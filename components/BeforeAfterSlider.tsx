'use client';

import { useState, MouseEvent, TouchEvent } from 'react';

interface Props { before: string; after: string; }

export default function BeforeAfterSlider({ before, after }: Props) {
  const [sliderPos, setSliderPos] = useState(50);

  const handleMove = (clientX: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  return (
    <div 
      className="relative w-full h-[450px] overflow-hidden select-none rounded-lg shadow"
      onMouseMove={(e: MouseEvent<HTMLDivElement>) => handleMove(e.clientX, e.currentTarget)}
      onTouchMove={(e: TouchEvent<HTMLDivElement>) => handleMove(e.touches[0].clientX, e.currentTarget)}
    >
      {/* After 이미지 (소파 배치됨) */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
      
      {/* Before 이미지 (원본 거실 - 슬라이더 너비만큼만 보여줌) */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPos}%` }}
      >
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%' }} />
      </div>

      {/* 슬라이더 바 구분선 */}
      <div className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize" style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow text-xs font-bold">
          ↔
        </div>
      </div>
    </div>
  );
}