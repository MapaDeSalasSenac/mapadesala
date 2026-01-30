<?php
// Frontend/api/mapa_salas.php
require __DIR__ . "/../PHP/conexao.php";

header("Content-Type: application/json; charset=utf-8");

function bad($msg) {
  http_response_code(400);
  echo json_encode(["ok" => false, "error" => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$start = $_GET["start"] ?? null; // YYYY-MM-DD
$end   = $_GET["end"] ?? null;   // YYYY-MM-DD

if (!$start || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $start)) bad("start inválido (YYYY-MM-DD)");
if (!$end   || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $end)) bad("end inválido (YYYY-MM-DD)");

// 1) SALAS
$salas = [];
$q1 = mysqli_query($conexao, "SELECT id_sala, nome_sala FROM salas ORDER BY nome_sala ASC");
if (!$q1) bad("Erro ao buscar salas: " . mysqli_error($conexao));

while ($r = mysqli_fetch_assoc($q1)) {
  $salas[] = [
    "id" => (int)$r["id_sala"],
    "nome" => $r["nome_sala"],
    "tipo" => "Sala", // se você tiver uma coluna tipo depois, troca aqui
  ];
}

// 2) AGENDAMENTOS
// ✅ NÃO filtra por CURDATE() → mostra passado também
$sql = "
  SELECT
    te.id_sala,
    te.data,
    te.turno,
    p.nome AS professor_nome,
    t.nome_turma,
    t.cod_turma,
    t.atividade_externa
  FROM turma_encontros te
  JOIN turmas t ON t.id_turma = te.id_turma
  JOIN professores p ON p.id_professor = te.id_professor
  WHERE te.status = 'marcado'
    AND te.data >= ?
    AND te.data <= ?
";

$stmt = mysqli_prepare($conexao, $sql);
if (!$stmt) bad("Erro prepare: " . mysqli_error($conexao));

mysqli_stmt_bind_param($stmt, "ss", $start, $end);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);

// Seu JS usa: matutino/vespertino/noturno
$turnoMap = [
  "manha" => "matutino",
  "tarde" => "vespertino",
  "noite" => "noturno",
];

$agendamentos = [];
while ($r = mysqli_fetch_assoc($res)) {
  // atividade externa pode vir sem sala -> não ocupa sala, então não entra no mapa
  if (empty($r["id_sala"])) continue;

  $agendamentos[] = [
    "salaId" => (int)$r["id_sala"],
    "data" => $r["data"], // YYYY-MM-DD
    "turno" => $turnoMap[$r["turno"]] ?? $r["turno"],
    "professor" => $r["professor_nome"] ?? "",
    "curso" => $r["nome_turma"] ?? "",
    "codigoTurma" => $r["cod_turma"] ?? "",
  ];
}

echo json_encode([
  "ok" => true,
  "salas" => $salas,
  "agendamentos" => $agendamentos
], JSON_UNESCAPED_UNICODE);
?>