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

    // 초고속 처리를 위해 품질 설정을 최적화합니다.
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });
    
    // 연산 시간을 줄이기 위해 프롬프트를 핵심 위주로 대폭 압축했습니다.
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
    
    // 만약 백틱이나 줄바꿈 텍스트가 섞여 들어왔을 때를 대비해 순수 JSON만 발라냅니다.
    const cleanJsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsedData = JSON.parse(cleanJsonText);
    const generatedImageBase64 = parsedData.imageBase64?.trim();

    if (!generatedImageBase64) {
      throw new Error('이미지 데이터 파싱에 실패했습니다.');
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
