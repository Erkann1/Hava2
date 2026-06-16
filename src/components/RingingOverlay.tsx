import React, { useEffect, useRef, useState } from "react";
import { AlarmSetting, WeatherData } from "../types";
import { Volume2, VolumeX, Bell, Moon, XCircle, CloudRain, Sun, Cloud, Snowflake, CloudLightning } from "lucide-react";

interface RingingOverlayProps {
  alarm: AlarmSetting;
  weather: WeatherData | null;
  spokenText: string;
  isGeneratingSpeech: boolean;
  onDismiss: () => void;
  onSnooze: () => void;
  onSpeakAgain: () => void;
}

export default function RingingOverlay({
  alarm,
  weather,
  spokenText,
  isGeneratingSpeech,
  onDismiss,
  onSnooze,
  onSpeakAgain,
}: RingingOverlayProps) {
  const [ticker, setTicker] = useState("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chimeIntervalRef = useRef<any>(null);

  // 1. Digital Clock for the Ringing screen
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTicker(
        now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Play soothing synthetic chime in background using Web Audio API
  useEffect(() => {
    try {
      // Create audio context
      const AudioCtxConstructor = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxConstructor();
      audioCtxRef.current = ctx;

      const playPulsingChime = () => {
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // High premium warm chime melody notes alternatively
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const randomNote = notes[Math.floor(Math.random() * notes.length)];

        osc.type = "sine";
        osc.frequency.setValueAtTime(randomNote, ctx.currentTime);

        // Soft volume to not pierce user ears
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      };

      // Trigger immediately and then periodic
      playPulsingChime();
      chimeIntervalRef.current = setInterval(playPulsingChime, 1800);
    } catch (e) {
      console.warn("Web Audio API not supported or allowed by sandbox context:", e);
    }

    return () => {
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const getWeatherIcon = (code?: number) => {
    if (code === undefined) return <Sun className="w-16 h-16 text-yellow-400" />;
    if (code === 0 || code === 1) return <Sun className="w-16 h-16 text-yellow-400 animate-pulse" />;
    if (code === 2 || code === 3) return <Cloud className="w-16 h-16 text-slate-300" />;
    if (code >= 51 && code <= 65) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (code >= 71 && code <= 77) return <Snowflake className="w-16 h-16 text-sky-200" />;
    if (code >= 95) return <CloudLightning className="w-16 h-16 text-amber-500" />;
    return <Cloud className="w-16 h-16 text-slate-300" />;
  };

  return (
    <div className="absolute inset-0 bg-[#050505] z-50 flex flex-col justify-between p-6 select-none overflow-hidden font-sans border border-white/20">
      
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 bg-transparent opacity-60 pointer-events-none"></div>

      {/* Header Stat & Title */}
      <div className="text-center mt-6 z-10">
        <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-[10px] text-blue-400 tracking-[0.15em] uppercase font-black animate-pulse">
          <Bell className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>ALARM TETİKLENDİ • AKTİF</span>
        </div>
        
        <h1 className="text-2xl font-black text-white tracking-tighter mt-4 uppercase leading-none">
          {alarm.label?.toUpperCase() || "SAYISAL ANONS"}
        </h1>
        <p className="text-[10px] uppercase font-black text-white/40 tracking-wider mt-1.5">
          {alarm.locationMode === "current" ? "GPS KONUMLANDIRMA AKTİF" : `KONUM: ${alarm.customCity?.toUpperCase()}`}
        </p>
      </div>

      {/* Massive Clock Monitor */}
      <div className="text-center z-10 my-4">
        <span className="text-7xl font-black text-white font-sans tracking-tighter block leading-none">
          {ticker.substring(0, 5)}
        </span>
        <span className="text-[10px] uppercase font-black text-blue-400 block mt-2.5 tracking-[0.2em]">
          SANİYE DELTASI • {ticker.substring(6, 8)}S
        </span>
      </div>

      {/* Center Weather Visualizer Screen */}
      <div className="bg-[#090909] border border-white/10 rounded-3xl p-5 mx-1 flex flex-col items-center justify-center text-center shadow-2xl relative z-10">
        
        {/* Simple geometric outline container for the weather icon */}
        <div className="relative mb-3.5 flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border border-blue-500/10 animate-ping duration-1000"></div>
          <div className="relative z-10 bg-white/5 p-4 rounded-full border border-white/10">
            {getWeatherIcon(weather?.conditionCode)}
          </div>
        </div>

        {weather ? (
          <div className="animate-fade-in">
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {Math.round(weather.temp)}°C
            </h2>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">
              {weather.condition?.toUpperCase()}
            </p>
            <div className="flex justify-center gap-4 text-[9px] text-white/40 mt-3 font-mono uppercase font-semibold">
              <span>NEM: %{weather.humidity}</span>
              <span>RÜZGAR: {Math.round(weather.windSpeed)} KM/S</span>
            </div>
          </div>
        ) : (
          <div className="py-2 text-white/40 text-[10px] uppercase font-black tracking-widest">
            METEOROLOJİK VERİLER DERLENİYOR...
          </div>
        )}

        {/* Text of Speech Being Voiced Screen */}
        <div className="border-t border-white/10 w-full mt-4 pt-4">
          <div className="flex items-center justify-between text-[9px] text-white/40 mb-2 font-mono uppercase font-black">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              RAPOR OKUNUYOR
            </span>
            <button 
              onClick={onSpeakAgain}
              className="px-2.5 py-1 rounded bg-white text-black font-black hover:bg-blue-500 hover:text-white transition-colors text-[9px] uppercase tracking-tighter"
              title="Yeniden Oynat"
            >
              YENİDEN DİNLE
            </button>
          </div>
          <div className="h-24 overflow-y-auto bg-black p-3 rounded-xl border border-white/5 text-left custom-scroll">
            {isGeneratingSpeech ? (
              <p className="text-[10px] text-white/40 uppercase font-black text-center animate-pulse pt-5 tracking-wider">
                YAPAY ZEKA SABAH ANONSUNUZU YAZIYOR...
              </p>
            ) : spokenText ? (
              <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">
                {spokenText}
              </p>
            ) : (
              <p className="text-[10px] text-white/30 uppercase font-black text-center pt-5 tracking-wider animate-pulse">
                SES SENTEZLEYİCİSİ HAZIRLANIYOR...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons block styled using heavy stark contrasts */}
      <div className="flex flex-col gap-3 z-10 px-1 mt-4 mb-2">
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-xl bg-white hover:bg-rose-600 text-black hover:text-white font-black text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-98"
        >
          <VolumeX className="w-4 h-4 stroke-[3px]" />
          <span>ALAMI KAPAT (DURDUR)</span>
        </button>

        <button
          onClick={onSnooze}
          className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
        >
          <Moon className="w-4 h-4 text-blue-400" />
          <span>5 DAKİKA ERTELE</span>
        </button>
      </div>
    </div>
  );
}
