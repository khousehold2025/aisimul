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

    // [변경] v1beta API에서 멀티모달 이미지 처리를 완벽하게 지원하는 gemini-2.5-flash 모델을 사용합니다.
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: roomImage.split(',')[1] // Base64 데이터 추출
        }
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: sofaImage.split(',')[1] // 투명 배경 소파 PNG 추출
        }
      },
      `You are an expert interior designer. The first image is a customer's empty or existing living room. The second image is a high-quality sofa PNG with a transparent background. TASK: 1. Place the sofa from the second image NATURALLY into the living room. 2. Detect the floor and perspective of the room, and scale/rotate the sofa to match the perspective perfectly. 3. Generate realistic shadows underneath and behind the sofa based on the room's lighting. 4. DO NOT alter any other parts of the room (walls, windows, other furniture, floor color). 5. Keep the sofa's original design, texture, and color identical. 6. Output ONLY the final rendered room image.`
    ]);

    // 최신 SDK 스펙에 맞춰 response에서 데이터를 안전하게 추출합니다.
    const response = await result.response;
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];
    
    let generatedImageBase64 = '';
    if (part && 'inlineData' in part) {
      generatedImageBase64 = part.inlineData?.data || '';
    }

    // 만약 데이터가 직접 추출되지 않고 텍스트 안에 포함되어 나올 경우를 대비한 안전 장치
    if (!generatedImageBase64) {
      const text = response.text();
      if (text.includes('data:image')) {
        const match = text.match(/data:image\/[^;]+;base64,([^\s)]+)/);
        generatedImageBase64 = match ? match[1] : '';
      }
    }

    if (!generatedImageBase64) {
      throw new Error('Gemini 모델로부터 합성 이미지 데이터를 받아오지 못했습니다.');
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
