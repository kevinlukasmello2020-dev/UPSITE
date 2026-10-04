"use client";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import * as tus from "tus-js-client";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

export default function CortarPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  
  const [range, setRange] = useState<[number, number]>([0, 10]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setProgress(0);
      setProcessing(false);
      setUploadUrl(null);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setRange([0, Math.min(videoRef.current.duration, 10)]);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    if(h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const startProcess = () => {
    if (!selectedFile) return;
    setProcessing(true);
    setProgress(0);
    
    const upload = new tus.Upload(selectedFile, {
      endpoint: "http://localhost:3001/files",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: selectedFile.name,
        filetype: selectedFile.type,
      },
      onError: function (error) {
        console.error("Failed because: " + error);
        setProcessing(false);
        alert("Erro no upload");
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 50).toFixed(2);
        setProgress(Number(percentage));
      },
      onSuccess: async function () {
        const urlObj = new URL(upload.url!);
        const id = urlObj.pathname.split("/").pop();
        
        try {
            const res = await fetch("http://localhost:3001/api/cut-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uploadId: id,
                    startTime: range[0],
                    duration: (range[1] - range[0])
                })
            });
            const data = await res.json();
            
            let current = 50;
            const interval = setInterval(() => {
                current += 10;
                if(current >= 100) {
                    clearInterval(interval);
                    setProgress(100);
                    setUploadUrl(id || null);
                } else {
                    setProgress(current);
                }
            }, 1500);
        } catch(e) {
            alert("Erro ao pedir o corte");
            setProcessing(false);
        }
      },
    });

    upload.start();
  };

  // Sincroniza o player com o slider ao mover o cursor do inicio
  const onSliderChange = (value: number | number[]) => {
    const val = value as [number, number];
    if (val[0] !== range[0] && videoRef.current) {
        videoRef.current.currentTime = val[0];
    } else if (val[1] !== range[1] && videoRef.current) {
        videoRef.current.currentTime = val[1];
    }
    setRange(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-geist-sans)] p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">
          &larr; Voltar
        </Link>
        <h1 className="text-3xl font-bold mb-4">✂️ Cortar Vídeo</h1>
        <p className="text-slate-400 mb-8">Selecione o vídeo, visualize e escolha o trecho exato para cortar.</p>
        
        <input 
          type="file" 
          accept="video/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />

        {!selectedFile ? (
          <div 
            className="border-2 border-dashed border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-900/50 hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
             <p className="text-slate-500 mb-4">Arraste seu vídeo aqui ou clique para selecionar</p>
             <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors">
               Procurar Vídeo
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center bg-slate-900 p-6 rounded-2xl border border-slate-800">
            {/* Player de Vídeo */}
            {videoUrl && (
              <video 
                ref={videoRef}
                src={videoUrl} 
                controls 
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full max-h-[500px] bg-black rounded-lg mb-8"
              />
            )}

            {/* Controles Estilo Timeline */}
            {duration > 0 && !processing && progress === 0 && (
              <div className="w-full max-w-3xl bg-slate-950 p-6 rounded-xl border border-slate-800">
                <div className="flex justify-between text-slate-400 text-sm mb-2 font-mono">
                  <span>{formatTime(range[0])}</span>
                  <span>{formatTime(range[1])}</span>
                </div>
                
                <Slider
                  range
                  min={0}
                  max={duration}
                  step={0.01}
                  value={range}
                  onChange={onSliderChange}
                  trackStyle={[{ backgroundColor: '#3b82f6', height: 8 }]}
                  handleStyle={[
                    { borderColor: '#60a5fa', height: 20, width: 20, marginTop: -6, backgroundColor: '#1e3a8a' },
                    { borderColor: '#60a5fa', height: 20, width: 20, marginTop: -6, backgroundColor: '#1e3a8a' }
                  ]}
                  railStyle={{ backgroundColor: '#334155', height: 8 }}
                />

                <div className="flex justify-between items-center mt-6">
                  <p className="text-slate-400 text-sm">Duração do corte: <span className="text-white font-bold">{formatTime(range[1] - range[0])}</span></p>
                  
                  <div className="space-x-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                    >
                      Trocar Arquivo
                    </button>
                    <button 
                      onClick={startProcess}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
                    >
                      Processar Corte Real
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tela de Processamento */}
            {processing && (
              <div className="mt-8 flex flex-col items-center w-full max-w-3xl">
                <h3 className="mb-4 text-slate-300">
                  {progress < 50 ? "Enviando arquivo para o servidor..." : progress < 100 ? "Cortando vídeo no servidor (FFmpeg)..." : "Corte finalizado!"}
                </h3>
                <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden mb-4 border border-slate-700">
                  <div 
                    className={`h-4 transition-all duration-300 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {progress === 100 && uploadUrl && (
                  <div className="mt-6 p-6 bg-slate-950 border border-slate-700 rounded-xl w-full text-center">
                    <p className="text-green-400 font-bold mb-4">✅ Vídeo cortado com sucesso!</p>
                    <a href={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/v/${uploadUrl}`} target="_blank" rel="noreferrer">
                        <button className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors mb-4 w-full cursor-pointer">
                        📥 Ver / Baixar Resultado
                        </button>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
