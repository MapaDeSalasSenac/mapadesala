const modal = document.getElementById("meuModal");
const btnAbrir = document.getElementById("btnAbrir");

function abrirModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  

  const firstFocusable = modal.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  firstFocusable?.focus();
}

function fecharModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");


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


  const mapDay = { seg:1, ter:2, qua:3, qui:4, sex:5, sab:6, dom:7 };
  const elPreview = document.getElementById('preview');
  const form = document.getElementById('formTurma');

  function getCheckedDays() {
    return Array.from(document.querySelectorAll('input[name="dias_semana[]"]:checked'))
      .map(i => i.value);
  }
  function fmtISO(d) { return d.toISOString().slice(0, 10); }
  function jsDayToISOWeekday(d) { return ((d.getDay() + 6) % 7) + 1; } // 1..7

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

  async function verificarConflitos({ id_sala, id_professor, turno, atividade_externa, datas }) {
    const res = await fetch('../PHP/verificar_conflitos.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sala, id_professor, turno, atividade_externa, datas })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok === false) {
      throw new Error(json?.error || "Falha ao verificar conflitos.");
    }
    return json;
  }

  function renderPreview({ cargaHoraria, turno, atividade_externa, datas, horasPorEncontro, horasUltimo, conflitos_professor, conflitos_sala }) {
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

    const obsSala = atividade_externa
      ? `<div style="margin-top:6px;"><b>Sala:</b> (atividade externa) não reserva sala.</div>`
      : `<div style="margin-top:6px;"><b>Sala:</b> será reservada.</div>`;

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

      <div style="margin-top:10px; padding:10px; border:1px solid #ddd; border-radius:10px;">
        <div style="font-weight:900; margin-bottom:6px;">📅 Datas (PROF = professor ocupado / SALA = sala ocupada)</div>
        ${linhas}
      </div>
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

    const atividade_externa = document.getElementById('atividade_externa')?.checked ? 1 : 0;
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

    if (!atividade_externa && !id_sala) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:800;">
        Se NÃO for atividade externa, selecione uma sala.
      </span>`;
      return;
    }

    try {
      const cal = gerarDatasPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados });
      const conf = await verificarConflitos({
        id_sala,
        id_professor,
        turno,
        atividade_externa,
        datas: cal.datas
      });

      renderPreview({
        cargaHoraria,
        turno,
        atividade_externa,
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
      e.target.id === 'atividade_externa' ||
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


