import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">케이하우스홀드</h1>
        <p className="text-gray-600 mb-6">우리집 거실에 어울리는 소파를 AI로 미리 배치해 보세요.</p>

        {/* 클릭하면 room-ai 페이지로 이동 */}
        <Link href="/room-ai" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition">
          소파 미리보기 시작하기
        </Link>
      </div>
    </div>
  );
}
