import { useState } from 'react';

export default function App() {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStory("正在讀取圖片並構思故事... (這可能需要幾秒鐘)");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        
        // 呼叫我們剛寫好的 API
        const res = await fetch('/api/generate-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `Server Error: ${res.status}`);
        }
        
        setStory(data.story);

      } catch (err: any) {
        console.error(err);
        setStory("❌ 發生錯誤: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>✨ 線條故事機 (Reborn)</h1>
      <p>上傳一張圖片，AI 將為你寫出一段極短篇。</p>
      
      <div style={{ margin: '20px 0', border: '2px dashed #ccc', padding: '20px', borderRadius: '8px' }}>
        <input type="file" accept="image/*" onChange={handleUpload} disabled={loading} />
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        minHeight: '100px',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.6'
      }}>
        {loading ? "⏳ 正在與謬思女神連線..." : (story || "故事將顯示在這裡...")}
      </div>
    </div>
  );
}