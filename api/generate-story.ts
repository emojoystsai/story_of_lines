import { GoogleGenerativeAI } from "@google/generative-ai";

// 👇 注意這裡：加了 : any 之後，紅線就會消失了
export default async function handler(req: any, res: any) {
  // 1. CORS 設定 (允許手機存取)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.Vercel_Key;
    if (!apiKey) throw new Error("Vercel_Key is missing");

    const { image } = req.body;
    if (!image) throw new Error("Image data is missing");

    // 2. 呼叫 Google AI (使用 Flash 模型)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "你是一位靈魂小說家。請根據這張圖寫一個100字左右的繁體中文極短篇故事。";
    const cleanImage = image.includes(',') ? image.split(',')[1] : image;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: cleanImage, mimeType: "image/png" } }
    ]);

    const response = await result.response;
    const story = response.text();

    return res.status(200).json({ story });

  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || String(error) });
  }
}