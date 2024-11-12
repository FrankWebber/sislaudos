// Atualiza o nome do arquivo de saída com base na data e hora atuais
function updateFilename() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const filename = `LAUDO_${day}.${month}.${year}_${hours}H${minutes}M`;
    document.getElementById("outputFilename").value = filename;
}

let processedData = [];

// Função para carregar o conteúdo do arquivo selecionado
function loadFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        document.getElementById("dataInput").value = e.target.result;
    };

    reader.readAsText(file);
}

// Função de normalização de strings para remover acentos
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Processa os dados e os exibe em uma pré-visualização
function processAndPreviewData() {
    let rawData = document.getElementById("dataInput").value;
    let entries = rawData.split(/(?=GOVERNO DO ESTADO DO\s+AMAZONAS\s+JUNTA MÉDICA - PERICIAL DO ESTADO)/);

    processedData = [];

    // Adiciona cabeçalhos apenas uma vez
    processedData.push([
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ]);

    // Processa cada entrada separadamente
    entries.forEach(entry => {
        let row = new Array(26).fill("");

        // Extrai o nome do servidor
        row[0] = normalizeString(entry).match(/servidor\(a\)\s+(.+?)(?=\s+CPF:|\s+publico,)/)?.[1]?.trim() || "";

        // Extrai a matrícula, dígito e letra
        let matriculaMatch = normalizeString(entry).match(/matricula\s*n°?\s*(\d{1,3}(?:\.\d{3})*)-(\d)([A-Za-z])?/);
        if (matriculaMatch) {
            row[1] = matriculaMatch[1].replace(/\./g, "") || "";
            row[2] = matriculaMatch[2] || "";
            row[3] = matriculaMatch[3] || "";
        }

        // Extrai unidade, cargo, cidade e telefone
        row[4] = normalizeString(entry).match(/unidade:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";
        row[5] = normalizeString(entry).match(/Cargo de:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";
        row[6] = normalizeString(entry).match(/cidade:\s+(.+?)(?=\/|\n)/)?.[1]?.trim() || "";
        row[7] = normalizeString(entry).match(/telefone:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";

        // Extrai a data do laudo
        let dataLaudoMatch = entry.match(/Data\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (dataLaudoMatch) {
            row[8] = dataLaudoMatch[1];
            row[9] = dataLaudoMatch[2];
            row[10] = dataLaudoMatch[3];
        }

        // Extrai o número do laudo médico
        let laudoMatch = entry.match(/LAUDO MÉDICO N°\s+(\d+)/);
        if (laudoMatch) {
            row[11] = laudoMatch[1];
        }

        // Extrai o período de licença
        let periodoMatch = entry.match(/Por\s+(\d+)\s+dias\s+(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (periodoMatch) {
            row[12] = periodoMatch[1];
            row[13] = periodoMatch[2];
            row[14] = periodoMatch[3];
            row[15] = periodoMatch[4];
            row[16] = periodoMatch[5];
            row[17] = periodoMatch[6];
            row[18] = periodoMatch[7];
        }

        // Extrai o CID
        let cidMatch = entry.match(/CID\s+([\w., ]+)/);
        row[19] = cidMatch ? cidMatch[1].trim() : "";

        // Define o Tipo de Licença e o Motivo
        row[20] = 5; // Tipo fixo como 5
        row[21] = (row[19] === "Z39.2") ? 4 : (row[19] === "Z76.3") ? 24 : 1;

        // Data Final, Reexaminar, Reassumir, e Prorrogação
        row[22] = `${row[16]}/${row[17]}/${row[18]}`;
        row[23] = "S";
        row[24] = "S";
        row[25] = "N";

        // Adiciona a linha de dados processada
        processedData.push(row);
    });

    // Atualiza a pré-visualização
    updatePreview();

    // Atualiza o status
    let status = document.getElementById('status');
    status.textContent = "Dados processados com sucesso! Pronto para exportar.";
    status.className = 'success';

    // Atualiza o nome do arquivo
    updateFilename();
}

// Atualiza a pré-visualização dos dados em uma tabela HTML
function updatePreview() {
    let preview = document.getElementById('dataPreview');
    preview.innerHTML = '';

    let table = document.createElement('table');
    table.className = 'preview-table';

    // Adiciona os cabeçalhos
    let headerRow = table.insertRow();
    processedData[0].forEach(header => {
        let th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Adiciona os dados
    for (let i = 1; i < processedData.length; i++) {
        let row = table.insertRow();
        processedData[i].forEach((cell, j) => {
            let td = row.insertCell();
            td.textContent = cell;
            td.contentEditable = true;

            // Salva as edições no array original
            td.addEventListener('blur', () => {
                processedData[i][j] = td.textContent;
            });
        });
    }

    preview.appendChild(table);
}

// Exporta os dados para um arquivo Excel
function exportToExcel() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    let ws = XLSX.utils.aoa_to_sheet(processedData);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laudos Médicos");

    const filename = document.getElementById("outputFilename").value || "Laudos_Medicos";
    XLSX.writeFile(wb, `${filename}.xlsx`);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel exportado com sucesso!";
    status.className = 'success';
}
// Exporta apenas as linhas onde a cidade é "Manaus"
function exportCapitalToExcel() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Filtra os dados para incluir apenas as linhas onde a cidade contém "MANAUS"
    let capitalData = processedData.filter(row => row[6].toUpperCase().includes("MANAUS"));

    if (capitalData.length === 0) {
        alert("Nenhum dado encontrado para a cidade Manaus.");
        return;
    }

    // Adiciona os cabeçalhos à capitalData
    capitalData.unshift(processedData[0]);

    let ws = XLSX.utils.aoa_to_sheet(capitalData);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Capital");

    const filename = `Laudos_Capital_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para a capital exportado com sucesso!";
    status.className = 'success';
}

// Exporta apenas as linhas onde a cidade não é "Manaus"
function exportInteriorToExcel() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Filtra os dados para incluir apenas as linhas onde a cidade NÃO contém "MANAUS"
    let interiorData = processedData.filter(row => !row[6].toUpperCase().includes("MANAUS"));

    if (interiorData.length === 0) {
        alert("Nenhum dado encontrado fora da cidade Manaus.");
        return;
    }

    // Adiciona os cabeçalhos à interiorData
    interiorData.unshift(processedData[0]);

    let ws = XLSX.utils.aoa_to_sheet(interiorData);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interior");

    const filename = `Laudos_Interior_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para o interior exportado com sucesso!";
    status.className = 'success';
}

// Exporta apenas as licenças vigentes, onde a data final é maior ou igual à data atual
function exportLicencasVigentes() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    const today = new Date();
    let licencasVigentes = processedData.filter((row, index) => {
        // Ignora a linha de cabeçalho
        if (index === 0) return false;

        const dataFinal = row[22]; // A coluna "data_final"
        if (!dataFinal) return false;

        // Divide a data final e converte para um objeto Date
        const [dia, mes, ano] = dataFinal.split('/').map(Number);
        const dataRow = new Date(ano, mes - 1, dia);

        // Compara a data da linha com a data de hoje
        return dataRow >= today;
    });

    if (licencasVigentes.length === 0) {
        alert("Nenhuma licença vigente encontrada.");
        return;
    }

    // Adiciona os cabeçalhos ao início do array licencasVigentes
    licencasVigentes.unshift(processedData[0]);

    let ws = XLSX.utils.aoa_to_sheet(licencasVigentes);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licencas_Vigentes");

    const filename = `Licencas_Vigentes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para licenças vigentes exportado com sucesso!";
    status.className = 'success';
}

// Exporta apenas as licenças vencidas, onde a data final é menor que a data atual
function exportVencidas() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    const today = new Date();
    let licencasVencidas = processedData.filter(row => {
        const dataFinal = row[22];
        if (!dataFinal) return false;
        const [dia, mes, ano] = dataFinal.split('/').map(Number);
        const dataRow = new Date(ano, mes - 1, dia);
        return dataRow < today;
    });

    if (licencasVencidas.length === 0) {
        alert("Nenhuma licença vencida encontrada.");
        return;
    }

    // Adiciona os cabeçalhos à licencasVencidas
    licencasVencidas.unshift(processedData[0]);

    let ws = XLSX.utils.aoa_to_sheet(licencasVencidas);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licencas_Vencidas");

    const filename = `Licencas_Vencidas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para licenças vencidas exportado com sucesso!";
    status.className = 'success';
}



window.onload = updateFilename;
