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

// === Helpers (usados em criar + editar) ===
const mapDay = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, dom: 7 };
function fmtISO(d) { return d.toISOString().slice(0, 10); }
function jsDayToISOWeekday(d) { return ((d.getDay() + 6) % 7) + 1; } // 1..7


  const elPreview = document.getElementById('preview');
  const form = document.getElementById('formTurma');

  function getCheckedDays() {
    return Array.from(document.querySelectorAll('input[name="dias_semana[]"]:checked'))
      .map(i => i.value);
  }

  function gerarDatasPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados }) {
    const horasPorEncontro = (turno === 'noite') ? 3 : 4;
    const totalEncontros = Math.ceil(cargaHoraria / horasPorEncontro);

    const diasSet = new Set(diasSelecionados.map(d => mapDay[d]).filter(Boolean));
    const datas = [];

    // segurança
    const maxDias = 366 * 3;
    let tentativas = 0;

    let d = new Date(inicioISO + "T00:00:00");
    while (datas.length < totalEncontros) {
      if (++tentativas > maxDias) throw new Error("Não consegui gerar datas (verifique dias/data início).");

      const weekday = jsDayToISOWeekday(d);
      if (diasSet.has(weekday)) datas.push(fmtISO(d));
      d.setDate(d.getDate() + 1);
    }

    const horasUltimo = cargaHoraria - ((totalEncontros - 1) * horasPorEncontro);

    return { datas, horasPorEncontro, totalEncontros, horasUltimo };
  }

  async function verificarConflitos({ id_sala, id_professor, turno, datas }) {
    const res = await fetch('../PHP/verificar_conflitos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala, id_professor, turno, datas })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok === false) {
      throw new Error(json?.error || "Falha ao verificar conflitos.");
    }
    return json;
  }

  function renderPreview({ cargaHoraria, turno, datas, horasPorEncontro, horasUltimo, conflitos_professor, conflitos_sala }) {
    const setProf = new Set(conflitos_professor || []);
    const setSala = new Set(conflitos_sala || []);

    const total = datas.length;
    const primeira = datas[0];
    const ultima = datas[datas.length - 1];

    const hasProf = setProf.size > 0;
    const hasSala = setSala.size > 0;
    const hasConflito = hasProf || hasSala;

    const avisoUltimo = (horasUltimo < horasPorEncontro)
      ? `<div style="margin-top:8px;color:#b00;font-weight:800;">
           ⚠️ Último encontro terá ${horasUltimo}h (não fecha ${horasPorEncontro}h certinho).
         </div>`
      : '';

    const badge = hasConflito
      ? `<div style="color:#b00;font-weight:900;">❌ Existem conflitos. Ajuste antes de salvar.</div>`
      : `<div style="color:#070;font-weight:900;">✅ Sem conflitos detectados.</div>`;
    const obsSala = `<div style="margin-top:6px;"><b>Sala:</b> será reservada.</div>`;

    // lista com marcação por dia
    const linhas = datas.map(dt => {
      const tags = [];
      if (setProf.has(dt)) tags.push(`<span style="color:#b00;font-weight:800;">PROF</span>`);
      if (setSala.has(dt)) tags.push(`<span style="color:#b00;font-weight:800;">SALA</span>`);
      const tagStr = tags.length ? ` - ${tags.join(" / ")}` : "";
      const cor = tags.length ? "#b00" : "#111";
      return `<div style="color:${cor};">${dt}${tagStr}</div>`;
    }).join("");

    elPreview.innerHTML = `
      ${badge}
      <div style="margin-top:6px;"><b>Carga horária:</b> ${cargaHoraria}h</div>
      <div><b>Turno:</b> ${turno} | <b>Horas por encontro:</b> ${horasPorEncontro}h | <b>Encontros:</b> ${total}</div>
      <div><b>Primeiro:</b> ${primeira} | <b>Último:</b> ${ultima}</div>
      ${obsSala}
      ${avisoUltimo}

    `;

    // Bloqueia submit se tiver conflito
    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = hasConflito;
  }

  async function atualizarPreview() {
    const inicioISO = document.getElementById('data_inicio')?.value;
    const cargaHoraria = parseInt(document.getElementById('carga_horaria')?.value || '0', 10);
    const turno = document.getElementById('turno')?.value;
    const diasSelecionados = getCheckedDays();
    const id_sala = document.getElementById('id_sala')?.value || "";
    const id_professor = document.getElementById('id_professor')?.value || "";

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) btnSubmit.disabled = true;

    if (!inicioISO || !cargaHoraria || !turno || diasSelecionados.length === 0 || !id_professor) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:800;">
        Preencha: professor, data início, carga horária, turno e dias da semana.
      </span>`;
      return;
    }

    if (!id_sala) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:800;">
        Selecione uma sala.
      </span>`;
      return;
    }

    try {
      const cal = gerarDatasPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados });
      const conf = await verificarConflitos({
        id_sala,
        id_professor,
        turno,
        datas: cal.datas
      });

      renderPreview({
        cargaHoraria,
        turno,
        datas: cal.datas,
        horasPorEncontro: cal.horasPorEncontro,
        horasUltimo: cal.horasUltimo,
        conflitos_professor: conf.conflitos_professor,
        conflitos_sala: conf.conflitos_sala
      });

    } catch (err) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:800;">
        Erro: ${String(err.message || err)}
      </span>`;
    }
  }

  // Botão preview (se você tiver)
  document.getElementById('btnPreview')?.addEventListener('click', atualizarPreview);

  // Atualiza sozinho ao mexer
  document.addEventListener('input', (e) => {
    if (
      e.target.id === 'data_inicio' ||
      e.target.id === 'carga_horaria' ||
      e.target.id === 'turno' ||
      e.target.id === 'id_sala' ||
      e.target.id === 'id_professor' ||
      e.target.name === 'dias_semana[]'
    ) {
      atualizarPreview();
    }
  });

  // No submit, força rodar preview antes (segurança UX)
  form?.addEventListener('submit', async (e) => {
    await atualizarPreview();
    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit?.disabled) {
      e.preventDefault();
      alert("Existe conflito de agenda. Ajuste antes de salvar.");
    }
  });

// ========== MODAL DE EDIÇÃO - VERSÃO SIMPLES SEM AJAX ==========
const modalEditar = document.getElementById("modalEditar");

function getCheckedDaysIn(containerSelector) {
  return Array.from(document.querySelectorAll(`${containerSelector} input[name="dias_semana[]"]:checked`)).map(i => i.value);
}

async function carregarDiasTurmaParaEdicao(idTurma) {
  // Lê bitmask do backend e marca checkboxes do modalEditar
  try {
    const resp = await fetch(`../PHP/carregar_dias_turma.php?id_turma=${encodeURIComponent(idTurma)}`, { credentials: 'same-origin' });
    if (!resp.ok) return;
    const data = await resp.json().catch(() => null);
    if (!data || !data.success) return;

    const mask = Number(data.dias_semana || 0);
    const dias = [];
    if (mask & 1) dias.push('seg');
    if (mask & 2) dias.push('ter');
    if (mask & 4) dias.push('qua');
    if (mask & 8) dias.push('qui');
    if (mask & 16) dias.push('sex');

    document.querySelectorAll('#modalEditar input[name="dias_semana[]"]').forEach(cb => {
      cb.checked = dias.includes(cb.value);
    });
  } catch {
    // silencioso
  }
}

function abrirModalEditar(btnElement) {
    console.log("Abrindo modal com dados do botão:", btnElement);
    
    // Pega os dados dos atributos data-*
    const dados = {
        id: btnElement.getAttribute('data-id'),
        nome: btnElement.getAttribute('data-nome'),
        codigo: btnElement.getAttribute('data-codigo'),
        carga: btnElement.getAttribute('data-carga'),
        turno: btnElement.getAttribute('data-turno'),
        professor: btnElement.getAttribute('data-professor'),
        sala: btnElement.getAttribute('data-sala'),    };
    
    console.log("Dados capturados:", dados);
    
    // Preenche os campos do formulário
    document.getElementById('edit_id_turma').value = dados.id;
    document.getElementById('edit_nome_turma').value = dados.nome;
    document.getElementById('edit_cod_turma').value = dados.codigo;
    document.getElementById('edit_carga_horaria').value = dados.carga;
    document.getElementById('edit_turno').value = dados.turno;
    
    // Professor (trata vazio)
    document.getElementById('edit_id_professor').value = dados.professor || '';
    
    // Sala (trata vazio)
    document.getElementById('edit_id_sala').value = dados.sala || '';
    
    // Data de recálculo (padrão: hoje)
    const hoje = new Date().toISOString().slice(0, 10);
    const inputDataRecalculo = document.querySelector('#modalEditar input[name="data_recalculo"]');
    if (inputDataRecalculo) {
        inputDataRecalculo.value = hoje;
    }
    
    // Limpa e depois carrega os dias atuais da turma
    document.querySelectorAll('#modalEditar input[name="dias_semana[]"]').forEach(cb => {
        cb.checked = false;
    });
    carregarDiasTurmaParaEdicao(dados.id);
    
    // Abre o modal
    modalEditar.classList.add("is-open");
    modalEditar.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");

    // Carrega dias atuais da turma (bitmask) pra deixar o modal consistente
    if (dados.id) carregarDiasTurmaParaEdicao(dados.id);
    
    // Foca no primeiro campo
    const firstInput = modalEditar.querySelector('input, select');
    if (firstInput) firstInput.focus();
}

function fecharModalEditar() {
    modalEditar.classList.remove("is-open");
    modalEditar.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");

    // limpa preview
    const pv = document.getElementById('previewEditar');
    if (pv) pv.innerHTML = '';
}

async function verificarConflitosEdicao({ id_turma, id_sala, id_professor, turno, datas }) {
  const res = await fetch('../PHP/verificar_conflitos_edicao.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_turma, id_sala, id_professor, turno, datas })
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.ok === false) {
    throw new Error(json?.error || 'Falha ao verificar conflitos (edição).');
  }
  return json;
}

function renderPreviewEditar({ cargaHoraria, turno, datas, horasPorEncontro, horasUltimo, conflitos_professor, conflitos_sala }) {
  const el = document.getElementById('previewEditar');
  if (!el) return;

  const setProf = new Set(conflitos_professor || []);
  const setSala = new Set(conflitos_sala || []);
  const hasProf = setProf.size > 0;
  const hasSala = setSala.size > 0;
  const hasConflito = hasProf || hasSala;

  const badge = hasConflito
    ? `<div class="preview-badge preview-badge--error">❌ Conflitos detectados. Ajuste antes de salvar.</div>`
    : `<div class="preview-badge preview-badge--ok">✅ Sem conflitos detectados.</div>`;

  const avisoUltimo = (horasUltimo < horasPorEncontro)
    ? `<div class="preview-warn">⚠️ Último encontro terá ${horasUltimo}h (não fecha ${horasPorEncontro}h certinho).</div>`
    : '';

  const linhas = datas.map(dt => {
    const tags = [];
    if (setProf.has(dt)) tags.push('Professor');
    if (setSala.has(dt)) tags.push('Sala');
    const t = tags.length ? ` <span class="preview-tags">(${tags.join(' + ')})</span>` : '';
    return `<div class="preview-linha ${tags.length ? 'is-conflito' : ''}">${dt}${t}</div>`;
  }).join('');

  el.innerHTML = `
    ${badge}
    <div class="preview-meta">
      <div><b>Carga horária:</b> ${cargaHoraria}h</div>
      <div><b>Turno:</b> ${turno} | <b>Horas/encontro:</b> ${horasPorEncontro}h | <b>Encontros:</b> ${datas.length}</div>
      <div><b>Primeiro:</b> ${datas[0]} | <b>Último:</b> ${datas[datas.length - 1]}</div>
      ${avisoUltimo}
    </div>
    <div class="preview-lista">${linhas}</div>
  `;

  const formEditar = document.getElementById('formEditarTurma');
  const btnSubmit = formEditar?.querySelector('button[type="submit"]');
  if (btnSubmit) btnSubmit.disabled = hasConflito;
}

async function atualizarPreviewEditar() {
  const el = document.getElementById('previewEditar');
  const formEditar = document.getElementById('formEditarTurma');
  if (!el || !formEditar) return;

  const id_turma = document.getElementById('edit_id_turma')?.value;
  const inicioISO = document.getElementById('edit_data_recalculo')?.value;
  const cargaHoraria = parseInt(document.getElementById('edit_carga_horaria')?.value || '0', 10);
  const turno = document.getElementById('edit_turno')?.value;
  const diasSelecionados = getCheckedDaysIn('#modalEditar');
  const id_sala = document.getElementById('edit_id_sala')?.value || '';
  const id_professor = document.getElementById('edit_id_professor')?.value || '';

  const btnSubmit = formEditar.querySelector('button[type="submit"]');
  if (btnSubmit) btnSubmit.disabled = true;

  if (!id_turma || !inicioISO || !cargaHoraria || !turno || diasSelecionados.length === 0 || !id_sala) {
    el.innerHTML = `<div class="preview-badge preview-badge--error">Preencha: data de recálculo, carga horária, turno, dias da semana e sala.</div>`;
    return;
  }

  try {
    const cal = gerarDatasPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados });
    const conf = await verificarConflitosEdicao({
      id_turma: parseInt(id_turma, 10),
      id_sala,
      id_professor,
      turno,
      datas: cal.datas
    });

    renderPreviewEditar({
      cargaHoraria,
      turno,
      datas: cal.datas,
      horasPorEncontro: cal.horasPorEncontro,
      horasUltimo: cal.horasUltimo,
      conflitos_professor: conf.conflitos_professor,
      conflitos_sala: conf.conflitos_sala
    });
  } catch (err) {
    el.innerHTML = `<div class="preview-badge preview-badge--error">Erro: ${String(err.message || err)}</div>`;
  }
}

// Botão Cancelar do modal editar
document.getElementById('btnCancelarEditar')?.addEventListener('click', fecharModalEditar);

// Botão Pré-visualizar (edição)
document.getElementById('btnPreviewEditar')?.addEventListener('click', atualizarPreviewEditar);

// Atualiza preview enquanto o usuário mexe (edição)
document.getElementById('modalEditar')?.addEventListener('input', (e) => {
  if (
    ['edit_data_recalculo', 'edit_carga_horaria', 'edit_turno', 'edit_id_sala', 'edit_id_professor'].includes(e.target.id) ||
    e.target.name === 'dias_semana[]'
  ) {
    atualizarPreviewEditar();
  }
});

// Bloqueia submit se tiver conflito (edição)
document.getElementById('formEditarTurma')?.addEventListener('submit', async (e) => {
  await atualizarPreviewEditar();
  const btnSubmit = document.getElementById('formEditarTurma')?.querySelector('button[type="submit"]');
  if (btnSubmit?.disabled) {
    e.preventDefault();
    alert('Existe conflito no recálculo. Ajuste antes de salvar.');
  }
});

// Evento para abrir modal ao clicar em editar
document.addEventListener('click', function(e) {
    // Verifica se clicou no botão de editar ou em seu ícone
    const btnEdit = e.target.closest('.btn-edit');
    if (btnEdit) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Clicou no botão editar:", btnEdit);
        abrirModalEditar(btnEdit);
    }
});

// Fechar modal editar ao clicar no X
const closeBtn = modalEditar.querySelector('.modal__close');
if (closeBtn) {
    closeBtn.addEventListener('click', fecharModalEditar);
}

// Fechar modal editar ao clicar fora
modalEditar.addEventListener('click', function(e) {
    if (e.target.matches('[data-close-editar]')) {
        fecharModalEditar();
    }
});

// Fechar modal editar com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalEditar.classList.contains('is-open')) {
        fecharModalEditar();
    }
});

// DEBUG: Verifica se tudo está carregando
console.log("Script turmas.js carregado");
console.log("Modal editar existe?", !!modalEditar);
console.log("Botões editar encontrados:", document.querySelectorAll('.btn-edit').length);