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
$qtd_semanas = (int)($_POST['qtd_semanas'] ?? 0);
$turno = $_POST['turno'] ?? '';

$dias = $_POST['dias_semana'] ?? [];
$map = ['seg'=>1,'ter'=>2,'qua'=>4,'qui'=>8,'sex'=>16,'sab'=>32,'dom'=>64];

$diasMask = 0;
foreach ($dias as $d) {
  if (isset($map[$d])) $diasMask |= $map[$d];
}

// ---------- Validações ----------
if ($id_sala <= 0) die("Sala inválida.");
if ($nome_turma === '' || $cod_turma === '') die("Nome ou código inválidos.");
if (!$data_inicio) die("Data início inválida.");
if ($qtd_semanas <= 0) die("Quantidade de semanas inválida.");
if (!in_array($turno, ['manha','tarde','noite'])) die("Turno inválido.");
if ($diasMask === 0) die("Selecione ao menos um dia da semana.");

// ---------- Datas ----------
$dtInicio = new DateTime($data_inicio);
$dtFim = (clone $dtInicio)->modify('+' . ($qtd_semanas * 7 - 1) . ' days');

mysqli_begin_transaction($conexao);

try {
  // 1) Turma
  $sqlTurma = "
    INSERT INTO turmas
      (id_sala, id_professor, nome_turma, cod_turma, data_inicio, qtd_semanas, dias_semana, turno)
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
    $qtd_semanas,
    $diasMask,
    $turno
  );
  mysqli_stmt_execute($stmt);

  $id_turma = mysqli_insert_id($conexao);

  // 2) Encontros
  $sqlEncontro = "
    INSERT INTO turma_encontros (id_turma, id_sala, data, turno)
    VALUES (?, ?, ?, ?)
  ";

  $stmtE = mysqli_prepare($conexao, $sqlEncontro);

  $dt = clone $dtInicio;
  $total = 0;
  $ultima = null;

  while ($dt <= $dtFim) {
    if (isDaySelected($diasMask, $dt)) {
      $dataStr = $dt->format('Y-m-d');
      mysqli_stmt_bind_param($stmtE, "iiss", $id_turma, $id_sala, $dataStr, $turno);
      mysqli_stmt_execute($stmtE);
      $total++;
      $ultima = $dataStr;
    }
    $dt->modify('+1 day');
  }

  if ($total === 0) {
    throw new Exception("Nenhum encontro gerado.");
  }

  mysqli_commit($conexao);

  echo "<h2>✅ Turma cadastrada!</h2>";
  echo "<p>Encontros gerados: <b>{$total}</b></p>";
  echo "<p>Último encontro: <b>{$ultima}</b></p>";
  echo "<a href='cadastrar_turma.php'>Cadastrar outra</a>";

} catch (Throwable $e) {
  mysqli_rollback($conexao);

  if (str_contains($e->getMessage(), 'uk_sala_data_turno')) {
    echo "<h2>❌ Conflito de sala</h2>";
    echo "<p>Essa sala já está ocupada nesse dia e turno.</p>";
  } else {
    echo "<h2>❌ Erro</h2>";
    echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
  }

  echo "<br><a href='cadastrar_turma.php'>Voltar</a>";
}
