import React, { useState, useRef } from 'react';
import { FileText, ChevronDown, ChevronRight, CheckCircle, XCircle, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const mockHistory = [
  { id: '1', date: '2026-06-12', ticker: 'NVDA', recommendation: 'BUY', signalScore: 8.5, riskScore: 7.2 },
  { id: '2', date: '2026-06-10', ticker: 'TSLA', recommendation: 'HOLD', signalScore: 5.4, riskScore: 8.9 },
  { id: '3', date: '2026-06-08', ticker: 'HDFCBANK', recommendation: 'BUY', signalScore: 7.8, riskScore: 4.1 },
];

export const HistoryScreen: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setExplanation(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setExplanation(null);
    }
  };

  const processDocument = async () => {
    if (!file) return;
    setIsUploading(true);
    setExplanation(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/analyze/document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (error) {
      console.error(error);
      setExplanation('An error occurred while analyzing the document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Upload Section */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Document Analysis (RAG & Vision)</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Upload a financial report (10-Q, 10-K PDF) or an image of a chart to get an AI-powered explanation.</p>

        <div 
          className="glass-panel" 
          style={{ 
            padding: '48px', 
            textAlign: 'center', 
            border: '2px dashed var(--border-glass)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="application/pdf,image/*"
          />
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '50%' }}>
            {file ? (
              file.type.startsWith('image/') ? <ImageIcon size={32} color="var(--primary)" /> : <FileText size={32} color="var(--primary)" />
            ) : (
              <UploadCloud size={32} color="var(--text-muted)" />
            )}
          </div>
          
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              {file ? file.name : "Click or drag document here"}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {file ? "Ready to analyze" : "Supports PDF and Images"}
            </p>
          </div>

          {file && (
            <button 
              onClick={(e) => { e.stopPropagation(); processDocument(); }}
              disabled={isUploading}
              style={{
                marginTop: '16px',
                background: 'var(--primary)',
                color: '#000',
                fontWeight: 600,
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isUploading ? 0.7 : 1
              }}
            >
              {isUploading ? (
                 <style dangerouslySetInnerHTML={{__html: `
                   @keyframes spin { 100% { transform: rotate(360deg); } }
                   .spin { animation: spin 1s linear infinite; }
                 `}} />
              ) : null}
              {isUploading ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
              {isUploading ? "Analyzing Document..." : "Analyze Document"}
            </button>
          )}
        </div>

        {/* Explanation Result */}
        {explanation && (
          <div className="glass-panel" style={{ marginTop: '24px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Analysis Result
            </h3>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* History Section */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>Previous Reports & History</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mockHistory.map((item) => (
            <div key={item.id} className="glass-panel" style={{ overflow: 'hidden' }}>
              {/* Header row (clickable) */}
              <div 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: expandedId === item.id ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {expandedId === item.id ? <ChevronDown size={20} color="var(--primary)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{item.ticker}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SIGNAL SCORE</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)' }}>{item.signalScore}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>RISK SCORE</span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)' }}>{item.riskScore}</span>
                  </div>
                  <div style={{ width: '80px', textAlign: 'center', padding: '6px 12px', borderRadius: '4px', background: item.recommendation === 'BUY' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(255, 209, 102, 0.1)', color: item.recommendation === 'BUY' ? 'var(--primary)' : 'var(--warning)', fontWeight: 600, fontSize: '12px' }}>
                    {item.recommendation}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === item.id && (
                <div style={{ padding: '24px', borderTop: '1px solid var(--border-glass)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>BULL THESIS (PROS)</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        Strong revenue growth in Q3.
                      </li>
                      <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <CheckCircle size={14} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        MACD indicates bullish crossover.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>BEAR THESIS (CONS)</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <XCircle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        High systemic risk due to sector rotation.
                      </li>
                    </ul>
                  </div>
                  <div style={{ gridColumn: '1 / span 2', marginTop: '12px' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '8px 16px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>
                      <FileText size={14} /> VIEW FULL JSON REPORT
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
