document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("fileInput");
  const correctTextButton = document.querySelector(".btn_correctText");
  const actionButtons = document.querySelectorAll(
    ".button-group button:not(.btn_correctText)"
  );

  // Função para desabilitar todos os botões, exceto o de correção de texto
  function disableButtons() {
    actionButtons.forEach((button) => {
      button.disabled = true;
    });
    correctTextButton.disabled = false;
    console.log("Botões desabilitados, exceto o botão de correção de texto."); // Log para verificação
  }

  // Função para habilitar todos os botões
  function enableButtons() {
    actionButtons.forEach((button) => {
      button.disabled = false;
    });
    console.log("Todos os botões foram habilitados."); // Log para verificação
  }

  // Desabilitar botões ao carregar um arquivo
  fileInput.addEventListener("change", function () {
    console.log("Arquivo carregado, desabilitando botões..."); // Log para verificação
    disableButtons();
  });

  // Habilitar botões ao clicar no botão de correção de texto
  correctTextButton.addEventListener("click", function () {
    console.log("Botão de correção de texto clicado, habilitando botões..."); // Log para verificação
    enableButtons();
  });
});
