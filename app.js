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

// Endpoint para processar o arquivo
app.post('/processar', upload.single('laudo'), async (req, res) => {
    try {
        // Enviar arquivo para o serviço Python
        const filePath = path.join(__dirname, req.file.path);
        const response = await axios.post('http://localhost:5000/processar', {
            filePath: filePath,
        });

        // Responder com o caminho do arquivo Excel gerado
        res.json({ success: true, file: response.data.file });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
