<?php
  require "../PHP/conexao.php";

  $sql ="SELECT nome_sala, capacidade FROM salas";
  $result = $conexao->query($sql);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Salas - Senac MA</title>
  <link rel="stylesheet" href="../CSS/salas.css" />
  <link rel="stylesheet" href="../CSS/padrao.css" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="../JS/padrao.js" defer></script>
  <script src="../JS/salas.js" defer></script>
</head>

<body>
  <!-- TOPBAR PADRÃO -->
  <header class="barra-topo">
    <button class="botao-menu" id="botao-menu" aria-label="Abrir menu" aria-expanded="false">☰</button>

    <div class="logo-topo">
      <img src="../IMG/senac_logo_branco.png" alt="Senac" />
    </div>

    <button class="botao-usuario" id="botao-usuario" aria-label="Usuário" aria-expanded="false">👤</button>
  </header>

  <!-- SIDEBAR PADRÃO -->
  <aside class="barra-lateral">
    <nav class="nav-lateral">
      <ul>
        <li class="item-nav"><a href="mapadesala.html" class="conteudo-barra-lateral">Mapa de Salas</a></li>
        <li class="item-nav"><a href="professores.php" class="conteudo-barra-lateral">Professores</a></li>
        <li class="item-nav ativo"><a href="salas.php" class="conteudo-barra-lateral">Salas</a></li>
        <li class="item-nav"><a href="turmas.php" class="conteudo-barra-lateral">Turmas</a></li>
      </ul>
    </nav>

    <div class="rodape-lateral">
      <div class="relogio-lateral" id="relogio-lateral">--:--</div>
      <div class="creditos-lateral">Desenvolvido pela Turma Técnico de Informatica para a Internet</div>
    </div>
  </aside>

  <!-- Overlay mobile -->
  <div class="sobreposicao-mobile"></div>

  <!-- CONTEÚDO -->
  <main class="conteudo-principal">
    <section class="pagina-salas">
      <div class="header-page">
        <h1>Salas</h1>

        <div class="actions-bar">
          <button class="btn-icon btn-add" title="Adicionar Sala" id="btnAbrir">+</button>
          <button class="botao-icone botao-filtro" type="button" data-abrir-filtros title="Filtros">
        <img src="../IMG/filtro.png" alt="Filtro" style="width:22px;height:22px;">
      </button>

        </div>
      </div>

      <div class="cards" id="listaSalas">
        <?php while ($row = $result->fetch_assoc()): ?>
          <div class="card" data-id="12">
            <button class="btn-edit" title="Editar Sala">✏️</button>
            <h3 class="card-h3"><?= htmlspecialchars($row['nome_sala']) ?></h3>
            <div class="line"></div>

            <div class="info">
              <p class="content-info">Capacidade: <?= htmlspecialchars($row['capacidade']) ?></p>
              <div class="line"></div>
            </div>
          </div>
        <?php endwhile; ?>
      </div>
    </section>
  </main>

  <!-- MODAL -->
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
            <label for="capacidade">Capacidade</label>
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
