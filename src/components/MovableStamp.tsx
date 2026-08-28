import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Move, X, Stamp } from 'lucide-react';
import { playStampSound } from '../utils/sound';

interface MovableStampProps {
  onClose?: () => void;
}

interface InkMark {
  id: string;
  x: number;
  y: number;
  text: string;
  rotation: number;
}

export const MovableStamp: React.FC<MovableStampProps> = ({ onClose }) => {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 40, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [stampText, setStampText] = useState('APPROVED ✓');
  const [inkMarks, setInkMarks] = useState<InkMark[]>([]);
  const stampRef = useRef<HTMLDivElement>(null);

  // Handle keyboard controls (Arrow keys, Space/Enter to stamp)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const step = e.shiftKey ? 30 : 12;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPos((prev) => ({ ...prev, x: Math.max(10, prev.x - step) }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPos((prev) => ({ ...prev, x: Math.min(window.innerWidth - 180, prev.x + step) }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPos((prev) => ({ ...prev, y: Math.max(70, prev.y - step) }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPos((prev) => ({ ...prev, y: Math.min(window.innerHeight - 140, prev.y + step) }));
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        leaveStamp();
      }
    },
    [pos, stampText]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const leaveStamp = () => {
    playStampSound();
    const newMark: InkMark = {
      id: `ink_${Date.now()}_${Math.random()}`,
      x: pos.x + 20,
      y: pos.y + 15,
      text: stampText,
      rotation: Math.floor(Math.random() * 16) - 8,
    };
    setInkMarks((prev) => [...prev.slice(-14), newMark]);
  };

  // Drag listeners
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 180, e.clientX - dragOffset.x)),
        y: Math.max(70, Math.min(window.innerHeight - 140, e.clientY - dragOffset.y)),
      });
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragOffset]);

  return (
    <>
      {/* Placed Gold Ink Marks on page */}
      {inkMarks.map((mark) => (
        <div
          key={mark.id}
          className="fixed pointer-events-none z-30 font-mono text-xs font-bold uppercase px-3 py-1.5 border border-dashed border-[#D4AF37] text-[#D4AF37] bg-[#0A0A0A]/90 shadow-[0_0_15px_rgba(212,175,55,0.2)] rounded-lg transition-opacity duration-700 tracking-wider"
          style={{
            left: `${mark.x}px`,
            top: `${mark.y}px`,
            transform: `rotate(${mark.rotation}deg)`,
          }}
        >
          {mark.text}
        </div>
      ))}

      {/* Floating Movable Stamp Component */}
      <div
        ref={stampRef}
        id="movable-classroom-stamp"
        className="fixed z-40 select-none cursor-grab active:cursor-grabbing bg-[#121212] border border-[#1F1F1F] hover:border-[#D4AF37]/50 rounded-xl shadow-2xl p-3.5 flex flex-col gap-2.5 w-52 text-[#E0E0E0]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          touchAction: 'none',
        }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center justify-between border-b border-[#1F1F1F] pb-2">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-[#D4AF37]">
            <Move className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Interactive Stamp</span>
          </div>
          {onClose && (
            <button
              id="close-movable-stamp-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-[#666666] hover:text-white p-0.5 rounded-md cursor-pointer"
              title="Close stamp widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Visual Stamp Surface */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            leaveStamp();
          }}
          className="border border-dashed border-[#D4AF37] bg-[#161616] hover:bg-[#1A1A1A] p-2.5 text-center rounded-lg text-[#D4AF37] transition cursor-pointer group shadow-[0_0_10px_rgba(212,175,55,0.08)]"
          title="Click or press Spacebar to stamp"
        >
          <div className="font-mono font-bold text-xs tracking-wider uppercase group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
            <Stamp className="w-3.5 h-3.5" />
            <span>{stampText}</span>
          </div>
          <div className="text-[9px] text-[#666666] font-mono mt-1 tracking-wider uppercase">
            Spacebar / Click to Stamp
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <select
            id="stamp-text-select"
            value={stampText}
            onChange={(e) => setStampText(e.target.value)}
            className="w-full text-[10px] font-mono py-1 px-2 bg-[#161616] border border-[#1F1F1F] rounded-md text-[#E0E0E0] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="APPROVED ✓">APPROVED ✓</option>
            <option value="EXCELLENT ★">EXCELLENT ★</option>
            <option value="REVISIT ⚑">REVISIT ⚑</option>
            <option value="VERIFIED 100%">VERIFIED 100%</option>
            <option value="UNIT READY!">UNIT READY!</option>
          </select>
        </div>

        <div className="text-[9px] text-[#666666] font-mono text-center leading-tight bg-[#161616] border border-[#1F1F1F] py-1 rounded-md uppercase tracking-wider">
          Move with <span className="text-[#D4AF37]">Arrow Keys</span>
        </div>

        {inkMarks.length > 0 && (
          <button
            id="clear-ink-marks-btn"
            onClick={(e) => {
              e.stopPropagation();
              setInkMarks([]);
            }}
            className="text-[9px] text-[#888888] hover:text-[#EF4444] font-mono uppercase tracking-widest text-center cursor-pointer pt-0.5"
          >
            Clear {inkMarks.length} ink marks
          </button>
        )}
      </div>
    </>
  );
};
