import React from "react";
import { X, Smartphone, Download, Settings, Navigation, Volume2, ShieldCheck, Heart } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-[#050505]/95 z-50 flex flex-col justify-end p-4 animate-slide-up font-sans">
      <div className="bg-[#090909] border border-white/15 rounded-3xl p-6 shadow-2xl relative max-h-[95%] overflow-y-auto w-full custom-scroll">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white text-white hover:text-black transition-colors cursor-pointer border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-black text-white tracking-widest uppercase">
            TELEFONA YÜKLEME & APK REHBERİ
          </h2>
        </div>

        <p className="text-[11px] text-white/60 leading-relaxed mb-6">
          Bu uygulama en güncel <strong>Progresif Web Uygulaması (PWA)</strong> teknolojisini kullanır ve telefonunuza bir mağaza uygulamasına ihtiyaç duymadan, yerel APK kalitesinde kurulabilir.
        </p>

        <div className="space-y-6">
          {/* Option A: Direct Android PWA Installation */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-400" />
              YÖNTEM 1: YEREL PWA OLARAK YÜKLE (TAVSİYE EDİLEN)
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Android telefonunuzda <strong>Google Chrome</strong> tarayıcısı ile bu adresi açın. Sağ üstteki <strong>üç noktaya (⋮)</strong> tıklayıp <strong>&quot;Uygulamayı Yükle&quot;</strong> veya <strong>&quot;Ana Ekrana Ekle&quot;</strong> butonuna dokunun. Uygulama telefonunuza ana ekran simgesiyle anında kurulacaktır.
            </p>
          </div>

          {/* Option B: Direct Custom APK Generation */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              YÖNTEM 2: TEK TIKLA MAĞAZA UYUMLU .APK YAPIN
            </h3>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Bu uygulama tüm PWA manifest kriterlerini (manifest.json, Service Worker ve yüksek çözünürlüklü logolar) eksiksiz sağlamaktadır. 
              <br /><br />
              Uygulamanın tam bağımsız <code>.apk</code> çıktısını almak için <strong><a href="https://www.pwabuilder.com/" target="_blank" rel="noopener noreferrer" className="text-white font-bold underline hover:text-blue-400">PWABuilder.com</a></strong> (veya <i>Bubblewrap CLI</i>) adresine bu web sitesinin URL linkini yapıştırarak 1 saniyede Google Play Store uyumlu, imzalı resmi <strong>APK</strong> dosyanızı tamamen ücretsiz şekilde indirebilirsiniz!
            </p>
          </div>

          {/* Technical Info */}
          <div className="flex gap-3 pt-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
              💡
            </div>
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">
                AKILLI SES VE KONUM İZİNLERİ
              </h3>
              <p className="text-[10px] text-white/40 leading-relaxed mt-1">
                Kalkış anında hava durumunun otomatik Türkçe spiker ses tonuyla seslendirilebilmesi için tarayıcınızdan / uygulamanızdan gelen <strong>Konum İzni</strong> ve <strong>Mikrofon/Ses İzni</strong> istemcisini kabul edin. Kesintisiz çalması için başucu standına geceden yerleştirmeniz yeterlidir.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-3.5 bg-white text-black hover:bg-blue-500 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
        >
          ANLADIM, SİSTEMİ ÇALIŞTIR
        </button>
      </div>
    </div>
  );
}
