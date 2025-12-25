import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  // 1. CORS 設定
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

    const cleanImage = image.includes(',') ? image.split(',')[1] : image;
    const prompt = "你是一位靈魂小說家。請根據這張圖寫一個100字左右的繁體中文極短篇故事。";
    const genAI = new GoogleGenerativeAI(apiKey);

    // 🛡️ 核心修改：這就是「一定可行」的關鍵
    // 我們準備了三個模型名稱，程式會自動一個一個試，直到成功為止。
    const modelCandidates = [
      "gemini-1.5-flash",        // 嘗試 1: 標準名稱
      "gemini-2.0-flash-latest", // 嘗試 2: 最新指標
      "gemini-1.5-flash-001",    // 嘗試 3: 固定版本號
      "gemini-2.0-flash"        // 嘗試 4: 舊版 (保底)
    ];

    let lastError = null;

    // 迴圈測試：只要有一個成功，就會回傳並結束
    for (const modelName of modelCandidates) {
      try {
        console.log(`Trying model: ${modelName}...`); // 記錄現在試哪一個
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent([
          prompt,
          { inlineData: { data: cleanImage, mimeType: "image/png" } }
        ]);

        const response = await result.response;
        const story = response.text();
        
        // 成功了！回傳結果
        return res.status(200).json({ story, modelUsed: modelName });

      } catch (err: any) {
        console.error(`Model ${modelName} failed:`, err.message);
        lastError = err;
        // 失敗了，繼續迴圈試下一個...
      }
    }

    // 如果全部都失敗，才會拋出錯誤
    throw lastError || new Error("All models failed");

  } catch (error: any) {
    console.error("Final API Error:", error);
    return res.status(500).json({ 
      error: error.message || String(error),
      details: "請確認您的 Google AI Studio API Key 是否有效"
    });
  }
}