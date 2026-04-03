import React from 'react';

export type TabId = 'converter' | 'studio';

interface TabNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabNav: React.FC<TabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="relative flex items-center gap-1 p-1 rounded-xl w-full md:w-auto"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
      {/* Animated sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-in-out"
        style={{
          background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))',
          border: '1px solid var(--border)',
          left: activeTab === 'converter' ? '4px' : '50%',
          right: activeTab === 'converter' ? '50%' : '4px',
        }}
      />

      <button
        id="tab-converter"
        onClick={() => onTabChange('converter')}
        className="relative z-10 flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200"
        style={{
          color: activeTab === 'converter' ? 'var(--gold)' : 'var(--text-secondary)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.05em',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <span className="text-sm md:text-base">𝄞</span>
        Converter
      </button>

      <button
        id="tab-studio"
        onClick={() => onTabChange('studio')}
        className="relative z-10 flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200"
        style={{
          color: activeTab === 'studio' ? 'var(--gold)' : 'var(--text-secondary)',
          fontFamily: 'Cinzel, serif',
          letterSpacing: '0.05em',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <span className="text-sm md:text-base">🎙</span>
        Studio
      </button>
    </div>
  );
};

export default TabNav;
