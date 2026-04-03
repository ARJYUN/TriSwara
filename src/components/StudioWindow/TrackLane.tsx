import React, { useCallback, useRef, useState } from 'react';
import Waveform from './Waveform';
import { playSingleTrack } from '../../lib/audioEngine';

export type TrackId = 'base' | 'normal' | 'top';

export interface TrackState {
  buffer: AudioBuffer | null;
  trimStart: number;
  trimEnd: number;
  volume: number;
  blobUrl?: string;
}

interface TrackLaneProps {
  id: TrackId;
  label: string;
  color: string;
  accentBg: string;
  state: TrackState;
  audioCtx: AudioContext | null;
  onStateChange: (patch: Partial<TrackState>) => void;
  onRequestAudioCtx: () => AudioContext;
  onToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

const TrackLane: React.FC<TrackLaneProps> = ({
  id,
  label,
  color,
  accentBg,
  state,
  audioCtx,
  onStateChange,
  onRequestAudioCtx,
  onToast,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        }
      });
      const ctx = onRequestAudioCtx();
      
      // Set up analyser for waveform viz
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const actualMimeType = mediaRecorderRef.current?.mimeType || '';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        const arrayBuffer = await blob.arrayBuffer();
        const blobUrl = URL.createObjectURL(blob);
        const ctx2 = onRequestAudioCtx();
        try {
          const decoded = await ctx2.decodeAudioData(arrayBuffer);
          onStateChange({ buffer: decoded, blobUrl });
          onToast(`${label} track recorded ✓`, 'success');
        } catch {
          onToast('Failed to decode audio. Please try again.', 'error');
        }
        analyserRef.current = null;
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('denied') || msg.includes('Permission')) {
        onToast('Microphone access denied. Please allow microphone in browser settings.', 'error');
      } else {
        onToast('Could not start recording: ' + msg, 'error');
      }
    }
  }, [id, label, onRequestAudioCtx, onStateChange, onToast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const playPreview = useCallback(() => {
    if (!state.buffer) {
      onToast('No recording yet. Record something first.', 'warning');
      return;
    }
    const ctx = onRequestAudioCtx();
    const src = playSingleTrack(ctx, {
      buffer: state.buffer,
      trimStart: state.trimStart,
      trimEnd: state.trimEnd,
      volume: state.volume,
    });
    if (src) {
      previewSourceRef.current = src;
      setPreviewPlaying(true);
      src.onended = () => setPreviewPlaying(false);
    }
  }, [state, onRequestAudioCtx, onToast]);

  const stopPreview = useCallback(() => {
    try { previewSourceRef.current?.stop(); } catch { /* ignore */ }
    setPreviewPlaying(false);
  }, []);

  const trimDuration = state.buffer
    ? ((state.trimEnd - state.trimStart) * state.buffer.duration).toFixed(2)
    : '0.00';

  const totalDuration = state.buffer?.duration.toFixed(2) ?? '0.00';

  return (
    <div
      id={`track-${id}`}
      className={`track-lane ${id}-track flex flex-col gap-4`}
    >
      {/* Track Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-2 md:w-3 h-8 md:h-10 rounded-full"
            style={{ background: color, boxShadow: `0 0 10px ${color}80` }}
          />
          <div>
            <h3 className="font-bold text-xs md:text-sm tracking-widest uppercase"
              style={{ fontFamily: 'Cinzel, serif', color }}>
              {label}
            </h3>
            <p className="text-[10px] md:text-xs" style={{ color: 'var(--text-muted)' }}>
              {state.buffer
                ? `${trimDuration}s / ${totalDuration}s total`
                : 'No recording'}
            </p>
          </div>
        </div>

        {/* Record / Stop Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {!isRecording ? (
            <button
              id={`record-${id}`}
              onClick={startRecording}
              className="btn-record flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-lg"
            >
              <span className="w-2 w-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 inline-block" />
              Record
            </button>
          ) : (
            <button
              id={`stop-record-${id}`}
              onClick={stopRecording}
              className="btn-record recording flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-semibold rounded-lg"
            >
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded bg-red-500 inline-block" />
              Stop
            </button>
          )}

          {/* Native Audio Fallback (Testing) - Hide on mobile if too crowded */}
          {state.blobUrl && (
            <audio src={state.blobUrl} controls className="h-6 md:h-8 w-24 md:w-32" />
          )}

          {/* WebAudio Preview */}
          {!previewPlaying ? (
            <button
              id={`preview-${id}`}
              onClick={playPreview}
              disabled={!state.buffer}
              className="btn-outline flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs rounded-lg disabled:opacity-30"
            >
              ▶ Preview
            </button>
          ) : (
            <button
              id={`stop-preview-${id}`}
              onClick={stopPreview}
              className="btn-outline flex items-center gap-1 px-2.5 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs rounded-lg"
              style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </div>

      {/* Waveform */}
      <Waveform
        analyser={isRecording ? analyserRef.current : null}
        audioBuffer={isRecording ? null : state.buffer}
        color={color}
        isRecording={isRecording}
      />

      {/* Trim & Volume Controls */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-6">
        {/* Trim Sliders */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Trim Region
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-right font-mono" style={{ color: 'var(--indigo-light, #6366f1)' }}>
                {(state.trimStart * 100).toFixed(0)}%
              </span>
              <input
                id={`trim-start-${id}`}
                type="range"
                min={0}
                max={state.trimEnd - 0.01}
                step={0.01}
                value={state.trimStart}
                onChange={e => onStateChange({ trimStart: parseFloat(e.target.value) })}
                className="flex-1 trim-start"
                disabled={!state.buffer}
              />
              <span className="text-xs w-8 font-mono" style={{ color: 'var(--text-muted)' }}>Start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-right font-mono" style={{ color: 'var(--amber-light, #f59e0b)' }}>
                {(state.trimEnd * 100).toFixed(0)}%
              </span>
              <input
                id={`trim-end-${id}`}
                type="range"
                min={state.trimStart + 0.01}
                max={1}
                step={0.01}
                value={state.trimEnd}
                onChange={e => onStateChange({ trimEnd: parseFloat(e.target.value) })}
                className="flex-1 trim-end"
                disabled={!state.buffer}
              />
              <span className="text-xs w-8 font-mono" style={{ color: 'var(--text-muted)' }}>End</span>
            </div>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Volume
            </label>
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {Math.round(state.volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔇</span>
            <input
              id={`volume-${id}`}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.volume}
              onChange={e => onStateChange({ volume: parseFloat(e.target.value) })}
              className="flex-1"
              style={{
                accentColor: color,
              }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>🔊</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackLane;
