const modal = document.getElementById("meuModal");
const btnAbrir = document.getElementById("btnAbrir");

function abrirModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");

  const firstFocusable = modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  firstFocusable?.focus();
}

function fecharModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");

  btnAbrir.focus();
}

btnAbrir.addEventListener("click", abrirModal);

modal.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) {
    fecharModal();
  }
});


document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) {
    fecharModal();
  }
});

function abrirModalEdicao(botao) {
    const modal = document.getElementById('modalEditar');
    
    // Pega os dados
    document.getElementById('edit_id').value = botao.getAttribute('data-id');
    document.getElementById('edit_nome').value = botao.getAttribute('data-nome');
    document.getElementById('edit_capacidade').value = botao.getAttribute('data-capacidade');

    // Abre o modal adicionando a classe
    modal.classList.add('is-open');
    document.body.classList.add('no-scroll');
}

function fecharModalEdicao() {
    const modal = document.getElementById('modalEditar');
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
}

// Aproveite e ajuste o modal de CRIAR para usar o mesmo padrão:
document.getElementById('btnAbrir').addEventListener('click', () => {
    document.getElementById('meuModal').classList.add('is-open');
});

// Fechar ao clicar no fechar do modal de criar
document.querySelectorAll('[data-close]').forEach(button => {
    button.addEventListener('click', () => {
        document.getElementById('meuModal').classList.remove('is-open');
        document.getElementById('modalEditar').classList.remove('is-open');
    });
});

function abrirModalExcluir(botao) {
    const modal = document.getElementById('modalExcluir');
    const id = botao.getAttribute('data-id');
    const nome = botao.getAttribute('data-nome');

    document.getElementById('delete_id').value = id;
    document.getElementById('nomeSalaExcluir').innerText = nome;

    modal.classList.add('is-open');
    document.body.classList.add('no-scroll');
}

function fecharModalExcluir() {
    const modal = document.getElementById('modalExcluir');
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
}