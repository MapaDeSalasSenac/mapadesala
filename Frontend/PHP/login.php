<?php
// Exibir erros para debug
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Conexão com o banco
require_once "conexao.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    // Recebe os dados do formulário
    $email = $_POST["email"] ?? '';
    $senha = $_POST["senha"] ?? '';

    if (empty($email) || empty($senha)) {
        die("Preencha todos os campos.");
    }

    // Preparar consulta com MySQLi
    $sql = "SELECT senha FROM usuarios WHERE email = ?";
    $stmt = mysqli_prepare($conexao, $sql);

    if (!$stmt) {
        die("Erro no prepare: " . mysqli_error($conexao));
    }

    mysqli_stmt_bind_param($stmt, "s", $email);
    mysqli_stmt_execute($stmt);

    $resultado = mysqli_stmt_get_result($stmt);
    $usuario = mysqli_fetch_assoc($resultado);

    if ($usuario) {
        // Comparação de senha em texto puro
        if ($senha === $usuario["senha"]) {
            // Login OK → redireciona
            header("Location: ../Paginas/mapadesala.html");
            exit;
        } else {
            echo "Senha incorreta.";
        }
    } else {
        echo "Usuário não encontrado.";
    }
}
?>
