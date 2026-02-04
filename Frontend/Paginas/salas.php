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
  <main class="conteudo-principal container">
    <section class="pagina-salas">
      <div class="header-page">
        <h1>Salas</h1>
        <?php if (isset($_GET['status'])): ?>
          <div id="alerta-feedback" style="...">
              <?php 
                  if($_GET['status'] == 'sucesso') echo "✅ Sala atualizada com sucesso!";
                  elseif($_GET['status'] == 'excluido') echo "🗑️ Sala removida com sucesso!";
                  elseif($_GET['status'] == 'erro') {
                      $msg = $_GET['msg'] ?? '';
                      if($msg == 'vinculo') echo "❌ Não é possível excluir: Esta sala está vinculada a uma turma ativa.";
                      else echo "❌ Erro ao processar a solicitação.";
                  }
              ?>
          </div>

          <script>
              // Remove a mensagem após 4 segundos e limpa a URL
              setTimeout(() => {
                  const alerta = document.getElementById('alerta-feedback');
                  if(alerta) alerta.style.display = 'none';
                  window.history.replaceState({}, document.title, window.location.pathname);
              }, 3000);
          </script>
      <?php endif; ?>

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
            <button class="btn-edit" title="Editar Sala" 
            data-id="<?= $row['id_sala'] ?>" 
            data-nome="<?= htmlspecialchars($row['nome_sala']) ?>" 
            data-capacidade="<?= htmlspecialchars($row['capacidade']) ?>" 
            onclick="abrirModalEdicao(this)">
              ✏️
            </button>
            <button class="btn-delete" title="Excluir Sala" 
            data-id="<?= $row['id_sala'] ?>" 
            data-nome="<?= htmlspecialchars($row['nome_sala']) ?>" 
            onclick="abrirModalExcluir(this)">
              🗑️
            </button>
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

  <div class="modal" id="modalEditar">
    <div class="modal__backdrop" onclick="fecharModalEdicao()"></div>
    <div class="modal__content">
        <header class="modal__header">
            <h2 id="modalTitle">Editar Sala</h2>
            <button class="modal__close" onclick="fecharModalEdicao()">×</button>
        </header>

        <div class="modal__body">
            <form action="../PHP/editarSalas.php" method="POST">
                <input type="hidden" name="id_sala" id="edit_id">
                
                <div class="inputs">
                    <label for="edit_nome">Nome da Sala</label>
                    <input type="text" name="nomeSala" id="edit_nome" required>
                </div>

                <div class="inputs">
                    <label for="edit_capacidade">Capacidade</label>
                    <input type="number" name="capacidade" id="edit_capacidade" required>
                </div>

                <button type="submit" class="buttonCriar">Salvar Alterações</button>
            </form>
        </div>
    </div>
</div>

<div class="modal" id="modalExcluir">
    <div class="modal__backdrop" onclick="fecharModalExcluir()"></div>
    <div class="modal__content" style="height: auto; max-width: 400px;">
        <header class="modal__header">
            <h2 style="color: #d9534f;">⚠️ Confirmar Exclusão</h2>
            <button class="modal__close" onclick="fecharModalExcluir()">×</button>
        </header>

        <div class="modal__body" style="text-align: center; flex-direction: column; gap: 20px;">
            <p>Tem certeza que deseja excluir a sala <strong id="nomeSalaExcluir" style="color: var(--azul);"></strong>?</p>
            <p style="font-size: 14px; color: #666;">Esta ação não pode ser desfeita.</p>
            
            <form action="../PHP/excluirSalas.php" method="POST" style="width: 100%; height: auto; gap: 10px;">
                <input type="hidden" name="id_sala" id="delete_id">
                <button type="submit" class="buttonCriar" style="background-color: #d9534f; width: 100%;">Sim, Excluir</button>
                <button type="button" onclick="fecharModalExcluir()" style="background: none; border: none; color: var(--azul); cursor: pointer; font-weight: 600;">Cancelar</button>
            </form>
        </div>
    </div>
</div>
    
</body>
</html>
