"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import * as tus from "tus-js-client";

export default function UparPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setProgress(0);
      setUploading(false);
      setUploadUrl(null);
    }
  };

  const startUpload = () => {
    if (!selectedFile) return;
    setUploading(true);
    
    const upload = new tus.Upload(selectedFile, {
      endpoint: "http://localhost:3001/files",
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: selectedFile.name,
        filetype: selectedFile.type,
      },
      onError: function (error) {
        console.error("Failed because: " + error);
        setUploading(false);
        alert("Erro no upload");
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        setProgress(Number(percentage));
      },
      onSuccess: function () {
        console.log("Download %s from %s", upload.file.name, upload.url);
        // Extract the TUS file ID from the url
        const urlObj = new URL(upload.url!);
        const id = urlObj.pathname.split("/").pop();
        setUploadUrl(id || null);
        setProgress(100);
      },
    });

    upload.start();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-geist-sans)] p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">
          &larr; Voltar
        </Link>
        <h1 className="text-3xl font-bold mb-4">📤 Upar Vídeo ou Imagem</h1>
        <p className="text-slate-400 mb-8">Faça o upload do seu conteúdo para gerar um link exclusivo.</p>
        
        <div 
          className="border-2 border-dashed border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center bg-slate-900/50 hover:border-indigo-500 transition-colors cursor-pointer"
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept="video/*,image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <div className="text-center w-full max-w-md">
              <p className="text-green-400 font-bold mb-2">Arquivo selecionado:</p>
              <p className="text-slate-300 font-medium truncate">{selectedFile.name}</p>
              <p className="text-slate-500 text-sm mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <p className="text-slate-500 mb-4">Arraste seus arquivos aqui ou clique para selecionar</p>
              <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors">
                Procurar Arquivo
              </button>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="mt-8 flex flex-col items-center">
            {uploading ? (
              <div className="w-full max-w-md bg-slate-800 rounded-full h-4 overflow-hidden mb-4 border border-slate-700">
                <div 
                  className="bg-indigo-500 h-4 transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
                <p className="text-center text-sm mt-2">{progress}% concluído...</p>
              </div>
            ) : (
              <button 
                onClick={startUpload}
                className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition-colors w-full max-w-md shadow-lg shadow-green-900/20"
              >
                Iniciar Upload Real
              </button>
            )}

            {uploadUrl && (
              <div className="mt-6 p-6 bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md text-center">
                <p className="text-green-400 font-bold mb-4">🎉 Upload concluído com sucesso!</p>
                <p className="text-sm text-slate-400 mb-2">Seu link exclusivo:</p>
                <input 
                  type="text" 
                  readOnly 
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/v/${uploadUrl}`} 
                  className="w-full bg-slate-950 border border-slate-700 p-3 rounded text-blue-400 text-center font-mono focus:outline-none cursor-pointer"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
