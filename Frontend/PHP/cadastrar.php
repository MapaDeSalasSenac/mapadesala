<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require_once 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../Paginas/cadastro.html');
    exit;
}

$email  = $_POST['email']  ?? '';
$senha  = $_POST['senha']  ?? '';
$Csenha = $_POST['Csenha'] ?? '';

if (empty($email) || empty($senha) || empty($Csenha)) {
    die("Preencha todos os campos.");
}

if ($senha !== $Csenha) {
    die("As senhas não coincidem.");
}

/* VERIFICAR SE EMAIL JÁ EXISTE
   coluna correta: id_usuario */
$sqlCheck = "SELECT id_usuario FROM usuarios WHERE email = ?";
$stmtCheck = mysqli_prepare($conexao, $sqlCheck);

if (!$stmtCheck) {
    die("Erro no SELECT: " . mysqli_error($conexao));
}

mysqli_stmt_bind_param($stmtCheck, "s", $email);
mysqli_stmt_execute($stmtCheck);
mysqli_stmt_store_result($stmtCheck);

if (mysqli_stmt_num_rows($stmtCheck) > 0) {
    die("Este e-mail já está cadastrado.");
}

/* HASH DA SENHA */
$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

/* INSERT */
$sql = "INSERT INTO usuarios (email, senha) VALUES (?, ?)";
$stmt = mysqli_prepare($conexao, $sql);

if (!$stmt) {
    die("Erro no INSERT: " . mysqli_error($conexao));
}

mysqli_stmt_bind_param($stmt, "ss", $email, $senhaHash);

if (mysqli_stmt_execute($stmt)) {
    header("Location: ../../index.html");
    exit;
} else {
    die("Erro ao cadastrar usuário.");
}
?>