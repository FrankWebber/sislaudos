from flask import Flask, request, jsonify
import re

app = Flask(__name__)

@app.route('/processar', methods=['POST'])
def processar_laudo():
    data = request.json

    # Verificar se os dados foram enviados
    if 'data' not in data:
        return jsonify({'success': False, 'message': 'Nenhum dado enviado.'}), 400
    
    # Obter os dados enviados
    editable_data = data['data']

    # Processar os dados editáveis
    laudos_sucesso = []
    laudos_erro = []

    # Definir os headers/colunas para os dados
    header = [
        "nome1", "matricula2", "digito3", "letra4", "lotado5", "cargo6", "cidade7", "telefone8",
        "dia_Laudo9", "mes_Laudo10", "ano_Laudo11", "laudo_medico_n12", "período_licença13",
        "dia_inicio14", "mes_inicio15", "ano_inicio16", "dia_fim17", "mes_fim18", "ano_fim19", 
        "cid20", "tipo21", "motivo22", "data_final_unificada23", "reexaminar24", "reassumir25", "prorrogacao26"
    ]

    # Processar cada entrada editável
    for entry in editable_data:
        row = entry  # Use a linha editável diretamente
        laudos_sucesso.append(row)

    # Retornar os laudos processados
    return jsonify({
        'laudos_sucesso': laudos_sucesso,
        'laudos_erro': laudos_erro
    })

if __name__ == '__main__':
    app.run(port=5000)
