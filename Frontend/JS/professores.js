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

btnAbrir.addEventListener("click", () => {
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Cadastrar Professor";

  const inputId = document.getElementById("idProfessor");
  if (inputId) inputId.value = "";

  modal.querySelector("form")?.reset();
  abrirModal();
});


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
document.addEventListener("click", (e) => {
  const btnEdit = e.target.closest(".btn-edit");
  if (!btnEdit) return;

  const card = btnEdit.closest(".card");
  if (!card) return;

  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Editar Professor";

  const inputId = document.getElementById("idProfessor");
  if (inputId) inputId.value = card.dataset.id || "";

  document.getElementById("nomeProfessor").value = card.dataset.nome || "";
  document.getElementById("inputFormacao").value = card.dataset.formacao || "";
  document.getElementById("inputTel").value = card.dataset.telefone || "";
  document.getElementById("inputEmail").value = card.dataset.email || "";
  document.getElementById("inputCompl").value = card.dataset.cursos || "";

  abrirModal(); // usa a função padrão (no-scroll + focus)
});
// =========================
// EXCLUIR PROFESSOR
// =========================
const modalExcluir = document.getElementById("modalExcluir");

function abrirModalExcluir({ id, nome }) {
  if (!modalExcluir) return;

  document.getElementById("delete_prof_id").value = id || "";
  document.getElementById("nomeProfessorExcluir").textContent = nome || "—";

  modalExcluir.classList.add("is-open");
  modalExcluir.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}

function fecharModalExcluir() {
  if (!modalExcluir) return;

  modalExcluir.classList.remove("is-open");
  modalExcluir.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

// clique no botão delete do card
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-delete");
  if (!btn) return;

  abrirModalExcluir({
    id: btn.dataset.id,
    nome: btn.dataset.nome,
  });
});

// fechar modal excluir por backdrop/X/cancelar
modalExcluir?.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-excluir]")) fecharModalExcluir();
});

// ESC fecha também
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalExcluir?.classList.contains("is-open")) {
    fecharModalExcluir();
  }
});
