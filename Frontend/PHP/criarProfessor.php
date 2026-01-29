<?php
require 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nomeProfessor  = $_POST["nomeProfessor"];
    $funcao = $_POST['funcao'];

    $sql = "INSERT INTO professores (nome, funcao) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("ss", $nomeProfessor, $funcao);

    if ($stmt->execute()) {
        header ('Location: ../professores.php');
    } else {
        echo "Erro ao salvar.";
    }

    $stmt->close();
    $conexao->close();
}
?>