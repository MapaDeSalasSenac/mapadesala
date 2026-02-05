<?php
require "conexao.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $id = (int)($_POST["id_professor"] ?? 0);
  if ($id <= 0) {
    header("Location: ../Paginas/professores.php?status=erro");
    exit;
  }

  $stmt = $conexao->prepare("DELETE FROM professores WHERE id_professor = ?");
  $stmt->bind_param("i", $id);

  if ($stmt->execute()) {
    header("Location: ../Paginas/professores.php?status=excluido");
    exit;
  }

  header("Location: ../Paginas/professores.php?status=erro");
  exit;
}
