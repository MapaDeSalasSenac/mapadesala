<?php
  require "../PHP/conexao.php";

  $sql ="SELECT nome_sala, capacidade FROM salas";
  $result = $conexao->query($sql);
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <link rel="stylesheet" href="../CSS/mapadesala.css">
    <link rel="stylesheet" href="../CSS/salas.css">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="../JS/salas.js"   defer></script>
    <title>Salas - Senac MA</title>
</head>
<body>
    <header class="topbar">
        <button class="menu-toggle" aria-label="Abrir menu">☰</button>
        <div class="topbar-logo">
            <img src="../IMG/senac_logo_branco.png" alt="Senac">
        </div>
        <button class="user-button" aria-label="Usuário">👤</button>
    </header>

    <!-- SIDEBAR AZUL -->
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

    <main class="container">
    <div class="header-page">
      <h1>Salas</h1>

      <div class="actions-bar">
        <button class="btn-icon btn-add" title="Adicionar Sala" id="btnAbrir">+</button>
        <button class="btn-icon btn-filter" title="Filtrar professores">🔍</button>
      </div>
    </div>



    <div class="cards" id="listaProfessores">
      <?php while ($row = $result->fetch_assoc()): ?>
      <div class="card" data-id="12">
        <button class="btn-edit" title="Editar Sala">✏️</button>
        <h3 class="card-h3"><?= htmlspecialchars($row['nome_sala']) ?></h3>
        <div class="line"></div>

        <div class="info">
          <p class=content-info">Capacidade: <?= htmlspecialchars($row['capacidade']) ?></p>
          <div class="line"></div>
        </div>
      </div>
      <?php endwhile; ?>

    </div>
    </main>


    <div class="modal" id="meuModal" aria-hidden="true">
    <div class="modal__backdrop" data-close></div>

    <div class="modal__content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <header class="modal__header">
        <h2 id="modalTitle">Criar Sala</h2>
        <button class="modal__close" aria-label="Fechar" data-close>×</button>
        </header>

    <div class="modal__body">
      <form action="../PHP/criarSalas.php" method="POST">

        <div class="inputs">
            <label for="nomeSala">Nome da Sala</label>
            <input type="text" name="nomeSala" class="nome_sala" id="nomeSala" placeholder="Digite o nome da sala" required>
        </div>

        <div class="inputs">
            <label for="capacidade">Capacidade</Label>
            <input type="number" name="capacidade" class="inputCap" id="inputCap" placeholder="Digite a capacidade da sala" required>
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