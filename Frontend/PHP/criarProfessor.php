<?php
require 'conexao.php';

function onlyDigits(string $v): string {
    return preg_replace('/\D+/', '', $v) ?? '';
}

function formatCelular(string $digits): string {
    // Espera 11 dígitos: DDD + 9 + 8
    if (strlen($digits) !== 11) return $digits;
    $ddd = substr($digits, 0, 2);
    $n9  = substr($digits, 2, 1);
    $p1  = substr($digits, 3, 4);
    $p2  = substr($digits, 7, 4);
    return "($ddd) $n9 $p1-$p2";
}

function backWithError(string $msg): void {
    $q = http_build_query(["erro" => $msg]);
    header("Location: ../Paginas/professores.php?$q");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $id = isset($_POST["idProfessor"]) ? (int)$_POST["idProfessor"] : 0;

    $nomeProfessor = trim($_POST["nomeProfessor"] ?? "");
    $formacao = trim($_POST["formacao"] ?? "");
    $telefoneRaw = trim($_POST["telefone"] ?? "");
    $email = strtolower(trim($_POST["email"] ?? ""));
    $cursosComp = trim($_POST["cursosCompl"] ?? "");

    // Validações básicas
    if ($nomeProfessor === "") backWithError("Nome do professor é obrigatório.");

    $telDigits = onlyDigits($telefoneRaw);
    if (strlen($telDigits) !== 11) {
        backWithError("Telefone inválido. Use (99) 9 9999-9999.");
    }
    $telefone = formatCelular($telDigits);

    if ($email !== "" && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        backWithError("E-mail inválido.");
    }

    // Unicidade: nome/email/telefone (ignora o próprio id no update)
    // Nome
    $sql = "SELECT id_professor FROM professores WHERE LOWER(nome) = LOWER(?) AND id_professor <> ? LIMIT 1";
    $st = $conexao->prepare($sql);
    $st->bind_param("si", $nomeProfessor, $id);
    $st->execute();
    $st->store_result();
    if ($st->num_rows > 0) { $st->close(); backWithError("Já existe um professor com esse nome."); }
    $st->close();

    // Email (se houver)
    if ($email !== "") {
        $sql = "SELECT id_professor FROM professores WHERE LOWER(email) = LOWER(?) AND id_professor <> ? LIMIT 1";
        $st = $conexao->prepare($sql);
        $st->bind_param("si", $email, $id);
        $st->execute();
        $st->store_result();
        if ($st->num_rows > 0) { $st->close(); backWithError("Já existe um professor com esse e-mail."); }
        $st->close();
    }

    // Telefone (compara por dígitos)
    $sql = "SELECT id_professor
            FROM professores
            WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone,'(',''),')',''),' ',''),'-','') = ?
              AND id_professor <> ?
            LIMIT 1";
    $st = $conexao->prepare($sql);
    $st->bind_param("si", $telDigits, $id);
    $st->execute();
    $st->store_result();
    if ($st->num_rows > 0) { $st->close(); backWithError("Já existe um professor com esse telefone."); }
    $st->close();

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
        backWithError("Erro ao salvar professor.");
    }

    $stmt->close();
    $conexao->close();
}
?>