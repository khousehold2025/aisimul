'use client';

import { useState, ChangeEvent } from 'react';
import BeforeAfterSlider from '../../components/BeforeAfterSlider';

export default function RoomAiPage() {
  const [roomImg, setRoomImg] = useState<string | null>(null);
  const [sofaImg, setSofaImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImg, setResultImg] = useState<string | null>(null);

  // 이미지 파일을 Base64로 변환하는 함수
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, type: 'room' | 'sofa') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'room') setRoomImg(reader.result as string);
        if (type === 'sofa') setSofaImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!roomImg || !sofaImg) return alert('두 사진을 모두 업로드해주세요!');
    
    setLoading(true);
    setResultImg(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomImage: roomImg, sofaImage: sofaImg }),
      });

      const data = await res.json();
      if (data.success) {
        setResultImg(data.resultImage);
      } else {
        alert(data.error || '생성 실패');
      }
    } catch (err) {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">케이하우스홀드 회원전용 - 우리집 소파 미리보기</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 1. 배경 거실 사진 업로드 */}
        <div className="border-2 border-dashed p-4 rounded text-center">
          <p className="font-medium mb-2">1. 우리집 거실 사진 (배경)</p>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'room')} className="mb-4" />
          {roomImg && <img src={roomImg} alt="거실" className="h-40 mx-auto object-contain" />}
        </div>

        {/* 2. 투명 소파 PNG 사진 업로드 */}
        <div className="border-2 border-dashed p-4 rounded text-center">
          <p className="font-medium mb-2">2. 소파 이미지 (투명 PNG)</p>
          <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'sofa')} className="mb-4" />
          {sofaImg && <img src={sofaImg} alt="소파" className="h-40 mx-auto object-contain bg-gray-100" />}
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="text-center mb-8">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white px-8 py-3 rounded font-bold disabled:bg-gray-400"
        >
          {loading ? 'AI가 소파를 배치하는 중... (약 20초)' : '내 공간에 배치하기'}
        </button>
      </div>

      {/* 결과 화면 (Before / After 슬라이더) */}
      {resultImg && roomImg && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-center">배치 결과 확인</h2>
          <BeforeAfterSlider before={roomImg} after={resultImg} />
          <div className="text-center mt-4">
            <a href={resultImg} download="khousehold-sofa-ai.jpg" className="bg-gray-800 text-white px-6 py-2 rounded text-sm">
              이미지 다운로드
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
