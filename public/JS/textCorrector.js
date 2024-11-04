function text_cleaner() {
    const textarea = document.getElementById("dataInput");
    let text = textarea.value;

    // Expressão regular para encontrar a matrícula, com ou sem formatação
    text = text.replace(/(matr[íi]cula\s*n[ºo°]?\s*[^\d]*)(\d{3})\.?(\d{3})-?(\d)([A-Z]?)/gi, function (match, prefix, part1, part2, part3, letter) {
        // Formata a matrícula no padrão 000.000-0A
        return `${prefix}${part1}.${part2}-${part3}${letter || ''}`;
    });

    // Atualiza o conteúdo do textarea com o texto formatado
    textarea.value = text;

    // Atualiza a interface para confirmar a ação
    const status = document.getElementById("status");
    status.textContent = "Texto formatado com sucesso!";
}
