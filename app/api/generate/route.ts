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

    // 1. 전 세계 표준 모델인 gemini-1.5-flash를 정확하게 호출합니다.
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // 2. 이미지 2장과 명령어를 구글이 원하는 정석 배열 구조로 전달합니다.
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
      `You are an expert interior designer. The first image is a customer's empty or existing living room. The second image is a high-quality sofa PNG with a transparent background. TASK: 1. Place the sofa from the second image NATURALLY into the living room. 2. Detect the floor and perspective of the room, and scale/rotate the sofa to match the perspective perfectly. 3. Generate realistic shadows underneath and behind the sofa based on the room's lighting. 4. DO NOT alter any other parts of the room (walls, windows, other furniture, floor color). 5. Keep the sofa's original design, texture, and color identical. 6. Output ONLY the final rendered room image.`
    ]);

    // 3. 구글 객체에서 에러 없이 가장 안전하게 결과물(텍스트 또는 이미지 데이터)을 꺼내는 최신 문법입니다.
    const response = await result.response;
    const text = response.text();

    // 만약 Gemini가 이미지 바이너리 대신 텍스트나 다른 형태로 주었을 때를 대비한 안전장치
    let generatedImageBase64 = '';
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && 'inlineData' in part) {
      generatedImageBase64 = part.inlineData?.data || '';
    }

    // 만약 이미지 데이터가 없다면 텍스트 결과물이라도 확인용으로 넘겨줍니다.
    if (!generatedImageBase64) {
      // 텍스트 응답에 base64 데이터가 포함되어 있는지 체크하거나 예외 처리
      if (text.includes('data:image')) {
        const match = text.match(/data:image\/[^;]+;base64,([^\s)]+)/);
        generatedImageBase64 = match ? match[1] : '';
      }
    }

    if (!generatedImageBase64) {
      throw new Error('Gemini 모델이 이미지를 직접 생성하지 못했습니다. (모델의 출력 형식을 확인해 주세요)');
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
