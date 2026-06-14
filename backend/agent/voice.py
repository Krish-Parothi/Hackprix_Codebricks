import os
import httpx

# These are mock stubs for the Hackathon. 
# If API keys are present in .env, they will be used.
# Otherwise, it falls back to a safe demo string.

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

async def translate_to_english_sarvam(regional_text: str) -> str:
    """Uses Sarvam AI to translate Indian regional language to English."""
    if not SARVAM_API_KEY:
        return regional_text  # Fallback
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.sarvam.ai/translate",
                json={
                    "input": [regional_text],
                    "source_language_code": "hi-IN",
                    "target_language_code": "en-IN"
                },
                headers={"api-subscription-key": SARVAM_API_KEY}
            )
            data = response.json()
            return data["translated_text"][0]
    except Exception as e:
        print(f"Sarvam translation failed: {e}")
        return regional_text


ELEVENLABS_VOICES = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",
    "drew": "29vD33N1CtxCmqQRPOHJ",
    "thomas": "GBv7mTt0atIp3Br8iCZE",
    "emily": "LcfcDJNUP1GQjkvn1xOu",
    "bella": "EXAVITQu4vr4xnSDxMaL"
}

async def generate_audio_elevenlabs(text: str, speaker: str = "rachel") -> bytes:
    """Uses ElevenLabs to generate voice from text."""
    if not ELEVENLABS_API_KEY:
        # Return a tiny empty MP3/WAV stub if no key is provided
        return b""
        
    voice_id = ELEVENLABS_VOICES.get(speaker, "21m00Tcm4TlvDq8ikWAM")
    try:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                return response.content
            return b""
    except Exception as e:
        print(f"ElevenLabs generation failed: {e}")
        return b""

async def generate_audio_sarvam(text: str, speaker: str = "tanya") -> bytes:
    """Uses Sarvam AI to generate voice from text."""
    if not SARVAM_API_KEY:
        # Fallback to ElevenLabs if only that key exists, though we want Sarvam
        return await generate_audio_elevenlabs(text)
        
    try:
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": SARVAM_API_KEY
        }
        data = {
            "inputs": [text[:500]], # Limiting text to prevent long generation times
            "target_language_code": "en-IN",
            "speaker": speaker,
            "pace": 1.25,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v3"
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                import base64
                audio_base64 = response.json().get("audios", [""])[0]
                return base64.b64decode(audio_base64)
            print(f"Sarvam API Error: {response.status_code} - {response.text}")
            return b""
    except Exception as e:
        print(f"Sarvam generation failed: {e}")
        return b""
