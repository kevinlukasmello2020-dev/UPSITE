import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

const videoWorker = new Worker('video-processing', async job => {
  console.log(`Iniciando processamento do job ${job.id}...`);
  console.log(`Dados da tarefa:`, job.data);
  
  // TODO: Integrar FFmpeg aqui para cortar o vídeo
  // job.data.videoPath
  // job.data.startTime
  // job.data.endTime
  
  // Simulação de processamento
  for (let i = 0; i <= 100; i += 10) {
    await job.updateProgress(i);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Job ${job.id} finalizado.`);
  return { success: true, url: 'http://localhost/video.mp4' };
}, { connection });

videoWorker.on('completed', job => {
  console.log(`[SUCESSO] Tarefa ${job.id} concluída`);
});

videoWorker.on('failed', (job, err) => {
  console.log(`[ERRO] Tarefa ${job?.id} falhou: ${err.message}`);
});

console.log('Worker de processamento de vídeo iniciado e escutando a fila "video-processing"...');
