// ========== MODAL DE EDIÇÃO ==========
const modalEditar = document.getElementById("modalEditar");
let turmaIdAtual = null;

// Mapeamento de dias da semana para bitmask (como no banco de dados)
const diasMap = {
    'seg': 1,   // 1 << 0
    'ter': 2,   // 1 << 1
    'qua': 4,   // 1 << 2
    'qui': 8,   // 1 << 3
    'sex': 16   // 1 << 4
};

function abrirModalEditar(btnElement) {
    console.log("Abrindo modal de edição:", btnElement);
    
    // Pega os dados dos atributos data-*
    const dados = {
        id: btnElement.getAttribute('data-id'),
        nome: btnElement.getAttribute('data-nome'),
        codigo: btnElement.getAttribute('data-codigo'),
        carga: btnElement.getAttribute('data-carga'),
        turno: btnElement.getAttribute('data-turno'),
        professor: btnElement.getAttribute('data-professor'),
        sala: btnElement.getAttribute('data-sala'),
        atividade: btnElement.getAttribute('data-atividade')
    };
    
    turmaIdAtual = dados.id;
    
    console.log("Dados capturados:", dados);
    
    // Preenche os campos do formulário
    document.getElementById('edit_id_turma').value = dados.id;
    document.getElementById('edit_nome_turma').value = dados.nome;
    document.getElementById('edit_cod_turma').value = dados.codigo;
    document.getElementById('edit_carga_horaria').value = dados.carga;
    document.getElementById('edit_turno').value = dados.turno;
    
    // Professor (trata vazio)
    document.getElementById('edit_id_professor').value = dados.professor || '';
    
    // Sala (trata vazio)
    document.getElementById('edit_id_sala').value = dados.sala || '';
    
    // Atividade Externa (verifica se é "1")
    const checkAtividade = document.getElementById('edit_atividade_externa');
    if (checkAtividade) {
        checkAtividade.checked = dados.atividade === '1';
    }
    
    // Data de recálculo (padrão: hoje)
    const hoje = new Date().toISOString().slice(0, 10);
    const inputDataRecalculo = document.getElementById('edit_data_recalculo');
    if (inputDataRecalculo) {
        inputDataRecalculo.value = hoje;
    }
    
    // Limpa os checkboxes de dias (serão carregados via AJAX)
    document.querySelectorAll('#modalEditar input[name="dias_semana[]"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Carrega os dias atuais da turma via AJAX
    carregarDiasTurma(dados.id);
    
    // Abre o modal
    modalEditar.classList.add("is-open");
    modalEditar.setAttribute("aria-hidden", "false");
    
    // Foca no primeiro campo
    const firstInput = modalEditar.querySelector('input, select');
    if (firstInput) firstInput.focus();
}

// Função para carregar os dias atuais da turma
async function carregarDiasTurma(idTurma) {
    try {
        const response = await fetch(`../PHP/carregar_dias_turma.php?id_turma=${idTurma}`);
        const data = await response.json();
        
        if (data.success && data.dias_semana) {
            // Converte a máscara de bits para checkboxes
            const diasSelecionados = [];
            const mask = data.dias_semana;
            
            if (mask & 1) diasSelecionados.push('seg');
            if (mask & 2) diasSelecionados.push('ter');
            if (mask & 4) diasSelecionados.push('qua');
            if (mask & 8) diasSelecionados.push('qui');
            if (mask & 16) diasSelecionados.push('sex');
            
            // Marca os checkboxes
            diasSelecionados.forEach(dia => {
                const checkbox = document.querySelector(`#modalEditar input[name="dias_semana[]"][value="${dia}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            console.log("Dias carregados:", diasSelecionados);
        }
    } catch (error) {
        console.error("Erro ao carregar dias da turma:", error);
    }
}

function fecharModalEditar() {
    modalEditar.classList.remove("is-open");
    modalEditar.setAttribute("aria-hidden", "true");
    turmaIdAtual = null;
}

// Evento para abrir modal ao clicar em editar
document.addEventListener('click', function(e) {
    // Verifica se clicou no botão de editar ou em seu ícone
    const btnEdit = e.target.closest('.btn-edit');
    if (btnEdit) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Clicou no botão editar:", btnEdit);
        abrirModalEditar(btnEdit);
    }
});

// Fechar modal editar
const closeBtnEditar = modalEditar.querySelector('[data-close-editar]');
if (closeBtnEditar) {
    closeBtnEditar.addEventListener('click', fecharModalEditar);
}

// Botão cancelar
const btnCancelarEditar = document.getElementById('btnCancelarEditar');
if (btnCancelarEditar) {
    btnCancelarEditar.addEventListener('click', fecharModalEditar);
}

// Fechar modal editar ao clicar fora
modalEditar.addEventListener('click', function(e) {
    if (e.target === modalEditar) {
        fecharModalEditar();
    }
});

// Fechar modal editar com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalEditar.classList.contains('is-open')) {
        fecharModalEditar();
    }
});

// Função para pré-visualizar recálculo (similar à criação, mas considerando encontros já realizados)
async function previewRecalculo() {
    const inicioISO = document.getElementById('edit_data_recalculo')?.value;
    const cargaHoraria = parseInt(document.getElementById('edit_carga_horaria')?.value || '0', 10);
    const turno = document.getElementById('edit_turno')?.value;
    const diasSelecionados = Array.from(
        document.querySelectorAll('#modalEditar input[name="dias_semana[]"]:checked')
    ).map(cb => cb.value);
    
    const atividade_externa = document.getElementById('edit_atividade_externa')?.checked ? 1 : 0;
    const id_sala = document.getElementById('edit_id_sala')?.value || "";
    const id_professor = document.getElementById('edit_id_professor')?.value || "";
    
    const previewDiv = document.getElementById('previewEditar');
    
    if (!inicioISO || !cargaHoraria || !turno || diasSelecionados.length === 0) {
        previewDiv.innerHTML = `<span style="color:#b00;font-weight:800;">
            Preencha: data de recálculo, carga horária, turno e dias da semana.
        </span>`;
        return;
    }
    
    if (!atividade_externa && !id_sala) {
        previewDiv.innerHTML = `<span style="color:#b00;font-weight:800;">
            Se NÃO for atividade externa, selecione uma sala.
        </span>`;
        return;
    }
    
    try {
        // Gerar datas (similar à função de criação)
        const horasPorEncontro = (turno === 'noite') ? 3 : 4;
        const totalEncontros = Math.ceil(cargaHoraria / horasPorEncontro);
        const diasSet = new Set(diasSelecionados.map(d => diasMap[d]).filter(Boolean));
        
        const datas = [];
        const maxDias = 366 * 3;
        let tentativas = 0;
        
        let d = new Date(inicioISO + "T00:00:00");
        while (datas.length < totalEncontros && tentativas < maxDias) {
            tentativas++;
            const weekday = ((d.getDay() + 6) % 7) + 1; // 1..7
            if (diasSet.has(weekday)) {
                datas.push(d.toISOString().slice(0, 10));
            }
            d.setDate(d.getDate() + 1);
        }
        
        // Verificar conflitos (ignorando a própria turma)
        const response = await fetch('../PHP/verificar_conflitos_edicao.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_turma: turmaIdAtual,
                id_sala: id_sala,
                id_professor: id_professor,
                turno: turno,
                atividade_externa: atividade_externa,
                datas: datas
            })
        });
        
        const conflitos = await response.json();
        
        // Mostrar preview
        const horasUltimo = cargaHoraria - ((totalEncontros - 1) * horasPorEncontro);
        const hasConflito = (conflitos.conflitos_professor?.length > 0) || 
                           (conflitos.conflitos_sala?.length > 0);
        
        let html = `<div style="margin-bottom: 10px;">
            <strong>Recálculo a partir de:</strong> ${inicioISO}<br>
            <strong>Total de encontros:</strong> ${totalEncontros}<br>
            <strong>Horas por encontro:</strong> ${horasPorEncontro}h<br>
            <strong>Último encontro:</strong> ${horasUltimo}h<br>
            <strong>Conflitos:</strong> ${hasConflito ? 'SIM' : 'NÃO'}
        </div>`;
        
        if (hasConflito) {
            html += `<div style="color:#b00;margin-top:10px;">
                <strong>Atenção!</strong> Existem conflitos nas seguintes datas:<br>`;
            
            if (conflitos.conflitos_professor?.length > 0) {
                html += `Professor: ${conflitos.conflitos_professor.join(', ')}<br>`;
            }
            if (conflitos.conflitos_sala?.length > 0) {
                html += `Sala: ${conflitos.conflitos_sala.join(', ')}`;
            }
            html += `</div>`;
        }
        
        previewDiv.innerHTML = html;
        
    } catch (error) {
        previewDiv.innerHTML = `<span style="color:#b00;font-weight:800;">
            Erro ao gerar preview: ${error.message}
        </span>`;
    }
}

// Botão preview no modal de edição
document.getElementById('btnPreviewEditar')?.addEventListener('click', previewRecalculo);

// Atualizar preview automaticamente ao mudar campos
document.querySelectorAll('#modalEditar input, #modalEditar select').forEach(element => {
    element.addEventListener('change', previewRecalculo);
});