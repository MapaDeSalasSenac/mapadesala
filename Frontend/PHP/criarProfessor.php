<?php
require 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nomeProfessor  = $_POST["nomeProfessor"];
    $formacao = $_POST['formacao'];
    $telefone = $_POST['telefone'];
    $email = $_POST['email'];
    $cursosComp = $_POST['cursosCompl'];

    $sql = "INSERT INTO professores (nome, formacao, telefone, email, cursos_complementares) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("sssss", $nomeProfessor, $formacao, $telofone, $email, $cursosComp);

    if ($stmt->execute()) {
        header ('Location: ../Paginas/professores.php');
    } else {
        echo "Erro ao salvar.";
    }

    $stmt->close();
    $conexao->close();
}
?>