import React, { useState } from 'react';
import { playAllTracks, exportMixAsWAV } from '../../lib/audioEngine';
import { TrackState } from './TrackLane';

interface MixControlsProps {
  tracks: { base: TrackState; normal: TrackState; top: TrackState };
  masterVolume: number;
  onMasterVolumeChange: (v: number) => void;
  onRequestAudioCtx: () => AudioContext;
  onToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const MixControls: React.FC<MixControlsProps> = ({
  tracks,
  masterVolume,
  onMasterVolumeChange,
  onRequestAudioCtx,
  onToast,
}) => {
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const activeSources = React.useRef<AudioBufferSourceNode[]>([]);

  const hasAnyRecording = tracks.base.buffer || tracks.normal.buffer || tracks.top.buffer;

  const playAll = () => {
    if (!hasAnyRecording) {
      onToast('Please record at least one track before mixing.', 'warning');
      return;
    }
    const ctx = onRequestAudioCtx();
    const trackList = [tracks.base, tracks.normal, tracks.top];
    const sources = playAllTracks(ctx, trackList, masterVolume);
    activeSources.current = sources;
    setPlaying(true);

    // Auto-stop when all sources end
    let doneCount = 0;
    sources.forEach(src => {
      src.onended = () => {
        doneCount++;
        if (doneCount >= sources.length) setPlaying(false);
      };
    });
  };

  const stopAll = () => {
    activeSources.current.forEach(src => {
      try { src.stop(); } catch { /* ignore */ }
    });
    activeSources.current = [];
    setPlaying(false);
  };

  const handleExport = async () => {
    if (!hasAnyRecording) {
      onToast('Please record at least one track before exporting.', 'warning');
      return;
    }
    setExporting(true);
    try {
      await exportMixAsWAV(
        [tracks.base, tracks.normal, tracks.top],
        masterVolume
      );
      onToast('Mix exported as .wav! Check your downloads.', 'success');
    } catch (e: unknown) {
      onToast(e instanceof Error ? e.message : 'Export failed.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-6"
      style={{
        background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ background: 'var(--gold-glow)', border: '1px solid var(--border)' }}
        >
          🎚️
        </div>
        <h3
          className="text-sm font-bold tracking-widest uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          Mix Console
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Play All / Stop All */}
        <div className="flex items-center gap-2">
          {!playing ? (
            <button
              id="play-all-btn"
              onClick={playAll}
              className="btn-gold px-6 py-3 flex items-center gap-2 text-sm"
            >
              ▶ Play All
            </button>
          ) : (
            <button
              id="stop-all-btn"
              onClick={stopAll}
              className="btn-gold px-6 py-3 flex items-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            >
              ⏹ Stop All
            </button>
          )}
        </div>

        {/* Playing indicator */}
        {playing && (
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: '4px',
                  background: 'var(--gold)',
                  animation: `equalizerBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                  height: `${8 + i * 4}px`,
                }}
              />
            ))}
            <span className="text-xs ml-1" style={{ color: 'var(--gold)' }}>Playing...</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Master Volume */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider shrink-0"
            style={{ color: 'var(--text-muted)' }}>
            Master
          </label>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔇</span>
          <input
            id="master-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={e => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-32"
            style={{ accentColor: 'var(--gold)' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔊</span>
          <span className="text-xs font-bold font-mono w-10"
            style={{ color: 'var(--gold)' }}>
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* Export */}
        <button
          id="export-btn"
          onClick={handleExport}
          disabled={exporting || !hasAnyRecording}
          className="btn-outline flex items-center gap-2 px-5 py-3 text-sm rounded-lg disabled:opacity-30"
          style={!exporting && hasAnyRecording ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}
        >
          {exporting ? (
            <>
              <span className="inline-block w-3 h-3 border-2 rounded-full border-t-transparent animate-spin"
                style={{ borderColor: 'var(--gold) transparent var(--gold) var(--gold)' }} />
              Rendering...
            </>
          ) : (
            <>⬇ Export Mix</>
          )}
        </button>
      </div>

      <style>{`
        @keyframes equalizerBar {
          from { transform: scaleY(0.3); }
          to { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
};

export default MixControls;
