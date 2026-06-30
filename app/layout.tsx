export const metadata = {
  title: '케이하우스홀드 AI 소파 미리보기',
  description: '우리집 거실에 소파를 미리 배치해보세요.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f9fafb' }}>
        {children}
      </body>
    </html>
  );
}
