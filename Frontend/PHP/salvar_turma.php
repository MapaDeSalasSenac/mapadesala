<?php
require __DIR__ . "/conexao.php";

// helpers
function dayToBit($n) {
  return match($n) {
    1 => 1, 2 => 2, 3 => 4, 4 => 8, 5 => 16, 6 => 32, 7 => 64
  };
}
function isDaySelected($mask, DateTime $dt) {
  $bit = dayToBit((int)$dt->format('N'));
  return (($mask & $bit) !== 0);
}

// POST
$id_sala = isset($_POST['id_sala']) && $_POST['id_sala'] !== "" ? (int)$_POST['id_sala'] : null;
$id_professor = isset($_POST['id_professor']) && $_POST['id_professor'] !== "" ? (int)$_POST['id_professor'] : null;

$nome_turma = trim($_POST['nome_turma'] ?? '');
$cod_turma  = trim($_POST['cod_turma'] ?? '');
$data_inicio = $_POST['data_inicio'] ?? '';
$turno = $_POST['turno'] ?? '';
$carga_horaria = (int)($_POST['carga_horaria'] ?? 0);

$dias = $_POST['dias_semana'] ?? [];
$map = ['seg'=>1,'ter'=>2,'qua'=>4,'qui'=>8,'sex'=>16,'sab'=>32,'dom'=>64];
$diasMask = 0;
foreach ($dias as $d) if (isset($map[$d])) $diasMask |= $map[$d];

// validações
if (!$id_professor || $id_professor <= 0) die("Professor inválido.");
if ($nome_turma === '' || $cod_turma === '') die("Nome/código inválidos.");
if (!$data_inicio) die("Data início inválida.");
if (!in_array($turno, ['manha','tarde','noite'], true)) die("Turno inválido.");
if ($carga_horaria <= 0) die("Carga horária inválida.");
if ($diasMask === 0) die("Selecione ao menos 1 dia da semana.");

if (!$id_sala || $id_sala <= 0) die("Sala inválida.");
// regra horas
$horasPorEncontro = ($turno === 'noite') ? 3 : 4;
$totalEncontros = (int)ceil($carga_horaria / $horasPorEncontro);

$dt = new DateTime($data_inicio);

mysqli_begin_transaction($conexao);

try {
  // insere turma
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

  // insere encontros
  $sqlE = "
    INSERT INTO turma_encontros (id_turma, id_sala, id_professor, data, turno, horas)
    VALUES (?, ?, ?, ?, ?, ?)
  ";
  $stmtE = mysqli_prepare($conexao, $sqlE);

  $encontrosCriados = 0;
  $ultimaData = null;

  $maxDias = 366 * 3;
  $tentativas = 0;

  while ($encontrosCriados < $totalEncontros) {
    if (++$tentativas > $maxDias) throw new Exception("Falha ao gerar datas (verifique dias/data início).");

    if (isDaySelected($diasMask, $dt)) {
      $dataStr = $dt->format('Y-m-d');

      $restante = $carga_horaria - ($encontrosCriados * $horasPorEncontro);
      $horasDoDia = min($horasPorEncontro, $restante);

      $id_sala_insert = $id_sala;
      mysqli_stmt_bind_param($stmtE, "iiissi", $id_turma, $id_sala_insert, $id_professor, $dataStr, $turno, $horasDoDia);
      mysqli_stmt_execute($stmtE); // aqui o UNIQUE impede choque de professor e/ou sala

      $encontrosCriados++;
      $ultimaData = $dataStr;
    }
    $dt->modify('+1 day');
  }

  mysqli_commit($conexao);

  echo "<h2>✅ Turma cadastrada!</h2>";  echo "<p><b>Carga horária:</b> {$carga_horaria}h</p>";
  echo "<p><b>Encontros:</b> {$encontrosCriados}</p>";
  echo "<p><b>Último encontro:</b> {$ultimaData}</p>";
  echo "<a href='cadastrar_turma.php'>Cadastrar outra</a>";

} catch (Throwable $e) {
  mysqli_rollback($conexao);

  $msg = $e->getMessage();

  if (str_contains($msg, 'uk_prof_data_turno')) {
    echo "<h2>❌ Conflito de professor</h2>";
    echo "<p>O professor já está ocupado nesse dia/turno em alguma data gerada.</p>";
  } elseif (str_contains($msg, 'uk_sala_data_turno')) {
    echo "<h2>❌ Conflito de sala</h2>";
    echo "<p>A sala já está ocupada nesse dia/turno em alguma data gerada.</p>";
  } else {
    echo "<h2>❌ Erro</h2>";
    echo "<pre>" . htmlspecialchars($msg) . "</pre>";
  }

  echo "<br><a href='cadastrar_turma.php'>Voltar</a>";
}
