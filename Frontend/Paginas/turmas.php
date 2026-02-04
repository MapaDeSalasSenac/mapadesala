<?php
require "../PHP/conexao.php";

// SALAS
$salas = [];
$q1 = mysqli_query($conexao, "SELECT id_sala, nome_sala, capacidade FROM salas ORDER BY nome_sala ASC");
while ($row = mysqli_fetch_assoc($q1)) {
  $salas[] = $row;
}

// PROFESSORES
$professores = [];
$q2 = mysqli_query($conexao, "SELECT id_professor, nome, formacao FROM professores ORDER BY nome ASC");
while ($row = mysqli_fetch_assoc($q2)) {
  $professores[] = $row;
}

$sql = "
  SELECT
    t.id_turma,
    t.nome_turma,
    t.cod_turma,
    t.turno,
    t.atividade_externa,
    t.carga_horaria,

    p.nome AS professor_nome,
    s.nome_sala AS sala_nome,

    (
      SELECT MAX(te.data)
      FROM turma_encontros te
      WHERE te.id_turma = t.id_turma
        AND te.status = 'marcado'
    ) AS data_fim,

    (
      SELECT COUNT(*)
      FROM turma_encontros te
      WHERE te.id_turma = t.id_turma
        AND te.status = 'marcado'
        AND te.data >= CURDATE()
    ) AS aulas_restantes,

    (
      SELECT COALESCE(SUM(te.horas), 0)
      FROM turma_encontros te
      WHERE te.id_turma = t.id_turma
        AND te.status = 'marcado'
        AND te.data >= CURDATE()
    ) AS horas_restantes,

    (
      SELECT COALESCE(SUM(te.horas), 0)
      FROM turma_encontros te
      WHERE te.id_turma = t.id_turma
        AND te.status = 'marcado'
        AND te.data < CURDATE()
    ) AS horas_realizadas

  FROM turmas t
  LEFT JOIN professores p ON p.id_professor = t.id_professor
  LEFT JOIN salas s ON s.id_sala = t.id_sala
  ORDER BY t.id_turma DESC
";

$result = mysqli_query($conexao, $sql);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Turmas - Senac MA</title>
  <link rel="stylesheet" href="../CSS/turmas.css" />
  <link rel="stylesheet" href="../CSS/padrao.css" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="../JS/padrao.js" defer></script>
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
    .modal {
      width: 100%;
      background:none;
    }
  </style>
</head>

<body>
  <!-- TOPBAR PADRÃO -->
  <header class="barra-topo">
    <button class="botao-menu" id="botao-menu" aria-label="Abrir menu" aria-expanded="false">☰</button>

    <div class="logo-topo">
      <img src="../IMG/senac_logo_branco.png" alt="Senac" />
    </div>

    <button class="botao-usuario" id="botao-usuario" aria-label="Usuário" aria-expanded="false">👤</button>
  </header>

  <!-- SIDEBAR PADRÃO -->
  <aside class="barra-lateral">
    <nav class="nav-lateral">
      <ul>
        <li class="item-nav"><a href="mapadesala.html" class="conteudo-barra-lateral">Mapa de Salas</a></li>
        <li class="item-nav"><a href="professores.php" class="conteudo-barra-lateral">Professores</a></li>
        <li class="item-nav"><a href="salas.php" class="conteudo-barra-lateral">Salas</a></li>
        <li class="item-nav ativo"><a href="turmas.php" class="conteudo-barra-lateral">Turmas</a></li>
      </ul>
    </nav>

    <div class="rodape-lateral">
      <div class="relogio-lateral" id="relogio-lateral">--:--</div>
      <div class="creditos-lateral">Desenvolvido pela Turma Técnico de Informatica para a Internet</div>
    </div>
  </aside>

  <!-- Overlay mobile -->
  <div class="sobreposicao-mobile"></div>

  <!-- CONTEÚDO -->
  <main class="conteudo-principal container">
    <section class="pagina-turmas">
      <div class="header-page">
        <h1>Turmas</h1>

        <div class="actions-bar">
          <button class="btn-icon btn-add" title="Adicionar Turma" id="btnAbrir">+</button>
          <button class="botao-icone botao-filtro" type="button" data-abrir-filtros title="Filtros">
            <img src="../IMG/filtro.png" alt="Filtro" style="width:22px;height:22px;">
          </button>
        </div>
      </div>

      <div class="cards" id="listaTurmas">
        <?php if (mysqli_num_rows($result) == 0): ?>
          <p>Nenhuma turma cadastrada.</p>
        <?php else: ?>
          <?php while ($t = mysqli_fetch_assoc($result) ):
            $carga = (int)($t['carga_horaria'] ?? 0);
            $horasRealizadas = (int)($t['horas_realizadas'] ?? 0);
            $horasRestantes  = (int)($t['horas_restantes'] ?? 0);
            $aulasRestantes  = (int)($t['aulas_restantes'] ?? 0);

            $progresso = 0;
            if ($carga > 0) {
              $progresso = (int) round(($horasRealizadas / $carga) * 100);
              if ($progresso < 0) $progresso = 0;
              if ($progresso > 100) $progresso = 100;
            }

            $diasRestantes = null;
            if (!empty($t['data_fim'])) {
              $hoje = new DateTime('today');
              $fim  = new DateTime($t['data_fim']);
              $diasRestantes = ($fim < $hoje) ? 0 : (int)$hoje->diff($fim)->days;
            }
          ?>
            <div class="card" data-id="<?= (int)$t['id_turma'] ?>">
              <button class="btn-edit" title="Editar Turma" data-id="<?= (int)$t['id_turma'] ?>">✏️</button>

              <h3 class="card-h3"><?= htmlspecialchars($t['nome_turma']) ?></h3>
              <div class="line"></div>

              <div class="info">
                <p class="content-info"><b>Código da Turma:</b> <?= htmlspecialchars($t['cod_turma']) ?></p>
                <div class="line"></div>

                <p class="content-info"><b>Professor:</b> <?= $t['professor_nome'] ? htmlspecialchars($t['professor_nome']) : "—" ?></p>
                <div class="line"></div>

                <p class="content-info p_turno"><b>Turno:</b> <?= htmlspecialchars($t['turno']) ?></p>
                <div class="line"></div>

                <p class="content-info"><b>Sala:</b>
                  <?php if ((int)$t['atividade_externa'] === 1): ?>
                    Atividade externa
                  <?php else: ?>
                    <?= $t['sala_nome'] ? htmlspecialchars($t['sala_nome']) : "—" ?>
                  <?php endif; ?>
                </p>
                <div class="line"></div>

                <p class="content-info"><b>Horas restantes:</b> <?= $horasRestantes ?>h</p>
                <div class="line"></div>

                <p class="content-info"><b>Aulas restantes:</b> <?= $aulasRestantes ?></p>
                <div class="line"></div>

                <p class="content-info"><b>Dias restantes:</b> <?= $diasRestantes !== null ? $diasRestantes." dia(s)" : "—" ?></p>
                <div class="line"></div>

                <p class="content-info"><b>Progresso:</b> <?= $progresso ?>%</p>

                <div style="margin-top:8px; border:1px solid #ddd; border-radius:10px; overflow:hidden; height:14px;">
                  <div style="height:14px; width: <?= $progresso ?>%; background: #2b7;"></div>
                </div>

                <p class="content-info" style="margin-top:8px;">
                  <small><?= $horasRealizadas ?>h feitas de <?= $carga ?>h</small>
                </p>
              </div>
            </div>
          <?php endwhile; ?>
        <?php endif; ?>
      </div>
    </section>
  </main>

  <!-- MODAL -->
  <div class="modal" id="meuModal">
    <div class="modal__content">
        <div class="modal__header">
            <h2>Adicionar Turma</h2>
            <button class="modal__close" data-close>×</button>
        </div>
        
        <div class="modal__body">
            <form id="formTurma" action="../PHP/salvar_turma.php" method="POST">
                <div class="form-row">
                    <div class="form-group">
                        <label>Sala</label>
                        <select name="id_sala" id="id_sala" required>
                            <option value="">Selecione...</option>
                            <?php foreach($salas as $s): ?>
                                <option value="<?= (int)$s['id_sala'] ?>">
                                    <?= htmlspecialchars($s['nome_sala']) ?> (<?= (int)$s['capacidade'] ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Professor</label>
                        <select name="id_professor" id="id_professor">
                            <option value="">(Sem professor)</option>
                            <?php foreach($professores as $p): ?>
                                <option value="<?= (int)$p['id_professor'] ?>">
                                    <?= htmlspecialchars($p['nome']) ?> - <?= htmlspecialchars($p['formacao']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Nome da turma</label>
                        <input type="text" name="nome_turma" id="nome_turma" required placeholder="Ex: Informática Básica">
                    </div>
                    <div class="form-group">
                        <label>Código da turma</label>
                        <input type="text" name="cod_turma" id="cod_turma" required placeholder="Ex: INF-2026-01">
                    </div>
                </div>

                <div class="atv-externa">
                    <input type="checkbox" id="atividade_externa" name="atividade_externa" value="1">
                    <label for="atividade_externa" style="display:inline; font-size: 12px; font-weight: 500;">
                        Atividade externa (não reserva sala, mas ocupa o professor)
                    </label>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Data de início</label>
                        <input type="date" name="data_inicio" id="data_inicio" required>
                    </div>
                    <div class="form-group">
                        <label>Carga horária</label>
                        <input type="number" name="carga_horaria" id="carga_horaria" min="1" required placeholder="Ex: 80">
                    </div>
                    <div class="form-group">
                        <label>Turno</label>
                        <select name="turno" id="turno" required>
                            <option value="">Selecione...</option>
                            <option value="manha">Manhã</option>
                            <option value="tarde">Tarde</option>
                            <option value="noite">Noite</option>
                        </select>
                    </div>
                </div>

                <label>Dias da semana</label>
                <div class="dias">
                    <label><input type="checkbox" name="dias_semana[]" value="seg"> Seg</label>
                    <label><input type="checkbox" name="dias_semana[]" value="ter"> Ter</label>
                    <label><input type="checkbox" name="dias_semana[]" value="qua"> Qua</label>
                    <label><input type="checkbox" name="dias_semana[]" value="qui"> Qui</label>
                    <label><input type="checkbox" name="dias_semana[]" value="sex"> Sex</label>
                </div>

                <div class="actions">
                    <button type="submit" class="btn-submit">✅ Cadastrar</button>
                    <button type="button" id="btnPreview" class="btn-preview">📅 Pré-visualizar</button>
                </div>

                <div id="preview"></div>
            </form>
        </div>
    </div>
</div>
</body>
</html>
