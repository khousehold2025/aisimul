export default function HomePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
      <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>케이하우스홀드 AI</h1>
        <p style={{ color: '#4b5563', marginBottom: '24px' }}>우리집 거실에 소파를 미리 배치해보세요.</p>
        <a href="/room-ai" style={{ display: 'inline-block', backgroundColor: '#000000', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
          소파 미리보기 시작하기 
        </a>
      </div>
    </div>
  );
}
