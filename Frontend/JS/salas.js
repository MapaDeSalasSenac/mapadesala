(() => {
  const modalCriar = document.getElementById("meuModal");
  const modalEditar = document.getElementById("modalEditar");
  const modalExcluir = document.getElementById("modalExcluir");

  const btnAbrir = document.getElementById("btnAbrir");

  function setOpen(modalEl, open) {
    if (!modalEl) return;
    modalEl.classList.toggle("is-open", open);
    modalEl.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("no-scroll", open);
  }

  function abrirModalCriar() { setOpen(modalCriar, true); }
  function fecharModalCriar() { setOpen(modalCriar, false); btnAbrir?.focus(); }

  // Expostas pro onclick no HTML:
  window.abrirModalEdicao = function (botao) {
    // Preenche os dados
    document.getElementById("edit_id").value = botao.getAttribute("data-id") || "";
    document.getElementById("edit_nome").value = botao.getAttribute("data-nome") || "";
    document.getElementById("edit_capacidade").value = botao.getAttribute("data-capacidade") || "";
    setOpen(modalEditar, true);
  };

  window.abrirModalExcluir = function (botao) {
    document.getElementById("delete_id").value = botao.getAttribute("data-id") || "";
    document.getElementById("nomeSalaExcluir").innerText = botao.getAttribute("data-nome") || "";
    setOpen(modalExcluir, true);
  };

  function fecharModalEditar() { setOpen(modalEditar, false); }
  function fecharModalExcluir() { setOpen(modalExcluir, false); }

  btnAbrir?.addEventListener("click", abrirModalCriar);

  // Fechar pelos botões/backdrop (data-close)
  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close]");
    if (!close) return;

    if (modalCriar?.classList.contains("is-open") && modalCriar.contains(close)) fecharModalCriar();
    if (modalEditar?.classList.contains("is-open") && modalEditar.contains(close)) fecharModalEditar();
    if (modalExcluir?.classList.contains("is-open") && modalExcluir.contains(close)) fecharModalExcluir();
  });

  // ESC fecha o que estiver aberto
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modalExcluir?.classList.contains("is-open")) fecharModalExcluir();
    else if (modalEditar?.classList.contains("is-open")) fecharModalEditar();
    else if (modalCriar?.classList.contains("is-open")) fecharModalCriar();
  });
})();
