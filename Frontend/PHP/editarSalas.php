<?php
require "conexao.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id_sala'] ?? '';
    $nome = $_POST['nomeSala'] ?? '';
    $capacidade = $_POST['capacidade'] ?? '';

    // Verifica se os campos estão realmente preenchidos
    if (!empty($id) && !empty($nome) && !empty($capacidade)) {
        
        // Ajustado para usar id_sala conforme seu SELECT
        $stmt = $conexao->prepare("UPDATE salas SET nome_sala = ?, capacidade = ? WHERE id_sala = ?");
        $stmt->bind_param("sii", $nome, $capacidade, $id);

        if ($stmt->execute()) {
            header("Location: ../PAGINAS/salas.php?status=sucesso");
        } else {
            header("Location: ../PAGINAS/salas.php?status=erro&msg=banco");
        }
        $stmt->close();
    } else {
        // Agora o erro volta para a página principal
        header("Location: ../PAGINAS/salas.php?status=erro&msg=campos_vazios");
    }
}
$conexao->close();
exit();