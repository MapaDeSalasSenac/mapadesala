(() => {
  // =========================
  // ELEMENTOS PADRÃO (se existir na página, funciona)
  // =========================
  const botaoMenu = document.getElementById("botao-menu");
  const overlayMobile = document.querySelector(".sobreposicao-mobile");
  const relogioEl = document.getElementById("relogio-lateral");

  const botaoUsuario = document.getElementById("botao-usuario");

  // seletor do botão de filtro (algumas páginas ainda usam variações antigas)
  const FILTRO_BTN_SELECTOR = [
    "[data-abrir-filtros]",
    "#botao-filtro",
    ".botao-filtro",
    ".btn-icon.btn-filter",
    ".btn-icon.btn-filtro",
  ].join(",");

  const paginaAtual = (() => {
    const p = (window.location.pathname || "").toLowerCase();
    if (p.includes("mapadesala")) return "mapa";
    if (p.includes("salas.php")) return "salas";
    if (p.includes("turmas.php")) return "turmas";
    if (p.includes("professores.php")) return "professores";
    return "outra";
  })();

  // no mapa, o core já implementa menu/relógio/filtro (evita duplicar handlers)
  const isMapaDeSalas = paginaAtual === "mapa" || !!document.getElementById("container-salas");

  // =========================
  // MENU LATERAL (MOBILE)
  // =========================
  function setMenuLateralAberto(open) {
    document.body.classList.toggle("menu-lateral-aberto", open);
    botaoMenu?.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (!isMapaDeSalas) {
  botaoMenu?.addEventListener("click", (e) => {
      e.stopPropagation();
      setMenuLateralAberto(!document.body.classList.contains("menu-lateral-aberto"));
    });
  
    overlayMobile?.addEventListener("click", () => setMenuLateralAberto(false));
  }

  
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

  // Retorna "Administrador" ou "Usuário".
  // 1) tenta via <body data-papel="admin|user"> (se a página for PHP e setar isso)
  // 2) tenta via endpoint de sessão (para páginas .html também)
  async function obterPapelUsuario() {
    const papelBody = (document.body?.dataset?.papel || "").toLowerCase();
    if (papelBody === "admin") return "Administrador";
    if (papelBody === "user") return "Usuário";

    try {
      const resp = await fetch("../PHP/session_info.php", { credentials: "same-origin" });
      if (!resp.ok) return "Usuário";
      const data = await resp.json();
      return data?.papel === "admin" ? "Administrador" : "Usuário";
    } catch {
      return "Usuário";
    }
  }

  function criarMenuUsuario() {
    const pop = document.createElement("div");
    pop.className = "menu-usuario";
    pop.innerHTML = `
      <div class="menu-usuario__cabecalho">
        <div class="menu-usuario__papel" id="menuUsuarioPapel">Usuário</div>
      </div>
      <button type="button" class="menu-usuario__sair" data-acao="sair">Sair</button>
    `;
    document.body.appendChild(pop);

    // Atualiza papel (async) sem travar UI
    obterPapelUsuario().then((txt) => {
      const el = pop.querySelector("#menuUsuarioPapel");
      if (el) el.textContent = txt;
    });

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
    // evento padrão do app + logout server-side + redirect pro index
    window.dispatchEvent(new CustomEvent("app:logout"));
    window.location.href = "../PHP/logout.php";
  }

  botaoUsuario?.addEventListener("click", (e) => {
    e.stopPropagation();
    abrirFecharMenuUsuario();
  });

  /* =====================================================
   FILTROS (GLOBAL) — MODAL PERSONALIZADO POR PÁGINA
   - NÃO roda no Mapa de Salas (lá o mapa já tem filtro próprio)
   - NÃO usa .modal pra não conflitar com modais CRUD das páginas
===================================================== */

  const getBotoesFiltro = () => Array.from(document.querySelectorAll(FILTRO_BTN_SELECTOR));

  const FILTROS_STORAGE_KEY = `ui:filtros:${paginaAtual}`;

  const filtrosPadraoPorPagina = () => {
    switch (paginaAtual) {
      case "salas":
        return { q: "", capacidadeMin: "", capacidadeMax: "" };
      case "turmas":
        return { q: "", turno: "all", professor: "", sala: "" };
      case "professores":
        return { q: "", formacao: "" };
      default:
        return { q: "" };
    }
  };

  let filtrosAtuais = filtrosPadraoPorPagina();

  function normalizar(v) {
    return String(v ?? "").trim().toLowerCase();
  }

  function carregarFiltrosPersistidos() {
    try {
      const raw = sessionStorage.getItem(FILTROS_STORAGE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        filtrosAtuais = { ...filtrosPadraoPorPagina(), ...obj };
      }
    } catch {}
  }

  function persistirFiltros() {
    try {
      sessionStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify(filtrosAtuais));
    } catch {}
  }

  function filtrosSaoPadrao() {
    const pad = filtrosPadraoPorPagina();
    const f = filtrosAtuais || {};
    return Object.keys(pad).every((k) => String(f[k] ?? "") === String(pad[k] ?? ""));
  }

  function atualizarIndicadorFiltro() {
    const ativo = !filtrosSaoPadrao();
    getBotoesFiltro().forEach((b) => b.classList.toggle("tem-filtro", ativo));
  }

  function emitirFiltros() {
    window.dispatchEvent(
      new CustomEvent("app:filtros", { detail: { pagina: paginaAtual, filtros: filtrosAtuais } })
    );
  }

  function aplicarFiltrosNaPagina() {
    if (isMapaDeSalas) return;

    const cards = document.querySelectorAll(".conteudo-principal .cards .card");
    if (!cards.length) return;

    const f = filtrosAtuais || {};
    const q = normalizar(f.q);

    // fallback: se a página não tiver filtro específico ainda, usa só a busca
    const aplicarBuscaGenerica = () => {
      cards.forEach((card) => {
        const texto = normalizar(card.innerText || "");
        const ok = !q || texto.includes(q);
        card.style.display = ok ? "" : "none";
      });
    };

    if (paginaAtual === "salas") {
      const min = f.capacidadeMin !== "" ? Number(f.capacidadeMin) : null;
      const max = f.capacidadeMax !== "" ? Number(f.capacidadeMax) : null;

      cards.forEach((card) => {
        const texto = normalizar(card.innerText || "");
        const nome = normalizar(card.querySelector(".card-h3")?.textContent || "");
        const capStr =
          card.querySelector(".btn-edit")?.getAttribute("data-capacidade") ||
          card.querySelector(".btn-edit")?.dataset?.capacidade ||
          "";
        const cap = Number(String(capStr).replace(/[^\d]/g, "")) || 0;

        let ok = true;

        if (q && !(nome.includes(q) || texto.includes(q))) ok = false;

        if (min !== null) ok = ok && cap >= min;
        if (max !== null) ok = ok && cap <= max;

        card.style.display = ok ? "" : "none";
      });
      return;
    }

    if (paginaAtual === "turmas") {
      const turno = normalizar(f.turno);
      const prof = normalizar(f.professor);
      const sala = normalizar(f.sala);

      cards.forEach((card) => {
        const texto = normalizar(card.innerText || "");

        let ok = true;
        if (q && !texto.includes(q)) ok = false;

        if (turno && turno !== "all" && !texto.includes(turno)) ok = false;
        if (prof && !texto.includes(prof)) ok = false;
        if (sala && !texto.includes(sala)) ok = false;

        card.style.display = ok ? "" : "none";
      });
      return;
    }

    if (paginaAtual === "professores") {
      const formacao = normalizar(f.formacao);

      cards.forEach((card) => {
        const texto = normalizar(card.innerText || "");
        const nome = normalizar(card.querySelector(".professor-nome")?.textContent || "");

        let ok = true;
        if (q && !(nome.includes(q) || texto.includes(q))) ok = false;
        if (formacao && !texto.includes(formacao)) ok = false;

        card.style.display = ok ? "" : "none";
      });
      return;
    }

    aplicarBuscaGenerica();
  }

  // =========================
  // MODAL DE FILTROS (ÚNICO) — não conflita com .modal das páginas
  // =========================
  let modalFiltrosEl = null;
  let botaoFiltroOrigem = null;

  function montarCamposDaPagina() {
    if (paginaAtual === "salas") {
      return `
        <div class="campo">
          <div class="rotulo">Buscar</div>
          <input class="entrada" type="text" name="q" placeholder="Ex: Sala 01" />
        </div>

        <div class="campo">
          <div class="rotulo">Capacidade</div>
          <div class="linha linha--grid2">
            <input class="entrada" type="number" min="0" name="capacidadeMin" placeholder="Mín." />
            <input class="entrada" type="number" min="0" name="capacidadeMax" placeholder="Máx." />
          </div>
        </div>
      `;
    }

    if (paginaAtual === "turmas") {
      return `
        <div class="campo">
          <div class="rotulo">Buscar</div>
          <input class="entrada" type="text" name="q" placeholder="Nome, sala ou professor..." />
        </div>

        <div class="campo">
          <div class="rotulo">Turno</div>
          <select class="entrada" name="turno">
            <option value="all">Todos</option>
            <option value="matutino">Manhã</option>
            <option value="vespertino">Tarde</option>
            <option value="noturno">Noite</option>
          </select>
        </div>

        <div class="campo">
          <div class="rotulo">Professor</div>
          <input class="entrada" type="text" name="professor" placeholder="Ex: Carlos" />
        </div>

        <div class="campo">
          <div class="rotulo">Sala</div>
          <input class="entrada" type="text" name="sala" placeholder="Ex: Sala 03 / Externa" />
        </div>
      `;
    }

    if (paginaAtual === "professores") {
      return `
        <div class="campo">
          <div class="rotulo">Buscar</div>
          <input class="entrada" type="text" name="q" placeholder="Ex: Ana" />
        </div>

        <div class="campo">
          <div class="rotulo">Formação</div>
          <input class="entrada" type="text" name="formacao" placeholder="Ex: Redes, ADS..." />
        </div>
      `;
    }

    return `
      <div class="campo">
        <div class="rotulo">Buscar</div>
        <input class="entrada" type="text" name="q" placeholder="Digite para filtrar..." />
      </div>
    `;
  }

  function criarModalFiltros() {
    const overlay = document.createElement("div");
    overlay.className = "sobreposicao-modal-filtros";

    overlay.innerHTML = `
      <div class="modal-filtros" role="dialog" aria-modal="true" aria-label="Filtros">
        <div class="cabecalho-modal">
          <div class="titulo-modal">Filtros</div>
          <button class="fechar-modal" type="button" data-acao="fechar" aria-label="Fechar">✕</button>
        </div>

        <div class="corpo-modal">
          ${montarCamposDaPagina()}
        </div>

        <div class="acoes-modal">
          <button class="botao" type="button" data-acao="limpar">Limpar</button>
          <button class="botao primario" type="button" data-acao="aplicar">Aplicar</button>
        </div>
      </div>
    `;

    // click fora fecha
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fecharModalFiltros();
    });

    // ações
    overlay.addEventListener("click", (e) => {
      const acao = e.target.closest("[data-acao]")?.dataset.acao;
      if (!acao) return;

      if (acao === "fechar") fecharModalFiltros();

      if (acao === "limpar") {
        filtrosAtuais = filtrosPadraoPorPagina();
        persistirFiltros();
        sincronizarModalComEstado(overlay);
        atualizarIndicadorFiltro();
        aplicarFiltrosNaPagina();
        emitirFiltros();
      }

      if (acao === "aplicar") {
        sincronizarEstadoComModal(overlay);
        persistirFiltros();
        atualizarIndicadorFiltro();
        aplicarFiltrosNaPagina();
        emitirFiltros();
        fecharModalFiltros();
      }
    });

    // atalho: filtra ao digitar (sem fechar)
    overlay.addEventListener("input", (e) => {
      const el = e.target;
      if (!el?.name) return;
      // só live para campo q (busca)
      if (el.name !== "q") return;
      sincronizarEstadoComModal(overlay);
      persistirFiltros();
      atualizarIndicadorFiltro();
      aplicarFiltrosNaPagina();
      emitirFiltros();
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function sincronizarModalComEstado(overlay) {
    const f = filtrosAtuais || {};
    overlay.querySelectorAll("input[name], select[name]").forEach((el) => {
      const name = el.getAttribute("name");
      if (!name) return;

      if (el.tagName === "SELECT") {
        el.value = String(f[name] ?? "");
        return;
      }

      el.value = String(f[name] ?? "");
    });
  }

  function sincronizarEstadoComModal(overlay) {
    const pad = filtrosPadraoPorPagina();
    const novo = { ...pad };

    overlay.querySelectorAll("input[name], select[name]").forEach((el) => {
      const name = el.getAttribute("name");
      if (!name || !(name in novo)) return;
      novo[name] = String(el.value ?? "").trim();
    });

    // normalizações simples
    if ("capacidadeMin" in novo && novo.capacidadeMin !== "" && Number.isNaN(Number(novo.capacidadeMin))) novo.capacidadeMin = "";
    if ("capacidadeMax" in novo && novo.capacidadeMax !== "" && Number.isNaN(Number(novo.capacidadeMax))) novo.capacidadeMax = "";

    filtrosAtuais = novo;
  }

  function abrirModalFiltros(botao) {
    if (isMapaDeSalas) return;

    botaoFiltroOrigem = botao || null;

    if (!modalFiltrosEl) modalFiltrosEl = criarModalFiltros();
    else {
      // se mudou de página/HTML e reaproveitou cache, garante campos corretos
      const corpo = modalFiltrosEl.querySelector(".corpo-modal");
      if (corpo) corpo.innerHTML = montarCamposDaPagina();
    }

    sincronizarModalComEstado(modalFiltrosEl);

    modalFiltrosEl.classList.add("aberto");
    document.body.style.overflow = "hidden";

    const primeiro = modalFiltrosEl.querySelector("input,select,button");
    if (primeiro) primeiro.focus();
  }

  function fecharModalFiltros() {
    if (!modalFiltrosEl) return;
    modalFiltrosEl.classList.remove("aberto");
    document.body.style.overflow = "";
    botaoFiltroOrigem?.focus?.();
  }

  // abre o modal em QUALQUER botão de filtro
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(FILTRO_BTN_SELECTOR);
    if (!btn) return;
    if (isMapaDeSalas) return; // mapa tem filtro próprio
    e.preventDefault();
    abrirModalFiltros(btn);
  }, true);

  // init do módulo de filtros
  if (!isMapaDeSalas) {
    carregarFiltrosPersistidos();
    atualizarIndicadorFiltro();
    aplicarFiltrosNaPagina();
  }


  /* =====================================================
     TRANSIÇÃO ENTRE PÁGINAS (GLOBAL, DIRECIONAL, EXIT+ENTER)
  ===================================================== */
  (function paginaTransicaoDirecional(){
    const DURATION = 150; // ajuste pra bater com seu --transicao-pagina-dur

    function getMenuItems(){
      return Array.from(document.querySelectorAll(".barra-lateral .nav-lateral .item-nav"));
    }

    function getIndexFromLi(li){
      const items = getMenuItems();
      return items.indexOf(li);
    }

    function getCurrentIndex(){
      const items = getMenuItems();
      const ativo = document.querySelector(".barra-lateral .nav-lateral .item-nav.ativo");
      if (ativo) return getIndexFromLi(ativo);

      const here = new URL(window.location.href);
      for (let i = 0; i < items.length; i++){
        const a = items[i].querySelector("a[href]");
        if (!a) continue;
        try{
          const u = new URL(a.getAttribute("href"), here);
          if (u.pathname === here.pathname) return i;
        }catch{}
      }
      return -1;
    }

    // ENTER: aplica a animação na página nova (uma vez)
    (function aplicarEntrada(){
      const dir = sessionStorage.getItem("ui:transicaoDirecao");
      if (!dir) return;

      sessionStorage.removeItem("ui:transicaoDirecao");
      document.body.classList.remove("entrada-pagina--up", "entrada-pagina--down");
      document.body.classList.add(dir === "up" ? "entrada-pagina--up" : "entrada-pagina--down");

      window.setTimeout(() => {
        document.body.classList.remove("entrada-pagina--up", "entrada-pagina--down");
      }, DURATION + 120);
    })();

    window.addEventListener("pageshow", () => {
      document.body.classList.remove("transicao-pagina--up", "transicao-pagina--down");
    });

    document.addEventListener("click", (e) => {
      const a = e.target.closest(".barra-lateral .nav-lateral a");
      if (!a) return;

      if (a.target === "_blank") return;
      if (a.hasAttribute("download")) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let dest;
      try{
        dest = new URL(href, window.location.href);
        if (dest.origin !== window.location.origin) return;
        if (dest.href === window.location.href) return;
      }catch{
        return;
      }

      e.preventDefault();

      const li = a.closest(".item-nav");
      const toIndex = li ? getIndexFromLi(li) : -1;
      const fromIndex = getCurrentIndex();

      const goingDown = (fromIndex !== -1 && toIndex !== -1) ? (toIndex > fromIndex) : true;
      const dir = goingDown ? "down" : "up";

      sessionStorage.setItem("ui:transicaoDirecao", dir);

      document.body.classList.remove("menu-lateral-aberto");

      document.body.classList.remove("transicao-pagina--up", "transicao-pagina--down");
      document.body.classList.add(goingDown ? "transicao-pagina--down" : "transicao-pagina--up");

      window.setTimeout(() => {
        window.location.href = dest.href;
      }, DURATION);
    }, { capture: true });
  })();

  // INIT
  if (!isMapaDeSalas) iniciarRelogio();
  // (no mapa, o core já atualiza o relógio/filtros)

})();
