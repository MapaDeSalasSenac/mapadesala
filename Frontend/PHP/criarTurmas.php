<?php
require 'conexao.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $nomeSala  = $_POST["nomeSala"];
    $capacidade = $_POST["capacidade"];

    $sql = "INSERT INTO salas (nome_sala, capacidade) VALUES (?, ?)";
    $stmt = $conexao->prepare($sql);
    $stmt->bind_param("si", $nomeSala, $capacidade);

    if ($stmt->execute()) {
        echo "Usuário cadastrado com sucesso!";
        header ('Location: ../Paginas/turmas.php');
    } else {
        echo "Erro ao salvar.";
    }

    $stmt->close();
    $conexao->close();
}
?>
