import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 구글 Gemini API 초기화
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { roomImage, sofaImage, sofaModel } = await req.json();

    if (!roomImage || !sofaImage) {
      return NextResponse.json({ error: '공간 사진과 소파 이미지가 모두 필요합니다.' }, { status: 400 });
    }

    // [수정] v1beta API에서 이미지 처리를 확실하게 지원하는 gemini-1.5-flash-latest 모델로 지정합니다.
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: roomImage.split(',')[1] // Base64 데이터만 추출
        }
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: sofaImage.split(',')[1] // 투명 배경 소파 PNG
        }
      },
      `You are an expert interior designer. The first image is a customer's empty or existing living room. The second image is a high-quality sofa PNG with a transparent background. TASK: 1. Place the sofa from the second image NATURALLY into the living room. 2. Detect the floor and perspective of the room, and scale/rotate the sofa to match the perspective perfectly. 3. Generate realistic shadows underneath and behind the sofa based on the room's lighting. 4. DO NOT alter any other parts of the room (walls, windows, other furniture, floor color). 5. Keep the sofa's original design, texture, and color identical. 6. Output ONLY the final rendered room image.`
    ]);

    // 최신 SDK 문법에 맞춰 response에서 안전하게 candidates 구조를 찾아 추출합니다.
    const candidate = result.response?.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    const generatedImageBase64 = part && 'inlineData' in part ? part.inlineData?.data : null;

    if (!generatedImageBase64) {
      throw new Error('AI 이미지 생성에 실패했습니다.');
    }

    return NextResponse.json({
      success: true,
      resultImage: `data:image/jpeg;base64,${generatedImageBase64}`
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
