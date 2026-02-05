<?php
require 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id = isset($_POST["idProfessor"]) ? (int)$_POST["idProfessor"] : 0;

    $nomeProfessor = $_POST["nomeProfessor"] ?? "";
    $formacao = $_POST["formacao"] ?? "";
    $telefone = $_POST["telefone"] ?? "";
    $email = $_POST["email"] ?? "";
    $cursosComp = $_POST["cursosCompl"] ?? "";

    if ($id > 0) {
        // UPDATE
        $sql = "UPDATE professores
                SET nome = ?, formacao = ?, telefone = ?, email = ?, cursos_complementares = ?
                WHERE id_professor = ?";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("sssssi", $nomeProfessor, $formacao, $telefone, $email, $cursosComp, $id);
    } else {
        // INSERT
        $sql = "INSERT INTO professores (nome, formacao, telefone, email, cursos_complementares)
                VALUES (?, ?, ?, ?, ?)";
        $stmt = $conexao->prepare($sql);
        $stmt->bind_param("sssss", $nomeProfessor, $formacao, $telefone, $email, $cursosComp);
    }

    if ($stmt->execute()) {
        header('Location: ../Paginas/professores.php');
        exit;
    } else {
        echo "Erro ao salvar.";
    }

    $stmt->close();
    $conexao->close();
}
?>