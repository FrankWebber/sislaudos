// Atualiza o nome do arquivo de saída com base na data e hora atuais
function updateFilename() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

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

function processAndPreviewData() {
  let rawData = document.getElementById("dataInput").value;
  
  // Normaliza e divide os dados
  rawData = normalizeString(rawData);
  let entries = rawData.split(
    /(?=GOVERNO DO ESTADO.*?JUNTA MÉDICA - PERICIAL DO ESTADO)/i
  );

  console.log(`Número de registros detectados: ${entries.length}`); // Depuração

  processedData = [];


  // Adiciona cabeçalhos, incluindo o novo cabeçalho "ano_fim"
  processedData.push([
    "servidor",
    "matricula",
    "digito",
    "letra",
    "matricula_completa",
    "lotacao",
    "cargo",
    "cidade",
    "telefone",
    "data_exame",
    "numero",
    "dias_licenca",
    "data_inicio",
    "data_fim",
    "ano_inicio",
    "data_fim_formatada", // Novo cabeçalho adicionado
    "cid",
    "tipo",
    "motivo",
    "data_final",
    "reexaminar",
    "reassumir",
    "prorrogacao",
    "codigo_cid",
  ]);

  entries.forEach((entry) => {
    let row = new Array(24).fill(""); // Atualizado para 24 colunas

    // Extrai o nome do servidor
    row[0] =
      normalizeString(entry)
        .match(/servidor\(a\)\s+(.+?)(?=\s+CPF:|\s+publico,)/)?.[1]
        ?.trim() || "";

    // Extrai a matrícula, dígito, letra e cria matricula_completa com traço antes do antepenúltimo dígito
    let matriculaMatch = normalizeString(entry).match(
      /matricula\s*n°?\s*(\d{1,3}(?:\.\d{3})*)-(\d)([A-Za-z])?/
    );
    if (matriculaMatch) {
      row[1] = matriculaMatch[1].replace(/\./g, "") || ""; // matricula
      row[2] = matriculaMatch[2] || ""; // digito
      row[3] = matriculaMatch[3] || ""; // letra

      // Adiciona o traço antes do antepenúltimo dígito
      let matriculaCompleta = `01${row[1]}${row[2]}${row[3]}`;
      row[4] = `${matriculaCompleta.slice(0, -2)}-${matriculaCompleta.slice(
        -2
      )}`;
    }

    // Outras extrações permanecem as mesmas...
    row[5] =
      normalizeString(entry)
        .match(/unidade:\s+(.+?)(?=\n)/)?.[1]
        ?.trim() || "";
    row[6] =
      normalizeString(entry)
        .match(/Cargo de:\s+(.+?)(?=\n)/)?.[1]
        ?.trim() || "";
    row[7] =
      normalizeString(entry)
        .match(/cidade:\s+(.+?)(?=\/|\n)/)?.[1]
        ?.trim() || "";
    row[8] =
      normalizeString(entry)
        .match(/telefone:\s+(.+?)(?=\n)/)?.[1]
        ?.trim() || "";

    let dataLaudoMatch = entry.match(/Data\s+(\d{2})\/(\d{2})\/(\d{4})/);
    if (dataLaudoMatch) {
      row[9] = `${dataLaudoMatch[1]}${dataLaudoMatch[2]}${dataLaudoMatch[3]}`;
    }

    // Captura a data_inicio e gera o ano_inicio
    let dataInicioMatch = entry.match(/Data do exame\s*(\d{2}\/\d{2}\/\d{4})/);
    if (dataInicioMatch) {
      row[12] = dataInicioMatch[1]; // Mantém a data completa como data_inicio
      let anoMatch = dataInicioMatch[1].match(/\d{4}$/); // Extrai os últimos 4 dígitos (ano)
      if (anoMatch) {
        row[14] = anoMatch[0]; // Preenche o ano_inicio
      }
    }

    let laudoMatch = entry.match(/LAUDO MÉDICO N°\s+(\d+)\//);
    if (laudoMatch) {
      row[10] = laudoMatch[1]; // Captura apenas o número antes da barra
    }

    // Captura o período e preenche "data_fim" e "data_fim_formatada"
    let periodoMatch = entry.match(
      /Por\s+(\d+)\s+dias\s+(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})/
    );
    if (periodoMatch) {
      row[11] = periodoMatch[1]; // dias_licenca
      row[12] = `${periodoMatch[2]}${periodoMatch[3]}${periodoMatch[4]}`; // data_inicio
      row[13] = `${periodoMatch[5]}${periodoMatch[6]}${periodoMatch[7]}`; // data_fim

      // Atualiza "ano_inicio" com base nos últimos 4 dígitos de "data_inicio"
      row[14] = periodoMatch[4]; // Extrai diretamente o ano da data_inicio

      // Preenche "data_fim_formatada" com data no formato dd/mm/yyyy
      row[15] = `${periodoMatch[7]}-${periodoMatch[6].padStart(
        2,
        "0"
      )}-${periodoMatch[5].padStart(2, "0")}`;
    }

    let cidMatch = entry.match(/CID\s+([\w., ]+)/);
    row[16] = cidMatch ? cidMatch[1].trim() : "";

    row[17] = 5; // Tipo fixo como 5
    row[18] = row[16] === "Z39.2" ? 4 : row[16] === "Z76.3" ? 24 : 1;

    row[19] = row[13]; // Usa data_fim como data_final
    row[20] = "S";
    row[21] = "S";
    row[22] = "N";

    if (row[16] === "Z76.3") {
      row[23] = "14012";
    } else if (row[16] === "Z39.2") {
      row[23] = "13734";
    } else {
      row[23] = "1";
    }

    // Adiciona a linha de dados processada
    processedData.push(row);
  });

  // Atualiza a pré-visualização
  updatePreview();

  // Atualiza o status
  let status = document.getElementById("status");
  status.textContent = "Dados processados com sucesso! Pronto para exportar.";
  status.className = "success";

  // Atualiza o nome do arquivo
  updateFilename();
}
// Atualiza a pré-visualização dos dados em uma tabela HTML
function updatePreview() {
  let preview = document.getElementById("dataPreview");
  preview.innerHTML = "";

  let table = document.createElement("table");
  table.className = "preview-table";

  // Adiciona os cabeçalhos
  let headerRow = table.insertRow();
  processedData[0].forEach((header) => {
    let th = document.createElement("th");
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
      td.addEventListener("blur", () => {
        processedData[i][j] = td.textContent;
      });
    });
  }

  preview.appendChild(table);
}

// Exporta os dados para um arquivo Excel
function exportToExcel() {
  if (processedData.length === 0) {
    alert(
      "Nenhum dado processado. Por favor, processe os dados antes de exportar."
    );
    return;
  }

  let ws = XLSX.utils.aoa_to_sheet(processedData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laudos Médicos");

  const filename =
    document.getElementById("outputFilename").value || "Laudos_Medicos";
  XLSX.writeFile(wb, `${filename}.xlsx`);

  let status = document.getElementById("status");
  status.textContent = "Arquivo Excel exportado com sucesso!";
  status.className = "success";
}
// Exporta apenas as linhas onde a cidade é "Manaus"
function exportCapitalToExcel() {
  if (processedData.length === 0) {
    alert(
      "Nenhum dado processado. Por favor, processe os dados antes de exportar."
    );
    return;
  }

  // Filtra os dados para incluir apenas as linhas onde a cidade contém "MANAUS"
  let capitalData = processedData.filter((row) =>
    row[6].toUpperCase().includes("MANAUS")
  );

  if (capitalData.length === 0) {
    alert("Nenhum dado encontrado para a cidade Manaus.");
    return;
  }

  // Adiciona os cabeçalhos à capitalData
  capitalData.unshift(processedData[0]);

  let ws = XLSX.utils.aoa_to_sheet(capitalData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Capital");

  const filename = `Laudos_Capital_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  let status = document.getElementById("status");
  status.textContent = "Arquivo Excel para a capital exportado com sucesso!";
  status.className = "success";
}

// Exporta apenas as linhas onde a cidade não é "Manaus"
function exportInteriorToExcel() {
  if (processedData.length === 0) {
    alert(
      "Nenhum dado processado. Por favor, processe os dados antes de exportar."
    );
    return;
  }

  // Filtra os dados para incluir apenas as linhas onde a cidade NÃO contém "MANAUS"
  let interiorData = processedData.filter(
    (row) => !row[6].toUpperCase().includes("MANAUS")
  );

  if (interiorData.length === 0) {
    alert("Nenhum dado encontrado fora da cidade Manaus.");
    return;
  }

  // Adiciona os cabeçalhos à interiorData
  interiorData.unshift(processedData[0]);

  let ws = XLSX.utils.aoa_to_sheet(interiorData);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Interior");

  const filename = `Laudos_Interior_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  let status = document.getElementById("status");
  status.textContent = "Arquivo Excel para o interior exportado com sucesso!";
  status.className = "success";
}

function parseDate(ddmmyyyy) {
  // Verifica se ddmmyyyy é uma string e possui o comprimento correto (8 caracteres para "ddmmyyyy")
  if (typeof ddmmyyyy !== "string" || ddmmyyyy.length !== 8) {
    console.error("Formato inválido de data:", ddmmyyyy);
    return null; // Retorna null em caso de formato inválido
  }

  const day = ddmmyyyy.slice(0, 2);
  const month = ddmmyyyy.slice(2, 4) - 1; // Subtrai 1, pois os meses no JavaScript começam em 0
  const year = ddmmyyyy.slice(4);

  return new Date(year, month, day);
}
s;
// Exporta apenas as licenças vigentes, onde a data final é maior ou igual à data atual
function exportLicencasVigentes() {
  if (processedData.length === 0) {
    alert(
      "Nenhum dado processado. Por favor, processe os dados antes de exportar."
    );
    return;
  }

  const today = new Date();
  const headerIndex = processedData[0].indexOf("data_fim_formatada");
  if (headerIndex === -1) {
    alert("Cabeçalho 'data_fim_formatada' não encontrado.");
    return;
  }

  // Filtra as linhas com data_fim_formatada >= hoje
  let licencasVigentes = processedData.filter((row, index) => {
    if (index === 0) return false; // Ignora cabeçalho
    const dataFim = new Date(row[headerIndex]); // Cria um objeto Date a partir de data_fim_formatada
    return dataFim >= today; // Verifica se a data é igual ou maior que hoje
  });

  if (licencasVigentes.length === 0) {
    alert("Nenhuma licença vigente encontrada.");
    return;
  }

  licencasVigentes.unshift(processedData[0]); // Adiciona cabeçalho

  let ws = XLSX.utils.aoa_to_sheet(licencasVigentes);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Licencas_Vigentes");

  const filename = "Licencas_Vigentes.xlsx"; // Nome fixo do arquivo
  XLSX.writeFile(wb, filename);

  let status = document.getElementById("status");
  status.textContent =
    "Arquivo Excel para licenças vigentes exportado com sucesso!";
  status.className = "success";
}

// Exporta apenas as licenças vencidas, onde a data final é menor que a data atual
function exportVencidas() {
  if (processedData.length === 0) {
    alert(
      "Nenhum dado processado. Por favor, processe os dados antes de exportar."
    );
    return;
  }

  const today = new Date();
  const headerIndex = processedData[0].indexOf("data_fim_formatada");
  if (headerIndex === -1) {
    alert("Cabeçalho 'data_fim_formatada' não encontrado.");
    return;
  }

  // Filtra as linhas com data_fim_formatada < hoje
  let licencasVencidas = processedData.filter((row, index) => {
    if (index === 0) return false; // Ignora cabeçalho
    const dataFim = new Date(row[headerIndex]); // Cria um objeto Date a partir de data_fim_formatada
    return dataFim < today; // Verifica se a data é menor que hoje
  });

  if (licencasVencidas.length === 0) {
    alert("Nenhuma licença vencida encontrada.");
    return;
  }

  licencasVencidas.unshift(processedData[0]); // Adiciona cabeçalho

  let ws = XLSX.utils.aoa_to_sheet(licencasVencidas);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Licencas_Vencidas");

  const filename = "Licencas_Vencidas.xlsx"; // Nome fixo do arquivo
  XLSX.writeFile(wb, filename);

  let status = document.getElementById("status");
  status.textContent =
    "Arquivo Excel para licenças vencidas exportado com sucesso!";
  status.className = "success";
}

window.onload = updateFilename;
