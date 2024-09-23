from flask import Flask, request, jsonify
import pandas as pd
import os

app = Flask(__name__)

@app.route('/processar', methods=['POST'])
def processar_laudo():
    # Receber o caminho do arquivo
    data = request.json
    file_path = data['filePath']
    
    # Ler o arquivo de texto
    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text = f.read()

    # Processar o texto (mesma lógica do código que você forneceu)
    processed_data = process_text(raw_text)

    # Gerar arquivo Excel
    df = pd.DataFrame(processed_data)
    output_file = os.path.join('uploads', 'laudo_processado.xlsx')
    df.to_excel(output_file, index=False)

    return jsonify({"file": 'laudo_processado.xlsx'})

def process_text(text):
    # Função que processa o texto, extraindo os dados e retornando uma lista de listas
    # Adapte conforme necessário
    processed_data = []
    entries = text.split("\n")  # Simples exemplo de processamento

    for entry in entries:
        # Exemplo simples: separando os dados em colunas
        row = entry.split()
        processed_data.append(row)
    
    return processed_data

if __name__ == '__main__':
    app.run(port=5000)
