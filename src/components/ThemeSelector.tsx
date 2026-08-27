import React, { useState, useRef, useEffect } from 'react';
import { ColorSchemeId } from '../types';
import {
  COLOR_SCHEMES,
  saveColorScheme,
  isDayMode,
  getSavedCustomBg,
  saveCustomBg,
  applyColorSchemeToDOM,
} from '../utils/theme';
import { playClickSound } from '../utils/sound';
import { Palette, Check, Sparkles, Sun, Moon, Pipette, RefreshCw } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: ColorSchemeId;
  onThemeChange: (themeId: ColorSchemeId) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'day' | 'night' | 'custom'>(
    isDayMode(currentTheme) ? 'day' : 'night'
  );
  const [customBg, setCustomBg] = useState<string>(getSavedCustomBg());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync active tab when current theme changes
  useEffect(() => {
    if (currentTheme === 'custom-bg') {
      setActiveTab('custom');
    } else if (isDayMode(currentTheme)) {
      setActiveTab('day');
    } else {
      setActiveTab('night');
    }
  }, [currentTheme]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeScheme =
    currentTheme === 'custom-bg'
      ? {
          name: 'Custom Background',
          preview: { bg: customBg, accent: isDayMode(currentTheme) ? '#B45309' : '#D4AF37' },
        }
      : COLOR_SCHEMES.find((s) => s.id === currentTheme) || COLOR_SCHEMES[0];

  const handleSelectScheme = (schemeId: ColorSchemeId) => {
    playClickSound();
    onThemeChange(schemeId);
    saveColorScheme(schemeId);
  };

  const handleCustomColorChange = (newHex: string) => {
    setCustomBg(newHex);
    saveCustomBg(newHex);
    onThemeChange('custom-bg');
    applyColorSchemeToDOM('custom-bg', newHex);
    try {
      localStorage.setItem('weekly_ledger_color_scheme', 'custom-bg');
    } catch {}
  };

  const daySchemes = COLOR_SCHEMES.filter((s) => s.isLight);
  const nightSchemes = COLOR_SCHEMES.filter((s) => !s.isLight);

  const quickCustomPresets = [
    { label: 'Pitch Black', hex: '#000000' },
    { label: 'Deep Charcoal', hex: '#121214' },
    { label: 'Midnight Blue', hex: '#0a1128' },
    { label: 'Pure White', hex: '#FFFFFF' },
    { label: 'Warm Cream', hex: '#FAF8F5' },
    { label: 'Soft Alabaster', hex: '#F3F4F6' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Palette Button */}
      <button
        id="theme-palette-toggle-btn"
        type="button"
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#121212] border border-[#1F1F1F] hover:border-[#333333] text-[#888888] hover:text-white transition cursor-pointer text-[10px] uppercase tracking-wider font-mono select-none"
        title="Change Background & Colour Theme"
      >
        <Palette className="w-3.5 h-3.5 text-[var(--gold)]" />
        <span className="hidden sm:inline">Background</span>
        <div
          className="w-2.5 h-2.5 rounded-full border border-white/20 ml-0.5 shadow-xs"
          style={{ backgroundColor: activeScheme.preview.accent }}
        />
      </button>

      {/* Dropdown Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#141414] border border-[#262626] rounded-sm p-3.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#222222]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-white">
              <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span>Theme &amp; Background</span>
            </div>
            <span className="text-[10px] font-mono text-[#888888] uppercase">
              {isDayMode(currentTheme) ? '☀️ Day (White)' : '🌙 Night (Black)'}
            </span>
          </div>

          {/* Day / Night / Custom Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xs mb-3">
            <button
              id="theme-tab-night"
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('night');
                if (isDayMode(currentTheme)) {
                  handleSelectScheme('sophisticated-dark');
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase font-mono font-medium rounded-xs transition cursor-pointer ${
                activeTab === 'night'
                  ? 'bg-[#1F1F1F] text-white border border-[#333333] shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3 text-[var(--gold)]" />
              <span>Night</span>
            </button>

            <button
              id="theme-tab-day"
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('day');
                if (!isDayMode(currentTheme) || currentTheme === 'custom-bg') {
                  handleSelectScheme('pure-white');
                }
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase font-mono font-medium rounded-xs transition cursor-pointer ${
                activeTab === 'day'
                  ? 'bg-[#E5C158] text-[#0A0A0A] font-semibold shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3 text-[#B45309]" />
              <span>Day</span>
            </button>

            <button
              id="theme-tab-custom"
              type="button"
              onClick={() => {
                playClickSound();
                setActiveTab('custom');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] uppercase font-mono font-medium rounded-xs transition cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-[#1F1F1F] text-white border border-[#333333] shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Pipette className="w-3 h-3 text-[var(--gold)]" />
              <span>Custom</span>
            </button>
          </div>

          {/* List of Presets or Custom Picker */}
          {activeTab === 'day' && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888] px-1 mb-1">
                Day (White) Backgrounds &middot; Inverted Dark Text
              </div>
              {daySchemes.map((scheme) => {
                const isSelected = scheme.id === currentTheme;
                return (
                  <button
                    key={scheme.id}
                    id={`theme-option-${scheme.id}`}
                    type="button"
                    onClick={() => handleSelectScheme(scheme.id)}
                    className={`w-full text-left p-2.5 rounded-xs border transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-[#1C1C1C] border-[var(--gold)] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'bg-[#101010] border-[#222222] hover:bg-[#181818] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-black/20 shadow-sm"
                        style={{
                          backgroundColor: scheme.preview.bg,
                          borderColor: scheme.preview.border,
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: scheme.preview.accent }}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-1.5">
                          <span>{scheme.name}</span>
                        </div>
                        <div className="text-[10px] text-[#777777] line-clamp-1 leading-tight font-light mt-0.5">
                          {scheme.subtitle}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--gold)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'night' && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888] px-1 mb-1">
                Night (Black) Backgrounds &middot; Crisp Light Text
              </div>
              {nightSchemes.map((scheme) => {
                const isSelected = scheme.id === currentTheme;
                return (
                  <button
                    key={scheme.id}
                    id={`theme-option-${scheme.id}`}
                    type="button"
                    onClick={() => handleSelectScheme(scheme.id)}
                    className={`w-full text-left p-2.5 rounded-xs border transition flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-[#1C1C1C] border-[var(--gold)] shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        : 'bg-[#101010] border-[#222222] hover:bg-[#181818] hover:border-[#333333]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm"
                        style={{
                          backgroundColor: scheme.preview.bg,
                          borderColor: scheme.preview.border,
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: scheme.preview.accent }}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-white flex items-center gap-1.5">
                          <span>{scheme.name}</span>
                        </div>
                        <div className="text-[10px] text-[#777777] line-clamp-1 leading-tight font-light mt-0.5">
                          {scheme.subtitle}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--gold)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-3 p-1">
              <div className="text-[10px] font-mono text-[#888888] leading-relaxed">
                Pick any custom background color. The system automatically calculates brightness and inverts text for high contrast.
              </div>

              {/* Color input control */}
              <div className="flex items-center gap-2.5 bg-[#0A0A0A] border border-[#222222] p-2 rounded-xs">
                <input
                  type="color"
                  id="custom-bg-color-picker"
                  value={customBg.startsWith('#') ? customBg : '#0A0A0A'}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-8 h-8 rounded-xs border border-white/20 cursor-pointer bg-transparent p-0"
                  title="Pick background color"
                />
                <div className="flex-1">
                  <div className="text-[9px] uppercase tracking-wider text-[#666666] font-mono">
                    HEX Code
                  </div>
                  <input
                    type="text"
                    id="custom-bg-hex-input"
                    value={customBg}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomBg(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
                        handleCustomColorChange(val);
                      }
                    }}
                    placeholder="#0A0A0A"
                    className="w-full bg-transparent text-xs font-mono text-white outline-none border-b border-transparent focus:border-[var(--gold)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCustomColorChange('#0A0A0A')}
                  className="p-1 text-[#666666] hover:text-white transition"
                  title="Reset to default obsidian black"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Preset Palette */}
              <div>
                <div className="text-[9px] uppercase font-mono tracking-wider text-[#666666] mb-1.5">
                  Quick Background Swatches
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {quickCustomPresets.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleCustomColorChange(preset.hex)}
                      className={`flex items-center gap-2 p-1.5 rounded-xs border text-[10px] font-mono transition cursor-pointer ${
                        customBg.toLowerCase() === preset.hex.toLowerCase() && currentTheme === 'custom-bg'
                          ? 'border-[var(--gold)] bg-[#1C1C1C] text-white'
                          : 'border-[#222222] bg-[#101010] text-[#888888] hover:text-white hover:border-[#333333]'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
