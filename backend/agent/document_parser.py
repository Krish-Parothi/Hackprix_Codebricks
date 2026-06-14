"""
Multimodal RAG System
- PDF parsing: text + image extraction (PyMuPDF)
- CLIP embeddings for images
- Sentence Transformers for text
- ChromaDB as vector store (persistent)
- LLaVA (via Groq) for vision captioning + answer generation
- Full RAG pipeline: ingest → embed → retrieve → generate

Install:
    pip install pymupdf pillow chromadb sentence-transformers transformers torch groq python-dotenv

.env:
    GROQ_API_KEY=your_key_here
"""

import os
import io
import base64
import hashlib
import json
import logging
import tempfile
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from fastapi import UploadFile

import fitz  # PyMuPDF
import numpy as np
from PIL import Image
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import torch
from transformers import CLIPProcessor, CLIPModel
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


# ─── Config ───────────────────────────────────────────────────────────────────

@dataclass
class RAGConfig:
    chroma_path: str       = "./chroma_db"
    text_collection: str   = "text_chunks"
    image_collection: str  = "image_chunks"
    clip_model: str        = "openai/clip-vit-base-patch32"
    text_model: str        = "all-MiniLM-L6-v2"
    chunk_size: int        = 500          # words per chunk
    chunk_overlap: int     = 50
    top_k: int             = 3
    groq_model: str        = "meta-llama/llama-4-scout-17b-16e-instruct"
    image_dir: str         = "./extracted_images"
    min_image_size: tuple  = (100, 100)   # filter tiny/logo images


# ─── Data classes ─────────────────────────────────────────────────────────────

@dataclass
class TextChunk:
    text: str
    page: int
    chunk_id: str
    source: str
    metadata: dict = field(default_factory=dict)


@dataclass
class ImageChunk:
    image_b64: str       # base64 PNG
    image_path: str      # saved to disk
    page: int
    chunk_id: str
    source: str
    caption: str = ""    # filled by LLaVA
    metadata: dict = field(default_factory=dict)


# ─── PDF Parser ───────────────────────────────────────────────────────────────

class PDFParser:
    def __init__(self, cfg: RAGConfig):
        self.cfg = cfg
        Path(cfg.image_dir).mkdir(parents=True, exist_ok=True)

    def extract(self, pdf_path: str) -> tuple[list[TextChunk], list[ImageChunk]]:
        doc = fitz.open(pdf_path)
        src = Path(pdf_path).name
        texts, images = [], []

        for page_num, page in enumerate(doc):
            # Text extraction
            raw = page.get_text("text")
            for chunk in self._chunk_text(raw, self.cfg.chunk_size, self.cfg.chunk_overlap):
                cid = self._uid(f"{src}-p{page_num}-{chunk[:30]}")
                texts.append(TextChunk(
                    text=chunk, page=page_num, chunk_id=cid,
                    source=src, metadata={"page": page_num, "source": src}
                ))

            # Image extraction disabled to prevent Groq API rate limits (429)
            # for img_idx, img_ref in enumerate(page.get_images(full=True)):
            #     xref = img_ref[0]
            #     try:
            #         base_img  = doc.extract_image(xref)
            #         img_bytes = base_img["image"]
            #         img       = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            # 
            #         # Skip tiny images (icons, decorations)
            #         if img.size[0] < self.cfg.min_image_size[0] or \
            #            img.size[1] < self.cfg.min_image_size[1]:
            #             continue
            # 
            #         # Save PNG to disk
            #         fname = f"{src}_p{page_num}_img{img_idx}.png"
            #         fpath = str(Path(self.cfg.image_dir) / fname)
            #         img.save(fpath, "PNG")
            # 
            #         # Base64 for API calls
            #         buf = io.BytesIO()
            #         img.save(buf, "PNG")
            #         b64 = base64.b64encode(buf.getvalue()).decode()
            # 
            #         cid = self._uid(f"{src}-p{page_num}-img{img_idx}")
            #         images.append(ImageChunk(
            #             image_b64=b64, image_path=fpath,
            #             page=page_num, chunk_id=cid, source=src,
            #             metadata={"page": page_num, "source": src, "img_idx": img_idx}
            #         ))
            #     except Exception as e:
            #         log.warning(f"Image extraction failed xref={xref}: {e}")

        doc.close()
        log.info(f"Extracted {len(texts)} text chunks, {len(images)} images from {src}")
        return texts, images

    @staticmethod
    def _chunk_text(text: str, size: int, overlap: int) -> list[str]:
        words = text.split()
        chunks, i = [], 0
        while i < len(words):
            chunk = " ".join(words[i:i + size])
            if chunk.strip():
                chunks.append(chunk.strip())
            i += size - overlap
        return chunks

    @staticmethod
    def _uid(s: str) -> str:
        return hashlib.md5(s.encode()).hexdigest()[:16]


# ─── Embedders ────────────────────────────────────────────────────────────────

class TextEmbedder:
    def __init__(self, model_name: str):
        log.info(f"Loading text model: {model_name}")
        self.model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        vecs = self.model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vecs.tolist()


class CLIPEmbedder:
    def __init__(self, model_name: str):
        log.info(f"Loading CLIP model: {model_name}")
        self.device    = "cuda" if torch.cuda.is_available() else "cpu"
        self.model     = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.model.eval()

    def embed_images(self, images: list[Image.Image]) -> list[list[float]]:
        inputs = self.processor(images=images, return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            feats = self.model.get_image_features(**inputs)
            feats = feats / feats.norm(dim=-1, keepdim=True)
        return feats.cpu().numpy().tolist()

    def embed_text(self, texts: list[str]) -> list[list[float]]:
        """Embed query into CLIP space for cross-modal text→image search."""
        inputs = self.processor(
            text=texts, return_tensors="pt", padding=True, truncation=True
        ).to(self.device)
        with torch.no_grad():
            feats = self.model.get_text_features(**inputs)
            feats = feats / feats.norm(dim=-1, keepdim=True)
        return feats.cpu().numpy().tolist()


# ─── Vision Captioner (LLaVA via Groq) ───────────────────────────────────────

class VisionCaptioner:
    def __init__(self, model: str, api_key: Optional[str] = None):
        self.client = Groq(api_key=api_key or os.getenv("GROQ_API_KEY"))
        self.model  = model

    def caption(self, image_b64: str, context: str = "") -> str:
        prompt = (
            "Describe this image in detail for a document retrieval system. "
            "Include: what the image shows, any visible text, charts or graphs content, "
            f"and how it relates to the document. Context: {context or 'unknown'}"
        )
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image_url",
                         "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                        {"type": "text", "text": prompt}
                    ]
                }],
                max_tokens=300
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            log.warning(f"Caption failed: {e}")
            return "Image content unavailable."


# ─── ChromaDB Vector Store ────────────────────────────────────────────────────

class VectorStore:
    def __init__(self, cfg: RAGConfig):
        self.cfg    = cfg
        self.client = chromadb.PersistentClient(
            path=cfg.chroma_path,
            settings=Settings(anonymized_telemetry=False)
        )
        # Separate collections — different embedding dims (384 vs 512)
        self.text_col = self.client.get_or_create_collection(
            cfg.text_collection,
            metadata={"hnsw:space": "cosine"}
        )
        self.image_col = self.client.get_or_create_collection(
            cfg.image_collection,
            metadata={"hnsw:space": "cosine"}
        )
        log.info(f"ChromaDB ready at {cfg.chroma_path}")

    def add_texts(self, chunks: list[TextChunk], embeddings: list[list[float]]):
        if not chunks:
            return
        self.text_col.upsert(
            ids=[c.chunk_id for c in chunks],
            embeddings=embeddings,
            documents=[c.text for c in chunks],
            metadatas=[{**c.metadata, "source": c.source} for c in chunks]
        )
        log.info(f"Upserted {len(chunks)} text chunks into ChromaDB")

    def add_images(self, chunks: list[ImageChunk], embeddings: list[list[float]]):
        if not chunks:
            return
        self.image_col.upsert(
            ids=[c.chunk_id for c in chunks],
            embeddings=embeddings,
            documents=[c.caption or "image" for c in chunks],  # caption = searchable doc
            metadatas=[{
                **c.metadata,
                "source":     c.source,
                "image_path": c.image_path,
                "caption":    c.caption
            } for c in chunks]
        )
        log.info(f"Upserted {len(chunks)} image chunks into ChromaDB")

    def query_text(self, embedding: list[float], k: int) -> list[dict]:
        count = self.text_col.count()
        if count == 0:
            return []
        res = self.text_col.query(query_embeddings=[embedding], n_results=min(k, count))
        return self._format(res)

    def query_images(self, embedding: list[float], k: int) -> list[dict]:
        count = self.image_col.count()
        if count == 0:
            return []
        res = self.image_col.query(query_embeddings=[embedding], n_results=min(k, count))
        return self._format(res)

    @staticmethod
    def _format(res) -> list[dict]:
        out = []
        for i, doc in enumerate(res["documents"][0]):
            out.append({
                "document": doc,
                "metadata": res["metadatas"][0][i],
                "distance": res["distances"][0][i] if res.get("distances") else None,
                "id":       res["ids"][0][i]
            })
        return out

    def stats(self) -> dict:
        return {
            "text_chunks":  self.text_col.count(),
            "image_chunks": self.image_col.count()
        }

    def reset(self):
        for name in [self.cfg.text_collection, self.cfg.image_collection]:
            try:
                self.client.delete_collection(name)
            except Exception:
                pass
        self.text_col  = self.client.get_or_create_collection(
            self.cfg.text_collection, metadata={"hnsw:space": "cosine"})
        self.image_col = self.client.get_or_create_collection(
            self.cfg.image_collection, metadata={"hnsw:space": "cosine"})
        log.info("ChromaDB collections reset")


# ─── Main RAG Pipeline ────────────────────────────────────────────────────────

class MultimodalRAG:
    """
    Ingest:
      PDF → extract text + images
          → LLaVA captions images
          → Sentence Transformer embeds text → ChromaDB
          → CLIP embeds images → ChromaDB

    Query:
      question → Sentence Transformer → retrieve top-K text chunks
               → CLIP text encoder   → retrieve top-K images (cross-modal)
               → LLaVA (Groq)        → generate grounded answer
    """

    def __init__(self, cfg: Optional[RAGConfig] = None):
        self.cfg       = cfg or RAGConfig()
        self.parser    = PDFParser(self.cfg)
        self.text_emb  = TextEmbedder(self.cfg.text_model)
        self.clip_emb  = CLIPEmbedder(self.cfg.clip_model)
        self.captioner = VisionCaptioner(self.cfg.groq_model)
        self.store     = VectorStore(self.cfg)
        self.groq      = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self._img_cache: dict[str, str] = {}  # chunk_id → base64

    # ── Ingest ────────────────────────────────────────────────────────────────

    def ingest(self, pdf_path: str) -> dict:
        log.info(f"Ingesting: {pdf_path}")
        text_chunks, image_chunks = self.parser.extract(pdf_path)

        # Embed + store text
        if text_chunks:
            t_embs = self.text_emb.embed([c.text for c in text_chunks])
            self.store.add_texts(text_chunks, t_embs)

        # Caption + embed + store images (Disabled to prevent API rate limits)
        # if image_chunks:
        #     ctx = Path(pdf_path).stem.replace("_", " ")
        #     log.info(f"Captioning {len(image_chunks)} images with LLaVA…")
        #     for ic in image_chunks:
        #         ic.caption = self.captioner.caption(ic.image_b64, context=ctx)
        #         self._img_cache[ic.chunk_id] = ic.image_b64
        #         log.info(f"  [{ic.chunk_id}] {ic.caption[:80]}…")
        # 
        #     pil_imgs = [Image.open(ic.image_path).convert("RGB") for ic in image_chunks]
        #     i_embs   = self.clip_emb.embed_images(pil_imgs)
        #     self.store.add_images(image_chunks, i_embs)

        stats = self.store.stats()
        log.info(f"Done. Store: {stats}")
        return {"text_chunks": len(text_chunks), "image_chunks": len(image_chunks), **stats}

    # ── Query ─────────────────────────────────────────────────────────────────

    def query(self, question: str, include_images: bool = True) -> dict:
        log.info(f"Query: {question}")

        # Text retrieval (sentence-transformer space)
        q_text_emb  = self.text_emb.embed([question])[0]
        text_results = self.store.query_text(q_text_emb, self.cfg.top_k)

        # Image retrieval (CLIP cross-modal: text query → image collection)
        image_results = []
        if include_images:
            q_clip_emb    = self.clip_emb.embed_text([question])[0]
            image_results = self.store.query_images(q_clip_emb, self.cfg.top_k)

        # Build context string
        text_ctx = "\n\n".join([
            f"[Text | page {r['metadata'].get('page', '?')}]\n{r['document']}"
            for r in text_results
        ])
        image_ctx = "\n\n".join([
            f"[Image | page {r['metadata'].get('page', '?')}]\n"
            f"{r['metadata'].get('caption', r['document'])}"
            for r in image_results
        ])
        context = f"TEXT CONTEXT:\n{text_ctx}"
        if image_ctx:
            context += f"\n\nIMAGE CONTEXT:\n{image_ctx}"

        # Pick best image to send visually (lowest distance = most relevant)
        best_b64 = None
        if image_results:
            bid = image_results[0]["id"]
            if bid in self._img_cache:
                best_b64 = self._img_cache[bid]
            else:
                path = image_results[0]["metadata"].get("image_path")
                if path and Path(path).exists():
                    best_b64 = base64.b64encode(Path(path).read_bytes()).decode()

        answer = self._generate(question, context, best_b64)

        return {
            "question": question,
            "answer":   answer,
            "text_sources": [
                {
                    "page":     r["metadata"].get("page"),
                    "source":   r["metadata"].get("source"),
                    "snippet":  r["document"][:200],
                    "distance": r["distance"]
                }
                for r in text_results
            ],
            "image_sources": [
                {
                    "page":       r["metadata"].get("page"),
                    "source":     r["metadata"].get("source"),
                    "caption":    r["metadata"].get("caption", "")[:200],
                    "image_path": r["metadata"].get("image_path"),
                    "distance":   r["distance"]
                }
                for r in image_results
            ],
        }

    def _generate(self, question: str, context: str, image_b64: Optional[str]) -> str:
        system = (
            "You are a precise document assistant with access to text and image context "
            "extracted from a PDF. Answer using ONLY the provided context. "
            "If the answer is not in the context, say so clearly. "
            "Cite page numbers when available."
        )
        user_content = [
            {"type": "text",
             "text": f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"}
        ]
        # Attach most relevant image for visual grounding
        if image_b64:
            user_content.insert(0, {
                "type":      "image_url",
                "image_url": {"url": f"data:image/png;base64,{image_b64}"}
            })

        resp = self.groq.chat.completions.create(
            model=self.cfg.groq_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user_content}
            ],
            max_tokens=1024,
            temperature=0.2
        )
        return resp.choices[0].message.content.strip()

    def stats(self) -> dict:
        return self.store.stats()

    def reset(self):
        self.store.reset()
        self._img_cache.clear()

async def parse_and_explain_document(file: UploadFile) -> str:
    content_type = file.content_type
    file_bytes = await file.read()
    
    if content_type == 'application/pdf':
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            rag = MultimodalRAG()
            rag.ingest(tmp_path)
            
            question = "Provide a detailed explanation of the key financial metrics, risks, and overall financial health. Structure your response with clear headings, bullet points, and highlight critical insights. Format your response in Markdown."
            result = rag.query(question, include_images=False)
            return result['answer']
        finally:
            os.unlink(tmp_path)
            
    elif content_type and content_type.startswith('image/'):
        b64 = base64.b64encode(file_bytes).decode()
        captioner = VisionCaptioner("meta-llama/llama-4-scout-17b-16e-instruct")
        return captioner.caption(b64, "Analyze this financial image and extract key insights.")
        
    else:
        return "Unsupported file type. Please upload a PDF or an Image."

# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse, sys

    p = argparse.ArgumentParser(description="Multimodal RAG CLI")
    sub = p.add_subparsers(dest="cmd")

    s_ing = sub.add_parser("ingest", help="Ingest a PDF")
    s_ing.add_argument("pdf", help="Path to PDF")

    s_qry = sub.add_parser("query", help="Ask a question")
    s_qry.add_argument("question")
    s_qry.add_argument("--no-images", action="store_true")

    sub.add_parser("stats",  help="Show DB stats")
    sub.add_parser("reset",  help="Clear all collections")

    args = p.parse_args()
    rag  = MultimodalRAG()

    if args.cmd == "ingest":
        print(json.dumps(rag.ingest(args.pdf), indent=2))

    elif args.cmd == "query":
        res = rag.query(args.question, include_images=not args.no_images)
        print(f"\n{'='*60}")
        print(f"Q: {res['question']}")
        print(f"{'='*60}")
        print(f"A: {res['answer']}")
        print(f"\n--- Text Sources ({len(res['text_sources'])}) ---")
        for s in res["text_sources"]:
            print(f"  [Page {s['page']}] {s['snippet'][:100]}…")
        print(f"\n--- Image Sources ({len(res['image_sources'])}) ---")
        for s in res["image_sources"]:
            print(f"  [Page {s['page']}] {s['caption'][:100]}…")
            if s.get("image_path"):
                print(f"           → {s['image_path']}")

    elif args.cmd == "stats":
        print(json.dumps(rag.stats(), indent=2))

    elif args.cmd == "reset":
        rag.reset()
        print("Reset complete.")

    else:
        p.print_help()
        sys.exit(1)