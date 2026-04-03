import React from 'react';
import { getOctave } from '../../lib/swaraMapper';

type ColumnType = 'base' | 'normal' | 'top';

interface SwaraColumnProps {
  label: string;
  type: ColumnType;
  rows: string[][];
}

const headerColors: Record<ColumnType, string> = {
  base: 'column-header-base',
  normal: 'column-header-normal',
  top: 'column-header-top',
};

const chipClass: Record<ColumnType, string> = {
  base: 'base',
  normal: 'normal',
  top: 'top',
};

const bgGlows: Record<ColumnType, string> = {
  base: 'rgba(67,56,202,0.05)',
  normal: 'rgba(5,150,105,0.05)',
  top: 'rgba(217,119,6,0.05)',
};

const columnIcons: Record<ColumnType, string> = {
  base: '↓',
  normal: '◈',
  top: '↑',
};

interface SwaraChipProps {
  token: string;
  type: ColumnType;
}

const SwaraChip: React.FC<SwaraChipProps> = ({ token, type }) => {
  if (token === '--') {
    return (
      <div className="tooltip-wrapper inline-block">
        <span
          className="swara-chip out-of-range"
          style={{ minWidth: '36px', textAlign: 'center' }}
        >
          —
        </span>
        <span className="tooltip-text">Out of scale range.</span>
      </div>
    );
  }

  if (token === '?') {
    return (
      <div className="tooltip-wrapper inline-block">
        <span
          className="swara-chip unknown"
          style={{ minWidth: '36px', textAlign: 'center' }}
        >
          ?
        </span>
        <span className="tooltip-text">Unrecognized — please verify.</span>
      </div>
    );
  }

  // Strip dots to get the letter, detect octave
  const octave = getOctave(token);
  const letter = token.replace(/^\./, '').replace(/\.+$/, '');

  return (
    <span
      className={`swara-chip ${chipClass[type]}`}
      data-octave={octave}
      title={`${token} (${octave} octave)`}
      style={{ minWidth: '36px', textAlign: 'center' }}
    >
      {letter}
    </span>
  );
};

const SwaraColumn: React.FC<SwaraColumnProps> = ({ label, type, rows }) => {
  const totalTokens = rows.reduce((sum, row) => sum + row.length, 0);

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: bgGlows[type],
        border: '1px solid var(--border-subtle)',
        minWidth: 0,
      }}
    >
      {/* Column Header */}
      <div
        className={`px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 ${headerColors[type]}`}
        style={{
          background: 'var(--bg-card)',
          paddingBottom: '10px',
        }}
      >
        <span className="text-base md:text-lg font-bold">{columnIcons[type]}</span>
        <div>
          <h3
            className="font-bold text-xs md:text-sm tracking-widest uppercase"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {label}
          </h3>
          <p className="text-[10px] md:text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>
            {totalTokens} swaras
          </p>
        </div>
      </div>

      {/* Swara Rows */}
      <div
        className="flex-1 overflow-y-auto p-2 md:p-3"
        style={{ maxHeight: '350px' }}
      >
        {rows.length === 0 ? (
          <div className="flex items-center justify-center h-full opacity-30">
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)', fontFamily: 'Cinzel, serif' }}>
              {label} swaras<br />will appear here
            </p>
          </div>
        ) : (
          rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-wrap items-center gap-y-1 py-2"
              style={{
                borderBottom: rowIdx < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <span
                className="text-xs mr-2 shrink-0 font-mono"
                style={{ color: 'var(--text-muted)', minWidth: '18px' }}
              >
                {rowIdx + 1}.
              </span>
              <div className="flex flex-wrap">
                {row.map((token, tIdx) => (
                  <SwaraChip key={tIdx} token={token} type={type} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SwaraColumn;
