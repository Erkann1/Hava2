import React from "react";
import { X, Smartphone, Download, Settings, Navigation, Volume2 } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col justify-end p-4 animate-slide-up backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative max-h-[92%] overflow-y-auto w-full">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Android Telefona Nasıl Yüklenir?
          </h2>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Bu uygulama bir <strong>Gelişmiş Web Uygulaması (PWA)</strong> teknolojisi ile tasarlanmıştır. Telefona sıradan bir Google Play Store uygulaması gibi yüklenerek bağımsız ve tam ekran ve sesli olarak çalışır.
        </p>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                Ana Ekrana Ekleyip Kurun
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Android telefonunuzda <strong>Google Chrome</strong> tarayıcısı ile bu adresi açın. Ekranın sağ üstündeki <strong>üç noktaya (⋮)</strong> tıklayın ve çıkan menüden <strong>&quot;Uygulamayı Yükle&quot;</strong> veya <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğine tıklayın.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                Konum İznini Onaylayın
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Uygulama açıldığında <strong>&quot;Mevcut Konumumla Çalışsın&quot;</strong> seçeneğini kullanabilmesi için tarayıcınızdan / telefondan gelen <strong>&quot;Konum İzin İsteği&quot;</strong> pencerelerini kabul edin.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                Ses ve Konuşma Etkinliği
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Android cihazınızın kendi yüksek kaliteli Türkçe ses sentezleyicisini (Google Speech Services) otomatik kullanır. Alarmınız çaldığında telefonunuzun sesini duymak için tarayıcıda ses/otomatik oynatma iznine izin verin ve telefonunun medya düzeyinin açık olduğundan emin olun.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-pink-400" />
                Kesintisiz Gece Çalışması
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                PWA olarak ana ekranınıza eklediğiniz uygulamayı, geceleri şarja takıp başucunuza açık bir şekilde yerleştirdiğinizde, tıpkı fiziksel bir çalar saat standı gibi saati gösterir ve günü geldiğinde sesli olarak sizi hava durumuyla uyandırır!
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-500/30 transition-all cursor-pointer"
        >
          Anladım, Kuruluma Başla
        </button>
      </div>
    </div>
  );
}
