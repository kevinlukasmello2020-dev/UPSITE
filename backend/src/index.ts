import express from 'express';
import cors from 'cors';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../uploads');
const outputDir = path.join(__dirname, '../outputs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// TUS server setup
const tusServer = new Server({
  path: '/files',
  datastore: new FileStore({ directory: uploadDir }),
  onUploadFinish: async (req, res, upload) => {
    console.log(`[TUS] Upload finalizado: ${upload.id}`);
    
    // Create DB entry (simplistic for local test)
    // In a real app we'd map this ID to our own ID and save it
    return res;
  }
});

app.all('/files', tusServer.handle.bind(tusServer));
app.all('/files/:id', tusServer.handle.bind(tusServer));

// Obter info do arquivo
app.get('/api/info/:id', (req, res) => {
  const infoPath = path.join(uploadDir, req.params.id + '.info');
  if (fs.existsSync(infoPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      return res.json(data);
    } catch(e) {}
  }
  res.json({ metadata: { filetype: 'video/mp4' } }); // Fallback
});

// Rota para baixar/ver vídeos ou imagens
app.get('/v/:id', (req, res) => {
  const filePath = path.join(uploadDir, req.params.id);
  const outPath = path.join(outputDir, req.params.id + '.mp4');
  const infoPath = path.join(uploadDir, req.params.id + '.info');
  
  if (fs.existsSync(outPath)) {
    res.setHeader('Content-Type', 'video/mp4');
    return res.sendFile(outPath);
  } else if (fs.existsSync(filePath)) {
    let contentType = 'video/mp4'; // fallback
    if (fs.existsSync(infoPath)) {
      try {
        const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
        if (info.metadata && info.metadata.filetype) {
          contentType = info.metadata.filetype;
        }
      } catch(e) {}
    }
    res.setHeader('Content-Type', contentType);
    return res.sendFile(filePath);
  }
  
  res.status(404).send('Not found');
});

// Process function (synchronous for simple local use)
async function processNext(uploadId: string, startTime: number, endTime: number) {
  const inputPath = path.join(uploadDir, uploadId);
  const outputPath = path.join(outputDir, uploadId + '.mp4');
  
  console.log(`[FFMPEG] Iniciando corte do vídeo ${uploadId}`);
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(endTime)
      .output(outputPath)
      .on('end', () => {
        console.log(`[FFMPEG] Corte concluído: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`[FFMPEG] Erro: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

app.post('/api/cut-video', async (req, res) => {
  const { uploadId, startTime, duration } = req.body;
  if (!uploadId || startTime === undefined || duration === undefined) {
    return res.status(400).json({ error: 'Faltam parâmetros' });
  }

  try {
    await processNext(uploadId, startTime, duration);
    res.json({ message: 'Processamento concluído', outputId: uploadId });
  } catch (e) {
    res.status(500).json({ error: 'Erro no processamento' });
  }
});

app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
