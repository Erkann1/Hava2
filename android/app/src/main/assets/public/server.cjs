var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}
function getWeatherCondition(code) {
  const codes = {
    0: "A\xE7\u0131k G\xF6ky\xFCz\xFC",
    1: "\xC7o\u011Funlukla A\xE7\u0131k",
    2: "Par\xE7al\u0131 Bulutlu",
    3: "Kapal\u0131 Bulutlu",
    45: "Sisli",
    48: "K\u0131ra\u011F\u0131 Sisli",
    51: "Hafif \xC7iseleme",
    53: "Orta \xC7iseleme",
    55: "Yo\u011Fun \xC7iseleme",
    61: "Hafif Ya\u011Fmurlu",
    63: "Ya\u011Fmurlu",
    65: "Sa\u011Fanak Ya\u011Fmurlu",
    71: "Hafif Karl\u0131",
    73: "Karl\u0131",
    75: "Yo\u011Fun Karl\u0131",
    77: "Kar Taneleri",
    80: "Hafif Ya\u011Fmur Sa\u011Fana\u011F\u0131",
    81: "Ya\u011Fmur Sa\u011Fana\u011F\u0131",
    82: "\u015Eiddetli Ya\u011Fmur Sa\u011Fana\u011F\u0131",
    85: "Hafif Kar Sa\u011Fana\u011F\u0131",
    86: "Yo\u011Fun Kar Sa\u011Fana\u011F\u0131",
    95: "G\xF6kg\xFCr\xFClt\xFCl\xFC F\u0131rt\u0131na",
    96: "Dolu Ya\u011F\u0131\u015Fl\u0131 Hafif F\u0131rt\u0131na",
    99: "Dolu Ya\u011F\u0131\u015Fl\u0131 \u015Eiddetli F\u0131rt\u0131na"
  };
  return codes[code] || "Belirsiz Hava Durumu";
}
function generateProceduralBriefing(city, temp, condition, humidity, windSpeed, tempMin, tempMax, personality) {
  const intro = `G\xFCnayd\u0131n! Kar\u015F\u0131n\u0131zda ak\u0131ll\u0131 sesli hava durumu asistan\u0131n\u0131z. Bug\xFCn ${city} \u015Fehrinde harika bir g\xFCne uyan\u0131yorsunuz.`;
  const dataBrief = `\u015Eu anki s\u0131cakl\u0131k ${Math.round(temp)} derece ve g\xF6ky\xFCz\xFCnde ${condition} hakim. Bug\xFCn en d\xFC\u015F\xFCk s\u0131cakl\u0131k ${Math.round(tempMin)}, en y\xFCksek ise ${Math.round(tempMax)} derece olacak. Nem oran\u0131 y\xFCzde ${humidity}, r\xFCzgar h\u0131z\u0131 ise saatte ${Math.round(windSpeed)} kilometre seviyesinde.`;
  switch (personality) {
    case "poetic":
      return `G\xFCnayd\u0131n can\u0131m kalplere! ${city} semalar\u0131nda bug\xFCn g\xF6ky\xFCz\xFC sessizce \u015Fark\u0131 s\xF6yl\xFCyor. ${condition} \xF6rt\xFCs\xFCyle kapl\u0131 g\xF6\u011F\xFCn alt\u0131nda s\u0131cakl\u0131\u011F\u0131m\u0131z ${Math.round(temp)} derece. R\xFCzgarlar saatte ${Math.round(windSpeed)} kilometre h\u0131z\u0131nda esip ruhumuzu ok\u015Fayacak. G\xFCn\xFCn\xFCz bir \u015Fiir gibi ak\u0131c\u0131 ve berrak ge\xE7sin!`;
    case "humorous":
      return `Hey, uyanma vakti! Yataktan d\xFC\u015Fmeden \xF6nce ${city} havas\u0131na bir g\xF6z atal\u0131m. D\u0131\u015Far\u0131s\u0131 \u015Fu an ${Math.round(temp)} derece. Yani ne \xE7ok s\u0131cak, ne \xE7ok so\u011Fuk, tam battaniye alt\u0131nda hayal kurmal\u0131k! Nem y\xFCzde ${humidity} civar\u0131nda, sa\xE7lar\u0131n\u0131z\u0131 kabartmaya aday. G\xF6ky\xFCz\xFC de ${condition} modunda tak\u0131l\u0131yor. \u015Eemsiyenizi yan\u0131n\u0131za al\u0131n ya da evde kal\u0131n, karar sizin!`;
    case "energetic":
      return `M\xFCkemmel bir sabah! Hadi kalk\u0131n, bug\xFCn muhte\u015Fem bir enerjiyle dolup ta\u015Fma g\xFCn\xFC! ${city} \u015Fu an tam\u0131 tam\u0131na ${Math.round(temp)} derece! ${condition} sizi durduramaz! R\xFCzgar saatte ${Math.round(windSpeed)} kilometreyle arkam\u0131zdan esiyor, hadi s\u0131n\u0131rlar\u0131 a\u015Fmaya! Harika, aktif ve ba\u015Far\u0131l\u0131 bir g\xFCn ge\xE7irin!`;
    case "futuristic":
      return `Sistem uyar\u0131s\u0131: Siber-atmosferik rapor y\xFCkleniyor. ${city} b\xF6lgesel ana merkez koordinatlar\u0131nda \u015Fu anki termal seviye ${Math.round(temp)} santigrat derece. G\xF6ky\xFCz\xFC verisi: ${condition}. Nem oran\u0131 y\xFCzde ${humidity} ve r\xFCzgar vekt\xF6r\xFC saatte ${Math.round(windSpeed)} kilometre. G\xFCnl\xFCk optimizasyonunuz i\xE7in k\u0131yafet kalkanlar\u0131n\u0131z\u0131 bu de\u011Ferlere g\xF6re kalibre etmeniz \xF6nerilir. \u0130yi d\xF6ng\xFCler dileriz.`;
    case "standard":
    default:
      return `${intro} ${dataBrief} Bu ko\u015Fullara uygun k\u0131yafetler se\xE7menizi \xF6nerir, huzurlu ve sa\u011Fl\u0131kl\u0131 bir g\xFCn dileriz.`;
  }
}
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
      return res.status(404).json({ error: "\u015Eehir bulunamad\u0131." });
    }
    const result = data.results[0];
    res.json({
      name: result.name,
      country: result.country,
      lat: result.latitude,
      lon: result.longitude
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Geocoding error" });
  }
});
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon query parameters are required" });
    }
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
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
      city: city || "Bilinmeyen B\xF6lge",
      temp: current.temperature_2m,
      condition: getWeatherCondition(current.weather_code),
      conditionCode: current.weather_code,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      tempMin: daily?.temperature_2m_min?.[0] ?? current.temperature_2m - 5,
      tempMax: daily?.temperature_2m_max?.[0] ?? current.temperature_2m + 5
    };
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message || "Weather fetch failed" });
  }
});
app.post("/api/generate-briefing", async (req, res) => {
  const { city, temp, condition, humidity, windSpeed, tempMin, tempMax, personality } = req.body;
  if (!city) {
    return res.status(400).json({ error: "Missing required weather fields" });
  }
  const personaLabel = personality || "standard";
  try {
    const ai = getGeminiClient();
    if (!ai) {
      const script2 = generateProceduralBriefing(
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
        script: script2,
        isDemoFallback: true,
        message: "Demo modu aktif (Gemini anahtar\u0131 sa\u011Flanmam\u0131\u015F, yerel motor kullan\u0131ld\u0131)"
      });
    }
    const prompt = `
A\u015Fa\u011F\u0131daki hava durumu verilerini kullanarak, bir sabah \xE7alar saati uyand\u0131rma ve bilgilendirme anons metni yaz. 
Bu metin ses sentezleyici (Text to Speech - TTS) taraf\u0131ndan sesli okunacakt\u0131r. Bu y\xFCzden ritmik, dinlemesi keyifli, anla\u015F\u0131l\u0131r ve tamamen T\xFCrk\xE7e olmal\u0131d\u0131r.

HAVA DURUMU VER\u0130LER\u0130:
- B\xF6lge/\u015Eehir: ${city}
- \u015Easi/\u015Eu anki S\u0131cakl\u0131k: ${temp}\xB0C
- Durum: ${condition}
- Nem Seviyesi: %${humidity}
- R\xFCzgar H\u0131z\u0131: ${windSpeed} km/sa
- G\xFCn\xFCn En D\xFC\u015F\xFCk S\u0131cakl\u0131\u011F\u0131: ${tempMin}\xB0C
- G\xFCn\xFCn En Y\xFCksek S\u0131cakl\u0131\u011F\u0131: ${tempMax}\xB0C

K\u0130\u015E\u0130L\u0130K/TON:
Se\xE7ilen Tarz: ${personaLabel}
\u0130stenen ki\u015Filik tarz\u0131na uygun \xF6zel bir \xFCslup kullan:
- standard: Samimi, tatl\u0131, net ve kibar bir sabah spikeri gibi.
- poetic: Romantik, do\u011Fa betimlemelerine \xF6nem veren, edebi bir dil uykudan uyan\u0131\u015Fa \u015Fark\u0131 tad\u0131nda e\u015Flik etsin.
- humorous: Komik, e\u011Flenceli, insan\u0131 g\xFCl\xFCmseten, hafif \u015Faka i\xE7eren dost canl\u0131s\u0131 espriler ekle.
- energetic: \u015Eampiyon enerjisi, motive eden, "hadi yataktan kalk\u0131p d\xFCnyay\u0131 kurtaral\u0131m" tad\u0131nda canland\u0131r\u0131c\u0131.
- futuristic: Bir bilim kurgu uzay gemisi yapay zekas\u0131 (Cyberpunk/Navigasyon bilgisayar\u0131) tonunda rasyonalize edilmi\u015F anons.

MET\u0130N KURALLARI:
1. Sadece okunacak metni geri d\xF6nd\xFCr. Ekstra a\xE7\u0131klama, ba\u015Fl\u0131k, "i\u015Fte metniniz:" gibi ifadeler KES\u0130NL\u0130KLE yazma.
2. Yaz\u0131 dili de\u011Fil, konu\u015Fma dili ak\u0131c\u0131l\u0131\u011F\u0131nda olsun. Say\u0131lar\u0131n ya da derecelerin telaffuzunun t\u0131n\u0131s\u0131n\u0131 d\xFC\u015F\xFCn.
3. Maksimum 3-4 c\xFCmle (seslendirmeyi yormayacak uzunlukta).
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 500
      }
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
      isDemoFallback: false
    });
  } catch (e) {
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
      errorLog: e.message
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
