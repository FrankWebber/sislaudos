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
        "cidade", "telefone", "data_exame", "numero", "dias_licenca",
        "data_inicio", "data_fim", "cid", "tipo", "motivo", "data_final",
        "reexaminar", "reassumir", "prorrogacao"
    ]);

    // Processa cada entrada separadamente
    entries.forEach(entry => {
        let row = new Array(19).fill("");

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

        // Extrai a data do laudo e combina em um formato "ddmmyyyy"
        let dataLaudoMatch = entry.match(/Data\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (dataLaudoMatch) {
            // Combina dia, mês e ano em um único campo "data_exame" no formato "ddmmyyyy"
            row[8] = `${dataLaudoMatch[1]}${dataLaudoMatch[2]}${dataLaudoMatch[3]}`;
        }

        // Extrai o número do laudo médico e insere na posição correta
        let laudoMatch = entry.match(/LAUDO MÉDICO N°\s+(\d+)/);
        if (laudoMatch) {
            row[9] = laudoMatch[1];
        }

        // Extrai o período de licença e combina as datas de início e fim no formato "ddmmyyyy"
        let periodoMatch = entry.match(/Por\s+(\d+)\s+dias\s+(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (periodoMatch) {
            row[10] = periodoMatch[1]; // dias_licenca
            // Combina dia, mês e ano de início em "data_inicio" no formato "ddmmyyyy"
            row[11] = `${periodoMatch[2]}${periodoMatch[3]}${periodoMatch[4]}`;
            // Combina dia, mês e ano de fim em "data_fim" no formato "ddmmyyyy"
            row[12] = `${periodoMatch[5]}${periodoMatch[6]}${periodoMatch[7]}`;
        }

        // Extrai o CID
        let cidMatch = entry.match(/CID\s+([\w., ]+)/);
        row[13] = cidMatch ? cidMatch[1].trim() : "";

        // Define o Tipo de Licença e o Motivo
        row[14] = 5; // Tipo fixo como 5
        row[15] = (row[13] === "Z39.2") ? 4 : (row[13] === "Z76.3") ? 24 : 1;

        // Data Final, Reexaminar, Reassumir, e Prorrogação
        row[16] = row[12]; // Usa data_fim como data_final
        row[17] = "S";
        row[18] = "S";
        row[19] = "N";

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

function parseDate(ddmmyyyy) {
    const day = ddmmyyyy.slice(0, 2);
    const month = ddmmyyyy.slice(2, 4) - 1;
    const year = ddmmyyyy.slice(4);
    return new Date(year, month, day);
}

// Exporta apenas as licenças vigentes, onde a data final é maior ou igual à data atual
function exportLicencasVigentes() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    const today = new Date();
    let licencasVigentes = processedData.filter((row, index) => {
        if (index === 0) return false; // Ignora cabeçalho
        const dataFinal = row[16]; // A coluna "data_final" no formato "ddmmyyyy"
        if (!dataFinal) return false;

        // Converte a data final para o formato Date e compara
        const dataRow = parseDate(dataFinal);
        return dataRow >= today;
    });

    if (licencasVigentes.length === 0) {
        alert("Nenhuma licença vigente encontrada.");
        return;
    }

    // Adiciona cabeçalho
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
    let licencasVencidas = processedData.filter((row, index) => {
        if (index === 0) return false; // Ignora cabeçalho
        const dataFinal = row[16]; // A coluna "data_final" no formato "ddmmyyyy"
        if (!dataFinal) return false;

        // Converte a data final para o formato Date e compara
        const dataRow = parseDate(dataFinal);
        return dataRow < today;
    });

    if (licencasVencidas.length === 0) {
        alert("Nenhuma licença vencida encontrada.");
        return;
    }

    // Adiciona cabeçalho
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
