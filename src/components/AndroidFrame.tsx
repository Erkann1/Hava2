import React, { useState, useEffect } from "react";
import { Signal, Wifi, Battery, Smartphone, Eye, EyeOff } from "lucide-react";

interface AndroidFrameProps {
  children: React.ReactNode;
}

export default function AndroidFrame({ children }: AndroidFrameProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [isSimulatorEnabled, setIsSimulatorEnabled] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-2 sm:p-6 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Simulation Toggle in Top Bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl backdrop-blur-md">
        <span className="text-xs text-slate-400 font-mono">
          Model: Android PWA Simulator
        </span>
        <button
          onClick={() => setIsSimulatorEnabled(!isSimulatorEnabled)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all cursor-pointer"
        >
          {isSimulatorEnabled ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Cihaz Çerçevesini Gizle</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cihaz Çerçevesini Göster</span>
            </>
          )}
        </button>
      </div>

      {isSimulatorEnabled ? (
        /* Realistic Android Physical Bezel */
        <div className="relative mx-auto bg-slate-950 border-[10px] border-slate-850 rounded-[48px] shadow-2xl shadow-indigo-950/40 w-full max-w-[390px] h-[780px] flex flex-col overflow-hidden ring-1 ring-slate-800/80">
          {/* Speaker ear piece & Camera Notch Hole */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end pr-5">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800 ring-1 ring-slate-700/50"></div>
          </div>

          {/* Android Status Bar */}
          <div className="h-7 pt-1 px-6 bg-slate-900/80 backdrop-blur-md flex justify-between items-center text-[11px] font-medium text-slate-300 select-none z-30">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-emerald-400" />
              <Wifi className="w-3.5 h-3.5 text-indigo-400" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-4 h-4 text-slate-300" />
                <span>%88</span>
              </div>
            </div>
          </div>

          {/* Embedded Application Frame Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex flex-col relative">
            {children}
            
            {/* Soft Android Bottom Navigation Bar Indicator */}
            <div className="h-6 bg-slate-950/70 backdrop-blur-md w-full flex items-center justify-center select-none shrink-0 border-t border-slate-900">
              <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        /* Flat Responsive Mobile-first dashboard layout (no bezel wrapper) */
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-2xl overflow-hidden shadow-xl shadow-indigo-950/10 border border-slate-900 flex flex-col h-[740px]">
          <div className="flex-1 overflow-y-auto flex flex-col relative">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
