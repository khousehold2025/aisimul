import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 구글 Gemini API 초기화
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { roomImage, sofaImage } = await req.json();

    if (!roomImage || !sofaImage) {
      return NextResponse.json({ error: '공간 사진과 소파 이미지가 모두 필요합니다.' }, { status: 400 });
    }

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 무거운 이미지 변환 대신 1초 만에 끝나는 가벼운 배치 좌표(JSON)만 요청합니다.
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: roomImage.split(',')[1]
        }
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: sofaImage.split(',')[1]
        }
      },
      `TASK: Analyze the room perspective and find the perfect placement for the sofa.
       Return ONLY a raw JSON object with placement coordinates (percentages 0-100 relative to the room image).
       Do not include markdown formatting, backticks, or any conversational text.
       
       Required Output Format:
       {"x": 40, "y": 60, "width": 35, "height": 20}`
    ]);

    const response = await result.response;
    const text = response.text()?.trim() || '';
    
    // 구글 응답에서 중괄호 {} 부분을 안전하게 도려냅니다.
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      // 구글이 JSON을 안 줬을 때를 대비한 기본값 배치 좌표 (정중앙 바닥 부근)
      return NextResponse.json({
        success: true,
        isCoordinates: true,
        placement: { x: 35, y: 55, width: 30, height: 25 },
        roomImage,
        sofaImage
      });
    }

    const cleanJsonText = text.substring(startIdx, endIdx + 1);
    const placement = JSON.parse(cleanJsonText);

    return NextResponse.json({
      success: true,
      isCoordinates: true,
      placement,
      roomImage,
      sofaImage
    });

  } catch (error: any) {
    console.error(error);
    // 에러 발생 시에도 화면이 먹통 되지 않도록 기본 좌표를 들려 보냅니다.
    return NextResponse.json({
      success: true,
      isCoordinates: true,
      placement: { x: 35, y: 55, width: 30, height: 25 },
      roomImage,
      sofaImage
    });
  }
}
