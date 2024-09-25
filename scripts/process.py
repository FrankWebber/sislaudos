from flask import Flask, request, jsonify
import pandas as pd
import os
import re

app = Flask(__name__)

@app.route('/processar', methods=['POST'])
def processar_laudo():
    # Receber o caminho do arquivo
    data = request.json
    file_path = data['filePath']
    
    # Ler o arquivo de texto
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # Processar o texto
    processed_data = process_text(raw_text)

    # Gerar arquivo Excel
    df = pd.DataFrame(processed_data[1:], columns=processed_data[0])  # Exclui o cabeçalho da lista
    output_file = os.path.join('uploads', 'laudo_processado.xlsx')
    df.to_excel(output_file, index=False)

    return jsonify({"file": 'laudo_processado.xlsx', "message": "Arquivo processado com sucesso."})

def process_text(text):
    processed_data = []
    entries = text.split("\n\n")  # Ajuste como necessário para separar os laudos

    # Adicionar cabeçalho à planilha
    header = ["Nome_Servidor", "Matrícula", "Digito", "Letra", "Lotado", "Cargo", "Cidade", "Telefone", 
              "Dia_Laudo", "Mes_Laudo", "Ano_Laudo", "LAUDO MÉDICO N°", "Ano", "Dias", "Dia_Ini", 
              "Mes_Ini", "Ano_Ini", "Dia_Fim", "Mes_Fim", "Ano_Fim", "CID", "Tipo", "Reexaminar", 
              "Reassumir", "Prorrogação"]
    processed_data.append(header)

    for entry in entries:
        # Inicializar linha de dados
        row = ["" for _ in range(len(header))]  # Cria uma linha vazia com o tamanho do cabeçalho

        # Extrair Matrícula
        matricula_match = re.search(r'matrícula\s*(?:n°)?\s*(\d+)(?:-(\d)([A-Za-z])?)?', entry, re.IGNORECASE)
        if matricula_match:
            row[1] = matricula_match.group(1)  # Matrícula
            row[2] = matricula_match.group(2) if matricula_match.group(2) else ""  # Dígito
            row[3] = matricula_match.group(3) if matricula_match.group(3) else ""  # Letra

        # Extrair Nome
        nome_match = re.search(r'servidor\(a\)\s+(.+?)(?=\s+CPF:)', entry, re.IGNORECASE)
        row[0] = nome_match.group(1).strip() if nome_match else ""

        # Extrair Cargo
        cargo_match = re.search(r'Cargo de:\s+(.+?)(?=\n)', entry, re.IGNORECASE)
        row[4] = cargo_match.group(1).strip() if cargo_match else ""

        # Extrair Dias
        dias_match = re.search(r'Por\s+(\d+)\s+dias', entry, re.IGNORECASE)
        row[13] = dias_match.group(1) if dias_match else ""

        # Extrair Cidade
        cidade_match = re.search(r'cidade:\s+(.+?)(?=\/|\n)', entry, re.IGNORECASE)
        row[6] = cidade_match.group(1).strip() if cidade_match else ""

        # Extrair Número do Laudo
        laudo_match = re.search(r'LAUDO MÉDICO N°\s+(\d+)', entry, re.IGNORECASE)
        row[11] = laudo_match.group(1) if laudo_match else ""

        # Extrair Período de Data
        periodo_match = re.search(r'(\d{2}/\d{2}/\d{4})\s+(?:à|a)\s+(\d{2}/\d{2}/\d{4})', entry)
        if periodo_match:
            dia_ini, dia_fim = periodo_match.group(1).split('/')
            row[14], row[15], row[16] = dia_ini, dia_fim, periodo_match.group(2)  # Data Fim
        else:
            row[14], row[15], row[16] = "", "", ""  # Data Início e Fim vazias

        # Extrair CID
        cid_match = re.search(r'CID\s+([A-Z0-9.,\s]+)', entry, re.IGNORECASE)
        row[19] = cid_match.group(1).strip() if cid_match else ""

        # Determinar Tipo baseado no CID
        if row[19] == "Z76.3":
            row[20] = 24  # Motivo
        elif row[19] == "Z39.2":
            row[20] = 4  # Motivo
        else:
            row[20] = 1  # Motivo

        # Se a linha tiver dados relevantes, adiciona ao processed_data
        if any(row):  # Se alguma coluna tiver dado relevante
            processed_data.append(row)

    return processed_data

if __name__ == '__main__':
    app.run(port=5000)
