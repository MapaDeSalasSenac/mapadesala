(() => {
  // =========================
  // ELEMENTOS PADRÃO (se existir na página, funciona)
  // =========================
  const botaoMenu = document.getElementById("botao-menu");
  const overlayMobile = document.querySelector(".sobreposicao-mobile");
  const relogioEl = document.getElementById("relogio-lateral");

  const botaoUsuario = document.getElementById("botao-usuario");
  const botaoFiltro = document.getElementById("botao-filtro");

  // =========================
  // MENU LATERAL (MOBILE)
  // =========================
  function setMenuLateralAberto(open) {
    document.body.classList.toggle("menu-lateral-aberto", open);
    botaoMenu?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  botaoMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuLateralAberto(!document.body.classList.contains("menu-lateral-aberto"));
  });

  overlayMobile?.addEventListener("click", () => setMenuLateralAberto(false));

  // =========================
  // RELÓGIO (SIDEBAR)
  // =========================
  function iniciarRelogio() {
    if (!relogioEl) return;

    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      relogioEl.textContent = `${hh}:${mm}`;
    };

    tick();
    setInterval(tick, 15_000);
  }

  // =========================
  // MENU USUÁRIO (POPOVER) + LOGOUT
  // =========================
  let menuUsuarioEl = null;

  function criarMenuUsuario() {
    const pop = document.createElement("div");
    pop.className = "menu-usuario";
    pop.innerHTML = `<button type="button" data-acao="sair">Sair</button>`;
    document.body.appendChild(pop);

    pop.addEventListener("click", (e) => {
      const acao = e.target.closest("[data-acao]")?.dataset.acao;
      if (acao === "sair") fazerLogout();
    });

    return pop;
  }

  function abrirFecharMenuUsuario() {
    if (!menuUsuarioEl) menuUsuarioEl = criarMenuUsuario();

    const abriu = menuUsuarioEl.classList.toggle("aberto");
    botaoUsuario?.setAttribute("aria-expanded", abriu ? "true" : "false");

    if (abriu) document.addEventListener("click", fecharMenuUsuarioAoClicarFora, { capture: true });
    else document.removeEventListener("click", fecharMenuUsuarioAoClicarFora, { capture: true });
  }

  function fecharMenuUsuarioAoClicarFora(e) {
    if (!menuUsuarioEl?.classList.contains("aberto")) return;
    if (menuUsuarioEl.contains(e.target)) return;
    if (botaoUsuario && botaoUsuario.contains(e.target)) return;

    menuUsuarioEl.classList.remove("aberto");
    botaoUsuario?.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", fecharMenuUsuarioAoClicarFora, { capture: true });
  }

  function fazerLogout() {
    // Você troca isso quando tiver autenticação real.
    // Por enquanto: evento + reload.
    window.dispatchEvent(new CustomEvent("sistema:logout"));
    location.reload();
  }

  botaoUsuario?.addEventListener("click", (e) => {
    e.stopPropagation();
    abrirFecharMenuUsuario();
  });

  // =========================
  // MODAL DE FILTROS (GENÉRICO)
  // - emite eventos para cada página filtrar do jeito dela
  // =========================
  let modalFiltrosEl = null;

  const filtrosPadrao = () => ({
    status: "all", // all | livre | ocupada
    professor: "",
    turnos: { matutino: true, vespertino: true, noturno: true },
  });

  let filtrosAtuais = filtrosPadrao();

  function filtrosSaoPadrao() {
    const f = filtrosAtuais;
    return (
      f.status === "all" &&
      !String(f.professor || "").trim() &&
      f.turnos.matutino && f.turnos.vespertino && f.turnos.noturno
    );
  }

  function atualizarIndicadorFiltro() {
    botaoFiltro?.classList.toggle("tem-filtro", !filtrosSaoPadrao());
  }

  function abrirModalFiltros() {
    if (!botaoFiltro) return;
    if (!modalFiltrosEl) modalFiltrosEl = criarModalFiltros();
    sincronizarModalComEstado(modalFiltrosEl);

    modalFiltrosEl.classList.add("aberto");
    document.body.style.overflow = "hidden";
    atualizarIndicadorFiltro();

    const primeiro = modalFiltrosEl.querySelector("input,button");
    if (primeiro) primeiro.focus();
  }

  function fecharModalFiltros() {
    if (!modalFiltrosEl) return;
    modalFiltrosEl.classList.remove("aberto");
    document.body.style.overflow = "";
  }

  function criarModalFiltros() {
    const overlay = document.createElement("div");
    overlay.className = "sobreposicao-modal";

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Filtros">
        <div class="cabecalho-modal">
          <div class="titulo-modal">Filtros</div>
          <button class="fechar-modal" type="button" data-acao="fechar">✕</button>
        </div>

        <div class="corpo-modal">
          <div class="campo">
            <div class="rotulo">Status</div>
            <div class="linha">
              <label class="pilula"><input type="radio" name="status" value="all"> Todos</label>
              <label class="pilula"><input type="radio" name="status" value="livre"> Só livres</label>
              <label class="pilula"><input type="radio" name="status" value="ocupada"> Só ocupadas</label>
            </div>
          </div>

          <div class="campo">
            <div class="rotulo">Professor</div>
            <input class="entrada" type="text" name="professor" placeholder="Ex: Carlos" />
          </div>

          <div class="campo">
            <div class="rotulo">Turno</div>
            <div class="linha">
              <label class="pilula"><input type="checkbox" name="turno" value="matutino"> Manhã</label>
              <label class="pilula"><input type="checkbox" name="turno" value="vespertino"> Tarde</label>
              <label class="pilula"><input type="checkbox" name="turno" value="noturno"> Noite</label>
            </div>
          </div>
        </div>

        <div class="acoes-modal">
          <button class="botao" type="button" data-acao="limpar">Limpar</button>
          <button class="botao primario" type="button" data-acao="aplicar">Aplicar</button>
        </div>
      </div>
    `;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharModalFiltros();
    });

    overlay.addEventListener("click", (e) => {
      const acao = e.target.closest("[data-acao]")?.dataset.acao;
      if (!acao) return;

      if (acao === "fechar") fecharModalFiltros();

      if (acao === "limpar") {
        filtrosAtuais = filtrosPadrao();
        sincronizarModalComEstado(overlay);
        atualizarIndicadorFiltro();
        window.dispatchEvent(new CustomEvent("sistema:filtros", { detail: filtrosAtuais }));
      }

      if (acao === "aplicar") {
        sincronizarEstadoComModal(overlay);
        atualizarIndicadorFiltro();
        window.dispatchEvent(new CustomEvent("sistema:filtros", { detail: filtrosAtuais }));
        fecharModalFiltros();
      }
    });

    // garante pelo menos 1 turno
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

  function sincronizarModalComEstado(overlay) {
    const f = filtrosAtuais;

    overlay.querySelectorAll('input[name="status"]').forEach((r) => {
      r.checked = (r.value === f.status);
    });

    overlay.querySelector('input[name="professor"]').value = f.professor || "";

    overlay.querySelectorAll('input[name="turno"]').forEach((c) => {
      c.checked = !!f.turnos[c.value];
    });
  }

  function sincronizarEstadoComModal(overlay) {
    const status = overlay.querySelector('input[name="status"]:checked')?.value || "all";
    const professor = overlay.querySelector('input[name="professor"]')?.value || "";

    const turnos = { matutino: false, vespertino: false, noturno: false };
    overlay.querySelectorAll('input[name="turno"]').forEach((c) => {
      turnos[c.value] = !!c.checked;
    });

    // fallback: pelo menos 1 turno
    if (!Object.values(turnos).some(Boolean)) turnos.matutino = true;

    filtrosAtuais = { status, professor, turnos };
  }

  botaoFiltro?.addEventListener("click", abrirModalFiltros);

  // =========================
  // ESC fecha: sidebar + modal + menu usuário
  // =========================
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setMenuLateralAberto(false);
    fecharModalFiltros();

    if (menuUsuarioEl?.classList.contains("aberto")) {
      menuUsuarioEl.classList.remove("aberto");
      botaoUsuario?.setAttribute("aria-expanded", "false");
    }
  });

  // INIT
  iniciarRelogio();
  atualizarIndicadorFiltro();
})();
