import React, { useCallback, useRef, useState } from 'react';

interface ImageUploaderProps {
  onImageReady: (base64: string, mimeType: string, previewUrl: string) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageReady }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPG, PNG, WebP, or GIF image.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      const previewUrl = dataUrl;
      setPreview(previewUrl);
      onImageReady(base64, file.type, previewUrl);
    };
    reader.readAsDataURL(file);
  }, [onImageReady]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        id="image-upload-zone"
        className={`upload-zone flex flex-col items-center justify-center gap-3 p-8 cursor-pointer transition-all duration-200 ${dragOver ? 'drag-over' : ''}`}
        style={{ minHeight: preview ? '120px' : '280px' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          id="file-input"
        />

        {!preview ? (
          <>
            {/* Upload Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'var(--gold-glow)', border: '1px solid var(--border)' }}
            >
              🎼
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Drop your swara sheet here
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                or click to browse — JPG, PNG, WebP supported
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              {['Handwritten', 'Printed', 'Scanned'].map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                  {t}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click to change image
            </p>
            {fileName && (
              <p className="text-xs mt-1 font-mono" style={{ color: 'var(--gold)' }}>
                {fileName}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image Preview */}
      {preview && (
        <div
          className="rounded-xl overflow-hidden border flex-1"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
        >
          <img
            src={preview}
            alt="Uploaded swara sheet preview"
            className="w-full h-full object-contain"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
