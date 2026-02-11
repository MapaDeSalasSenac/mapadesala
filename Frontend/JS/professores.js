const modal = document.getElementById("meuModal");
const btnAbrir = document.getElementById("btnAbrir");

// Máscara/validação usam esse input
const inputTel = document.getElementById('inputTel');

// =========================
// VALIDAÇÃO (duplicidade) + UX (desabilitar salvar)
// =========================
const formProfessor = modal?.querySelector('form');
const inputNome = document.getElementById('nomeProfessor');
const inputEmail = document.getElementById('inputEmail');
const inputIdProfessor = document.getElementById('idProfessor');
const btnSalvarProfessor = document.getElementById('btnSalvarProfessor');
const msgErroProfessor = document.getElementById('msgErroProfessor');

function onlyDigits(v) {
  return (v || '').toString().replace(/\D/g, '');
}

function normText(v) {
  return (v || '').toString().trim().toLowerCase();
}

function listarProfessoresExistentes() {
  return Array.from(document.querySelectorAll('.card[data-id]')).map((card) => {
    return {
      id: (card.dataset.id || '').toString(),
      nome: normText(card.dataset.nome || ''),
      email: normText(card.dataset.email || ''),
      tel: onlyDigits(card.dataset.telefone || ''),
    };
  });
}

function setErroProfessor(msg) {
  if (!msgErroProfessor || !btnSalvarProfessor) return;
  const temErro = !!(msg && msg.trim());
  msgErroProfessor.textContent = temErro ? msg : '';
  msgErroProfessor.classList.toggle('ativo', temErro);
  btnSalvarProfessor.disabled = temErro;
  btnSalvarProfessor.classList.toggle('desabilitado', temErro);
}

function validarDuplicidadeProfessor() {
  // Se os elementos não existirem (página quebrada), não faz nada
  if (!inputNome || !inputEmail || !inputTel || !btnSalvarProfessor) return;

  const idAtual = (inputIdProfessor?.value || '').toString();
  const nome = normText(inputNome.value);
  const email = normText(inputEmail.value);
  const tel = onlyDigits(inputTel.value);

  const existentes = listarProfessoresExistentes().filter(p => p.id !== idAtual);

  // Prioridade: telefone -> email -> nome (porque telefone é mais “único” e dá menos ambiguidade)
  if (tel && existentes.some(p => p.tel && p.tel === tel)) {
    setErroProfessor('Já existe alguém cadastrado com esse número de celular.');
    return;
  }
  if (email && existentes.some(p => p.email && p.email === email)) {
    setErroProfessor('Já existe alguém cadastrado com esse email.');
    return;
  }
  if (nome && existentes.some(p => p.nome && p.nome === nome)) {
    setErroProfessor('Já existe alguém cadastrado com esse nome.');
    return;
  }

  setErroProfessor('');
}


// Máscara: (99) 9 9999-9999
function formatCel(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 11);
  const ddd = digits.slice(0, 2);
  const n9  = digits.slice(2, 3);
  const p1  = digits.slice(3, 7);
  const p2  = digits.slice(7, 11);

  let out = '';
  if (ddd) out += '(' + ddd;
  if (ddd.length === 2) out += ') ';
  if (n9) out += n9 + ' ';
  if (p1) out += p1;
  if (p2) out += '-' + p2;
  return out.trimEnd();
}

if (inputTel) {
  inputTel.addEventListener('input', (e) => {
    const start = inputTel.selectionStart;
    const before = inputTel.value;
    const formatted = formatCel(before);
    inputTel.value = formatted;
    // tenta manter cursor razoável
    const diff = formatted.length - before.length;
    inputTel.setSelectionRange((start ?? formatted.length) + diff, (start ?? formatted.length) + diff);
  });
}

// Revalida enquanto o usuário digita
[inputNome, inputEmail, inputTel].forEach((el) => {
  if (!el) return;
  el.addEventListener('input', validarDuplicidadeProfessor);
  el.addEventListener('blur', validarDuplicidadeProfessor);
});

// Não deixa enviar se o botão estiver desabilitado (UX)
formProfessor?.addEventListener('submit', (e) => {
  validarDuplicidadeProfessor();
  if (btnSalvarProfessor?.disabled) {
    e.preventDefault();
    // garante que a mensagem esteja visível
    msgErroProfessor?.classList.add('ativo');
  }
});

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
  setErroProfessor('');
  // garante botão habilitado no modo criar
  if (btnSalvarProfessor) btnSalvarProfessor.disabled = false;
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

  // revalida no modo editar (ignora o próprio ID)
  setErroProfessor('');
  if (btnSalvarProfessor) btnSalvarProfessor.disabled = false;
  validarDuplicidadeProfessor();

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

// =========================
// FILTROS (modal padrão - páginas administrativas)
// =========================
(() => {
  const pagina = 'professores';
  const lista = document.getElementById('listaProfessores');
  if (!lista) return;

  let overlay = null;
  let estado = { q: '' };

  function getCards() {
    return Array.from(lista.querySelectorAll('.card'));
  }

  function aplicarFiltros() {
    const q = (estado.q || '').trim().toLowerCase();
    const cards = getCards();
    cards.forEach((card) => {
      const hay = (card.innerText || '').toLowerCase();
      const ok = !q || hay.includes(q);
      card.style.display = ok ? '' : 'none';
    });
  }

  function criarOverlay() {
    // Usa o modal "namespaced" de filtros (evita conflito com .modal das páginas)
    const el = document.createElement('div');
    el.className = 'sobreposicao-modal-filtros';
    el.setAttribute('role', 'presentation');
    el.innerHTML = `
      <div class="modal-filtros" role="dialog" aria-modal="true" aria-label="Filtros">
        <div class="cabecalho-modal">
          <div class="titulo-modal">Filtros</div>
          <button type="button" class="fechar-modal" data-acao="fechar" aria-label="Fechar">×</button>
        </div>
        <div class="corpo-modal">
          <div class="campo">
            <div class="rotulo">Buscar</div>
            <input class="entrada" id="filtroTexto" placeholder="Nome, formação, turma, email..." />
          </div>
          <div class="linha-acoes">
            <button type="button" class="botao-secundario" data-acao="limpar">Limpar</button>
            <button type="button" class="botao-primario" data-acao="aplicar">Aplicar</button>
          </div>
        </div>
      </div>
    `;

    // clique fora fecha
    el.addEventListener('click', (e) => {
      if (e.target === el) fechar();
      const acao = e.target.closest('[data-acao]')?.dataset.acao;
      if (!acao) return;
      if (acao === 'fechar') fechar();
      if (acao === 'limpar') {
        estado.q = '';
        const inp = el.querySelector('#filtroTexto');
        if (inp) inp.value = '';
        aplicarFiltros();
      }
      if (acao === 'aplicar') {
        const inp = el.querySelector('#filtroTexto');
        estado.q = inp?.value || '';
        aplicarFiltros();
        fechar();
      }
    });

    // enter aplica
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fechar();
      if (e.key === 'Enter') {
        const inp = el.querySelector('#filtroTexto');
        estado.q = inp?.value || '';
        aplicarFiltros();
        fechar();
      }
    });

    document.body.appendChild(el);
    return el;
  }

  function abrir() {
    if (!overlay) overlay = criarOverlay();
    overlay.classList.add('aberto');
    const inp = overlay.querySelector('#filtroTexto');
    if (inp) {
      inp.value = estado.q || '';
      setTimeout(() => inp.focus(), 0);
    }
  }

  function fechar() {
    overlay?.classList.remove('aberto');
  }

  window.addEventListener('app:abrir-filtros', (e) => {
    if (e?.detail?.pagina !== pagina) return;
    abrir();
  });
})();

// Se o PHP devolveu erro (ex.: tentou salvar duplicado),
// mostra a mensagem no próprio modal e impede novo envio até ajustar.
document.addEventListener('DOMContentLoaded', () => {
  const msg = (window.__PROF_ERRO__ || '').toString().trim();
  if (!msg) return;
  // abre o modal em modo "cadastrar" (o usuário pode corrigir e salvar)
  setErroProfessor(msg);
  abrirModal();
});