import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  analyser: AnalyserNode | null;
  audioBuffer: AudioBuffer | null;
  color: string;
  isRecording?: boolean;
}

const drawEmpty = (canvas: HTMLCanvasElement, color: string) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = `${color}50`;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
  ctx.setLineDash([]);
};

const Waveform: React.FC<WaveformProps> = ({ analyser, audioBuffer, color, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Draw empty state on first mount
  useEffect(() => {
    if (canvasRef.current) drawEmpty(canvasRef.current, color);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Draw live waveform during recording
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      const path = new Path2D();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
        x += sliceWidth;
      }
      path.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke(path);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [analyser, color]);

  // Draw static recorded waveform
  useEffect(() => {
    if (analyser || !audioBuffer) return; // live mode handles its own drawing
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;

    const path = new Path2D();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1, max = -1;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j] ?? 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      path.moveTo(i, (1 + min) * amp);
      path.lineTo(i, (1 + max) * amp);
    }
    ctx.stroke(path);
  }, [analyser, audioBuffer, color]);

  // Redraw empty state when recording stops and no buffer exists
  useEffect(() => {
    if (analyser || audioBuffer) return;
    if (canvasRef.current) drawEmpty(canvasRef.current, color);
  }, [analyser, audioBuffer, color]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={72}
      className="waveform-canvas w-full"
      style={{
        height: '72px',
        display: 'block',
        ...(isRecording ? { boxShadow: `0 0 12px ${color}60` } : {}),
      }}
    />
  );
};

export default Waveform;
