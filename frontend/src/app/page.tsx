import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="p-6 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          DanoneVendas Vídeos
        </h1>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
          👤
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8 flex flex-col items-center mt-12 gap-8">
        <h2 className="text-4xl font-extrabold text-center tracking-tight">
          Hospedagem e Cortes de Vídeo Profissionais
        </h2>
        <p className="text-lg text-slate-400 text-center max-w-2xl">
          Faça uploads de até 100GB com segurança e velocidade. Corte seus vídeos com precisão, tudo em uma interface moderna e intuitiva.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
          {/* Card: Cortar Vídeo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-blue-500 transition-colors">
            <div className="text-4xl">✂️</div>
            <h3 className="text-xl font-bold">Cortar Vídeo</h3>
            <p className="text-slate-400 text-sm">
              Envie um vídeo, selecione o tempo inicial e final, e processamos pra você sem travar o seu PC.
            </p>
            <Link href="/cortar" className="mt-auto">
              <button className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition-colors cursor-pointer">
                Iniciar Corte
              </button>
            </Link>
          </div>

          {/* Card: Upar Arquivo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-indigo-500 transition-colors">
            <div className="text-4xl">📤</div>
            <h3 className="text-xl font-bold">Upar Vídeo/Imagem</h3>
            <p className="text-slate-400 text-sm">
              Faça upload de vídeos ou imagens de até 100GB e gere links exclusivos instantaneamente.
            </p>
            <Link href="/upar" className="mt-auto">
              <button className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors cursor-pointer">
                Fazer Upload
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
