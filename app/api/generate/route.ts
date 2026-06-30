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
    
    // 무거운 이미지 대신 가벼운 좌표(JSON)만 빠르게 계산하도록 요청합니다.
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
       Do not include markdown formatting or backticks.
       
       Format:
       {
         "x": number, (left position in %)
         "y": number, (top position in %)
         "width": number, (width in %)
         "height": number (height in %)
       }`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 안전하게 JSON 데이터만 추출
    const cleanJsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const placement = JSON.parse(cleanJsonText);

    // 프론트엔드가 이미지 2장을 레이어로 합칠 수 있도록 원본 데이터와 좌표를 그대로 넘겨줍니다.
    return NextResponse.json({
      success: true,
      isCoordinates: true, // 프론트엔드 구분을 위한 플래그
      placement,
      roomImage,
      sofaImage
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
