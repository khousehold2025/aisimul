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

    // 1. 이미지 출력을 안정적으로 지원하는 gemini-2.5-flash 모델을 가져옵니다.
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      // [수정] 외부 export 에러를 막기 위해 구조체 타입을 문자열 대문자로 직접 지정합니다.
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            success: { type: "BOOLEAN" },
            imageBase64: { 
              type: "STRING", 
              description: "The final rendered room image containing the sofa, encoded in base64 without data URI prefix" 
            }
          },
          required: ["imageBase64"]
        }
      }
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
      `TASK: Place the sofa from the second image naturally into the living room shown in the first image.
       1. Detect the floor and perspective of the room, and scale/rotate the sofa to match perfectly.
       2. Generate realistic shadows underneath and behind the sofa based on the room's lighting.
       3. DO NOT alter any other parts of the room. Keep the sofa's original design, texture, and color identical.
       4. Output the result image as a base64 string inside the JSON object property 'imageBase64'.`
    ]);

    const response = await result.response;
    const jsonText = response.text();
    
    // 구글이 보낸 JSON 응답에서 이미지 데이터 추출
    const parsedData = JSON.parse(jsonText);
    const generatedImageBase64 = parsedData.imageBase64?.trim();

    if (!generatedImageBase64) {
      throw new Error('Gemini 모델이 이미지 데이터를 JSON 구조로 생성하지 못했습니다.');
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
