'use client';

import { useState } from 'react';

export default function RoomAiPage() {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [sofaImage, setSofaImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 구글 AI가 계산한 좌표를 저장할 상태(State)
  const [sofaStyle, setSofaStyle] = useState<React.CSSProperties | null>(null);

  // 이미지 업로드 처리 (Base64 변환)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'room' | 'sofa') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'room') setRoomImage(reader.result as string);
        if (type === 'sofa') setSofaImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 배치하기 버튼 클릭 시 구글 Flow 호출
  const handleArrange = async () => {
    if (!roomImage || !sofaImage) return;
    setIsLoading(true);
    setError(null);
    setSofaStyle(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomImage, sofaImage }),
      });

      const data = await res.json();

      if (data.success && data.placement) {
        // 백엔드가 계산해 준 % 좌표를 소파 스타일에 그대로 입혀줍니다.
        setSofaStyle({
          position: 'absolute',
          left: `${data.placement.x}%`,
          top: `${data.placement.y}%`,
          width: `${data.placement.width}%`,
          height: `${data.placement.height}%`,
          transform: 'translate(-50%, -50%)', // 정중앙 기준 정렬
          pointerEvents: 'auto',
          cursor: 'move',
          zIndex: 10
        });
      } else {
        throw new Error(data.error || '좌표를 가져오지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">케이하우스홀드 회원전용 - 우리집 소파 미리보기</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 거실 사진 등록 */}
        <div className="border p-4 rounded bg-gray-50">
          <label className="block font-semibold mb-2">1. 내 공간 사진 등록 (거실/방)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'room')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {roomImage && <img src={roomImage} alt="Room" className="mt-4 max-h-48 object-contain mx-auto rounded" />}
        </div>

        {/* 소파 사진 등록 */}
        <div className="border p-4 rounded bg-gray-50">
          <label className="block font-semibold mb-2">2. 배치할 소파 사진 등록 (PNG 권장)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'sofa')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          {sofaImage && <img src={sofaImage} alt="Sofa" className="mt-4 max-h-48 object-contain mx-auto rounded" />}
        </div>
      </div>

      {/* 배치하기 버튼 */}
      <button
        onClick={handleArrange}
        disabled={isLoading || !roomImage || !sofaImage}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6 transition"
      >
        {isLoading ? 'AI가 배치 공간 분석 및 배치 중...' : '내 공간에 배치하기'}
      </button>

      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      {/* 최종 미리보기 화면 (두 이미지가 겹쳐서 렌더링되는 마법 공간) */}
      {roomImage && (
        <div className="border p-4 rounded bg-white shadow-inner">
          <h2 className="text-lg font-bold mb-3 text-center">미리보기 결과</h2>
          <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded bg-black flex items-center justify-center">
            {/* 배경 거실 이미지 */}
            <img src={roomImage} alt="Final Room" className="w-full h-auto block" />
            
            {/* 구글 AI 좌표값을 받아 거실 위에 레이어로 얹어지는 소파 이미지 */}
            {sofaImage && sofaStyle && (
              <img src={sofaImage} alt="Placed Sofa" style={sofaStyle} className="transition-all duration-300" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
