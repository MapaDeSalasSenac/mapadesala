<?php
// CORRIJA: Remova esta linha errada
// display_errors = On  // <-- ESTÁ ERRADO!

// CORRETO: Use ini_set() para habilitar display_errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require "conexao.php";

// Iniciar sessão apenas se não estiver iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Debug: registrar dados recebidos
error_log("=== ATUALIZAR TURMA ===");
error_log("POST data: " . print_r($_POST, true));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Método não permitido: " . $_SERVER['REQUEST_METHOD']);
    header("Location: ../Paginas/turmas.php");
    exit;
}

// Validar campos obrigatórios
$campos_obrigatorios = ['id_turma', 'nome_turma', 'cod_turma', 'carga_horaria', 'turno'];
$campos_faltando = [];

foreach ($campos_obrigatorios as $campo) {
    if (empty($_POST[$campo])) {
        $campos_faltando[] = $campo;
    }
}

if (!empty($campos_faltando)) {
    $_SESSION['erro'] = "Campos obrigatórios faltando: " . implode(', ', $campos_faltando);
    error_log("Campos faltando: " . implode(', ', $campos_faltando));
    header("Location: ../Paginas/turmas.php");
    exit;
}

$id_turma = (int)$_POST['id_turma'];
$nome_turma = mysqli_real_escape_string($conexao, $_POST['nome_turma']);
$cod_turma = mysqli_real_escape_string($conexao, $_POST['cod_turma']);
$carga_horaria = (int)$_POST['carga_horaria'];
$turno = mysqli_real_escape_string($conexao, $_POST['turno']);
$data_recalculo = $_POST['data_recalculo'] ?? date('Y-m-d');

// Campos opcionais
$id_professor = !empty($_POST['id_professor']) ? (int)$_POST['id_professor'] : null;
$id_sala = !empty($_POST['id_sala']) ? (int)$_POST['id_sala'] : null;
$atividade_externa = isset($_POST['atividade_externa']) ? 1 : 0;

// Dias da semana (converter para bitmask)
$dias_semana = 0;
$dias_map = ['seg' => 1, 'ter' => 2, 'qua' => 4, 'qui' => 8, 'sex' => 16];
if (!empty($_POST['dias_semana'])) {
    foreach ($_POST['dias_semana'] as $dia) {
        if (isset($dias_map[$dia])) {
            $dias_semana |= $dias_map[$dia];
        }
    }
}

error_log("Dias da semana calculados: $dias_semana");

// Verificar se turma existe
$sql_check = "SELECT * FROM turmas WHERE id_turma = ?";
$stmt_check = mysqli_prepare($conexao, $sql_check);
if (!$stmt_check) {
    error_log("Erro prepare check: " . mysqli_error($conexao));
    $_SESSION['erro'] = "Erro ao verificar turma.";
    header("Location: ../Paginas/turmas.php");
    exit;
}

mysqli_stmt_bind_param($stmt_check, 'i', $id_turma);
mysqli_stmt_execute($stmt_check);
$result_check = mysqli_stmt_get_result($stmt_check);

if (mysqli_num_rows($result_check) === 0) {
    error_log("Turma não encontrada: $id_turma");
    $_SESSION['erro'] = "Turma não encontrada.";
    header("Location: ../Paginas/Turmas.php");
    exit;
}

// Iniciar transação
mysqli_begin_transaction($conexao);
error_log("Transação iniciada");

try {
    // 1. Atualizar informações básicas da turma
    $sql_update = "UPDATE turmas SET 
                   nome_turma = ?, 
                   cod_turma = ?, 
                   carga_horaria = ?, 
                   turno = ?, 
                   dias_semana = ?,
                   id_professor = ?,
                   id_sala = ?,
                   atividade_externa = ?
                   WHERE id_turma = ?";
    
    error_log("SQL Update: $sql_update");
    
    $stmt_update = mysqli_prepare($conexao, $sql_update);
    if (!$stmt_update) {
        throw new Exception("Erro prepare update: " . mysqli_error($conexao));
    }
    
    // Bind dos parâmetros
    mysqli_stmt_bind_param($stmt_update, 'ssisiiiii', 
        $nome_turma, 
        $cod_turma, 
        $carga_horaria, 
        $turno, 
        $dias_semana,
        $id_professor,
        $id_sala,
        $atividade_externa,
        $id_turma
    );
    
    if (!mysqli_stmt_execute($stmt_update)) {
        throw new Exception("Erro ao executar update: " . mysqli_stmt_error($stmt_update));
    }
    
    error_log("Turma atualizada com sucesso. Linhas afetadas: " . mysqli_stmt_affected_rows($stmt_update));
    
    // 2. Se dias da semana foram alterados, recalcular encontros futuros
    if ($dias_semana > 0 && !empty($data_recalculo)) {
        error_log("Iniciando recálculo a partir de: $data_recalculo");
        
        // Primeiro, verificar se há encontros futuros para cancelar
        $sql_check_encontros = "SELECT COUNT(*) as total FROM turma_encontros 
                               WHERE id_turma = ? 
                               AND status = 'marcado' 
                               AND data >= ?";
        $stmt_check_encontros = mysqli_prepare($conexao, $sql_check_encontros);
        mysqli_stmt_bind_param($stmt_check_encontros, 'is', $id_turma, $data_recalculo);
        mysqli_stmt_execute($stmt_check_encontros);
        $result_check_encontros = mysqli_stmt_get_result($stmt_check_encontros);
        $row_check = mysqli_fetch_assoc($result_check_encontros);
        
        error_log("Encontros futuros encontrados: " . $row_check['total']);
        
        if ($row_check['total'] > 0) {
            // Cancelar encontros futuros a partir da data de recálculo
            $sql_cancel = "UPDATE turma_encontros 
                          SET status = 'cancelado' 
                          WHERE id_turma = ? 
                          AND status = 'marcado' 
                          AND data >= ?";
            
            $stmt_cancel = mysqli_prepare($conexao, $sql_cancel);
            if (!$stmt_cancel) {
                throw new Exception("Erro prepare cancel: " . mysqli_error($conexao));
            }
            
            mysqli_stmt_bind_param($stmt_cancel, 'is', $id_turma, $data_recalculo);
            
            if (!mysqli_stmt_execute($stmt_cancel)) {
                throw new Exception("Erro ao cancelar encontros: " . mysqli_stmt_error($stmt_cancel));
            }
            
            error_log("Encontros cancelados: " . mysqli_stmt_affected_rows($stmt_cancel));
        }
        
        // Gerar novos encontros apenas se tiver dias selecionados
        $horas_por_encontro = ($turno === 'noite') ? 3 : 4;
        $total_encontros = ceil($carga_horaria / $horas_por_encontro);
        
        error_log("Horas por encontro: $horas_por_encontro, Total encontros: $total_encontros");
        
        // Converter bitmask para array de dias da semana (1=seg, 2=ter, etc)
        $dias_numeros = [];
        if ($dias_semana & 1) $dias_numeros[] = 1; // seg
        if ($dias_semana & 2) $dias_numeros[] = 2; // ter
        if ($dias_semana & 4) $dias_numeros[] = 3; // qua
        if ($dias_semana & 8) $dias_numeros[] = 4; // qui
        if ($dias_semana & 16) $dias_numeros[] = 5; // sex
        
        if (empty($dias_numeros)) {
            error_log("Nenhum dia da semana selecionado. Pulando geração de encontros.");
        } else {
            // Calcular datas a partir da data de recálculo
            $datas_geradas = [];
            $data_atual = new DateTime($data_recalculo);
            $count = 0;
            $max_iteracoes = 365 * 2; // 2 anos máximo
            
            while (count($datas_geradas) < $total_encontros && $count < $max_iteracoes) {
                $dia_semana_numero = (int)$data_atual->format('N'); // 1=seg, 7=dom
                
                if (in_array($dia_semana_numero, $dias_numeros)) {
                    $datas_geradas[] = $data_atual->format('Y-m-d');
                }
                
                $data_atual->modify('+1 day');
                $count++;
            }
            
            error_log("Datas geradas: " . count($datas_geradas));
            
            if (!empty($datas_geradas)) {
                // Inserir novos encontros
                $sql_inserir = "INSERT INTO turma_encontros (id_turma, id_sala, id_professor, data, turno, horas, status) 
                               VALUES (?, ?, ?, ?, ?, ?, 'marcado')";
                $stmt_inserir = mysqli_prepare($conexao, $sql_inserir);
                
                if (!$stmt_inserir) {
                    throw new Exception("Erro prepare insert: " . mysqli_error($conexao));
                }
                
                foreach ($datas_geradas as $i => $data) {
                    // Calcular horas para o último encontro
                    if ($i === count($datas_geradas) - 1) {
                        $horas = $carga_horaria - (($total_encontros - 1) * $horas_por_encontro);
                    } else {
                        $horas = $horas_por_encontro;
                    }
                    
                    // Para atividade externa, id_sala pode ser NULL
                    $id_sala_insert = $atividade_externa ? null : $id_sala;
                    
                    // Bind dos parâmetros
                    mysqli_stmt_bind_param($stmt_inserir, 'iiissi', 
                        $id_turma, 
                        $id_sala_insert,
                        $id_professor,
                        $data,
                        $turno,
                        $horas
                    );
                    
                    if (!mysqli_stmt_execute($stmt_inserir)) {
                        throw new Exception("Erro ao inserir encontro: " . mysqli_stmt_error($stmt_inserir));
                    }
                    
                    error_log("Encontro inserido: $data com $horas horas");
                }
            }
        }
    }
    
    // Commit da transação
    mysqli_commit($conexao);
    error_log("Transação commitada com sucesso");
    
    $_SESSION['sucesso'] = "Turma atualizada com sucesso!";
    
} catch (Exception $e) {
    // Rollback em caso de erro
    mysqli_rollback($conexao);
    error_log("ERRO na transação: " . $e->getMessage());
    $_SESSION['erro'] = "Erro ao atualizar turma: " . $e->getMessage();
}

// Debug: verificar estado da sessão
error_log("Sessão ao final: sucesso=" . ($_SESSION['sucesso'] ?? 'null') . ", erro=" . ($_SESSION['erro'] ?? 'null'));

header("Location: ../Paginas/turmas.php");
exit;
?>