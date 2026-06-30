'use client';

import { useState } from 'react';

export default function RoomAiPage() {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [sofaImage, setSofaImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 구글 AI 좌표 스타일 상태
  const [sofaStyle, setSofaStyle] = useState<React.CSSProperties | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'room' | 'sofa') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'room') {
          setRoomImage(reader.result as string);
          setSofaStyle(null);
        }
        if (type === 'sofa') {
          setSofaImage(reader.result as string);
          setSofaStyle(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
        // [수정] 무조건 부모 박스의 % 기준으로 칼같이 얹어지도록 설정
        setSofaStyle({
          position: 'absolute',
          left: `${data.placement.x}%`,
          top: `${data.placement.y}%`,
          width: `${data.placement.width}%`,
          height: `${data.placement.height}%`,
          transform: 'translate(-50%, -50%)', // 정중앙 매칭
          objectFit: 'contain',
          zIndex: 50,
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
        <div className="border p-4 rounded bg-gray-50">
          <label className="block font-semibold mb-2">1. 내 공간 사진 등록 (거실/방)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'room')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {roomImage && <img src={roomImage} alt="Room" className="mt-4 max-h-48 object-contain mx-auto rounded" />}
        </div>

        <div className="border p-4 rounded bg-gray-50">
          <label className="block font-semibold mb-2">2. 배치할 소파 사진 등록 (PNG 권장)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'sofa')} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          {sofaImage && <img src={sofaImage} alt="Sofa" className="mt-4 max-h-48 object-contain mx-auto rounded" />}
        </div>
      </div>

      <button
        onClick={handleArrange}
        disabled={isLoading || !roomImage || !sofaImage}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6 transition"
      >
        {isLoading ? 'AI가 배치 공간 분석 및 배치 중...' : '내 공간에 배치하기'}
      </button>

      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      {roomImage && (
        <div className="border p-4 rounded bg-white shadow-inner max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-3 text-center">미리보기 결과</h2>
          
          {/* [핵심 교정] 블록 정렬을 맞추고 확실하게 relative 기준점을 강제 주입했습니다. */}
          <div className="relative w-full overflow-hidden rounded bg-gray-900" style={{ position: 'relative' }}>
            {/* 배경 거실 이미지 */}
            <img src={roomImage} alt="Final Room" className="w-full h-auto block" />
            
            {/* 이제 거실 이미지 프레임 밖으로 절대 탈출하지 못하는 소파 레이어 */}
            {sofaImage && sofaStyle && (
              <img src={sofaImage} alt="Placed Sofa" style={sofaStyle} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
