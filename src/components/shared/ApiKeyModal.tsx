import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  initialKey?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, initialKey = '' }) => {
  const [key, setKey] = useState(initialKey);
  const [show, setShow] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="rounded-2xl p-8 flex flex-col gap-6 w-full max-w-md mx-4 animate-slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 0 80px rgba(201,168,76,0.15)',
        }}
      >
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="TriSwara Logo" 
              className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(201,168,76,0.5)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl md:text-4xl font-bold" style="color:var(--gold);font-family:\'Cinzel\',serif;">T<span class="text-2xl md:text-3xl">S</span></span>';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold gold-text-glow" style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}>
            Tri<span className="text-gray-300">Swara</span>
          </h1>
          <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            | त्रि स्वरा |
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Enter your Google Gemini API Key for vision extraction.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Gemini API Key
          </label>
          <div className="relative">
            <input
              id="api-key-input"
              type={show ? 'text' : 'password'}
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-mono"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())}
            />
            <button
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100"
              style={{ color: 'var(--text-secondary)' }}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Get a FREE key at{' '}
            <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
              style={{ color: 'var(--gold)', textDecoration: 'underline' }}>
              aistudio.google.com
            </a>
          </p>
        </div>

        <button
          id="save-api-key-btn"
          onClick={() => key.trim() && onSave(key.trim())}
          disabled={!key.trim()}
          className="btn-gold py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Enter the Studio →
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;
