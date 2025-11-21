// api/api.js - Código da Serverless Function no Vercel

// Lista de Emojis que serão usados nas sequências - MAIS DIVERTIDOS!
const EMOJIS_VISUAIS = [
    "😀", "😎", "🤩", "🥳", "🤗", "😍", 
    "🚀", "🎈", "🎨", "🎭", "🎪", "🎯",
    "🍕", "🍦", "🍭", "🍰", "🧁", "🍩",
    "🐶", "🐱", "🐼", "🦁", "🦊", "🐸",
    "⭐", "💖", "💎", "🌈", "🔥", "✨",
    "🤖", "👾", "👽", "🦄", "🦋", "🐙"
];

const DOMINIO_PERMITIDO = 'https://playjogosgratis.com';
const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=59',
    'Content-Type': 'application/javascript; charset=utf-8'
};

/**
 * Função de manipulação da requisição do Vercel.
 */
module.exports = async (req, res) => {
    // ========== CONTROLE DE CORS ==========
    const origin = req.headers.origin;
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    
    if (origin === DOMINIO_PERMITIDO || isLocalhost) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'null');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    // ========== CABEÇALHOS DE CACHE ==========
    for (const [key, value] of Object.entries(CACHE_HEADERS)) {
        res.setHeader(key, value);
    }
    
    // ========== LÓGICA DO JOGO (Injectable JavaScript) ==========
    const gameLogicScript = `
        // ==========================================
        // VARIÁVEIS DE ESTADO DO JOGO
        // ==========================================
        let sequenciaEmojis = [];
        let sequenciaUsuarioEmojis = [];
        let nivelVisual = 1;
        let jogando = false;
        let startTime = null;
        let totalTime = 0;
        let totalAcertos = 0;
        let totalErros = 0;
        const emojisDisponiveis = ${JSON.stringify(EMOJIS_VISUAIS)};

        // ==========================================
        // FUNÇÕES AUXILIARES
        // ==========================================
        
        function playClick() {
            if (typeof somClique !== 'undefined' && somClique.play) {
                somClique.pause();
                somClique.currentTime = 0;
                somClique.play().catch(e => console.log("Erro ao tocar click:", e));
            }
        }
        
        function inicializarVariaveis() {
            sequenciaEmojis = [];
            sequenciaUsuarioEmojis = [];
            nivelVisual = 1;
            jogando = false;
            startTime = Date.now();
            totalTime = 0;
            totalAcertos = 0;
            totalErros = 0;
            
            if (typeof atualizarProgressoVisual === 'function') {
                atualizarProgressoVisual(1, 0, 3);
            }
            
            document.getElementById('sequenciaVisualMostra').innerHTML = '🎬 Preparando...';
            document.getElementById('areaBotoesVisual').innerHTML = '';
        }
        
        function resetarSequenciaVisual() {
            inicializarVariaveis();
        }

        // ==========================================
        // FLUXO DO JOGO
        // ==========================================

        function iniciarSequenciaVisual() {
            if (startTime === null) {
                inicializarVariaveis();
            }
            proximoNivelVisual();
        }

        function proximoNivelVisual() {
            jogando = false;
            
            if (typeof atualizarProgressoVisual === 'function') {
                atualizarProgressoVisual(nivelVisual, 0, 3); 
            }

            // Adiciona emoji aleatório
            const emojiAleatorio = emojisDisponiveis[Math.floor(Math.random() * emojisDisponiveis.length)];
            sequenciaEmojis.push(emojiAleatorio);
            sequenciaUsuarioEmojis = [];
            
            // CORREÇÃO: Cria botões ANTES de mostrar sequência
            criarBotoesVisual();
            
            // Mostra sequência e ativa botões depois
            mostrarSequenciaVisual(() => {
                jogando = true;
            });
        }

        // ==========================================
        // VISUALIZAÇÃO DA SEQUÊNCIA
        // ==========================================

        function mostrarSequenciaVisual(callback) {
            const mostraDiv = document.getElementById('sequenciaVisualMostra');
            mostraDiv.innerHTML = '';
            
            let i = 0;
            const intervalo = setInterval(() => {
                mostraDiv.innerHTML = ''; // Limpa para mostrar um emoji por vez
                
                const emojiSpan = document.createElement('span');
                emojiSpan.innerText = sequenciaEmojis[i];
                emojiSpan.className = 'emoji-sequencia';
                mostraDiv.appendChild(emojiSpan);
                
                // Animação de entrada
                setTimeout(() => {
                    emojiSpan.style.opacity = '1';
                }, 10);
                
                // Animação de pulso/destaque
                emojiSpan.classList.add('ativo');
                setTimeout(() => {
                    emojiSpan.classList.remove('ativo');
                }, 500);

                i++;
                if (i >= sequenciaEmojis.length) {
                    clearInterval(intervalo);
                    setTimeout(() => {
                        mostraDiv.innerHTML = '👆 Repita a Sequência! 🎯';
                        if (callback) callback();
                    }, 1200);
                }
            }, 1000); // 1 segundo por emoji
        }

        function criarBotoesVisual() {
            const botoesDiv = document.getElementById('areaBotoesVisual');
            botoesDiv.innerHTML = '';
            
            // Pega emojis únicos (sequência + extras aleatórios)
            let botoesEmojisUnicos = [...new Set([
                ...sequenciaEmojis, 
                ...emojisDisponiveis.sort(() => Math.random() - 0.5).slice(0, 6)
            ])];
            
            // Embaralha botões
            botoesEmojisUnicos.sort(() => Math.random() - 0.5);
            
            botoesEmojisUnicos.forEach(emoji => {
                const btn = document.createElement('button');
                btn.innerText = emoji;
                btn.className = 'btn-emoji-opcao';
                btn.onclick = () => escolherEmojiVisual(emoji, btn);
                botoesDiv.appendChild(btn);
            });
        }

        // ==========================================
        // LÓGICA DE VERIFICAÇÃO
        // ==========================================

        function escolherEmojiVisual(emoji, button) {
            if (!jogando) return;
            playClick();

            // Efeito visual ao clicar
            button.style.transform = 'scale(0.85)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);

            sequenciaUsuarioEmojis.push(emoji);
            verificarSequenciaVisual();
        }

        function verificarSequenciaVisual() {
            const indice = sequenciaUsuarioEmojis.length - 1;
            const emojiCorreto = sequenciaEmojis[indice];
            const emojiEscolhido = sequenciaUsuarioEmojis[indice];

            if (emojiEscolhido !== emojiCorreto) {
                // ERRO - Finaliza o jogo
                totalErros++;
                jogando = false;
                exibirFeedback(false, () => finalizarJogo('erro')); 
                return;
            }

            if (sequenciaUsuarioEmojis.length === sequenciaEmojis.length) {
                // ACERTOU A SEQUÊNCIA COMPLETA
                totalAcertos++;
                nivelVisual++;
                jogando = false;
                exibirFeedback(true, proximoNivelVisual);
            }
        }
        
        // ==========================================
        // RESULTADO FINAL
        // ==========================================
        
        function exibirResultado(motivo) {
            jogando = false;
            
            // Calcula tempo total
            totalTime = Date.now() - startTime;
            const tempoEmSegundos = (totalTime / 1000).toFixed(2);
            
            // Cálculo do Nível de Concentração (QI ajustado)
            let nivelConcentracao = 100;
            const totalTentativas = totalAcertos + totalErros;
            
            if (totalTentativas > 0) {
                const acertoRatio = totalAcertos / totalTentativas;
                const tempoPenalidade = Math.min(60, tempoEmSegundos);
                
                // Fórmula: Base + (Taxa de Acerto * Bônus) - Penalidade de Tempo + Bônus por Nível
                nivelConcentracao = 70 + (acertoRatio * 80) - (tempoPenalidade * 0.3) + (totalAcertos * 2);
                
                // Limita entre 70 e 150
                nivelConcentracao = Math.round(Math.max(70, Math.min(150, nivelConcentracao))); 
            }

            // Atualiza interface
            document.getElementById('resumoAcertos').innerText = totalAcertos;
            document.getElementById('resumoTempo').innerText = tempoEmSegundos + 's';
            document.getElementById('valorQI').innerText = nivelConcentracao;

            // Reseta para próximo jogo
            startTime = null; 

            // Vai para tela de resultado
            alternarTela('telaResumo');
        }
    `;

    // ========== ENVIA O SCRIPT ==========
    res.end(gameLogicScript);
};
