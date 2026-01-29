<?php
require __DIR__ . "/conexao.php";

// ---------- Helpers ----------
function dayToBit($n) {
  return match($n) {
    1 => 1,   // seg
    2 => 2,   // ter
    3 => 4,   // qua
    4 => 8,   // qui
    5 => 16,  // sex
    6 => 32,  // sab
    7 => 64,  // dom
  };
}
function isDaySelected($mask, DateTime $dt) {
  $bit = dayToBit((int)$dt->format('N'));
  return (($mask & $bit) !== 0);
}

// ---------- POST ----------
$id_sala = (int)($_POST['id_sala'] ?? 0);
$id_professor = !empty($_POST['id_professor']) ? (int)$_POST['id_professor'] : null;

$nome_turma = trim($_POST['nome_turma'] ?? '');
$cod_turma  = trim($_POST['cod_turma'] ?? '');

$data_inicio = $_POST['data_inicio'] ?? '';
$turno = $_POST['turno'] ?? '';
$carga_horaria = (int)($_POST['carga_horaria'] ?? 0);

$dias = $_POST['dias_semana'] ?? [];
$map = ['seg'=>1,'ter'=>2,'qua'=>4,'qui'=>8,'sex'=>16,'sab'=>32,'dom'=>64];
$diasMask = 0;
foreach ($dias as $d) if (isset($map[$d])) $diasMask |= $map[$d];

// ---------- Validações ----------
if ($id_sala <= 0) die("Sala inválida.");
if ($nome_turma === '' || $cod_turma === '') die("Nome ou código inválidos.");
if (!$data_inicio) die("Data início inválida.");
if (!in_array($turno, ['manha','tarde','noite'], true)) die("Turno inválido.");
if ($diasMask === 0) die("Selecione ao menos um dia da semana.");
if ($carga_horaria <= 0) die("Carga horária inválida.");

// ---------- Regra das horas ----------
$horasPorEncontro = ($turno === 'noite') ? 3 : 4;
$totalEncontros = (int)ceil($carga_horaria / $horasPorEncontro);

$dt = new DateTime($data_inicio);

mysqli_begin_transaction($conexao);

try {
  // 1) Inserir turma
  $sqlTurma = "
    INSERT INTO turmas
      (id_sala, id_professor, nome_turma, cod_turma, data_inicio, carga_horaria, dias_semana, turno)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ";
  $stmt = mysqli_prepare($conexao, $sqlTurma);
  mysqli_stmt_bind_param(
    $stmt,
    "iisssiis",
    $id_sala,
    $id_professor,
    $nome_turma,
    $cod_turma,
    $data_inicio,
    $carga_horaria,
    $diasMask,
    $turno
  );
  mysqli_stmt_execute($stmt);
  $id_turma = mysqli_insert_id($conexao);

  // 2) Inserir encontros até bater a quantidade necessária
  $sqlE = "INSERT INTO turma_encontros (id_turma, id_sala, data, turno, horas) VALUES (?, ?, ?, ?, ?)";
  $stmtE = mysqli_prepare($conexao, $sqlE);

  $encontrosCriados = 0;
  $ultimaData = null;

  // limite de segurança (evita loop infinito se alguém marcar 0 dias)
  $maxDias = 366 * 3; // até 3 anos de tentativa
  $tentativas = 0;

  while ($encontrosCriados < $totalEncontros) {
    if (++$tentativas > $maxDias) {
      throw new Exception("Não consegui gerar encontros (verifique dias/turno/data).");
    }

    if (isDaySelected($diasMask, $dt)) {
      $dataStr = $dt->format('Y-m-d');

      $restante = $carga_horaria - ($encontrosCriados * $horasPorEncontro);
      $horasDoDia = min($horasPorEncontro, $restante);

      mysqli_stmt_bind_param($stmtE, "iissi", $id_turma, $id_sala, $dataStr, $turno, $horasDoDia);
      mysqli_stmt_execute($stmtE); // se conflitar com uk_sala_data_turno, explode aqui

      $encontrosCriados++;
      $ultimaData = $dataStr;
    }

    $dt->modify('+1 day');
  }

  mysqli_commit($conexao);

  echo "<h2>✅ Turma cadastrada!</h2>";
  echo "<p><b>ID Turma:</b> {$id_turma}</p>";
  echo "<p><b>Carga horária:</b> {$carga_horaria}h</p>";
  echo "<p><b>Horas por encontro:</b> {$horasPorEncontro}h</p>";
  echo "<p><b>Total de encontros:</b> {$encontrosCriados}</p>";
  echo "<p><b>Último encontro:</b> {$ultimaData}</p>";
  echo "<a href='cadastrar_turma.php'>Cadastrar outra</a>";

} catch (Throwable $e) {
  mysqli_rollback($conexao);

  if (str_contains($e->getMessage(), 'uk_sala_data_turno')) {
    echo "<h2>❌ Conflito de sala</h2>";
    echo "<p>Essa sala já está ocupada em algum dia desse turno dentro do calendário gerado.</p>";
  } else {
    echo "<h2>❌ Erro</h2>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
  }

  echo "<br><a href='cadastrar_turma.php'>Voltar</a>";
}
