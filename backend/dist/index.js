"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const server_1 = require("@tus/server");
const file_store_1 = require("@tus/file-store");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
dotenv_1.default.config();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const uploadDir = path_1.default.join(__dirname, '../uploads');
const outputDir = path_1.default.join(__dirname, '../outputs');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
if (!fs_1.default.existsSync(outputDir))
    fs_1.default.mkdirSync(outputDir, { recursive: true });
// TUS server setup
const tusServer = new server_1.Server({
    path: '/files',
    datastore: new file_store_1.FileStore({ directory: uploadDir }),
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
    const infoPath = path_1.default.join(uploadDir, req.params.id + '.info');
    if (fs_1.default.existsSync(infoPath)) {
        try {
            const data = JSON.parse(fs_1.default.readFileSync(infoPath, 'utf8'));
            return res.json(data);
        }
        catch (e) { }
    }
    res.json({ metadata: { filetype: 'video/mp4' } }); // Fallback
});
// Rota para baixar/ver vídeos ou imagens
app.get('/v/:id', (req, res) => {
    const filePath = path_1.default.join(uploadDir, req.params.id);
    const outPath = path_1.default.join(outputDir, req.params.id + '.mp4');
    const infoPath = path_1.default.join(uploadDir, req.params.id + '.info');
    if (fs_1.default.existsSync(outPath)) {
        res.setHeader('Content-Type', 'video/mp4');
        return res.sendFile(outPath);
    }
    else if (fs_1.default.existsSync(filePath)) {
        let contentType = 'video/mp4'; // fallback
        if (fs_1.default.existsSync(infoPath)) {
            try {
                const info = JSON.parse(fs_1.default.readFileSync(infoPath, 'utf8'));
                if (info.metadata && info.metadata.filetype) {
                    contentType = info.metadata.filetype;
                }
            }
            catch (e) { }
        }
        res.setHeader('Content-Type', contentType);
        return res.sendFile(filePath);
    }
    res.status(404).send('Not found');
});
// Process function (synchronous for simple local use)
async function processNext(uploadId, startTime, endTime) {
    const inputPath = path_1.default.join(uploadDir, uploadId);
    const outputPath = path_1.default.join(outputDir, uploadId + '.mp4');
    console.log(`[FFMPEG] Iniciando corte do vídeo ${uploadId}`);
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(inputPath)
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
    }
    catch (e) {
        res.status(500).json({ error: 'Erro no processamento' });
    }
});
app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});
