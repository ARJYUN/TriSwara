import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  // Initial App Loading State
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAppFadingOut, setIsAppFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsAppFadingOut(true), 2500);
    const removeTimer = setTimeout(() => setIsAppLoading(false), 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

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
      {isAppLoading && (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f0f14] transition-opacity duration-700 ${isAppFadingOut ? 'opacity-0' : 'opacity-100'}`}>
          <div className="relative flex flex-col items-center">
            {/* Logo container with radial glow and pulse */}
            <div className="w-32 h-32 md:w-40 md:h-40 mb-8 relative animate-pulse" style={{ animationDuration: '2s' }}>
               <div className="absolute inset-0 rounded-full blur-[50px] opacity-40" style={{ background: '#c9a84c' }}></div>
               <img 
                 src="/logo.png" 
                 alt="TriSwara Logo" 
                 className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(201,168,76,0.7)]" 
                 onError={(e) => {
                   e.currentTarget.style.display = 'none';
                   const fallback = document.createElement('div');
                   fallback.className = 'w-full h-full flex items-center justify-center text-5xl md:text-6xl font-bold';
                   fallback.style.color = '#c9a84c';
                   fallback.style.fontFamily = 'Cinzel, serif';
                   fallback.innerHTML = 'TS';
                   e.currentTarget.parentElement?.appendChild(fallback);
                 }}
               />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] mb-4 text-[#c9a84c]" style={{ fontFamily: 'Cinzel, serif' }}>
              Tri<span className="text-gray-300">Swara</span>
            </h1>
            
            <div className="w-48 md:w-64 h-1 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
               <div className="absolute top-0 left-0 h-full animate-loader-progress" style={{ background: '#c9a84c' }}></div>
            </div>
            
            <p className="mt-8 text-xs tracking-[0.3em] uppercase opacity-50 animate-pulse text-gray-400">
              Initializing Studio Environment
            </p>
          </div>
        </div>
      )}

      {!isAppLoading && showKeyModal && (
        <ApiKeyModal 
          onSave={handleSaveApiKey} 
          initialKey={currentApiKey}
        />
      )}

      <div className="min-h-screen stars-bg flex flex-col" style={{ background: 'var(--bg-deep)' }}>
        <header className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shrink-0">
                <img 
                  src="/logo.png" 
                  alt="TriSwara Logo" 
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(201,168,76,0.5)]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="text-2xl md:text-3xl font-bold" style="color:var(--gold);font-family:\'Cinzel\',serif;">T<span class="text-xl md:text-2xl">S</span></span>';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-lg md:text-xl font-bold tracking-wider leading-none gold-text-glow"
                    style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}>
                    Tri<span className="text-gray-300">Swara</span>
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] md:text-xs font-medium tracking-widest uppercase whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    Read • Map • Record • Harmonize
                  </span>
                </div>
              </div>
            </div>

            <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

            <button
              onClick={() => setShowKeyModal(true)}
              className="btn-outline flex items-center gap-2 px-3 py-2 text-xs rounded-lg order-first md:order-last self-end md:self-auto mb-[-48px] md:mb-0"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Gemini ✦ Key
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
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

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 py-3 px-4 md:px-6 rounded-xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Base Octave', example: '.S', color: 'var(--indigo-light, #6366f1)', desc: 'dot before' },
                  { label: 'Normal Octave', example: 'S', color: 'var(--emerald-light, #10b981)', desc: 'plain' },
                  { label: 'Top Octave', example: 'S.', color: 'var(--amber-light, #f59e0b)', desc: 'dot after' },
                ].map(({ label, example, color, desc }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <div className="flex flex-col md:flex-row md:items-baseline">
                      <span className="text-[10px] md:text-xs font-semibold" style={{ color }}>{label}</span>
                      <span className="text-[10px] md:ml-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>({example})</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2 flex flex-col gap-4">
                  <div className="glass-card p-4 md:p-5">
                    <h3 className="text-sm font-bold mb-4 uppercase tracking-wider"
                      style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-secondary)' }}>
                      Upload Sheet
                    </h3>
                    <ImageUploader onImageReady={handleImageReady} />
                  </div>

                  <div className="glass-card p-4 md:p-5 flex flex-col items-center gap-4">
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

                <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 min-h-96">
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
              href="https://arjunk.vercel.app" 
              target="_blank" 
              rel="noreferrer" 
              className="text-white hover:opacity-100 transition-opacity flex items-center gap-1.5"
              style={{ color: 'var(--gold)', textShadow: '0 0 8px rgba(201,168,76,0.3)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
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
