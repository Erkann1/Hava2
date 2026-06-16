import React from "react";
import { AlarmSetting } from "../types";
import { MapPin, Volume2, Trash2, Calendar, Smile, Sparkles, Zap, Brain, MessageSquare, Edit2 } from "lucide-react";

interface AlarmCardProps {
  key?: string;
  alarm: AlarmSetting;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (alarm: AlarmSetting) => void | Promise<void>;
  onEdit: (alarm: AlarmSetting) => void;
}

const DAYS_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const DAYS_FULL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export default function AlarmCard({ alarm, onToggle, onDelete, onPreview, onEdit }: AlarmCardProps) {
  // Format days representation
  const activeDaysString = alarm.days.length === 7 
    ? "Her Gün" 
    : alarm.days.length === 5 && !alarm.days.includes(0) && !alarm.days.includes(6)
    ? "Hafta İçi"
    : alarm.days.length === 2 && alarm.days.includes(0) && alarm.days.includes(6)
    ? "Hafta Sonu"
    : alarm.days.length === 0
    ? "Yalnızca Bir Kez"
    : alarm.days.map(d => DAYS_SHORT[d]).join(", ");

  const getPersonalityIcon = (p: string) => {
    switch (p) {
      case "poetic": return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
      case "humorous": return <Smile className="w-3.5 h-3.5 text-amber-400" />;
      case "energetic": return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
      case "futuristic": return <Brain className="w-3.5 h-3.5 text-cyan-400" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const getPersonalityLabel = (p: string) => {
    switch (p) {
      case "poetic": return "Şiirsel";
      case "humorous": return "Mizahi / Eğlenceli";
      case "energetic": return "Enerjik / Motivasyonel";
      case "futuristic": return "Fütüristik Bilim Kurgu";
      default: return "Standart Spiker";
    }
  };

  return (
    <div 
      className={`p-5 rounded-2xl border transition-all duration-200 ${
        alarm.enabled 
          ? "bg-[#090909] border-white/15" 
          : "bg-transparent border-white/5 opacity-50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          {/* Label & Active Days Summary with Bold typography */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] font-black text-blue-400">
              {alarm.label || "SAYISAL ALARM"}
            </span>
          </div>

          {/* Large Clock Display */}
          <div className="text-4xl font-black font-sans tracking-tighter text-white mt-1 leading-none">
            {alarm.time}
          </div>

          {/* Repetitive Days Summary */}
          <div className="flex items-center gap-1.5 text-[9px] text-white/40 mt-2 uppercase font-black tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{activeDaysString}</span>
          </div>
        </div>

        {/* Master Active Switch Toggle styled elegantly */}
        <button
          onClick={() => onToggle(alarm.id)}
          className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none cursor-pointer shrink-0 ${
            alarm.enabled ? "bg-white" : "bg-white/10"
          }`}
        >
          <div 
            className={`w-5 h-5 rounded-full shadow-md transform duration-200 ${
              alarm.enabled ? "translate-x-5 bg-black" : "translate-x-0 bg-white/60"
            }`}
          />
        </button>
      </div>

      {/* Weekday indicator dots inside high contrast borders */}
      <div className="flex gap-1 mt-3.5">
        {DAYS_SHORT.map((day, idx) => {
          const isActive = alarm.days.includes(idx);
          return (
            <span 
              key={idx} 
              className={`text-[8px] font-black px-1.5 py-0.5 uppercase tracking-tighter rounded ${
                isActive 
                  ? "bg-blue-500 text-white font-black" 
                  : "bg-white/5 text-white/30"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="border-t border-white/10 my-3.5" />

      {/* Footer Specs with bold labels */}
      <div className="flex flex-col gap-1.5 text-[10px] text-white/60">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            KONUM:{" "}
            <strong className="text-white font-black">
              {alarm.locationMode === "current" ? "📍 GPS MEVCUT KONUM" : `🌆 ${alarm.customCity?.toUpperCase()}`}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-bold uppercase tracking-tight">
          {getPersonalityIcon(alarm.personality)}
          <span className="truncate">
            ANONS TARZI:{" "}
            <strong className="text-white font-black">
              {getPersonalityLabel(alarm.personality).toUpperCase()}
            </strong>
          </span>
        </div>
      </div>

      {/* Actions with stark uppercase and heavy styling */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-2 border-t border-white/10">
        <button
          onClick={() => onPreview(alarm)}
          title="Sesli hava durumunu hemen test et"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 transition-colors cursor-pointer"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Sesi Test Et</span>
        </button>

        <button
          onClick={() => onEdit(alarm)}
          title="Alarmı Düzenle"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Düzenle</span>
        </button>

        <button
          onClick={() => onDelete(alarm.id)}
          title="Alarmı Sil"
          className="p-1.5 px-2 rounded-full text-[9px] font-black uppercase tracking-tighter text-rose-450 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
