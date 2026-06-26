import React, { useState, useEffect, useRef } from "react";
import { AlarmSetting, WeatherData, AlarmLog } from "./types";
import AndroidFrame from "./components/AndroidFrame";
import AlarmCard from "./components/AlarmCard";
import HelpModal from "./components/HelpModal";
import RingingOverlay from "./components/RingingOverlay";
import { 
  Plus, 
  Clock, 
  MapPin, 
  ChevronRight, 
  Volume2, 
  ListRestart, 
  HelpCircle, 
  Check, 
  AlertTriangle, 
  Languages, 
  CalendarDays,
  Activity,
  ChevronDown
} from "lucide-react";

const DEFAULT_ALARMS: AlarmSetting[] = [
  {
    id: "default-1",
    time: "08:30",
    days: [1, 2, 3, 4, 5], // Hafta içi
    enabled: true,
    label: "Hafta İçi Sabah Raporu",
    locationMode: "current",
    personality: "standard",
    voiceRate: 1.0,
    voicePitch: 1.0
  },
  {
    id: "default-2",
    time: "10:00",
    days: [0, 6], // Hafta sonu
    enabled: false,
    label: "Hafta Sonu Şiirsel Uyanış",
    locationMode: "custom",
    customCity: "Ankara",
    lat: 39.9334,
    lon: 32.8597,
    personality: "poetic",
    voiceRate: 0.9,
    voicePitch: 1.1
  }
];

const getServerUrl = () => {
  const origin = window.location.origin;
  if (origin.includes("localhost:3000") || origin.includes("127.0.0.1:3000")) {
    return "";
  }
  if (
    origin.startsWith("capacitor:") || 
    origin.startsWith("file:") || 
    origin.startsWith("http://localhost") || 
    origin.startsWith("https://localhost")
  ) {
    return "https://ais-dev-5knb3upqyym366uefyuapq-948395534891.europe-west2.run.app";
  }
  return "";
};

export default function App() {
  // State
  const [alarms, setAlarms] = useState<AlarmSetting[]>(() => {
    const saved = localStorage.getItem("weather_alarms");
    return saved ? JSON.parse(saved) : DEFAULT_ALARMS;
  });
  const [logs, setLogs] = useState<AlarmLog[]>(() => {
    const saved = localStorage.getItem("weather_alarm_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Create / Edit Alarm Form panel state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  const [formTime, setFormTime] = useState("08:00");
  const [formLabel, setFormLabel] = useState("");
  const [formDays, setFormDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default weekdays
  const [formLocationMode, setFormLocationMode] = useState<'current' | 'custom'>('current');
  const [formCustomCity, setFormCustomCity] = useState("İstanbul");
  const [formPersonality, setFormPersonality] = useState<AlarmSetting['personality']>("standard");
  const [formVoiceRate, setFormVoiceRate] = useState(1.0);
  const [formVoicePitch, setFormVoicePitch] = useState(1.0);
  
  // Status message state
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sound Engine Speech Testing State
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewText, setPreviewText] = useState("");

  // Ringing alarm orchestrator state
  const [ringingAlarm, setRingingAlarm] = useState<AlarmSetting | null>(null);
  const [ringingWeather, setRingingWeather] = useState<WeatherData | null>(null);
  const [ringingSpokenText, setRingingSpokenText] = useState("");
  const [isRingingActionLoading, setIsRingingActionLoading] = useState(false);

  // Keep track of which alarm triggered during this minute to avoid multiple triggers
  const triggeredAlarmsRef = useRef<Record<string, string>>({}); // { alarmId: "YYYY-MM-DD HH:MM" }

  // Save changes helper
  useEffect(() => {
    localStorage.setItem("weather_alarms", JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem("weather_alarm_logs", JSON.stringify(logs));
  }, [logs]);

  // Status message auto-clear
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // 1. Digital Clock & Alarm Ringing Monitor Loops
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Check alarms every minute
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const currentHHMM = `${hh}:${mm}`;
      const weekday = now.getDay(); // 0 = Sunday, 1 = Monday ...
      const todayDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const triggerKey = `${todayDateStr} ${currentHHMM}`;

      alarms.forEach(async (alarm) => {
        if (!alarm.enabled) return;

        // Verify if correct hour and minute
        if (alarm.time === currentHHMM) {
          // Verify if matches weekday (length 0 means trigger once)
          if (alarm.days.length === 0 || alarm.days.includes(weekday)) {
            // Check if alarm already triggered during this minute to prevent infinite firing recursion
            if (triggeredAlarmsRef.current[alarm.id] !== triggerKey) {
              triggeredAlarmsRef.current[alarm.id] = triggerKey;
              triggerAlarm(alarm);
            }
          }
        }
      });
    }, 5000); // Check every 5 seconds for pinpoint accuracy

    return () => clearInterval(clockTimer);
  }, [alarms]);

  // Helper: Format Turkish Date string
  const getFormatTurkishDate = () => {
    const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    const months = [
      "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
      "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];
    return `${currentTime.getDate()} ${months[currentTime.getMonth()]} ${days[currentTime.getDay()]}`;
  };

  // 2. Fetch Coordinates utilizing Geolocation
  const fetchCoordinates = (): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showStatus("Tarayıcınız GPS desteklemiyor. Varsayılan konum seçildi.", "info");
        resolve({ lat: 41.0082, lon: 28.9784 }); // Fallback Istanbul
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation permission denied, falling back to Istanbul:", err);
          showStatus("Bölge taraması için GPS erişimi engellendi, İstanbul varsayılıyor.", "info");
          resolve({ lat: 41.0082, lon: 28.9784 }); // Fallback Istanbul
        },
        { timeout: 8000 }
      );
    });
  };

  // Show visual toast statuses
  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
  };

  // 3. Main Alarm Trigger Handler (ALARM RINGING EVENT!)
  const triggerAlarm = async (alarm: AlarmSetting) => {
    setRingingAlarm(alarm);
    setRingingSpokenText("");
    setRingingWeather(null);
    setIsRingingActionLoading(true);

    try {
      let lat = alarm.lat;
      let lon = alarm.lon;
      let city = alarm.customCity || "Bilinmeyen Konum";

      // If set to current location mode, grab active GPS coordinates
      if (alarm.locationMode === "current") {
        const coords = await fetchCoordinates();
        lat = coords.lat;
        lon = coords.lon;
        city = "Mevcut Konumunuz";
      }

      // 1. Fetch live open-meteo weather of coordinates via server
      const weatherRes = await fetch(`${getServerUrl()}/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
      if (!weatherRes.ok) throw new Error("Weather request failed");
      const weatherData: WeatherData = await weatherRes.json();
      setRingingWeather(weatherData);

      // 2. Request Gemini AI beautifully crafted spoken morning report script
      const briefingRes = await fetch(`${getServerUrl()}/api/generate-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: weatherData.city,
          temp: weatherData.temp,
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          tempMin: weatherData.tempMin,
          tempMax: weatherData.tempMax,
          personality: alarm.personality,
        }),
      });

      if (!briefingRes.ok) throw new Error("Gemini generation failed");
      const briefingData = await briefingRes.json();
      const speechScript = briefingData.script;
      setRingingSpokenText(speechScript);
      setIsRingingActionLoading(false);

      // 3. Fire speech synthesizer to voice out Turkish transcript!
      speakText(speechScript, alarm.voiceRate, alarm.voicePitch);

      // 4. Record successful alarm log
      const newLog: AlarmLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) + " - " + getFormatTurkishDate(),
        alarmLabel: alarm.label || "Hava Durumu Alarmı",
        weatherSummary: `${Math.round(weatherData.temp)}°C, ${weatherData.condition}`,
        spokenText: speechScript
      };
      setLogs(prev => [newLog, ...prev].slice(0, 15)); // Keep last 15 reports
    } catch (e: any) {
      console.error("Alarm workflow failure:", e);
      setIsRingingActionLoading(false);
      const fallbackScript = `Günaydın! Saat şu an ${alarm.time}. Maalesef hava durumu sunucusuna bağlanılamadı ama harika bir gün dileriz!`;
      setRingingSpokenText(fallbackScript);
      speakText(fallbackScript, alarm.voiceRate, alarm.voicePitch);
    }
  };

  // Helper to vocalize using HTML5 TTS Synthesis
  const speakText = (text: string, rate: number, pitch: number) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech Synthesis is unavailable in this environment browser.");
      return;
    }

    // Cancel ongoing vocalizations
    window.speechSynthesis.cancel();

    // Create Utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "tr-TR";
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Search and set high precision Turkish Voice from system
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(v => v.lang.startsWith("tr") || v.lang.includes("TR"));
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // 4. Immediate Live Forecaster / Sound Checker Button Clicked
  const runLiveTestPreview = async (alarm: AlarmSetting) => {
    setIsPreviewing(true);
    setPreviewText("Hava raporu analizöründen veriler toplanıyor...");
    showStatus("Metreolojik veriler toplanıyor...", "info");

    try {
      let lat = alarm.lat;
      let lon = alarm.lon;
      let city = alarm.customCity || "Bölge";

      if (alarm.locationMode === "current") {
        const coords = await fetchCoordinates();
        lat = coords.lat;
        lon = coords.lon;
        city = "Mevcut Bölgeniz";
      }

      // Fetch live open-meteo weather of coordinates via server
      const weatherRes = await fetch(`${getServerUrl()}/api/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`);
      if (!weatherRes.ok) throw new Error("Live meteorological fetch failed");
      const weatherData: WeatherData = await weatherRes.json();

      // Trigger briefing generator
      const briefingRes = await fetch(`${getServerUrl()}/api/generate-briefing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: weatherData.city,
          temp: weatherData.temp,
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          tempMin: weatherData.tempMin,
          tempMax: weatherData.tempMax,
          personality: alarm.personality,
        }),
      });

      if (!briefingRes.ok) throw new Error("AI forecast generation failed");
      const briefingData = await briefingRes.json();
      const generatedScript = briefingData.script;
      
      setPreviewText(generatedScript);
      speakText(generatedScript, alarm.voiceRate, alarm.voicePitch);
      showStatus("Sesli rapor başarıyla başlatıldı!", "success");
    } catch (e: any) {
      console.error(e);
      const errScript = "Ses testi başarısız oldu. İnternet bağlantınızı kontrol edin.";
      setPreviewText(errScript);
      speakText(errScript, 1.0, 1.0);
      showStatus("Bağlantı Hatası: Rapor alınamadı.", "error");
    }
  };

  // 5. Save Newly Created or Edited Alarm configuration
  const handleSaveAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeocoding(true);
    showStatus("Konum doğrulanıyor...", "info");

    try {
      let lat = 41.0082;
      let lon = 28.9784;
      let validatedCity = formCustomCity;

      // Geocode customized city coordinates
      if (formLocationMode === "custom") {
        const geocodeRes = await fetch(`${getServerUrl()}/api/geocode?city=${encodeURIComponent(formCustomCity)}`);
        if (!geocodeRes.ok) {
          throw new Error("Girdiğiniz şehir ülkeler coğrafyasında doğrulanamadı.");
        }
        const geoInfo = await geocodeRes.json();
        lat = geoInfo.lat;
        lon = geoInfo.lon;
        validatedCity = geoInfo.name;
      }

      if (editingAlarmId) {
        setAlarms(prev => 
          prev.map(al => al.id === editingAlarmId ? {
            ...al,
            time: formTime,
            days: formDays,
            label: formLabel.trim() || "Sabah Raporu",
            locationMode: formLocationMode,
            customCity: validatedCity,
            lat,
            lon,
            personality: formPersonality,
            voiceRate: formVoiceRate,
            voicePitch: formVoicePitch
          } : al)
        );
        showStatus("Sesli alarm başarıyla güncellendi!", "success");
      } else {
        const newAlarm: AlarmSetting = {
          id: "alarm-" + Date.now(),
          time: formTime,
          days: formDays,
          enabled: true,
          label: formLabel.trim() || "Sabah Raporu",
          locationMode: formLocationMode,
          customCity: validatedCity,
          lat,
          lon,
          personality: formPersonality,
          voiceRate: formVoiceRate,
          voicePitch: formVoicePitch
        };

        setAlarms(prev => [newAlarm, ...prev]);
        showStatus("Yeni sesli uyandırıcı başarıyla kuruldu!", "success");
      }

      setIsFormOpen(false);
      resetForm();
    } catch (err: any) {
      showStatus(err.message || "Şehir sorgularken bir hata oluştu.", "error");
    } finally {
      setIsGeocoding(false);
    }
  };

  const resetForm = () => {
    setFormTime("08:00");
    setFormLabel("");
    setFormDays([1, 2, 3, 4, 5]);
    setFormLocationMode("current");
    setFormCustomCity("İstanbul");
    setFormPersonality("standard");
    setFormVoiceRate(1.0);
    setFormVoicePitch(1.0);
    setEditingAlarmId(null);
  };

  const handleEditAlarm = (alarm: AlarmSetting) => {
    setEditingAlarmId(alarm.id);
    setFormTime(alarm.time);
    setFormLabel(alarm.label || "");
    setFormDays(alarm.days);
    setFormLocationMode(alarm.locationMode);
    setFormCustomCity(alarm.customCity || "İstanbul");
    setFormPersonality(alarm.personality);
    setFormVoiceRate(alarm.voiceRate || 1.0);
    setFormVoicePitch(alarm.voicePitch || 1.0);
    setIsFormOpen(true);
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms(prev => 
      prev.map(al => al.id === id ? { ...al, enabled: !al.enabled } : al)
    );
    showStatus("Alarm durumu güncellendi.");
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(al => al.id !== id));
    showStatus("Sesli uyandırıcı silindi.", "info");
  };

  // Turn Alarm Off
  const handleDismissRinging = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setRingingAlarm(null);
    setRingingSpokenText("");
    setRingingWeather(null);
    showStatus("Susturuldu: Alarm kapatıldı ve gün optimize edildi.", "success");
  };

  // Snooze Alarm for next 5 minutes
  const handleSnoozeRinging = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    // Add snooze alarm inside active alarms
    if (ringingAlarm) {
      const snoozeMinutes = 5;
      const now = new Date();
      now.setMinutes(now.getMinutes() + snoozeMinutes);
      const mmString = String(now.getMinutes()).padStart(2, "0");
      const hhString = String(now.getHours()).padStart(2, "0");
      
      const snoozeAlarm: AlarmSetting = {
        ...ringingAlarm,
        id: "snooze-" + Date.now(),
        time: `${hhString}:${mmString}`,
        days: [], // Trigger once, then discard
        label: `Erteleme: ${ringingAlarm.label || "Hava Alarmı"}`,
        enabled: true,
      };

      setAlarms(prev => [...prev, snoozeAlarm]);
      showStatus(`${snoozeMinutes} Dakikalık Gece Ertelemesi Oluşturuldu (${hhString}:${mmString})!`, "success");
    }

    setRingingAlarm(null);
    setRingingSpokenText("");
    setRingingWeather(null);
  };

  // Form day checkbox click handler
  const handleDaySelect = (dayIndex: number) => {
    setFormDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort()
    );
  };

  return (
    <AndroidFrame>
      <div className="flex-1 flex flex-col p-4 relative bg-[#050505] font-sans text-white select-none h-full max-h-full overflow-hidden">
        
        {/* Dynamic Warning Notification Card with bold theme styling */}
        {statusMessage && (
          <div className={`p-2.5 rounded-xl border mb-3 flex items-center gap-2 text-xs animate-fade-in z-20 shrink-0 ${
            statusMessage.type === "success" 
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
              : statusMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-white/5 border-white/10 text-white/90"
          }`}>
            {statusMessage.type === "error" ? (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            ) : statusMessage.type === "success" ? (
              <Check className="w-3.5 h-3.5 shrink-0 text-blue-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 shrink-0 text-blue-400" />
            )}
            <p className="font-bold uppercase tracking-tight text-[10px] leading-tight">{statusMessage.text}</p>
          </div>
        )}

        {/* Unified High-Density Dashboard Card (Title, Clock, Installation button) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-inner mb-3 relative overflow-hidden shrink-0">
          <div className="absolute -left-4 -top-6 text-[4.5rem] font-black opacity-[0.02] text-white leading-none tracking-tighter select-none pointer-events-none">
            AURA
          </div>
          <div className="flex flex-col text-left relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                AURA VOICE
              </span>
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black text-[8px] font-black uppercase tracking-widest cursor-pointer transition-colors duration-150 border border-white/5"
              >
                Kurulum
              </button>
            </div>
            <h1 className="text-lg font-black text-white tracking-tighter mt-1 leading-none uppercase">
              SAYISAL ALARM
            </h1>
            <p className="text-[9px] font-mono uppercase opacity-40 mt-1.5 tracking-wider">
              {getFormatTurkishDate()}
            </p>
          </div>
          <div className="flex flex-col items-end text-right relative z-10">
            <span className="text-3xl font-black text-white font-sans tracking-tighter leading-none">
              {currentTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-[8px] text-blue-400 font-mono tracking-[0.15em] mt-1.5 uppercase font-black">
              SİSTEM • {currentTime.getSeconds()}S
            </span>
          </div>
        </div>

        {/* Form Panel or Alarms List */}
        {isFormOpen ? (
          <form 
            onSubmit={handleSaveAlarm}
            className="p-3.5 rounded-2xl bg-[#090909] border border-white/15 flex flex-col gap-3 animate-slide-up shadow-2xl relative z-20 flex-1 min-h-0 overflow-y-auto custom-scroll"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
              <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em]">
                {editingAlarmId ? "ALARM DÜZENLEME TERMİNALİ" : "YENİ ALARM TERMİNALİ"}
              </h2>
              <button 
                type="button"
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-tighter cursor-pointer underline"
              >
                Vazgeç
              </button>
            </div>

            {/* Time & Label side-by-side */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
              <div className="col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-1">
                  Saat:
                </label>
                <input 
                  type="time" 
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full bg-[#050505] text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-1">
                  Alarm Etiketi:
                </label>
                <input 
                  type="text" 
                  placeholder="Sabah Raporu..."
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full bg-[#050505] text-xs text-slate-100 placeholder:text-white/20 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Repetitive Mode */}
            <div className="shrink-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-1">
                Tekrar Eden Günler:
              </label>
              <div className="flex items-center gap-1 justify-between">
                {["PZ", "PT", "SA", "ÇA", "PE", "CU", "CT"].map((day, idx) => {
                  const isSel = formDays.includes(idx);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => handleDaySelect(idx)}
                      className={`w-7.5 h-7.5 rounded-full border text-[9px] font-black flex items-center justify-center transition-all cursor-pointer ${
                        isSel 
                          ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/10" 
                          : "bg-[#050505] text-white/40 border-white/10 hover:border-white/30"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location Selector */}
            <div className="shrink-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-1">
                Konum Algılama:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-[#050505] rounded-xl p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setFormLocationMode("current")}
                  className={`py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                    formLocationMode === "current"
                      ? "bg-white text-black border border-transparent"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  📍 GPS KONUM
                </button>
                <button
                  type="button"
                  onClick={() => setFormLocationMode("custom")}
                  className={`py-1 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all cursor-pointer ${
                    formLocationMode === "custom"
                      ? "bg-white text-black border border-transparent"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  ŞEHİR SORGULA
                </button>
              </div>

              {formLocationMode === "custom" && (
                <input 
                  type="text" 
                  value={formCustomCity}
                  onChange={(e) => setFormCustomCity(e.target.value)}
                  placeholder="Şehir örn: İstanbul, Ankara..."
                  className="w-full mt-1.5 bg-[#050505] text-white border border-white/10 rounded-xl px-3 py-1 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              )}
            </div>

            {/* Personality Theme Selector */}
            <div className="shrink-0">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 block mb-1">
                Yapay Zeka Anons Üslubu:
              </label>
              <select
                value={formPersonality}
                onChange={(e: any) => setFormPersonality(e.target.value)}
                className="w-full bg-[#050505] text-white border border-white/10 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-bold uppercase tracking-tight"
              >
                <option value="standard">Samimi Klasik Akıllı Spiker</option>
                <option value="poetic">Şiirsel & Romantik Uyanış</option>
                <option value="humorous">Mizahi Eğlenceli Dost Dostu</option>
                <option value="energetic">Müteşebbis Enerjik Şampiyon</option>
                <option value="futuristic">Uzay Savaşçısı Siber Yapay Zeka</option>
              </select>
            </div>

            {/* Vocal Adjustments sliders */}
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-xl border border-white/10 shrink-0">
              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">
                  OKUMA HIZI ({formVoiceRate}x)
                </span>
                <input 
                  type="range" 
                  min="0.8" 
                  max="1.4" 
                  step="0.1"
                  value={formVoiceRate}
                  onChange={(e) => setFormVoiceRate(parseFloat(e.target.value))}
                  className="w-full mt-1 accent-blue-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
              </div>

              <div>
                <span className="text-[8px] font-black uppercase tracking-wider text-white/40 block">
                  SES TONU ({formVoicePitch})
                </span>
                <input 
                  type="range" 
                  min="0.7" 
                  max="1.3" 
                  step="0.1"
                  value={formVoicePitch}
                  onChange={(e) => setFormVoicePitch(parseFloat(e.target.value))}
                  className="w-full mt-1 accent-blue-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeocoding}
              className="w-full py-2.5 bg-white hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 text-black font-black text-xs rounded-xl cursor-pointer tracking-wider uppercase flex items-center justify-center gap-1.5 shrink-0 mt-auto"
            >
              {isGeocoding ? "KONUM DOĞRULANIYOR..." : (editingAlarmId ? "DEĞİŞİKLİKLERİ KAYDET" : "ALARM KUR VE KAYDET")}
            </button>
          </form>
        ) : (
          <>
            {/* Add Alarm master trigger button in white bold aesthetics */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="w-full py-3 mb-3.5 rounded-xl bg-white text-black hover:bg-blue-500 hover:text-white font-black text-xs uppercase tracking-tighter border border-transparent transition-colors flex items-center justify-center gap-1.5 cursor-pointer leading-none shadow-md shrink-0"
            >
              <Plus className="w-4 h-4 text-current stroke-[3px]" />
              <span>YENİ SESLİ ALARM EKLE</span>
            </button>

            {/* Live Audio / TTS Text Preview Window */}
            {isPreviewing && (
              <div className="bg-[#090909] p-3 rounded-2xl border border-blue-500/25 mb-3.5 animate-fade-in relative shadow-md shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5 font-bold tracking-widest uppercase flex items-center gap-1">
                    <Volume2 className="w-3 h-3 text-blue-500 animate-pulse" />
                    DİNLETİ PARK ALANI
                  </span>
                  <button 
                    onClick={() => {
                      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                      setIsPreviewing(false);
                      setPreviewText("");
                    }}
                    className="text-[9px] text-white/50 hover:text-white uppercase tracking-tighter font-black underline cursor-pointer"
                  >
                    GİZLE
                  </button>
                </div>
                
                <p className="text-[11px] text-white/90 leading-relaxed max-h-20 overflow-y-auto bg-black p-2 rounded-xl text-left border border-white/5 custom-scroll">
                  {previewText}
                </p>
              </div>
            )}

            {/* Main List of configured alarms */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-black tracking-[0.2em] uppercase mb-2 shrink-0">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>YAPILANDIRILMIŞ ALARMLAR ({alarms.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scroll">
                {alarms.length === 0 ? (
                  <div className="py-8 px-4 rounded-2xl border border-white/5 bg-[#090909] text-center flex flex-col items-center justify-center">
                    <Clock className="w-7 h-7 text-white/20 mb-2" />
                    <p className="text-xs text-white font-bold uppercase tracking-tight">Kayıtlı Alarm Yok</p>
                    <p className="text-[9px] text-white/40 leading-normal mt-1 max-w-[180px] mx-auto">
                      Üstteki ekleme butonu üzerinden ilk akıllı sesli alarm konfigürasyonunuzu saniyeler içinde kurun.
                    </p>
                  </div>
                ) : (
                  alarms.map(alarm => (
                    <AlarmCard
                      key={alarm.id}
                      alarm={alarm}
                      onToggle={handleToggleAlarm}
                      onDelete={handleDeleteAlarm}
                      onPreview={runLiveTestPreview}
                      onEdit={handleEditAlarm}
                    />
                  ))
                )}

                {/* Historical Telemetry Logs Section */}
                {logs.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-[9px] text-white/45 font-black tracking-[0.2em] uppercase mb-2">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        BÜLTEN TETİKLEME GÜNLÜKLERİ
                      </span>
                      <button 
                        onClick={() => setLogs([])}
                        className="text-[8px] text-white/40 hover:text-rose-400 uppercase font-black cursor-pointer"
                      >
                        TEMİZLE
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scroll">
                      {logs.map((log) => (
                        <div key={log.id} className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-1 text-[9px] text-white/80">
                          <div className="flex justify-between font-bold text-white uppercase tracking-tight">
                            <span>{log.alarmLabel}</span>
                            <span className="font-mono text-[8px] text-blue-400">{log.timestamp}</span>
                          </div>
                          <div className="text-[8px] text-blue-500 uppercase font-black">
                            HAVA MODELİ: {log.weatherSummary}
                          </div>
                          <p className="bg-[#050505] p-2 rounded-lg text-[9px] text-white/60 font-sans line-clamp-2 leading-relaxed">
                            {log.spokenText}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Overlay panels */}
        <HelpModal 
          isOpen={isHelpOpen} 
          onClose={() => setIsHelpOpen(false)} 
        />

        {ringingAlarm && (
          <RingingOverlay
            alarm={ringingAlarm}
            weather={ringingWeather}
            spokenText={ringingSpokenText}
            isGeneratingSpeech={isRingingActionLoading}
            onDismiss={handleDismissRinging}
            onSnooze={handleSnoozeRinging}
            onSpeakAgain={() => speakText(ringingSpokenText, ringingAlarm.voiceRate, ringingAlarm.voicePitch)}
          />
        )}
      </div>
    </AndroidFrame>
  );
}
