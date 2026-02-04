<?php
  require "../PHP/conexao.php";

  $sql ="SELECT nome, formacao, telefone, email, cursos_complementares FROM professores";
  $result = $conexao->query($sql);
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Professores - Senac MA</title>
  <link rel="icon" type="image/x-icon" href="../IMG/favicon.png">
  <link rel="stylesheet" href="../CSS/professores.css" />
  <link rel="stylesheet" href="../CSS/padrao.css" />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="../JS/padrao.js" defer></script>
  <script src="../JS/professores.js" defer></script>
  <style>
    .modal {
      width: 100%;
      background:none;
    }
  </style>
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
        <li class="item-nav ativo"><a href="professores.php" class="conteudo-barra-lateral">Professores</a></li>
        <li class="item-nav"><a href="salas.php" class="conteudo-barra-lateral">Salas</a></li>
        <li class="item-nav"><a href="turmas.php" class="conteudo-barra-lateral">Turmas</a></li>
        <li class="item-nav"><a href="creditos.html" class="conteudo-barra-lateral">Créditos</a></li>
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
  <main class="conteudo-principal container">
    <section class="pagina-professores">
      <!-- TÍTULO + AÇÕES -->
      <div class="header-page">
        <h1>Professores</h1>

        <div class="actions-bar">
          <button class="btn-icon btn-add" title="Adicionar professor" id="btnAbrir">+</button>
          <button class="botao-icone botao-filtro" type="button" data-abrir-filtros title="Filtros">
            <img src="../IMG/filtro.png" alt="Filtro" style="width:22px;height:22px;">
          </button>
        </div>
      </div>

      <div class="cards" id="listaProfessores">
        <?php while ($row = $result->fetch_assoc()): ?>
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
    </section>
  </main>

  <!-- MODAL -->
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
            <label for="formacao">Formação</label>
            <input type="text" name="formacao" class="inputFormacao" id="inputFormacao" placeholder="Ex: Técnico em informática" required>
          </div>

          <div class="inputs">
            <label for="Telefone">Telefone</label>
            <input type="text" name="telefone" class="inputTel" id="inputTel" placeholder="Digite o número" maxlength="15" required>
          </div>

          <div class="inputs">
            <label for="email">Email</label>
            <input type="email" name="email" class="inputEmail" id="inputEmail" placeholder="Digite o email" required>
          </div>

          <div class="inputs">
            <label for="text">Cursos Complementares</label>
            <input type="text" name="cursosCompl" class="inputCompl" id="inputCompl" placeholder="Ex: Beleza, Estética, Informática...">
          </div>

          <button type="submit" class="buttonCriar">Criar</button>
        </form>
      </div>

    </div>
  </div>
</body>
</html>
