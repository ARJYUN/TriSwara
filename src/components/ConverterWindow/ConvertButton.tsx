import React, { useState } from 'react';
import { extractSwarasFromImage } from '../../lib/claudeVision';
import { extractSwarasWithGemini } from '../../lib/geminiVision';
import { mapToHarmonics, HarmonicResult } from '../../lib/swaraMapper';
import { ApiProvider } from '../shared/ApiKeyModal';

interface ConvertButtonProps {
  base64Image: string | null;
  mimeType: string | null;
  apiKey: string;
  provider: ApiProvider;
  onResult: (result: HarmonicResult) => void;
  onError: (msg: string) => void;
}

const ConvertButton: React.FC<ConvertButtonProps> = ({
  base64Image,
  mimeType,
  apiKey,
  provider,
  onResult,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleConvert = async () => {
    if (!base64Image || !mimeType) {
      onError('Please upload a swara sheet image first.');
      return;
    }
    if (!apiKey.trim()) {
      onError(`Please enter your ${provider === 'anthropic' ? 'Anthropic' : 'Gemini'} API key.`);
      return;
    }

    setLoading(true);
    setProgress(provider === 'anthropic' ? 'Sending to Claude...' : 'Sending to Gemini...');

    try {
      setProgress('AI is reading the swaras...');
      const rows = provider === 'anthropic' 
        ? await extractSwarasFromImage(base64Image, mimeType, apiKey)
        : await extractSwarasWithGemini(base64Image, mimeType, apiKey);

      setProgress('Applying harmonic mapping...');
      const result = mapToHarmonics(rows);
      onResult(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error occurred.';
      onError(msg);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-6">
          {/* Veena SVG shimmer loading */}
          <div className="veena-loading">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="40" cy="60" rx="16" ry="10" fill="#c9a84c" opacity="0.3"/>
              <path d="M40 60 Q38 40 35 20 Q33 10 36 6 Q40 2 44 6 Q47 10 45 20 Q42 40 40 60Z"
                fill="#c9a84c" opacity="0.5"/>
              <circle cx="40" cy="6" r="4" fill="#c9a84c" opacity="0.6"/>
              <path d="M36 30 Q30 28 28 32 Q26 36 30 36" stroke="#c9a84c" strokeWidth="1.5"
                fill="none" opacity="0.6"/>
              <path d="M44 26 Q50 24 52 28 Q54 32 50 32" stroke="#c9a84c" strokeWidth="1.5"
                fill="none" opacity="0.6"/>
              {[0,1,2,3,4,5].map(i => (
                <line key={i} x1={32 + i * 2} y1={18} x2={32 + i * 2} y2={50}
                  stroke="#c9a84c" strokeWidth="0.8" opacity={0.3 + i * 0.05}/>
              ))}
            </svg>
          </div>
          <div
            className="shimmer rounded-lg px-6 py-2"
            style={{ minWidth: '220px', textAlign: 'center' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}>
              {progress}
            </p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'var(--gold)',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3 w-full">
          <button
            id="convert-btn"
            onClick={handleConvert}
            disabled={!base64Image || !apiKey}
            className="btn-gold px-8 py-3 text-base flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            style={{ minWidth: '200px', justifyContent: 'center' }}
          >
            <span className="text-xl">✦</span>
            Convert to Harmonics
          </button>
          
          <button
            id="sample-data-btn"
            onClick={() => {
              const sampleRows = [
                ["S", "R", "G", "M", "P", "D", "N", "S."],
                ["S.", "N", "D", "P", "M", "G", "R", "S"],
                [".P", ".D", ".N", "S", "R", "G", "M", "P"]
              ];
              onResult(mapToHarmonics(sampleRows));
            }}
            className="btn-outline px-8 py-2 text-xs opacity-60 hover:opacity-100 transition-opacity"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            💡 Try with Sample Data (Simulate AI)
          </button>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConvertButton;
