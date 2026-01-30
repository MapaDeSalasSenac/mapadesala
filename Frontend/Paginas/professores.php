<?php
  require "../PHP/conexao.php";

  $sql ="SELECT nome, formacao, telefone, email, cursos_complementares FROM professores";
  $result = $conexao->query($sql);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Professores - Senac MA</title>

  <link rel="stylesheet" href="../CSS/professores.css">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="../JS/professores.js" defer></script>
</head>
<body>

  <!-- TOPBAR -->
  <header class="topbar">
    <button class="menu-toggle" aria-label="Abrir menu">☰</button>
    <div class="topbar-logo">
      <img src="../IMG/senac_logo_branco.png" alt="Senac">
    </div>
    <button class="user-button" aria-label="Usuário">👤</button>
  </header>

  <!-- SIDEBAR -->
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <ul>
       <li class="nav-item active"><a href="mapadesala.html" class="side-bar-content">Mapa de Salas</a></li>
        <li class="nav-item"><a href="professores.php" class="side-bar-content">Professores</a></li>
        <li class="nav-item"><a href="salas.php" class="side-bar-content">Salas</a></li>
        <li class="nav-item"><a href="turmas.php" class="side-bar-content">Turmas</a></li>
      </ul>
    </nav>
  </aside>

  <!-- CONTEÚDO -->
  <main class="container">

    <!-- TÍTULO + AÇÕES -->
    <div class="header-page">
      <h1>Professores</h1>

      <div class="actions-bar">
        <button class="btn-icon btn-add" title="Adicionar professor" id="btnAbrir">+</button>
        <button class="btn-icon btn-filter" title="Filtrar professores">🔍</button>
      </div>
    </div>

    <div class="cards" id="listaProfessores">

      <?php while ($row = $result->fetch_assoc()):?>
      <div class="card" data-id="12">
        <button class="btn-edit" title="Editar professor">✏️</button>

        <h3 class="professor-nome"><?= htmlspecialchars($row['nome']) ?></h3>
        <div class="line"></div>

        <div class="info">
          <p class="turma-info"><?= htmlspecialchars($row['formacao']) ?></p>
          <div class="line"></div>
          <p class="turma-info">Turma</p>
          <div class="line"></div>
          <p class="turma-info">Turno</p>
        </div>
      </div>
      <?php endwhile; ?>
    </div>
    

  </main>

  <div class="modal" id="meuModal" aria-hidden="true">
    <div class="modal__backdrop" data-close></div>

    <div class="modal__content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header class="modal__header">
        <h2 id="modalTitle">Cadastrar Professor</h2>
        <button class="modal__close" aria-label="Fechar" data-close>×</button>
        </header>

    <div class="modal__body">
      <form action="../PHP/criarProfessor.php" method="POST">
        <div class="inputs">
            <label for="nomeProfessor">Nome do Professor</label>
            <input type="text" name="nomeProfessor" class="nome_prof" id="nomeProfessor" placeholder="Digite o nome" required>
        </div>

        <div class="inputs">
            <label for="formacao">Formação</Label>
            <input type="text" name="formacao" class="inputFormacao" id="inputFormacao" placeholder="Ex: Técnico em informática" required>
        </div>
        
        <div class="inputs">
            <label for="Telefone">Telefone</Label>
            <input type="text" name="telefone" class="inputTel" id="inputTel" placeholder="Digite o número" maxlength="15" required>
        </div>
        
        <div class="inputs">
            <label for="email">Email</Label>
            <input type="email" name="email" class="inputEmail" id="inputEmail" placeholder="Digite o email" required>
        </div>
        
        <div class="inputs">
            <label for="text">Cursos Complementares</Label>
            <input type="text" name="cursosCompl" class="inputCompl" id="inputCompl" placeholder="Ex: Beleza, Estética, Informática...">
        </div>

        <button type="submit" class="buttonCriar">Criar</button>

      </form>
    </div>

    <footer class="modal__footer">
      <button data-close>Fechar</button>
      <button>Confirmar</button>
    </footer>
  </div>
</div>

</body>
</html>
