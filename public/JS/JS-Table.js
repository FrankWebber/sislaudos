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

function loadFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        document.getElementById("dataInput").value = e.target.result;
    };

    reader.readAsText(file);
}

function processAndPreviewData() {
    let rawData = document.getElementById("dataInput").value;
    let entries = rawData.split(/(?=AMAZONAS\s+GOVERNO DO ESTADO)/);
    processedData = [];

    // Adiciona cabeçalhos apenas uma vez
    processedData.push([
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ]);

    entries.forEach(entry => {
        let row = new Array(25).fill(""); // Atualize para 25 colunas

        row[0] = entry.match(/servidor\(a\)\s+(.+?)(?=\s+CPF:|\s+público,)/)?.[1]?.trim() || "";

        let matriculaMatch = entry.match(/matrícula\s*n°?\s*(\d{1,3}(?:\.\d{3})*)-(\d)([A-Za-z])?/);
        if (matriculaMatch) {
            row[1] = matriculaMatch[1].replace(/\./g, "") || "";
            row[2] = matriculaMatch[2] || "";
            row[3] = matriculaMatch[3] || "";
        }

        row[4] = entry.match(/unidade:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";
        row[5] = entry.match(/Cargo de:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";
        row[6] = entry.match(/cidade:\s+(.+?)(?=\/|\n)/)?.[1]?.trim() || "";
        row[7] = entry.match(/telefone:\s+(.+?)(?=\n)/)?.[1]?.trim() || "";

        let dataLaudoMatch = entry.match(/Data\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (dataLaudoMatch) {
            row[8] = dataLaudoMatch[1]; // Dia
            row[9] = dataLaudoMatch[2]; // Mês
            row[10] = dataLaudoMatch[3]; // Ano
        }

        let laudoMatch = entry.match(/LAUDO MÉDICO N°\s+(\d+)\/(\d{4})/);
        if (laudoMatch) {
            row[11] = `${laudoMatch[1]}/${laudoMatch[2]}`;
        }

        let periodoMatch = entry.match(/Por\s+(\d+)\s+dias\s+(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})/);
        if (periodoMatch) {
            row[12] = periodoMatch[1]; // Número de dias
            row[13] = periodoMatch[2]; // Dia_Inicio
            row[14] = periodoMatch[3]; // Mês_Inicio
            row[15] = periodoMatch[4]; // Ano_Inicio
            row[16] = periodoMatch[5]; // Dia_Fim
            row[17] = periodoMatch[6]; // Mês_Fim
            row[18] = periodoMatch[7]; // Ano_Fim
        }

        let cidMatch = entry.match(/CID\s+([\w., ]+)/);
        row[19] = cidMatch ? cidMatch[1].trim() : "";

        // Define o Tipo de Licença
        row[20] = 5; // Sempre 5

        // Adiciona a lógica para definir o motivo
        if (row[19] === "Z39.2") {
            row[21] = 4; // Motivo para Z39.2
        } else if (row[19] === "Z76.3") {
            row[21] = 24; // Motivo para Z76.3
        } else {
            row[21] = 1; // Para qualquer outro CID
        }

        // Adiciona as novas colunas
        row[22] = `${row[16]}/${row[17]}/${row[18]}`; // Data Final Unificada (Dia_Fim/Mês_Fim/Ano_Fim)

        row[23] = "S"; // Reexaminar
        row[24] = "S"; // Reassumir
        row[25] = "N"; // Prorrogação

        processedData.push(row);
    });

    updatePreview();

    let status = document.getElementById('status');
    status.textContent = "Dados processados com sucesso! Pronto para exportar.";
    status.className = 'success';

    updateFilename();
}

function updatePreview() {
    let preview = document.getElementById('dataPreview');
    preview.innerHTML = '';

    let table = document.createElement('table');
    table.className = 'preview-table';

    let headerRow = table.insertRow();
    processedData[0].forEach((header) => {
        let th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    for (let i = 1; i < processedData.length; i++) {
        let row = table.insertRow();
        processedData[i].forEach((cell, j) => {
            let td = row.insertCell();
            td.textContent = cell; // Preencher normalmente sem valores fixos

            // Cria uma célula editável
            td.contentEditable = true; // Torna a célula editável

            // Adiciona um listener para salvar as edições
            td.addEventListener('blur', () => {
                processedData[i][j] = td.textContent; // Salva a edição no array
            });
        });
    }

    preview.appendChild(table);
}

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

function exportCapitalToExcel() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Filtrar os dados para incluir apenas as linhas onde a cidade contém "MANAUS"
    let capitalData = processedData.filter(row => row[6].toUpperCase().includes("MANAUS"));

    if (capitalData.length === 0) {
        alert("Nenhum dado encontrado para a cidade Manaus.");
        return;
    }

    // Adicionar os cabeçalhos à capitalData
    let headers = [
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ];

    // Adiciona cabeçalhos na primeira linha
    capitalData.unshift(headers);

    let ws = XLSX.utils.aoa_to_sheet(capitalData);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Capital");

    const filename = `Laudos_Capital_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para a capital exportado com sucesso!";
    status.className = 'success';
}

function exportInteriorToExcel() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Filtrar os dados para incluir apenas as linhas onde a cidade NÃO contém "MANAUS"
    let interiorData = processedData.filter(row => !row[6].toUpperCase().includes("MANAUS"));

    if (interiorData.length === 0) {
        alert("Nenhum dado encontrado fora da cidade Manaus.");
        return;
    }

    // Adicionar os cabeçalhos à interiorData
    let headers = [
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ];

    // Verifica se o primeiro elemento é um cabeçalho e, se for, remove antes de adicionar o novo cabeçalho
    if (interiorData[0][0] === "servidor") {
        interiorData.shift(); // Remove o cabeçalho atual
    }

    // Adiciona cabeçalhos na primeira linha
    interiorData.unshift(headers);

    let ws = XLSX.utils.aoa_to_sheet(interiorData);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Interior");

    const filename = `Laudos_Interior_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para o interior exportado com sucesso!";
    status.className = 'success';
}

function exportLicençasVigentes() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Obtém a data atual
    const today = new Date();

    // Filtrar os dados para incluir apenas as linhas onde a data_final é maior ou igual à data atual
    let licencasVigentes = processedData.filter(row => {
        // A data está na coluna 22
        const dataFinal = row[22]; // Obtém a data da coluna "data_final"
        const [dia, mes, ano] = dataFinal.split('/').map(Number); // Separa a data em partes
        const dataRow = new Date(ano, mes - 1, dia); // Cria um objeto Date para a data da linha
        return dataRow >= today; // Compara a data da linha com a data atual
    });

    if (licencasVigentes.length === 0) {
        alert("Nenhuma licença vigente encontrada.");
        return;
    }

    // Adicionar os cabeçalhos à licencasVigentes
    let headers = [
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ];

    // Adiciona cabeçalhos na primeira linha
    licencasVigentes.unshift(headers);

    let ws = XLSX.utils.aoa_to_sheet(licencasVigentes);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licenças Vigentes");

    const filename = `Licencas_Vigentes_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para licenças vigentes exportado com sucesso!";
    status.className = 'success';
}



function exportVencidas() {
    if (processedData.length === 0) {
        alert("Nenhum dado processado. Por favor, processe os dados antes de exportar.");
        return;
    }

    // Obtém a data atual
    const today = new Date();

    // Filtrar os dados para incluir apenas as linhas onde a data_final é menor que a data atual
    let licencasVencidas = processedData.filter(row => {
        // A data está na coluna 22
        const dataFinal = row[22]; // Obtém a data da coluna "data_final"
        const [dia, mes, ano] = dataFinal.split('/').map(Number); // Separa a data em partes
        const dataRow = new Date(ano, mes - 1, dia); // Cria um objeto Date para a data da linha
        return dataRow < today; // Compara a data da linha com a data atual
    });

    if (licencasVencidas.length === 0) {
        alert("Nenhuma licença vencida encontrada.");
        return;
    }

    // Adicionar os cabeçalhos à licencasVencidas
    let headers = [
        "servidor", "matricula", "digito", "letra", "lotacao", "cargo",
        "cidade", "telefone", "dia_exame", "mes_exame", "ano_exame",
        "numero", "dias_licenca", "dia_inicio", "mes_inicio",
        "ano_inicio", "dia_fim", "mes_fim", "ano_fim", "cid",
        "tipo", "motivo", "data_final", "reexaminar", "reassumir", "prorrogacao"
    ];

    // Adiciona cabeçalhos na primeira linha
    licencasVencidas.unshift(headers);

    let ws = XLSX.utils.aoa_to_sheet(licencasVencidas);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licenças Vencidas");

    const filename = `Licencas_Vencidas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);

    let status = document.getElementById('status');
    status.textContent = "Arquivo Excel para licenças vencidas exportado com sucesso!";
    status.className = 'success';
}




window.onload = updateFilename;

