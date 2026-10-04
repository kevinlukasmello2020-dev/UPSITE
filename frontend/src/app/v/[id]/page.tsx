"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VideoViewerPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [fileType, setFileType] = useState<string>("video/mp4");

  useEffect(() => {
    fetch(`http://localhost:3001/api/info/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.metadata && data.metadata.filetype) {
          setFileType(data.metadata.filetype);
        }
      })
      .catch(() => {});
  }, [id]);

  // URL of the backend serving the file
  const fileSrc = `http://localhost:3001/v/${id}`;
  const isImage = fileType.startsWith("image/");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-geist-sans)] flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            DanoneVendas VÃ­deos
          </h1>
        </Link>
        <div className="flex gap-4">
          <a href={fileSrc} download className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
            Baixar Arquivo
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col items-center">
          
          {isImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={fileSrc} 
              alt="ConteÃºdo Compartilhado" 
              className="w-full max-h-[70vh] object-contain rounded-lg bg-black"
            />
          ) : (
            <video 
              controls 
              autoPlay 
              className="w-full max-h-[70vh] rounded-lg bg-black"
              src={fileSrc}
            >
              Seu navegador nÃ£o suporta o formato de vÃ­deo. 
              <a href={fileSrc} className="text-blue-500 underline ml-2">Clique aqui para baixar</a>.
            </video>
          )}

          <div className="w-full mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-200">ConteÃºdo Compartilhado</h2>
              <p className="text-sm text-slate-500 mt-1">Hospedado via DanoneVendas</p>
            </div>
            
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copiado!");
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors w-full md:w-auto flex items-center justify-center gap-2"
            >
              ðŸ”— Copiar Link de Compartilhamento
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
