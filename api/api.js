// api/api.js - Código da Serverless Function no Vercel

// Lista de Emojis que serão usados nas sequências.
const EMOJIS_VISUAIS = ["😀", "😎", "🤩", "🚀", "🍕", "🐶", "🎈", "💖", "🤖", "👾", "👽", "🦄"];
const DOMINIO_PERMITIDO = 'https://playjogosgratis.com'; // Domínio permitido
const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=59',
    'Content-Type': 'application/javascript; charset=utf-8'
};

/**
 * Função de manipulação da requisição do Vercel.
 * @param {import('http').IncomingMessage} req 
 * @param {import('http').ServerResponse} res 
 */
module.exports = async (req, res) => {
    // 1. Lógica de Controle de CORS
    const origin = req.headers.origin;
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    
    // Define o cabeçalho CORS para o domínio permitido ou localhost
    if (origin === DOMINIO_PERMITIDO || isLocalhost) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Para qualquer outro domínio, nega o acesso
        res.setHeader('Access-Control-Allow-Origin', 'null');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache de 24h para preflight

    // Trata a requisição OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // 2. Aplica os cabeçalhos de Cache (Para garantir que o cliente pegue o JS)
    for (const [key, value] of Object.entries(CACHE_HEADERS)) {
        res.setHeader(key, value);
    }
    
    // 3. Lógica do Jogo Sequência Visual (Injectable JavaScript)
    // O código JavaScript do jogo é retornado como uma string para ser injetado no <script> do index.html.

    const gameLogicScript = `
        // Variáveis de Estado do Jogo (Globais no contexto do index.html)
        let sequenciaEmojis = [];
        let sequenciaUsuarioEmojis = [];
        let nivelVisual = 1;
        let jogando = false;
        let startTime;
        let totalTime = 0;
        let totalAcertos = 0;
        let totalErros = 0;
        const emojisDisponiveis = ${JSON.stringify(EMOJIS_VISUAIS)};

        // Helper para reproduzir som de clique (usando a função global do index.html)
        function playClick() {
            if (typeof somClique !== 'undefined' && somClique.play) {
                somClique.pause();
                somClique.currentTime = 0;
                somClique.play().catch(e => console.log("Erro ao tocar click:", e));
            }
        }
        
        // ** 1. Funções de Fluxo do Jogo **

        // Inicia o Jogo (Chamado por index.html)
        function iniciarSequenciaVisual() {
            // Zera o placar e inicia o cronômetro (só na primeira vez)
            if (!startTime) {
                startTime = Date.now();
                totalAcertos = 0;
                totalErros = 0;
                nivelVisual = 1;
            }
            proximoNivelVisual();
        }

        // Passa para o próximo nível (adiciona mais 1 emoji na sequência)
        function proximoNivelVisual() {
            jogando = false;
            document.getElementById('nivelInfo').innerText = 'Nível: ' + nivelVisual;
            
            // Adiciona um emoji aleatório à sequência
            const emojiAleatorio = emojisDisponiveis[Math.floor(Math.random() * emojisDisponiveis.length)];
            sequenciaEmojis.push(emojiAleatorio);
            sequenciaUsuarioEmojis = [];
            
            mostrarSequenciaVisual(proximaFaseBotoes);
        }

        // ** 2. Funções de Visualização **

        // Mostra a sequência de emojis que o jogador deve memorizar
        function mostrarSequenciaVisual(callback) {
            const mostraDiv = document.getElementById('sequenciaVisualMostra');
            mostraDiv.innerHTML = '';
            
            let i = 0;
            const intervalo = setInterval(() => {
                const emojiSpan = document.createElement('span');
                emojiSpan.innerText = sequenciaEmojis[i];
                emojiSpan.className = 'emoji-sequencia';
                mostraDiv.appendChild(emojiSpan);
                
                // Animação de entrada
                setTimeout(() => {
                    emojiSpan.style.opacity = '1';
                }, 10);
                
                // Animação de pulso/piscar
                emojiSpan.classList.add('ativo');
                setTimeout(() => {
                    emojiSpan.classList.remove('ativo');
                }, 400);

                i++;
                if (i >= sequenciaEmojis.length) {
                    clearInterval(intervalo);
                    setTimeout(() => {
                        // Limpa a tela e chama o callback (proximaFaseBotoes)
                        mostraDiv.innerHTML = 'Repita a Sequência! 👆';
                        if (callback) callback();
                    }, 1000); // 1 segundo de pausa após o último emoji
                }
            }, 800); // 800ms por emoji na sequência
        }
        
        // Fase 3: Cria os botões para o usuário interagir
        function proximaFaseBotoes() {
            criarBotoesVisual();
            jogando = true;
        }

        // Cria os botões de opção embaralhados
        function criarBotoesVisual() {
            const botoesDiv = document.getElementById('areaBotoesVisual');
            botoesDiv.innerHTML = '';
            
            // Pega um conjunto único de emojis que inclui todos na sequência + extras aleatórios
            let botoesEmojisUnicos = [...new Set([...sequenciaEmojis, ...emojisDisponiveis.slice(0, 5)])];
            // Embaralha o conjunto final de botões
            botoesEmojisUnicos.sort(() => Math.random() - 0.5);
            
            botoesEmojisUnicos.forEach(emoji => {
                const btn = document.createElement('button');
                btn.innerText = emoji;
                btn.className = 'btn-emoji-opcao';
                btn.onclick = () => escolherEmojiVisual(emoji, btn);
                botoesDiv.appendChild(btn);
            });
        }

        // ** 3. Funções de Lógica e Verificação **

        // Chamado quando o jogador clica em um emoji de opção
        function escolherEmojiVisual(emoji, button) {
            if (!jogando) return;
            playClick();

            // Efeito visual ao clicar
            button.style.transform = 'scale(0.9)';
            setTimeout(() => {
                button.style.transform = '';
            }, 100);

            sequenciaUsuarioEmojis.push(emoji);
            verificarSequenciaVisual();
        }

        // Verifica se o último clique do jogador está correto
        function verificarSequenciaVisual() {
            const indice = sequenciaUsuarioEmojis.length - 1;
            const emojiCorreto = sequenciaEmojis[indice];
            const emojiEscolhido = sequenciaUsuarioEmojis[indice];

            if (emojiEscolhido !== emojiCorreto) {
                // ERRO
                totalErros++;
                jogando = false;
                
                // Passa o callback para exibirResultado() após o feedback de erro
                exibirFeedback(false, () => finalizarJogo('erro')); 
                return;
            }

            if (sequenciaUsuarioEmojis.length === sequenciaEmojis.length) {
                // ACERTOU A SEQUÊNCIA COMPLETA
                totalAcertos++;
                nivelVisual++;
                jogando = false;
                
                // Passa o callback para iniciar o próximo nível após o feedback de acerto
                exibirFeedback(true, proximoNivelVisual);
            }
            
            // Se ainda não terminou a sequência, continua esperando o próximo clique
        }
        
        // ** 4. Função de Resultado Final **
        
        // Exibe o resumo na telaResultadoQI (Chamado pelo index.html)
        function exibirResultado(motivo) {
            // Garante que o jogo pare
            jogando = false;
            
            // Calcula o tempo total
            totalTime = Date.now() - startTime;
            const tempoEmSegundos = (totalTime / 1000).toFixed(2);
            
            // Cálculo do QI (Fórmula baseada em acertos e tempo)
            let qiCalculado = 100;
            const totalTentativas = totalAcertos + totalErros;
            
            if (totalTentativas > 0) {
                const acertoRatio = totalAcertos / totalTentativas;
                // Quanto mais acertos e menos tempo, maior o QI
                // Max: ~130-140 | Min: ~70
                
                // Penaliza o tempo: 1 ponto de QI por segundo gasto (limite de 60s)
                const tempoPenalidade = Math.min(60, tempoEmSegundos);
                
                // QI = Base + (Acerto * Bônus) - Penalidade de Tempo
                qiCalculado = 70 + (acertoRatio * 80) - (tempoPenalidade * 0.5);
                
                // Garante que o QI não seja menor que 70 ou maior que 135
                qiCalculado = Math.round(Math.max(70, Math.min(135, qiCalculado))); 
            }

            // Atualiza os elementos de resumo no index.html
            document.getElementById('resumoAcertos').innerText = totalAcertos;
            document.getElementById('resumoTempo').innerText = tempoEmSegundos + 's';
            document.getElementById('valorQI').innerText = qiCalculado;

            // Reinicia o tempo para o próximo jogo
            startTime = null; 

            // Alterna a tela para o resumo
            alternarTela('telaResumo');
        }
    `;

    // 4. Envia o script de volta para o cliente
    res.end(gameLogicScript);
};
