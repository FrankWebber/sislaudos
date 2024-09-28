let processedData = []; 

function processAndPreviewData() {
    let rawData = document.getElementById("dataInput").value;
    let entries = rawData.split(/(?=AMAZONAS\s+GOVERNO DO ESTADO)/);
    processedData = [];

    // Adiciona linha de cabeçalho
    const header = [
        "Nome_Servidor", "Matrícula", "Digito", "Letra", "Lotado", "Cargo",
        "Cidade", "Telefone", "Dia_Laudo", "Mes_Laudo", "Ano_Laudo",
        "LAUDO MÉDICO N°", "Ano", "Dias", "Dia_Ini", "Mes_Ini",
        "Ano_Ini", "Dia_Fim", "Mes_Fim", "Ano_Fim", "CID", 
        "Tipo", "Reexaminar", "Reassumir", "Prorrogação"
    ];
    
    processedData.push(header); // Adiciona o cabeçalho à planilha

    entries.forEach(entry => {
        let row = new Array(header.length).fill(""); // Preenche a linha com strings vazias

        // Extrai Matricula, Digito, Letra
        let matriculaMatch = entry.match(/matrícula\s*(?:n°)?\s*(\d+)[-.](\d)([A-Za-z])?/i);
        if (matriculaMatch) {
            row[1] = matriculaMatch[1]; // Matrícula
            row[2] = matriculaMatch[2]; // Dígito
            row[3] = matriculaMatch[3] || ""; // Letra
        }

        // Extrai Nome
        let nomeMatch = entry.match(/servidor\(a\)\s+(.+?)(?=\s+CPF:|\s+público,)/);
        row[0] = nomeMatch ? nomeMatch[1].trim() : ""; // Nome_Servidor

        // Extrai Cargo
        let cargoMatch = entry.match(/Cargo de:\s+(.+?)(?=\n)/);
        row[4] = cargoMatch ? cargoMatch[1].trim() : ""; // Cargo

        // Extrai Dias
        let diasMatch = entry.match(/Por\s+(\d+)\s+dias/);
        row[13] = diasMatch ? diasMatch[1] : ""; // Dias

        // Extrai Cidade
        let cidadeMatch = entry.match(/cidade:\s+(.+?)(?=\/|\n)/);
        row[6] = cidadeMatch ? cidadeMatch[1].trim() : ""; // Cidade
        row[18] = row[6]; // Duplicar cidade no final

        // Extrai Número do Laudo
        let laudoMatch = entry.match(/LAUDO MÉDICO N°\s+(\d+)/);
        row[7] = laudoMatch ? laudoMatch[1] : ""; // LAUDO MÉDICO N°

        // Extrai Período de Data
        let periodoMatch = entry.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (periodoMatch) {
            row[8] = periodoMatch[1];  // Dia_Inicio
            row[9] = periodoMatch[2];  // Mes_Inicio
            row[10] = periodoMatch[3]; // Ano_Inicio
            row[11] = periodoMatch[4]; // Dia_Fim
            row[12] = periodoMatch[5]; // Mes_Fim
            row[13] = periodoMatch[6]; // Ano_Fim
        }

        // Extrai Data do Exame
        let exameMatch = entry.match(/Data do exame:\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (exameMatch) {
            row[14] = exameMatch[1]; // Dia_Exame
            row[15] = exameMatch[2]; // Mes_Exame
            row[16] = exameMatch[3]; // Ano_Exame
        }

        // Extrai CID
        let cidMatch = entry.match(/CID\s+([A-Z0-9.,\s]+)/);
        row[17] = cidMatch ? cidMatch[1].trim() : ""; // CID

        // Se a linha tiver dados relevantes, adiciona ao processedData
        if (row.some(item => item)) {
            processedData.push(row);
        }
    });

    // Atualiza a pré-visualização
    updatePreview();

    // Mostra mensagem de sucesso
    let status = document.getElementById('status');
    status.textContent = "Dados processados com sucesso! Pronto para exportar.";
    status.className = 'success';
}

function updatePreview() {
    let preview = document.getElementById('dataPreview');
    preview.innerHTML = '';
    
    let table = document.createElement('table');
    table.className = 'preview-table';
    
    // Adiciona o cabeçalho
    let headerRow = table.insertRow();
    processedData[0].forEach(header => {
        let th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    
    // Adiciona as linhas de dados
    for (let i = 1; i < processedData.length; i++) {
        let row = table.insertRow();
        processedData[i].forEach(cell => {
            let td = row.insertCell();
            td.textContent = cell;
        });
    }
    
    preview.appendChild(table);
}

function exportToExcel() {
    if (processedData.length === 0) {
        alert("Por favor, processe os dados primeiro.");
        return;
    }

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(processedData);
    XLSX.utils.book_append_sheet(wb, ws, "Dados Processados");

    let filename = document.getElementById("outputFilename").value || "dados_processados";
    XLSX.writeFile(wb, filename + ".xlsx");
}

// Função para carregar dados de um arquivo de texto
document.getElementById('fileInput').addEventListener('change', function(e) {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('dataInput').value = e.target.result;
    };
    reader.readAsText(file);
});
