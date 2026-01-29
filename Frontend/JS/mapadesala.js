(() => {
  /* =====================================================
     ELEMENTOS
  ===================================================== */
  const stage = document.getElementById("salas-container");
  const subtitleEl = document.getElementById("mapa-subtitle");
  const btns = Array.from(document.querySelectorAll(".periodo-btn"));
  const filterBtn = document.getElementById("filter-btn");
  const userBtn = document.getElementById("user-btn");
  const clockEl = document.getElementById("sidebar-clock");

  /* =====================================================
     CONSTANTES
  ===================================================== */
  const VIEW_ORDER = ["day", "week", "month"];

  const TURNOS = [
    { id: "matutino", label: "Manhã", range: [6, 12] },
    { id: "vespertino", label: "Tarde", range: [12, 18] },
    { id: "noturno", label: "Noite", range: [18, 23] },
  ];

  /* =====================================================
     ESTADO
  ===================================================== */
  const appState = {
    view: "day",
    date: toISODate(new Date()),
    monthSelectedDate: null,

    data: null, // { salas, agendamentos }
    idx: null,  // Map slotKey -> agendamento

    filters: {
      status: "all", // all | free | busy
      professor: "",
      turnos: { matutino: true, vespertino: true, noturno: true },
    },
  };

  /* =====================================================
     MOCK (contrato realista)
     -> No backend: troque apenas getData()
  ===================================================== */
  const mockAPI = {
    salas: [
      { id: 1, nome: "Sala 01", tipo: "Sala" },
      { id: 2, nome: "Sala 02", tipo: "Sala" },
      { id: 3, nome: "Sala 03", tipo: "Lab" },
      { id: 4, nome: "Sala 04", tipo: "Lab" },
      { id: 5, nome: "Sala 05", tipo: "Sala" },
      { id: 6, nome: "Sala 06", tipo: "Sala" },
      { id: 7, nome: "Sala 07", tipo: "Lab" },
      { id: 8, nome: "Sala 08", tipo: "Sala" },
      { id: 9, nome: "Sala 09", tipo: "Sala" },
      { id: 10, nome: "Sala 10", tipo: "Lab" },
      { id: 11, nome: "Sala 11", tipo: "Sala" },
      { id: 12, nome: "Sala 12", tipo: "Sala" },
    ],
    agendamentos: [
      { salaId: 1, data: shiftISO(toISODate(new Date()), 0), turno: "matutino", professor: "Carlos", curso: "Informática", codigoTurma: "TI-01" },
      { salaId: 1, data: shiftISO(toISODate(new Date()), 0), turno: "noturno", professor: "Ana", curso: "Redes", codigoTurma: "RD-02" },
      { salaId: 3, data: shiftISO(toISODate(new Date()), 0), turno: "vespertino", professor: "Marcos", curso: "Design", codigoTurma: "DS-03" },
      { salaId: 4, data: shiftISO(toISODate(new Date()), 1), turno: "matutino", professor: "Juliana", curso: "Adm", codigoTurma: "AD-01" },
      { salaId: 7, data: shiftISO(toISODate(new Date()), 2), turno: "noturno", professor: "Rita", curso: "Dev Web", codigoTurma: "DW-07" },
      { salaId: 10, data: shiftISO(toISODate(new Date()), 3), turno: "vespertino", professor: "Paulo", curso: "Excel", codigoTurma: "EX-10" },
      { salaId: 2, data: shiftISO(toISODate(new Date()), -1), turno: "matutino", professor: "Bruno", curso: "Segurança", codigoTurma: "SG-02" },
      { salaId: 5, data: shiftISO(toISODate(new Date()), -2), turno: "noturno", professor: "Lívia", curso: "Marketing", codigoTurma: "MK-05" },
      { salaId: 12, data: shiftISO(toISODate(new Date()), 5), turno: "matutino", professor: "Fernanda", curso: "RH", codigoTurma: "RH-12" },
      { salaId: 6, data: startOfMonthISO(toISODate(new Date())), turno: "vespertino", professor: "Denis", curso: "Inglês", codigoTurma: "IN-06" },
      { salaId: 9, data: shiftISO(startOfMonthISO(toISODate(new Date())), 8), turno: "matutino", professor: "Cíntia", curso: "Atendimento", codigoTurma: "AT-09" },
    ],
  };

  async function getData() {
    // Backend: substitua por fetch() e retorne { salas, agendamentos } no mesmo formato.
    // Ex:
    // const r = await fetch("SEU_ENDPOINT_AQUI");
    // return await r.json();
    return deepClone(mockAPI);
  }

  /* =====================================================
     INDEX / CONSULTA
  ===================================================== */
  function buildIndex(agendamentos) {
    const map = new Map();
    for (const a of agendamentos) map.set(slotKey(a.salaId, a.data, a.turno), a);
    return map;
  }

  function getBooking(salaId, dataISO, turno) {
    return appState.idx.get(slotKey(salaId, dataISO, turno)) || null;
  }

  /* =====================================================
     "AGORA"
  ===================================================== */
  function getTurnoNowId(date = new Date()) {
    const h = date.getHours();
    for (const t of TURNOS) {
      const [ini, fim] = t.range;
      if (h >= ini && h < fim) return t.id;
    }
    return null;
  }

  function isPastTurno(turnoId, baseDateISO) {
    const todayISO = toISODate(new Date());
    if (baseDateISO !== todayISO) return false;

    const nowId = getTurnoNowId(new Date());
    const order = ["matutino", "vespertino", "noturno"];
    const nowIdx = order.indexOf(nowId);
    const idx = order.indexOf(turnoId);
    if (nowIdx === -1) return false;
    return idx < nowIdx;
  }

  function isNowTurno(turnoId, baseDateISO) {
    const todayISO = toISODate(new Date());
    if (baseDateISO !== todayISO) return false;
    return getTurnoNowId(new Date()) === turnoId;
  }

  /* =====================================================
     FILTROS
  ===================================================== */
  function norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function enabledTurnosCount() {
    return Object.values(appState.filters.turnos).filter(Boolean).length || 0;
  }

  function professorMatches(booking) {
    const q = norm(appState.filters.professor);
    if (!q) return true;
    if (!booking) return false;
    return norm(booking.professor).includes(q);
  }

  function slotVisible(booking, turnoId) {
    const f = appState.filters;
    if (!f.turnos[turnoId]) return false;

    const hasProf = !!norm(f.professor);
    if (hasProf && f.status === "free") return false; // livre não tem professor

    if (hasProf) return !!booking && professorMatches(booking);

    if (f.status === "busy") return !!booking;
    if (f.status === "free") return !booking;
    return true;
  }

  function slotBarClass(booking, turnoId) {
    const f = appState.filters;
    const hasProf = !!norm(f.professor);

    if (!f.turnos[turnoId]) return "muted";

    if (hasProf) {
      if (booking && professorMatches(booking)) return "busy";
      return "muted";
    }

    if (f.status === "busy") return booking ? "busy" : "muted";
    if (f.status === "free") return booking ? "muted" : "free";
    return booking ? "busy" : "free";
  }

  function isFiltersDefault() {
    const f = appState.filters;
    return (
      f.status === "all" &&
      !norm(f.professor) &&
      f.turnos.matutino &&
      f.turnos.vespertino &&
      f.turnos.noturno
    );
  }

  function updateFilterIndicator() {
    if (!filterBtn) return;
    filterBtn.classList.toggle("has-active", !isFiltersDefault());
  }

  /* =====================================================
     RENDER: DAY
  ===================================================== */
  function renderDay(dateISO) {
    const cards = appState.data.salas
      .map((s) => {
        const rows = TURNOS
          .filter((t) => appState.filters.turnos[t.id])
          .map((t) => {
            const booking = getBooking(s.id, dateISO, t.id);
            if (!slotVisible(booking, t.id)) return "";

            const statusClass = booking ? "status--busy" : "status--free";
            const badge = booking
              ? `<span class="badge busy"><span class="dot"></span>Ocupada</span>`
              : `<span class="badge free"><span class="dot"></span>Livre</span>`;

            const meta = booking
              ? `${escapeHTML(booking.professor)} • ${escapeHTML(booking.curso)}`
              : "Sem agendamento";

            const past = isPastTurno(t.id, dateISO) ? " is-past" : "";
            const now = isNowTurno(t.id, dateISO) ? " is-now" : "";

            return `
              <div class="turno-row ${statusClass}${past}${now}">
                <span class="turno-pill">${t.label}</span>
                ${badge}
                <div class="turno-meta" title="${escapeHTML(meta)}">${escapeHTML(meta)}</div>
              </div>
            `;
          })
          .filter(Boolean)
          .join("");

        if (!rows) return "";

        return `
          <div class="sala-card">
            <div class="sala-head">
              <h2 class="sala-nome">${escapeHTML(s.nome)}</h2>
              <span class="sala-type">${escapeHTML(s.tipo || "Sala")}</span>
            </div>
            <div class="turnos">${rows}</div>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    return cards
      ? `<div class="salas-grid">${cards}</div>`
      : `<div class="details-empty">Nenhum resultado com os filtros atuais.</div>`;
  }

  /* =====================================================
     RENDER: WEEK
  ===================================================== */
  function renderWeek(dateISO) {
    const start = startOfWeekISO(dateISO);
    const days = Array.from({ length: 7 }, (_, i) => shiftISO(start, i));
    const dow = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const rows = appState.data.salas
      .map((s) => {
        let hasAnyMatch = false;

        const daysHTML = days
          .map((d) => {
            const dt = new Date(d + "T00:00:00");
            const dayNum = dt.getDate();
            const dayDow = dow[dt.getDay()];

            const bars = TURNOS
              .filter((t) => appState.filters.turnos[t.id])
              .map((t) => {
                const booking = getBooking(s.id, d, t.id);
                const cls = slotBarClass(booking, t.id);
                if (cls !== "muted") hasAnyMatch = true;
                return `<span class="week-bar ${cls}" title="${t.label}: ${cls === "busy" ? "Ocupada" : cls === "free" ? "Livre" : "—"}"></span>`;
              })
              .join("");

            return `
              <div class="week-day">
                <div class="week-day-top">
                  <span class="week-day-num">${dayNum}</span>
                  <span class="week-day-dow">${dayDow}</span>
                </div>
                <div class="week-bars">${bars}</div>
              </div>
            `;
          })
          .join("");

        if (!isFiltersDefault() && !hasAnyMatch) return "";

        return `
          <div class="week-row">
            <div class="week-room">
              <h2 class="sala-nome">${escapeHTML(s.nome)}</h2>
              <span class="sala-type">${escapeHTML(s.tipo || "Sala")}</span>
            </div>
            <div class="week-days">${daysHTML}</div>
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    return rows
      ? `<div class="week-list">${rows}</div>`
      : `<div class="details-empty">Nenhum resultado com os filtros atuais.</div>`;
  }

  /* =====================================================
     RENDER: MONTH DETAILS
  ===================================================== */
  function renderMonthDetails(dateISO) {
    const salasById = new Map(appState.data.salas.map((s) => [s.id, s]));
    const f = appState.filters;
    const hasProf = !!norm(f.professor);

    const enabledTurnos = TURNOS.filter((t) => f.turnos[t.id]).map((t) => t.id);
    const totalSlots = appState.data.salas.length * (enabledTurnos.length || 1);

    const busy = appState.data.agendamentos
      .filter((a) => a.data === dateISO)
      .filter((a) => f.turnos[a.turno])
      .filter((a) => {
        if (hasProf) return professorMatches(a);
        if (f.status === "free") return false;
        if (f.status === "busy") return true;
        return true;
      })
      .map((a) => {
        const sala = salasById.get(a.salaId) || { nome: `Sala ${a.salaId}`, tipo: "Sala" };
        return {
          salaNome: sala.nome,
          salaTipo: sala.tipo || "Sala",
          turno: a.turno,
          professor: a.professor || "—",
          curso: a.curso || "—",
          codigoTurma: a.codigoTurma || a.turma || a.codigo || "",
          kind: "busy",
        };
      });

    const free = [];
    if (f.status === "free" && !hasProf) {
      for (const sala of appState.data.salas) {
        for (const t of TURNOS) {
          if (!f.turnos[t.id]) continue;
          const booking = getBooking(sala.id, dateISO, t.id);
          if (!booking) {
            free.push({
              salaNome: sala.nome,
              salaTipo: sala.tipo || "Sala",
              turno: t.id,
              professor: "—",
              curso: "—",
              codigoTurma: "",
              kind: "free",
            });
          }
        }
      }
    }

    const order = { matutino: 0, vespertino: 1, noturno: 2 };
    const list = (f.status === "free" && !hasProf) ? free : busy;

    list.sort(
      (a, b) =>
        (order[a.turno] ?? 9) - (order[b.turno] ?? 9) ||
        a.salaNome.localeCompare(b.salaNome)
    );

    const count = list.length;
    const summary =
      (f.status === "free" && !hasProf)
        ? `${count}/${totalSlots} livres`
        : `${count}/${totalSlots} ocupados`;

    if (!list.length) {
      const msg =
        hasProf && f.status === "free"
          ? "Professor + Livre não retorna resultados (livre não tem professor)."
          : "Nenhum resultado para este dia com os filtros atuais.";

      return `
        <div class="details-date">${formatDateBR(dateISO)}</div>
        <div class="details-sub">${summary}</div>
        <div class="details-empty">${msg}</div>
      `;
    }

    const items = list
      .map(
        (item) => `
        <div class="detail-item ${item.kind === "free" ? "is-free" : ""}">
          <div class="detail-top">
            <span class="turno-pill">${turnoLabel(item.turno)}</span>
            <span class="detail-room" title="${escapeHTML(item.salaNome)}">
              ${escapeHTML(item.salaNome)} • ${escapeHTML(item.salaTipo)}
            </span>
          </div>

          ${
            item.kind === "busy"
              ? `<div class="detail-prof">${escapeHTML(item.professor)}</div>`
              : `<div class="detail-prof">Livre</div>`
          }

          ${
            item.kind === "busy"
              ? `<div class="detail-meta">${escapeHTML(item.curso)}${item.codigoTurma ? ` • ${escapeHTML(item.codigoTurma)}` : ""}</div>`
              : `<div class="detail-meta">Sem agendamento</div>`
          }
        </div>
      `
      )
      .join("");

    return `
      <div class="details-date">${formatDateBR(dateISO)}</div>
      <div class="details-sub">${summary}</div>
      <div class="details-list">${items}</div>
    `;
  }

  /* =====================================================
     RENDER: MONTH
  ===================================================== */
  function renderMonth(dateISO) {
    const first = startOfMonthISO(dateISO);
    const { gridDays } = monthGrid(first);

    if (!appState.monthSelectedDate) appState.monthSelectedDate = dateISO;

    const head = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
      .map((x) => `<div>${x}</div>`)
      .join("");

    const enabled = enabledTurnosCount() || 1;
    const totalSlotsPerDay = appState.data.salas.length * enabled;
    const hasProf = !!norm(appState.filters.professor);

    const cells = gridDays
      .map((d) => {
        const out = d.slice(0, 7) !== first.slice(0, 7) ? " is-out" : "";
        const sel = d === appState.monthSelectedDate ? " is-selected" : "";
        const dayNum = new Date(d + "T00:00:00").getDate();

        let count = 0;
        for (const s of appState.data.salas) {
          for (const t of TURNOS) {
            if (!appState.filters.turnos[t.id]) continue;
            const booking = getBooking(s.id, d, t.id);

            if (hasProf) {
              if (booking && professorMatches(booking) && appState.filters.status !== "free") count++;
            } else if (appState.filters.status === "free") {
              if (!booking) count++;
            } else if (appState.filters.status === "busy") {
              if (booking) count++;
            } else {
              if (booking) count++; // all -> mostra ocupados
            }
          }
        }

        const pct = totalSlotsPerDay ? Math.round((count / totalSlotsPerDay) * 100) : 0;
        const meta =
          (!hasProf && appState.filters.status === "free")
            ? `${count}/${totalSlotsPerDay} livres`
            : `${count}/${totalSlotsPerDay} ocupados`;

        return `
          <button type="button" class="day-cell${out}${sel}" data-date="${d}">
            <div class="day-num">${dayNum}</div>
            <div class="occ-bar" style="--busy-pct:${pct}"></div>
            <div class="occ-meta">${meta}</div>
          </button>
        `;
      })
      .join("");

    return `
      <div class="month-split">
        <div class="month">
          <div class="month-head">${head}</div>
          <div class="month-grid">${cells}</div>
        </div>
        <aside class="month-details" data-role="month-details">
          ${renderMonthDetails(appState.monthSelectedDate)}
        </aside>
      </div>
    `;
  }

  function render(view, dateISO) {
    if (view === "day") return renderDay(dateISO);
    if (view === "week") return renderWeek(dateISO);
    if (view === "month") return renderMonth(dateISO);
    return `<div></div>`;
  }

  /* =====================================================
     SUBTITLE
  ===================================================== */
  function setSubtitle(view, dateISO) {
    const dt = new Date(dateISO + "T00:00:00");
    const month = dt.toLocaleString("pt-BR", { month: "long" });
    const year = dt.getFullYear();
    const day = dt.getDate();

    if (view === "day") subtitleEl.textContent = `Hoje • ${day} de ${capitalize(month)} de ${year}`;
    if (view === "week") subtitleEl.textContent = `Semana • a partir de ${formatDateBR(startOfWeekISO(dateISO))}`;
    if (view === "month") subtitleEl.textContent = `Mês • ${capitalize(month)} de ${year}`;
  }

  /* =====================================================
     STAGE HEIGHT (evita corte)
  ===================================================== */
  function measureViewHeight(viewEl) {
    const child = viewEl.firstElementChild;
    const h1 = viewEl.scrollHeight || 0;
    const h2 = Math.ceil(viewEl.getBoundingClientRect().height || 0);
    const h3 = child ? Math.ceil(child.getBoundingClientRect().height || 0) : 0;
    return Math.max(h1, h2, h3, 120);
  }

  function setStageHeight(viewEl, animate = true) {
    const h = measureViewHeight(viewEl);
    if (!animate) stage.style.transition = "none";
    stage.style.height = h + "px";
    if (!animate) {
      stage.offsetHeight; // reflow
      stage.style.transition = "";
    }
  }

  function rerenderCurrent() {
    const current = stage.querySelector(".view");
    if (!current) return;

    current.innerHTML = render(appState.view, appState.date);
    setSubtitle(appState.view, appState.date);

    requestAnimationFrame(() => setStageHeight(current, true));
  }

  /* =====================================================
     VIEW SWITCH (transição)
  ===================================================== */
  function viewIndex(v) { return VIEW_ORDER.indexOf(v); }

  function setActiveButton(view) {
    btns.forEach((b) => {
      const active = b.dataset.view === view;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function switchView(nextView) {
    const prevView = appState.view;
    if (nextView === prevView) return;

    if (nextView === "month") appState.monthSelectedDate = appState.date;

    const forward = viewIndex(nextView) > viewIndex(prevView);
    const enterClass = forward ? "enter-from-right" : "enter-from-left";
    const exitClass = forward ? "exit-to-left" : "exit-to-right";

    const from = stage.querySelector(".view");
    const to = document.createElement("div");
    to.className = `view ${enterClass}`;
    to.innerHTML = render(nextView, appState.date);
    stage.appendChild(to);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setStageHeight(to, true);
        if (from) from.classList.add(exitClass);
        to.classList.add("enter-active");
        to.classList.remove(enterClass);
      });
    });

    const onEnd = (e) => {
      if (e.propertyName !== "transform") return;
      to.removeEventListener("transitionend", onEnd);
      if (from && from.parentNode) from.remove();
      to.classList.add("enter-active");
    };
    to.addEventListener("transitionend", onEnd);

    appState.view = nextView;
    setActiveButton(nextView);
    setSubtitle(nextView, appState.date);
  }

  function mountFirst() {
    stage.innerHTML = "";
    const first = document.createElement("div");
    first.className = "view enter-active";
    first.innerHTML = render(appState.view, appState.date);
    stage.appendChild(first);

    setActiveButton(appState.view);
    setSubtitle(appState.view, appState.date);
    requestAnimationFrame(() => setStageHeight(first, false));
  }

  /* =====================================================
     MODAL FILTROS
  ===================================================== */
  let filterModalEl = null;

  function openFilterModal() {
    if (!filterModalEl) filterModalEl = buildFilterModal();
    syncModalFromState(filterModalEl);
    filterModalEl.classList.add("open");
    document.body.style.overflow = "hidden";

    const firstInput = filterModalEl.querySelector("input,button");
    if (firstInput) firstInput.focus();
  }

  function closeFilterModal() {
    if (!filterModalEl) return;
    filterModalEl.classList.remove("open");
    document.body.style.overflow = "";
  }

  function buildFilterModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Filtros">
        <div class="modal-head">
          <div class="modal-title">Filtros</div>
          <button class="modal-close" type="button" data-act="close">✕</button>
        </div>

        <div class="modal-body">
          <div class="field">
            <div class="label">Status da sala</div>
            <div class="row">
              <label class="pill"><input type="radio" name="status" value="all"> Todos</label>
              <label class="pill"><input type="radio" name="status" value="free"> Só livres</label>
              <label class="pill"><input type="radio" name="status" value="busy"> Só ocupadas</label>
            </div>
          </div>

          <div class="field">
            <div class="label">Professor</div>
            <input class="input" type="text" name="professor" placeholder="Ex: Carlos" />
          </div>

          <div class="field">
            <div class="label">Turno</div>
            <div class="row">
              <label class="pill"><input type="checkbox" name="turno" value="matutino"> Manhã</label>
              <label class="pill"><input type="checkbox" name="turno" value="vespertino"> Tarde</label>
              <label class="pill"><input type="checkbox" name="turno" value="noturno"> Noite</label>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn" type="button" data-act="clear">Limpar</button>
          <button class="btn primary" type="button" data-act="apply">Aplicar</button>
        </div>
      </div>
    `;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeFilterModal();
    });

    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFilterModal();
    });

    overlay.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (!act) return;

      if (act === "close") closeFilterModal();

      if (act === "clear") {
        appState.filters = {
          status: "all",
          professor: "",
          turnos: { matutino: true, vespertino: true, noturno: true },
        };
        updateFilterIndicator();
        syncModalFromState(overlay);
        rerenderCurrent();
      }

      if (act === "apply") {
        syncStateFromModal(overlay);
        updateFilterIndicator();
        rerenderCurrent();
        closeFilterModal();
      }
    });

    // garante que não fique "zero turnos" marcados
    overlay.addEventListener("change", (e) => {
      const t = e.target;
      if (t?.name !== "turno") return;

      const checks = overlay.querySelectorAll('input[name="turno"]');
      let on = 0;
      checks.forEach((c) => { if (c.checked) on++; });
      if (on === 0) t.checked = true;
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function syncModalFromState(overlay) {
    const f = appState.filters;
    overlay.querySelectorAll('input[name="status"]').forEach((r) => (r.checked = r.value === f.status));
    overlay.querySelector('input[name="professor"]').value = f.professor;
    overlay.querySelectorAll('input[name="turno"]').forEach((c) => (c.checked = !!f.turnos[c.value]));
  }

  function syncStateFromModal(overlay) {
    const status = overlay.querySelector('input[name="status"]:checked')?.value || "all";
    const professor = overlay.querySelector('input[name="professor"]')?.value || "";

    const turnos = { matutino: false, vespertino: false, noturno: false };
    overlay.querySelectorAll('input[name="turno"]').forEach((c) => (turnos[c.value] = !!c.checked));

    appState.filters = { status, professor, turnos };
    if (!enabledTurnosCount()) appState.filters.turnos.matutino = true;
  }

  /* =====================================================
     MENU USUÁRIO
  ===================================================== */
  let userMenuEl = null;

  function buildUserMenu() {
    const pop = document.createElement("div");
    pop.className = "user-popover";
    pop.innerHTML = `<button type="button" data-act="logout">Sair</button>`;
    document.body.appendChild(pop);

    pop.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "logout") logout();
    });

    return pop;
  }

  function toggleUserMenu() {
    if (!userMenuEl) userMenuEl = buildUserMenu();
    const open = userMenuEl.classList.toggle("open");
    userBtn?.setAttribute("aria-expanded", open ? "true" : "false");

    if (open) document.addEventListener("click", onOutsideUserMenu, { capture: true });
    else document.removeEventListener("click", onOutsideUserMenu, { capture: true });
  }

  function onOutsideUserMenu(e) {
    if (!userMenuEl?.classList.contains("open")) return;
    if (userMenuEl.contains(e.target)) return;
    if (userBtn && userBtn.contains(e.target)) return;

    userMenuEl.classList.remove("open");
    userBtn?.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutsideUserMenu, { capture: true });
  }

  function logout() {
    // hook neutro: backend substitui por fluxo real
    window.dispatchEvent(new CustomEvent("mapaSalas:logout"));
    location.reload();
  }

  /* =====================================================
     EVENTOS
  ===================================================== */
  function bindEvents() {
    btns.forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));

    stage.addEventListener("click", (e) => {
      // clique em dia do mês -> painel direito
      if (appState.view !== "month") return;

      const cell = e.target.closest(".day-cell[data-date]");
      if (!cell) return;

      const d = cell.dataset.date;
      appState.monthSelectedDate = d;

      const current = stage.querySelector(".view");
      if (!current) return;

      const prev = current.querySelector(".day-cell.is-selected");
      if (prev) prev.classList.remove("is-selected");
      cell.classList.add("is-selected");

      const details = current.querySelector('[data-role="month-details"]');
      if (details) details.innerHTML = renderMonthDetails(d);

      setStageHeight(current, true);
    });

    filterBtn?.addEventListener("click", openFilterModal);

    userBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUserMenu();
    });

    window.addEventListener("resize", () => {
      const current = stage.querySelector(".view");
      if (!current) return;
      setStageHeight(current, false);
    });

    // atualiza "agora" no day (só re-render)
    setInterval(() => {
      if (appState.view === "day") rerenderCurrent();
    }, 60_000);
  }

  /* =====================================================
     RELÓGIO
  ===================================================== */
  function startClock() {
    if (!clockEl) return;

    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      clockEl.textContent = `${hh}:${mm}`;
    };

    tick();
    setInterval(tick, 15_000);
  }

  /* =====================================================
     INIT
  ===================================================== */
  async function init() {
    appState.data = await getData();
    appState.idx = buildIndex(appState.data.agendamentos);

    updateFilterIndicator();
    mountFirst();
    bindEvents();
    startClock();
  }

  /* =====================================================
     UTILS
  ===================================================== */
  function slotKey(salaId, dataISO, turno) {
    return `${salaId}|${dataISO}|${turno}`;
  }

  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function shiftISO(dateISO, days) {
    const d = new Date(dateISO + "T00:00:00");
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }

  function startOfWeekISO(dateISO) {
    const d = new Date(dateISO + "T00:00:00");
    d.setDate(d.getDate() - d.getDay());
    return toISODate(d);
  }

  function startOfMonthISO(dateISO) {
    const d = new Date(dateISO + "T00:00:00");
    d.setDate(1);
    return toISODate(d);
  }

  function monthGrid(monthFirstISO) {
    const first = new Date(monthFirstISO + "T00:00:00");
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    const gridStartISO = toISODate(gridStart);
    const gridDays = Array.from({ length: 42 }, (_, i) => shiftISO(gridStartISO, i));
    return { gridDays };
  }

  function escapeHTML(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function capitalize(s) {
    const str = String(s || "");
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function formatDateBR(dateISO) {
    const [y, m, d] = dateISO.split("-");
    return `${d}/${m}/${y}`;
  }

  function turnoLabel(turnoId) {
    const t = TURNOS.find((x) => x.id === turnoId);
    return t ? t.label : turnoId;
  }

  function deepClone(obj) {
    // structuredClone é ótimo, mas esse fallback deixa rodar em qualquer browser
    if (typeof structuredClone === "function") return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  }

  init();
})();
