import React, { useCallback, useRef, useState } from 'react';
import TabNav, { TabId } from './components/shared/TabNav';
import Toast, { ToastMessage, createToast } from './components/shared/Toast';
import ApiKeyModal from './components/shared/ApiKeyModal';
import ImageUploader from './components/ConverterWindow/ImageUploader';
import SwaraColumn from './components/ConverterWindow/SwaraColumn';
import ConvertButton from './components/ConverterWindow/ConvertButton';
import TrackLane, { TrackState } from './components/StudioWindow/TrackLane';
import MixControls from './components/StudioWindow/MixControls';
import { HarmonicResult } from './lib/swaraMapper';
import './index.css';

// ─── Default Track State ──────────────────────────────────────────────────────
const defaultTrack = (): TrackState => ({
  buffer: null,
  trimStart: 0,
  trimEnd: 1,
  volume: 0.8,
});

// ─── Main App ─────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('converter');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Converter state
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [harmonicResult, setHarmonicResult] = useState<HarmonicResult | null>(null);

  // Studio state
  const [trackBase, setTrackBase] = useState<TrackState>(defaultTrack());
  const [trackNormal, setTrackNormal] = useState<TrackState>(defaultTrack());
  const [trackTop, setTrackTop] = useState<TrackState>(defaultTrack());
  const [masterVolume, setMasterVolume] = useState(0.85);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const addToast = useCallback((msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToasts(prev => [...prev, createToast(msg, type)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    setShowKeyModal(false);
  };

  const handleImageReady = useCallback((base64: string, mimeType: string) => {
    setImageData({ base64, mimeType });
    setHarmonicResult(null);
  }, []);

  const handleConvertResult = useCallback((result: HarmonicResult) => {
    setHarmonicResult(result);
    addToast('Swaras extracted and mapped successfully!', 'success');
  }, [addToast]);

  const handleConvertError = useCallback((msg: string) => {
    addToast(msg, 'error');
  }, [addToast]);

  const handleDownload = useCallback(() => {
    if (!harmonicResult) return;
    const lines: string[] = [];
    lines.push('HARMONIC SWARAS — EXPORTED SHEET');
    lines.push('='.repeat(50));
    lines.push('');
    const maxRows = harmonicResult.base.length;
    for (let i = 0; i < maxRows; i++) {
       lines.push(`Row ${i + 1}:`);
       lines.push(`  BASE:   ${harmonicResult.base[i].join('  ')}`);
       lines.push(`  NORMAL: ${harmonicResult.normal[i].join('  ')}`);
       lines.push(`  TOP:    ${harmonicResult.top[i].join('  ')}`);
       lines.push('');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'harmonic-swaras.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    addToast('Sheet downloaded as .txt!', 'success');
  }, [harmonicResult, addToast]);

  const currentApiKey = apiKey;
  const allTracks = { base: trackBase, normal: trackNormal, top: trackTop };
  const totalRows = harmonicResult?.base.length ?? 0;
  const totalTokens = harmonicResult?.base.reduce((s, r) => s + r.length, 0) ?? 0;

  return (
    <>
      {showKeyModal && (
        <ApiKeyModal 
          onSave={handleSaveApiKey} 
          initialKey={currentApiKey}
        />
      )}

      <div className="min-h-screen stars-bg flex flex-col" style={{ background: 'var(--bg-deep)' }}>
        <header className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.png" 
                  alt="TriSwara Logo" 
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                  onError={(e) => {
                    // Fallback to text if the user hasn't saved the image to public/ yet
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl font-bold" style="color:var(--gold);font-family:\'Cinzel\',serif;">T<span class="text-2xl">S</span></span>';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-bold tracking-wider leading-none gold-text-glow"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}>
                    Tri<span className="text-gray-300">Swara</span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Read • Map • Record • Harmonize
                  </span>
                </div>
              </div>
            </div>

            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

            <button
              onClick={() => setShowKeyModal(true)}
              className="btn-outline flex items-center gap-2 px-3 py-2 text-xs rounded-lg"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Gemini ✦ Key
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {activeTab === 'converter' && (
            <div className="tab-content flex flex-col gap-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}>
                  Swara Sheet Converter
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Upload an image of your Carnatic geetha or krithi. Gemini AI will extract the swaras and auto-generate 
                  the harmonics.
                </p>
              </div>

              <div className="flex items-center justify-center gap-6 py-3 px-6 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Base Octave', example: '.S  .R  .G', color: 'var(--indigo-light, #6366f1)', desc: 'dot before' },
                  { label: 'Normal Octave', example: 'S  R  G', color: 'var(--emerald-light, #10b981)', desc: 'plain' },
                  { label: 'Top Octave', example: 'S.  R.  G.', color: 'var(--amber-light, #f59e0b)', desc: 'dot after' },
                ].map(({ label, example, color, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <div>
                      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                      <span className="text-xs ml-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>({desc}: {example})</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-2 flex flex-col gap-4">
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider"
                      style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-secondary)' }}>
                      Upload Sheet
                    </h3>
                    <ImageUploader onImageReady={handleImageReady} />
                  </div>

                  <div className="glass-card p-5 flex flex-col items-center gap-4">
                    <ConvertButton
                      base64Image={imageData?.base64 ?? null}
                      mimeType={imageData?.mimeType ?? null}
                      apiKey={currentApiKey}
                      onResult={handleConvertResult}
                      onError={handleConvertError}
                    />

                    {harmonicResult && (
                      <>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>✓ {totalRows} rows</span>
                          <span>·</span>
                          <span>{totalTokens} swaras</span>
                        </div>
                        <button
                          onClick={handleDownload}
                          className="btn-outline flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg w-full justify-center"
                          style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                        >
                          ⬇ Download Sheet
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="col-span-3 grid grid-cols-3 gap-4 min-h-96">
                  <SwaraColumn label="Base" type="base" rows={harmonicResult?.base ?? []} />
                  <SwaraColumn label="Normal" type="normal" rows={harmonicResult?.normal ?? []} />
                  <SwaraColumn label="Top" type="top" rows={harmonicResult?.top ?? []} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="tab-content flex flex-col gap-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}>
                  Harmonic Studio
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Record three harmonic layers of your Carnatic composition. Trim, adjust volumes, and play them 
                  simultaneously for a synchronized blend.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <TrackLane
                  id="base" label="Base Track" color="var(--indigo-light)" accentBg="var(--indigo-bg)"
                  state={trackBase} audioCtx={audioCtxRef.current}
                  onStateChange={(p) => setTrackBase(prev => ({ ...prev, ...p }))}
                  onRequestAudioCtx={getAudioCtx} onToast={addToast}
                />
                <TrackLane
                  id="normal" label="Normal Track" color="var(--emerald-light)" accentBg="var(--emerald-bg)"
                  state={trackNormal} audioCtx={audioCtxRef.current}
                  onStateChange={(p) => setTrackNormal(prev => ({ ...prev, ...p }))}
                  onRequestAudioCtx={getAudioCtx} onToast={addToast}
                />
                <TrackLane
                  id="top" label="Top Track" color="var(--amber-light)" accentBg="var(--amber-bg)"
                  state={trackTop} audioCtx={audioCtxRef.current}
                  onStateChange={(p) => setTrackTop(prev => ({ ...prev, ...p }))}
                  onRequestAudioCtx={getAudioCtx} onToast={addToast}
                />
              </div>

              <MixControls
                tracks={allTracks}
                masterVolume={masterVolume}
                onMasterVolumeChange={setMasterVolume}
                onRequestAudioCtx={getAudioCtx}
                onToast={addToast}
              />
            </div>
          )}
        </main>

        <footer className="border-t py-6 flex flex-col items-center gap-2 text-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Built for Carnatic musicians who want to hear the full harmonic beauty of their compositions.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mt-1">
            <span style={{ color: 'var(--text-secondary)' }}>Created by</span>
            <a 
              href="https://github.com/ARJYUN" 
              target="_blank" 
              rel="noreferrer" 
              className="text-white hover:opacity-100 transition-opacity flex items-center gap-1.5"
              style={{ color: 'var(--gold)', textShadow: '0 0 8px rgba(201,168,76,0.3)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 10 0 0 12 2z"/>
              </svg>
              Arjun
            </a>
          </div>
        </footer>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default App;
