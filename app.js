const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

// Configuração do diretório público
app.use(express.static('public'));

// Configuração do Multer para upload de arquivos
const upload = multer({ dest: 'uploads/' });

// Rota para servir o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para processar o arquivo
app.post('/processar', upload.single('laudo'), async (req, res) => {
    try {
        // Verificar se o arquivo foi enviado
        if (!req.file) {
            return res.status(400).json({ success: false, error: "Nenhum arquivo enviado." });
        }

        const filePath = path.join(__dirname, req.file.path);
        const response = await axios.post('http://localhost:5000/processar', { filePath });

        // Responder com o caminho dos arquivos gerados (sucesso e erro)
        res.json({
            success: true,
            successFile: response.data.success_file,
            errorFile: response.data.error_file,
            message: response.data.message
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
