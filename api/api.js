// ======================================================================
// Sequência Visual Mágica - API JS
// Lógica do Jogo, Níveis e Feedback
// ======================================================================

// Variáveis Globais de Jogo
let nivelAtual = 1;
let acertosNoNivel = 0;
let totalSequenciasCorretas = 0;
let tempoInicio;

// Configuração do Nível (Emoji e Dificuldade)
const configuracaoNiveis = [
    { nivel: 1, emojies: ['🍎', '🍌', '🍇', '🍉'], comprimentoSequencia: 3, numOpcoes: 3, acertosNecessarios: 2 },
    { nivel: 2, emojies: ['🍎', '🍌', '🍇', '🍉', '🍓'], comprimentoSequencia: 4, numOpcoes: 4, acertosNecessarios: 3 },
    { nivel: 3, emojies: ['🍎', '🍌', '🍇', '🍉', '🍓', '🥝'], comprimentoSequencia: 5, numOpcoes: 5, acertosNecessarios: 4 },
    { nivel: 4, emojies: ['🍎', '🍌', '🍇', '🍉', '🍓', '🥝', '🥭'], comprimentoSequencia: 6, numOpcoes: 6, acertosNecessarios: 5 },
    { nivel: 5, emojies: ['🍎', '🍌', '🍇', '🍉', '🍓', '🥝', '🥭', '🍍'], comprimentoSequencia: 7, numOpcoes: 7, acertosNecessarios: 6 }
];

let sequenciaMestra = []; // Sequência correta a ser lembrada
let sequenciaUsuario = []; // Sequência que o usuário clicou

// Referências ao DOM
const sequenciaVisualMostra = document.getElementById('sequenciaVisualMostra');
const areaBotoesVisual = document.getElementById('areaBotoesVisual');
const telaJogo = document.getElementById('telaJogo');

// ======================================================================
// FUNÇÕES DE LÓGICA DO JOGO (Expostas globalmente)
// ======================================================================

/**
 * Inicia ou reinicia o ciclo de um nível (apresentação da sequência).
 */
function iniciarSequenciaVisual() {
    sequenciaUsuario = []; // Zera a sequência de cliques do usuário
    sequenciaVisualMostra.innerHTML = ''; // Limpa a área de exibição
    areaBotoesVisual.innerHTML = ''; // Limpa os botões de opção
    
    // Inicia a contagem de tempo (se for a primeira vez no nível)
    if (!tempoInicio) {
        tempoInicio = Date.now();
    }
    
    // Pega a configuração do nível atual (ou a última, se for nível muito alto)
    const config = configuracaoNiveis[nivelAtual - 1] || configuracaoNiveis[configuracaoNiveis.length - 1];

    // 1. Gera uma nova sequência mestra
    sequenciaMestra = gerarSequenciaAleatoria(config.comprimentoSequencia, config.emojies);

    // 2. Cria os elementos de emoji na tela (ainda invisíveis)
    sequenciaMestra.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji-sequencia';
        span.innerText = emoji;
        sequenciaVisualMostra.appendChild(span);
    });

    // 3. Inicia a apresentação visual
    apresentarSequenciaVisual(0, config.nivel);
}

/**
 * Reseta todas as variáveis de jogo para começar do zero.
 */
function resetarSequenciaVisual() {
    nivelAtual = 1;
    acertosNoNivel = 0;
    totalSequenciasCorretas = 0;
    tempoInicio = null;
    sequenciaMestra = [];
    sequenciaUsuario = [];
}

/**
 * Função de manipulação de eventos do clique do usuário.
 * @param {string} emojiClicado - O emoji selecionado pelo usuário.
 */
function verificarCliqueUsuario(emojiClicado) {
    if (telaJogo.classList.contains('bloqueado')) {
        return; // Ignora cliques enquanto o jogo está bloqueado
    }
    
    // Toca o som de clique (somClique é definido no index.html)
    if (typeof somClique !== 'undefined' && somClique.paused) {
        somClique.play().catch(e => console.log("Erro ao tocar som de clique:", e));
    }

    sequenciaUsuario.push(emojiClicado);

    const indiceAtual = sequenciaUsuario.length - 1;

    // Verifica se o clique está correto até o momento
    if (sequenciaUsuario[indiceAtual] === sequenciaMestra[indiceAtual]) {
        // Correto até agora
        
        // Se a sequência estiver completa e correta
        if (sequenciaUsuario.length === sequenciaMestra.length) {
            tratarAcertoCompleto();
        }

    } else {
        // Erro: sequência incorreta
        tratarErroCompleto();
    }
}

// ======================================================================
// FUNÇÕES DE APOIO E LÓGICA INTERNA
// ======================================================================

/**
 * Gera uma sequência aleatória de emojis.
 * @param {number} comprimento - O tamanho da sequência.
 * @param {string[]} emojiesDisponiveis - Lista de emojis para escolher.
 * @returns {string[]} A sequência de emojis gerada.
 */
function gerarSequenciaAleatoria(comprimento, emojiesDisponiveis) {
    const sequencia = [];
    for (let i = 0; i < comprimento; i++) {
        const randomIndex = Math.floor(Math.random() * emojiesDisponiveis.length);
        sequencia.push(emojiesDisponiveis[randomIndex]);
    }
    return sequencia;
}

/**
 * Apresenta a sequência de emojis visualmente.
 * @param {number} index - O índice atual na sequência.
 * @param {number} nivel - O nível atual para ajustar a velocidade.
 */
function apresentarSequenciaVisual(index, nivel) {
    const elementosEmoji = document.querySelectorAll('#sequenciaVisualMostra .emoji-sequencia');
    const delay = Math.max(800 - (nivel * 50), 300); // Velocidade aumenta com o nível

    if (index < elementosEmoji.length) {
        // Remove a classe 'ativo' do emoji anterior, se houver
        if (index > 0) {
            elementosEmoji[index - 1].classList.remove('ativo');
        }
        
        // Adiciona a classe 'ativo' ao emoji atual
        elementosEmoji[index].classList.add('ativo');

        setTimeout(() => {
            apresentarSequenciaVisual(index + 1, nivel);
        }, delay);
        
    } else {
        // Fim da apresentação
        
        // 1. Remove a classe 'ativo' do último emoji
        if (elementosEmoji.length > 0) {
            elementosEmoji[elementosEmoji.length - 1].classList.remove('ativo');
        }
        
        // 2. Limpa a área de exibição para a fase de resposta
        sequenciaVisualMostra.innerHTML = '';
        
        // 3. 🚨 CORREÇÃO: SOMENTE AGORA CRIA OS BOTÕES DE RESPOSTA
        criarBotoesOpcao(); 
    }
}

/**
 * Cria os botões de opção (emojis) para o usuário clicar.
 */
function criarBotoesOpcao() {
    areaBotoesVisual.innerHTML = ''; // Limpa a área antes de criar
    
    const config = configuracaoNiveis[nivelAtual - 1] || configuracaoNiveis[configuracaoNiveis.length - 1];
    
    // Obtém o pool de emojis que devem aparecer nos botões:
    // 1. Todos os emojis usados na sequência mestra (únicos).
    let opcoes = [...new Set(sequenciaMestra)]; 
    
    // 2. Adiciona emojis aleatórios do pool até atingir o número de opções.
    while (opcoes.length < config.numOpcoes) {
        const emojiAleatorio = config.emojies[Math.floor(Math.random() * config.emojies.length)];
        if (!opcoes.includes(emojiAleatorio)) {
            opcoes.push(emojiAleatorio);
        }
    }
    
    // Embaralha as opções para que a ordem não seja óbvia
    opcoes.sort(() => Math.random() - 0.5);

    // Cria os botões na tela
    opcoes.forEach(emoji => {
        const button = document.createElement('button');
        button.className = 'btn-emoji-opcao';
        button.innerText = emoji;
        // Adiciona o manipulador de clique global
        button.onclick = () => verificarCliqueUsuario(emoji); 
        areaBotoesVisual.appendChild(button);
    });
}

/**
 * Trata o caso de acerto completo da sequência.
 */
function tratarAcertoCompleto() {
    totalSequenciasCorretas++;
    acertosNoNivel++;
    telaJogo.classList.add('bloqueado'); // Bloqueia cliques temporariamente
    
    // Chama a função global de feedback
    if (typeof exibirFeedback === 'function') {
        exibirFeedback(true, () => {
            telaJogo.classList.remove('bloqueado');
            const config = configuracaoNiveis[nivelAtual - 1];

            // Verifica se o jogador avançou de nível
            if (acertosNoNivel >= config.acertosNecessarios) {
                if (nivelAtual < configuracaoNiveis.length) {
                    nivelAtual++;
                    acertosNoNivel = 0;
                    console.log(`Nível avançado para ${nivelAtual}`);
                } else {
                    // Nível máximo atingido
                    finalizarJogo('vitoria');
                    return; 
                }
            }
            
            // Atualiza o progresso visual
            if (typeof atualizarProgressoVisual === 'function') {
                atualizarProgressoVisual(nivelAtual, acertosNoNivel, configuracaoNiveis[nivelAtual - 1].acertosNecessarios);
            }

            // Inicia a próxima sequência (próximo nível ou próxima rodada)
            iniciarSequenciaVisual();
        });
    } else {
        // Se o feedback não estiver disponível, apenas avança
        iniciarSequenciaVisual();
    }
}

/**
 * Trata o caso de erro na sequência.
 */
function tratarErroCompleto() {
    telaJogo.classList.add('bloqueado'); // Bloqueia cliques temporariamente
    
    // Chama a função global de feedback
    if (typeof exibirFeedback === 'function') {
        exibirFeedback(false, () => {
            telaJogo.classList.remove('bloqueado');
            finalizarJogo('erro'); // Encerra o jogo e mostra o resultado
        });
    } else {
        finalizarJogo('erro');
    }
}


/**
 * Exibe a tela de resultado final.
 * @param {string} motivo - Motivo do fim do jogo ('erro', 'vitoria', 'manual').
 */
function exibirResultado(motivo) {
    const tempoFinal = Date.now();
    const tempoTotalSegundos = Math.floor((tempoFinal - tempoInicio) / 1000);
    const configAtual = configuracaoNiveis[nivelAtual - 1];
    
    // Calcula um valor de "QI" simples baseado no desempenho
    const pontuacaoBase = (totalSequenciasCorretas * 10) + (nivelAtual * 5);
    const pontuacaoTempo = Math.max(0, 100 - tempoTotalSegundos);
    let valorQI = pontuacaoBase + pontuacaoTempo;
    
    // Ajusta a pontuação final (limite inferior 50, superior 150)
    valorQI = Math.min(150, Math.max(50, valorQI));

    // Atualiza a tela de resumo (assumindo que as funções de navegação estão no index.html)
    if (typeof alternarTela === 'function') {
        alternarTela('telaResumo');
    }

    // Atualiza os dados na tela de resumo
    document.getElementById('resumoAcertos').innerText = totalSequenciasCorretas;
    document.getElementById('resumoTempo').innerText = `${tempoTotalSegundos}s`;
    
    // Define a cor e o texto do valor QI
    const valorQIElement = document.getElementById('valorQI');
    valorQIElement.innerText = valorQI;
    if (valorQI >= 120) {
        valorQIElement.style.color = '#4CAF50'; // Verde
        valorQIElement.style.textShadow = '4px 4px 0 #aaf0aa';
    } else if (valorQI >= 80) {
        valorQIElement.style.color = '#ffc300'; // Amarelo
        valorQIElement.style.textShadow = '4px 4px 0 #fff3c6';
    } else {
        valorQIElement.style.color = '#f44336'; // Vermelho
        valorQIElement.style.textShadow = '4px 4px 0 #f0aaaa';
    }

    // Reseta o estado do jogo após mostrar o resultado
    resetarSequenciaVisual();
}

// ----------------------------------------------------
// EXPOSIÇÃO GLOBAL
// As funções abaixo precisam ser acessíveis pelo index.html
window.iniciarSequenciaVisual = iniciarSequenciaVisual;
window.resetarSequenciaVisual = resetarSequenciaVisual;
window.exibirResultado = exibirResultado;
// As funções do index.html (exibirFeedback, atualizarProgressoVisual, finalizarJogo)
// são consideradas acessíveis pela API.
// ----------------------------------------------------
