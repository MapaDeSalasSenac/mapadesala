<?php
require "../PHP/conexao.php";

// Busca salas e professores já cadastrados
$salas = $conexao->query("SELECT id_sala, nome_sala, capacidade FROM salas ORDER BY nome_sala ASC")
  ->fetch_all(MYSQLI_ASSOC);

$professores = $conexao->query("SELECT id_professor, nome, funcao FROM professores ORDER BY nome ASC")
  ->fetch_all(MYSQLI_ASSOC);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Turma - Senac MA</title>
    <link rel="stylesheet" href="../CSS/mapadesala.css">
    <link rel="stylesheet" href="../CSS/turmas.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="../JS/turmas.js" defer></script>
    <style>
    .box{border:1px solid #ddd; border-radius:10px; padding:12px;}
    label{display:block; font-weight:600; margin-top:8px;}
    input, select{width:100%; padding:10px; margin-top:6px;}
    .dias{display:flex; flex-wrap:wrap; gap:10px; margin-top:8px;}
    .dias label{font-weight:500; margin-top:0; display:flex; align-items:center; gap:6px;}
    .actions{margin-top:12px; display:flex; gap:10px;}
    button{padding:10px 14px; border:0; border-radius:10px; cursor:pointer;}
    button[type="submit"]{background:#2b7; color:#fff;}
    button[type="button"]{background:#eee;}
    #preview{margin-top:12px; white-space:pre-wrap; font-family:ui-monospace, monospace;}
    .warn{color:#b00; font-weight:700;}
    .ok{color:#070; font-weight:700;}
  </style>
</head>
<body>
        <header class="topbar">
        <button class="menu-toggle" aria-label="Abrir menu">☰</button>
        <div class="topbar-logo">
            <img src="../IMG/senac_logo_branco.png" alt="Senac">
        </div>
        <button class="user-button" aria-label="Usuário">👤</button>
    </header>

    <!-- SIDEBAR AZUL -->
    <aside class="sidebar">
        <nav class="sidebar-nav">
            <ul>
         <li class="nav-item active"><a href="mapadesala.html" class="side-bar-content">Mapa de Salas</a></li>
        <li class="nav-item"><a href="professores.php" class="side-bar-content">Professores</a></li>
        <li class="nav-item"><a href="salas.php" class="side-bar-content">Salas</a></li>
        <li class="nav-item"><a href="turmas.php" class="side-bar-content">Turmas</a></li>
            </ul>
        </nav>
    </aside>

    <main class="container">
    <div class="header-page">
      <h1>Turmas</h1>

      <div class="actions-bar">
        <button class="btn-icon btn-add" title="Adicionar Turma" id="btnAbrir">+</button>
        <button class="btn-icon btn-filter" title="Filtrar professores">🔍</button>
      </div>
    </div>



    <div class="cards" id="listaProfessores">

      <!-- CARD EXEMPLO (JS VAI SUBSTITUIR) -->
      <div class="card" data-id="12">
        <button class="btn-edit" title="Editar Turma">✏️</button>

        <h3 class="card-h3">Nome da Turma</h3>
        <div class="line"></div>

        <div class="info">
          <p class=content-info">Código da turma</p>
          <div class="line"></div>
          <p class=content-info">Professor</p>
          <div class="line"></div>
          <p class=content-info">Turno</p>
          <div class="line"></div>
          <p class="content-info">Sala</p>
        </div>
      </div>

    </div>
    </main>

    <div class="modal" id="meuModal" aria-hidden="true">
    <div class="modal__backdrop" data-close></div>

    <div class="modal__content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header class="modal__header">
        <h2 id="modalTitle">Cadastrar Professor</h2>
        <button class="modal__close" aria-label="Fechar" data-close>×</button>
        </header>

    <div class="modal__body">
      <div class="grid">
  <div class="box">
    <form id="formTurma" action="../PHP/salvar_turma.php" method="POST">

      <label>Sala</label>
      <select name="id_sala" id="id_sala" required>
        <option value="">Selecione...</option>
        <?php foreach($salas as $s): ?>
          <option value="<?= (int)$s['id_sala'] ?>">
            <?= htmlspecialchars($s['nome_sala']) ?> (<?= (int)$s['capacidade'] ?>)
          </option>
        <?php endforeach; ?>
      </select>

      <label>Professor</label>
      <select name="id_professor" id="id_professor">
        <option value="">(Sem professor)</option>
        <?php foreach($professores as $p): ?>
          <option value="<?= (int)$p['id_professor'] ?>">
            <?= htmlspecialchars($p['nome']) ?> - <?= htmlspecialchars($p['funcao']) ?>
          </option>
        <?php endforeach; ?>
      </select>

      <label>Nome da turma</label>
      <input type="text" name="nome_turma" id="nome_turma" required placeholder="Ex: Informática Básica">

      <label>Código da turma</label>
      <input type="text" name="cod_turma" id="cod_turma" required placeholder="Ex: INF-2026-01">

      <label>Data de início</label>
      <input type="date" name="data_inicio" id="data_inicio" required>

      <label>Carga horária (em horas)</label>
      <input type="number" name="carga_horaria" id="carga_horaria" min="1" required placeholder="Ex: 80">


      <label>Dias da semana</label>
      <div class="dias">
        <label><input type="checkbox" name="dias_semana[]" value="seg"> Seg</label>
        <label><input type="checkbox" name="dias_semana[]" value="ter"> Ter</label>
        <label><input type="checkbox" name="dias_semana[]" value="qua"> Qua</label>
        <label><input type="checkbox" name="dias_semana[]" value="qui"> Qui</label>
        <label><input type="checkbox" name="dias_semana[]" value="sex"> Sex</label>
      </div>

      <label>Turno</label>
      <select name="turno" id="turno" required>
        <option value="">Selecione...</option>
        <option value="manha">Manhã</option>
        <option value="tarde">Tarde</option>
        <option value="noite">Noite</option>
      </select>

      <div class="actions">
        <button type="submit">✅ Cadastrar</button>
        <button type="button" id="btnPreview">📅 Pré-visualizar</button>
      </div>

      <div id="preview"></div>
    </form>
  </div>
</div>
    </div>

    <footer class="modal__footer">
      <button data-close>Fechar</button>
      <button>Confirmar</button>
    </footer>
  </div>
</div>
<script>
  // Mapeia dias para números 1..7 (seg..dom)
  const mapDay = { seg:1, ter:2, qua:3, qui:4, sex:5, sab:6, dom:7 };

  const elPreview = document.getElementById('preview');

  function getCheckedDays() {
    return Array.from(document.querySelectorAll('input[name="dias_semana[]"]:checked'))
      .map(i => i.value);
  }

  function fmtISO(d) {
    return d.toISOString().slice(0, 10);
  }

  // JS getDay(): 0=Dom..6=Sab -> converter p/ 1=Seg..7=Dom
  function jsDayToISOWeekday(d) {
    return ((d.getDay() + 6) % 7) + 1;
  }

  function gerarCalendarioPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados }) {
    const horasPorEncontro = (turno === 'noite') ? 3 : 4;
    const totalEncontros = Math.ceil(cargaHoraria / horasPorEncontro);

    const diasSet = new Set(diasSelecionados.map(d => mapDay[d]).filter(Boolean));
    const datas = [];

    // Segurança: evita loop infinito
    const maxDias = 366 * 3; // tenta até 3 anos
    let tentativas = 0;

    let d = new Date(inicioISO + "T00:00:00");
    while (datas.length < totalEncontros) {
      if (++tentativas > maxDias) {
        throw new Error("Não consegui gerar datas (verifique dias e data de início).");
      }

      const weekday = jsDayToISOWeekday(d);
      if (diasSet.has(weekday)) {
        datas.push(fmtISO(d));
      }

      d.setDate(d.getDate() + 1);
    }

    // Horas do último encontro (pode ser menor)
    const horasUltimo = cargaHoraria - ((totalEncontros - 1) * horasPorEncontro);

    return {
      horasPorEncontro,
      totalEncontros,
      datas,
      primeiraData: datas[0],
      ultimaData: datas[datas.length - 1],
      horasUltimo
    };
  }

  function renderPreview() {
    const inicioISO = document.getElementById('data_inicio')?.value;
    const cargaHoraria = parseInt(document.getElementById('carga_horaria')?.value || '0', 10);
    const turno = document.getElementById('turno')?.value;
    const diasSelecionados = getCheckedDays();

    if (!inicioISO || !cargaHoraria || !turno || diasSelecionados.length === 0) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:700;">
        Preencha: data início, carga horária, turno e dias da semana.
      </span>`;
      return;
    }

    try {
      const r = gerarCalendarioPorHoras({ inicioISO, cargaHoraria, turno, diasSelecionados });

      const avisoUltimo = (r.horasUltimo < r.horasPorEncontro)
        ? `<div style="margin-top:8px;color:#b00;font-weight:700;">
             ⚠️ Último encontro terá ${r.horasUltimo}h (porque não fecha ${r.horasPorEncontro}h certinho).
           </div>`
        : '';

      elPreview.innerHTML = `
        <div style="color:#070;font-weight:800;">✅ Prévia do calendário</div>
        <div><b>Carga horária:</b> ${cargaHoraria}h</div>
        <div><b>Turno:</b> ${turno}</div>
        <div><b>Horas por encontro:</b> ${r.horasPorEncontro}h</div>
        <div><b>Total de encontros:</b> ${r.totalEncontros}</div>
        <div><b>Primeiro:</b> ${r.primeiraData} | <b>Último:</b> ${r.ultimaData}</div>
        ${avisoUltimo}
        <div style="margin-top:10px;"><b>Datas:</b><br>${r.datas.join(", ")}</div>
      `;
    } catch (err) {
      elPreview.innerHTML = `<span style="color:#b00;font-weight:700;">
        Erro no preview: ${String(err.message || err)}
      </span>`;
    }
  }

  // Botão preview
  document.getElementById('btnPreview')?.addEventListener('click', renderPreview);

  // Atualiza automaticamente quando mexer
  document.addEventListener('input', (e) => {
    if (
      e.target.id === 'data_inicio' ||
      e.target.id === 'carga_horaria' ||
      e.target.id === 'turno' ||
      e.target.name === 'dias_semana[]'
    ) {
      renderPreview();
    }
  });
</script>

</body>
</html>