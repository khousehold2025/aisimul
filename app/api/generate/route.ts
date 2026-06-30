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

    // 1. 이미지 출력을 지원하는 gemini-2.5-flash 모델을 가져옵니다.
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });
    
    // 2. 구글 Flow 규격에 맞게 거실 사진, 소파 사진, 프롬프트를 전달합니다.
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
          `CRITICAL TASK: Merge the sofa from image 2 into the room in image 1.
       - Place the sofa naturally on the floor.
       - Match perspective and lighting.
       - Output Format: Return ONLY a raw JSON object with a single key 'imageBase64'. Do not write markdown blocks or backticks.
       Example: {"imageBase64": "your_base64_string_here"}`
    ]);

    const response = await result.response;
    const text = response.text();
    
    // 마크다운 백틱(```json)이 들어가 있을 경우를 대비해 순수 JSON만 추출합니다.
    const cleanJsonText = text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanJsonText);
    const generatedImageBase64 = parsedData.imageBase64?.trim();

    if (!generatedImageBase64) {
      throw new Error('Gemini 모델이 이미지 데이터를 생성하지 못했습니다.');
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
