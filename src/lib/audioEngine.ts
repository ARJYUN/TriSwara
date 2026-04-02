// ─── Audio Engine for Harmonic Studio ─────────────────────────────────────────

export interface TrackConfig {
  buffer: AudioBuffer | null;
  trimStart: number; // 0-1
  trimEnd: number;   // 0-1
  volume: number;    // 0-1
}

/**
 * Plays all tracks simultaneously with tight synchronization.
 * Returns an array of source nodes for stopping.
 */
export function playAllTracks(
  audioCtx: AudioContext,
  tracks: TrackConfig[],
  masterVolume: number
): AudioBufferSourceNode[] {
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(audioCtx.destination);

  const sources: AudioBufferSourceNode[] = [];
  const startTime = audioCtx.currentTime + 0.05; // small buffer for sync

  for (const track of tracks) {
    if (!track.buffer) continue;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = track.volume;
    gainNode.connect(masterGain);

    const source = audioCtx.createBufferSource();
    source.buffer = track.buffer;
    source.connect(gainNode);

    const offsetSeconds = track.trimStart * track.buffer.duration;
    const durationSeconds = (track.trimEnd - track.trimStart) * track.buffer.duration;

    source.start(startTime, offsetSeconds, durationSeconds);
    sources.push(source);
  }

  return sources;
}

/**
 * Plays a single track (preview mode).
 */
export function playSingleTrack(
  audioCtx: AudioContext,
  track: TrackConfig
): AudioBufferSourceNode | null {
  if (!track.buffer) return null;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = track.volume;
  gainNode.connect(audioCtx.destination);

  const source = audioCtx.createBufferSource();
  source.buffer = track.buffer;
  source.connect(gainNode);

  const offsetSeconds = track.trimStart * track.buffer.duration;
  const durationSeconds = (track.trimEnd - track.trimStart) * track.buffer.duration;

  // Use currentTime, rather than 0, to prevent playback dropping during context resume cycles
  source.start(audioCtx.currentTime, offsetSeconds, durationSeconds);
  return source;
}

/**
 * Encodes raw PCM data to a WAV file as an ArrayBuffer.
 * 16-bit signed PCM, 44100Hz, stereo.
 */
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const sampleRate = audioBuffer.sampleRate;
  const numChannels = Math.min(audioBuffer.numberOfChannels, 2);
  const bitsPerSample = 16;
  const numSamples = audioBuffer.length;
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  const writeU32 = (offset: number, val: number) => view.setUint32(offset, val, true);
  const writeU16 = (offset: number, val: number) => view.setUint16(offset, val, true);

  writeStr(0, "RIFF");
  writeU32(4, 36 + dataSize);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  writeU32(16, 16);
  writeU16(20, 1); // PCM
  writeU16(22, numChannels);
  writeU32(24, sampleRate);
  writeU32(28, sampleRate * numChannels * (bitsPerSample / 8));
  writeU16(32, numChannels * (bitsPerSample / 8));
  writeU16(34, bitsPerSample);
  writeStr(36, "data");
  writeU32(40, dataSize);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = audioBuffer.getChannelData(ch)[i];
      const s16 = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, s16 < 0 ? s16 * 0x8000 : s16 * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}

/**
 * Renders the full mix offline and triggers a .wav download.
 */
export async function exportMixAsWAV(
  tracks: TrackConfig[],
  masterVolume: number
): Promise<void> {
  // Find the longest track duration
  let maxDuration = 0;
  for (const track of tracks) {
    if (!track.buffer) continue;
    const dur =
      track.buffer.duration * (track.trimEnd - track.trimStart);
    if (dur > maxDuration) maxDuration = dur;
  }

  if (maxDuration === 0) throw new Error("No audio to export.");

  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.ceil(maxDuration * sampleRate), sampleRate);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(offlineCtx.destination);

  for (const track of tracks) {
    if (!track.buffer) continue;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = track.volume;
    gainNode.connect(masterGain);

    const source = offlineCtx.createBufferSource();
    source.buffer = track.buffer;
    source.connect(gainNode);

    const offsetSeconds = track.trimStart * track.buffer.duration;
    const durationSeconds = (track.trimEnd - track.trimStart) * track.buffer.duration;

    source.start(0, offsetSeconds, durationSeconds);
  }

  const rendered = await offlineCtx.startRendering();
  const wavData = encodeWAV(rendered);
  const blob = new Blob([wavData as BlobPart], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `harmonic-mix-${Date.now()}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
