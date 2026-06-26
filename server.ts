import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily & Safely to prevent startup crashes if key is omitted
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// 1. Weather code mapper
function getWeatherCondition(code: number): string {
  const codes: Record<number, string> = {
    0: "Açık Gökyüzü",
    1: "Çoğunlukla Açık",
    2: "Parçalı Bulutlu",
    3: "Kapalı Bulutlu",
    45: "Sisli",
    48: "Kırağı Sisli",
    51: "Hafif Çiseleme",
    53: "Orta Çiseleme",
    55: "Yoğun Çiseleme",
    61: "Hafif Yağmurlu",
    63: "Yağmurlu",
    65: "Sağanak Yağmurlu",
    71: "Hafif Karlı",
    73: "Karlı",
    75: "Yoğun Karlı",
    77: "Kar Taneleri",
    80: "Hafif Yağmur Sağanağı",
    81: "Yağmur Sağanağı",
    82: "Şiddetli Yağmur Sağanağı",
    85: "Hafif Kar Sağanağı",
    86: "Yoğun Kar Sağanağı",
    95: "Gökgürültülü Fırtına",
    96: "Dolu Yağışlı Hafif Fırtına",
    99: "Dolu Yağışlı Şiddetli Fırtına",
  };
  return codes[code] || "Belirsiz Hava Durumu";
}

// 2. Fallback procedural briefing generator when Gemini is missing/fails
function generateProceduralBriefing(
  city: string,
  temp: number,
  condition: string,
  humidity: number,
  windSpeed: number,
  tempMin: number,
  tempMax: number,
  personality: string
): string {
  const roundedTemp = Math.round(temp);
  switch (personality) {
    case "poetic":
      return `Bugün gökyüzü sessizce ${condition} şarkısını mırıldanıyor ve hava tatlı bir ${roundedTemp} derece.`;
    case "humorous":
      return `Uyanma vakti! Dışarısı şu an ${condition} ve tam ${roundedTemp} derece, haberiniz olsun!`;
    case "energetic":
      return `Mükemmel bir gün başladı! Hava şu an ${condition} ve sıcaklık tamı tamına ${roundedTemp} derece!`;
    case "futuristic":
      return `Atmosfer durumu: ${condition}. Termal seviye: ${roundedTemp} derece.`;
    case "standard":
    default:
      return `${city} için hava durumu şu an ${condition} ve sıcaklık ${roundedTemp} derece.`;
  }
}

// --- API ENDPOINTS ---

// 1. Geocoding API
app.get("/api/geocode", async (req, res) => {
  try {
    const { city } = req.query;
    if (!city || typeof city !== "string") {
      return res.status(400).json({ error: "City query parameter is required" });
    }

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=1&language=tr`
    );
    if (!response.ok) {
      throw new Error("Geocoding failed");
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: "Şehir bulunamadı." });
    }

    const result = data.results[0];
    res.json({
      name: result.name,
      country: result.country,
      lat: result.latitude,
      lon: result.longitude,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Geocoding error" });
  }
});

// 2. Weather Fetch API
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon query parameters are required" });
    }

    const latNum = parseFloat(lat as string);
    const lonNum = parseFloat(lon as string);

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lonNum}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    if (!response.ok) {
      throw new Error("Weather request failed");
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const weatherData = {
      city: (city as string) || "Bilinmeyen Bölge",
      temp: current.temperature_2m,
      condition: getWeatherCondition(current.weather_code),
      conditionCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 5,
      tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 5,
    };

    res.json(weatherData);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Weather fetch failed" });
  }
});

// 3. AI Briefing Generator Endpoint
app.post("/api/generate-briefing", async (req, res) => {
  const { city, temp, condition, humidity, windSpeed, tempMin, tempMax, personality } = req.body;

  if (!city) {
    return res.status(400).json({ error: "Missing required weather fields" });
  }

  const personaLabel = personality || "standard";

  try {
    const ai = getGeminiClient();

    if (!ai) {
      // API Key missing or not configured -> Fallback gracefully
      const script = generateProceduralBriefing(
        city,
        temp,
        condition,
        humidity,
        windSpeed,
        tempMin,
        tempMax,
        personaLabel
      );
      return res.json({
        script,
        isDemoFallback: true,
        message: "Demo modu aktif (Gemini anahtarı sağlanmamış, yerel motor kullanıldı)",
      });
    }

    const prompt = `
Aşağıdaki hava durumu verilerini kullanarak, bir sabah çalar saati uyandırma ve bilgilendirme anons metni yaz. 
Bu metin ses sentezleyici (Text to Speech - TTS) tarafından sesli okunacaktır. Bu yüzden ritmik, dinlemesi keyifli, anlaşılır ve tamamen Türkçe olmalıdır.

HAVA DURUMU VERİLERİ:
- Bölge/Şehir: ${city}
- Şasi/Şu anki Sıcaklık: ${temp}°C
- Durum: ${condition}

KİŞİLİK/TON:
Seçilen Tarz: ${personaLabel}
İstenen kişilik tarzına uygun özel bir üslup kullan:
- standard: Samimi, tatlı, net ve kibar bir sabah spikeri gibi.
- poetic: Romantik, doğa betimlemelerine önem veren, edebi bir dil uykudan uyanışa şarkı tadında eşlik etsin.
- humorous: Komik, eğlenceli, insanı gülümseten, hafif şaka içeren dost canlısı espriler ekle.
- energetic: Şampiyon enerjisi, motive eden, "hadi yataktan kalkıp dünyayı kurtaralım" tadında canlandırıcı.
- futuristic: Bir bilim kurgu uzay gemisi yapay zekası (Cyberpunk/Navigasyon bilgisayarı) tonunda rasyonalize edilmiş anons.

ÇOK ÖNEMLİ KRİTİK KURAL:
Yazacağın metin KESİNLİKLE çok kısa olmalı ve SADECE havanın durumunu (gökyüzü durumu: ${condition}) ve hava sıcaklığını (${temp}°C) içermelidir. 
Nem oranı, rüzgar hızı, günün en düşük/en yüksek sıcaklığı, tavsiyeler, kıyafet önerileri gibi hiçbir ek detaydan veya yan bilgiden bahsetme. 
Yalnızca hava durumunu ve sıcaklığı belirten tek bir kısa cümle (en fazla iki kısa cümle) üret.

METİN KURALLARI:
1. Sadece okunacak metni geri döndür. Ekstra açıklama, başlık, "işte metniniz:" gibi ifadeler KESİNLİKLE yazma.
2. Yazı dili değil, konuşma dili akıcılığında olsun. Sayıların ya da derecelerin telaffuzunun tınısını düşün.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 500,
      },
    });

    const script = response.text?.trim() || generateProceduralBriefing(
      city,
      temp,
      condition,
      humidity,
      windSpeed,
      tempMin,
      tempMax,
      personaLabel
    );

    res.json({
      script,
      isDemoFallback: false,
    });
  } catch (e: any) {
    console.error("Gemini API Error, falling back...", e);
    const script = generateProceduralBriefing(
      city,
      temp,
      condition,
      humidity,
      windSpeed,
      tempMin,
      tempMax,
      personaLabel
    );
    res.json({
      script,
      isDemoFallback: true,
      errorLog: e.message,
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
