<?php
require "conexao.php";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id = $_POST['id_sala'] ?? '';

    if (!empty($id)) {
        // Prepara a remoção
        $stmt = $conexao->prepare("DELETE FROM salas WHERE id_sala = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            // Sucesso
            header("Location: ../PAGINAS/salas.php?status=excluido");
        } else {
            // Erro de restrição (ex: sala vinculada a uma turma)
            header("Location: ../PAGINAS/salas.php?status=erro&msg=vinculo");
        }
        $stmt->close();
    } else {
        header("Location: ../PAGINAS/salas.php?status=erro");
    }
}
$conexao->close();
exit();