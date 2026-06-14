import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  ticker: string;
  amountToInvest: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  ticker,
  amountToInvest,
  onClose,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address to receive your PDF statement.");
      return;
    }

    setIsProcessing(true);
    try {
      // Fake bank verification delay
      await new Promise(r => setTimeout(r, 3000));

      // Simulate backend call
      const res = await fetch('/api/execute_trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker,
          amount: amountToInvest,
          user_email: email
        })
      });
      
      if (res.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          onPaymentSuccess();
        }, 3000);
      } else {
        setPaymentStatus('error');
      }
    } catch (e) {
      setPaymentStatus('error');
    }
    setIsProcessing(false);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(5, 8, 22, 0.8)', backdropFilter: 'blur(10px)',
      animation: 'fade-in 0.3s ease forwards'
    }}>
      <div style={{
        width: '90%', maxWidth: '420px',
        background: 'rgba(11, 16, 32, 0.95)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '16px', padding: '32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(0, 212, 255, 0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'transparent', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer'
        }}>
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '18px', color: '#fff', fontFamily: 'var(--font-mono)', marginBottom: '8px', textAlign: 'center' }}>
          SECURE CHECKOUT
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
          Scan the QR code to finalize your investment of <strong style={{color:'var(--primary)'}}>₹{amountToInvest.toFixed(2)}</strong> in <strong style={{color:'#fff'}}>{ticker}</strong>
        </p>

        {/* Custom QR Code Container */}
        <div style={{
          background: '#fff', padding: '8px', borderRadius: '12px',
          marginBottom: '24px', boxShadow: '0 0 20px rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <img src="/QR.jpeg" alt="Payment QR" style={{ width: '180px', height: '180px', objectFit: 'contain' }} />
        </div>

        {/* Email Input / Display */}
        <div style={{ width: '100%', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <Mail size={14} /> SEND PDF RECEIPT TO
          </label>
          <input 
            type="email" 
            placeholder="investor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!user?.email} // Disable if auto-filled from login
            style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              background: user?.email ? 'rgba(0, 212, 255, 0.05)' : 'rgba(255,255,255,0.05)', 
              border: user?.email ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid var(--border-glass)',
              color: user?.email ? 'var(--primary)' : '#fff', 
              fontSize: '14px', outline: 'none',
              cursor: user?.email ? 'not-allowed' : 'text'
            }}
          />
          {user?.email && (
            <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '6px', textAlign: 'right' }}>
              ✓ Automatically linked to your Google Account
            </div>
          )}
        </div>

        {paymentStatus === 'pending' && (
          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing || !email}
            className="btn-cyber"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: (isProcessing || !email) ? 0.5 : 1 }}
          >
            {isProcessing ? <Loader2 size={18} className="spin" /> : <QrCode size={18} />}
            {isProcessing ? 'VERIFYING BANK PAYMENT...' : 'I HAVE SCANNED & PAID'}
          </button>
        )}

        {paymentStatus === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
            <CheckCircle size={32} />
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>PAYMENT SUCCESSFUL! EMAIL SENT.</span>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <AlertTriangle size={32} />
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>ERROR VERIFYING PAYMENT</span>
            <button onClick={() => setPaymentStatus('pending')} style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '4px 12px', borderRadius: '4px', fontSize: '10px', marginTop: '8px', cursor: 'pointer' }}>TRY AGAIN</button>
          </div>
        )}
      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
