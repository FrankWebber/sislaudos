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
    result = process_text(raw_text)

    return jsonify(result)

def process_text(text):
    laudos_sucesso = []
    laudos_erro = []
    
    entries = text.split("\n\n")
    header = ["Nome_Servidor", "Matrícula", "Dígito", "Letra", "Lotado", "Cargo", "Cidade", "Telefone", 
              "Dia_Laudo", "Mes_Laudo", "Ano_Laudo", "LAUDO MÉDICO N°", "Período_Licença", 
              "Dia_Inicio", "Mes_Inicio", "Ano_Inicio", "Dia_Fim", "Mes_Fim", "Ano_Fim", "CID", "Tipo", "Motivo"]

    for entry in entries:
        row = ["" for _ in range(len(header))]
        erro = False
        
        # Extração dos campos
        matricula_match = re.search(r'matrícula\s*n°?\s*(\d{1,3}(?:\.\d{3})*)-(\d)([A-Za-z])?', entry, re.IGNORECASE)
        if matricula_match:
            row[1] = matricula_match.group(1).replace('.', '')  # Remover pontos
            row[2] = matricula_match.group(2) if matricula_match.group(2) else ""
            row[3] = matricula_match.group(3) if matricula_match.group(3) else ""
        else:
            erro = True

        nome_match = re.search(r'servidor\(a\)\s+(.+?)(?=\s+CPF:)', entry, re.IGNORECASE)
        row[0] = nome_match.group(1).strip() if nome_match else ""
        if not nome_match:
            erro = True

        cargo_match = re.search(r'Cargo de:\s+(.+?)(?=\n)', entry, re.IGNORECASE)
        row[4] = cargo_match.group(1).strip() if cargo_match else ""
        if not cargo_match:
            erro = True

        cidade_match = re.search(r'cidade:\s+(.+?)(?=\/|\n)', entry, re.IGNORECASE)
        row[6] = cidade_match.group(1).strip() if cidade_match else ""
        if not cidade_match:
            erro = True

        telefone_match = re.search(r'telefone:\s+(.+?)(?=\n)', entry, re.IGNORECASE)
        row[7] = telefone_match.group(1).strip() if telefone_match else ""
        if not telefone_match:
            erro = True

        # Lógica de extração para a data do laudo
        data_laudo_match = re.search(r'Data\s+(\d{2})\/(\d{2})\/(\d{4})', entry)
        if data_laudo_match:
            row[8] = data_laudo_match.group(1)  # Dia
            row[9] = data_laudo_match.group(2)  # Mês
            row[10] = data_laudo_match.group(3)  # Ano
        else:
            erro = True

        # Extração do número do laudo médico
        laudo_match = re.search(r'LAUDO MÉDICO N°\s+(\d+\/\d+)', entry)
        row[11] = laudo_match.group(1) if laudo_match else ""

        # Extração do período de licença
        periodo_match = re.search(r'Por\s+(\d+)\s+dias\s+(\d{2})\/(\d{2})\/(\d{4})\s+(?:à|a)\s+(\d{2})\/(\d{2})\/(\d{4})', entry)
        if periodo_match:
            row[12] = periodo_match.group(1)  # Número de dias
            row[13] = periodo_match.group(2)  # Dia_Inicio
            row[14] = periodo_match.group(3)  # Mês_Inicio
            row[15] = periodo_match.group(4)  # Ano_Inicio
            row[16] = periodo_match.group(5)  # Dia_Fim
            row[17] = periodo_match.group(6)  # Mês_Fim
            row[18] = periodo_match.group(7)  # Ano_Fim
        else:
            erro = True

        # Extração do CID
        cid_match = re.search(r'CID\s+([A-Z0-9.,\s]+)', entry)
        row[19] = cid_match.group(1).strip() if cid_match else ""

        # Definir o motivo baseado no CID
        if row[19] == "Z39.2":
            row[20] = 4  # Motivo para Z39.2 LICENÇA MATERNIDADE
        elif row[19] == "Z76.3":
            row[20] = 24  # Motivo para Z76.3 LICENÇA SAÚDE PARA ACOMPANHAR PESSOA DA FAMILIA HOSPITALIZADA 
        else:
            row[20] = 1  # Para qualquer outro CID

        # Se houver qualquer erro de extração, adiciona aos laudos com erro
        if erro:
            laudos_erro.append(row)
        else:
            laudos_sucesso.append(row)

    return laudos_sucesso, laudos_erro

if __name__ == '__main__':
    app.run(port=5000)
