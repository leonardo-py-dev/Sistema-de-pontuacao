/* ==========================================================================
   JS Sorteio - Lógica do Game Show Multi-jogadores
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // === Sistema de Jogadores e Pontuação ===
    const playersContainer = document.getElementById('players-container');
    const btnAddPlayer = document.getElementById('btn-add-player');
    const playerTemplate = document.getElementById('player-template');
    
    const MAX_PLAYERS = 3;
    let playerCount = 0;
    
    // Array para manter as pontuações independentes
    // Índice do array corresponde ao ID do jogador (0, 1, 2)
    let playerScores = [0, 0, 0]; 

    // Adiciona o primeiro jogador automaticamente ao carregar
    addPlayer();

    btnAddPlayer.addEventListener('click', () => {
        if (playerCount < MAX_PLAYERS) {
            addPlayer();
        }
    });

    function addPlayer() {
        if (playerCount >= MAX_PLAYERS) return;

        const playerId = playerCount; // 0, 1, 2...
        playerScores[playerId] = 0; // Inicializa a pontuação
        playerCount++;

        // Clona o template
        const clone = playerTemplate.content.cloneNode(true);
        const playerCard = clone.querySelector('.player-card');
        
        // Configurações Iniciais da Interface
        const playerNameInput = clone.querySelector('.player-name');
        playerNameInput.value = `Jogador ${playerCount}`;
        
        const scoreDisplay = clone.querySelector('.score-value');
        scoreDisplay.id = `score-value-${playerId}`;

        // Eventos dos Botões de Pontos Específicos (+5, +10, +15, -5)
        const pointBtns = clone.querySelectorAll('.point-btn');
        pointBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const points = parseInt(e.target.getAttribute('data-points'));
                updatePlayerScore(playerId, points, scoreDisplay);
            });
        });

        // Evento de Remoção de Jogador
        const btnRemove = clone.querySelector('.btn-remove-player');
        // Esconde o botão se for o pódios base (1 jogador não deveria ser removido ideialmentem, mas permitimos a partir do segundo)
        if(playerCount === 1) {
            btnRemove.style.display = 'none';
        }
        
        btnRemove.addEventListener('click', () => {
            playerCard.remove();
            playerCount--;
            // Reseta a pontuação na memória para não vazar se readicionar
            playerScores[playerId] = 0; 
            updateAddButtonState();
        });

        playersContainer.appendChild(clone);
        updateAddButtonState();
    }

    function updateAddButtonState() {
        if (playerCount >= MAX_PLAYERS) {
            btnAddPlayer.style.display = 'none';
        } else {
            btnAddPlayer.style.display = 'block';
        }
    }

    function updatePlayerScore(playerId, pointsToAdd, scoreElement) {
        // Pega pontuação atual daquele jogador
        const currentScore = playerScores[playerId];
        
        // Calcula nova pontuação (sem deixar cair abaixo de zero se for negativo)
        const targetScore = Math.max(0, currentScore + pointsToAdd);
        
        // Atualiza memória
        playerScores[playerId] = targetScore;

        // Animação de UI
        scoreElement.classList.remove('score-bump');
        void scoreElement.offsetWidth; // trigger reflow
        scoreElement.classList.add('score-bump');
        
        animateValue(scoreElement, currentScore, targetScore, 400);

        // Placeholder Tocar som dependendo se ganhou ou perdeu
        if (pointsToAdd > 0) playAudio(audioCerto);
        else playAudio(audioErrado);
    }

    // Função universal de animação de números
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end; // Garantia do valor final inteiro
            }
        };
        window.requestAnimationFrame(step);
    }

    
    // ==========================================
    // Funções e Lógica do Sorteio (Roleta de Dificuldade)
    // ==========================================
    
    const btnSortear = document.getElementById('btn-sortear');
    const dicaDisplay = document.getElementById('dica-display');
    const roletaContainer = document.querySelector('.roleta-container');
    
    // Regra Específica: Apenas estas 3 dicas na roleta.
    const dicasRoleta = [
        { text: " Verde / Fácil ", class: "resultado-facil" },
        { text: "Amarelo / Médio", class: "resultado-medio" },
        { text: "Vermelho / Difícil", class: "resultado-dificil" }
    ];
    
    let isSorteando = false;
    let baseTime = 50; 

    btnSortear.addEventListener('click', startRaffle);

    function startRaffle() {
        if (isSorteando) return; 
        
        isSorteando = true;
        btnSortear.disabled = true;
        btnSortear.textContent = "Sorteando...";
        btnSortear.classList.remove('golden-glow');
        
        // Limpa efeitos visuais anteriores
        dicaDisplay.className = 'dica-texto sorteando'; // Reseta tudo mantendo a base e adicionando sorteando
        roletaContainer.classList.remove('pop-color');
        
        let counter = 0;
        // Total de piscadas antes de parar (aleatório entre 20 e 40)
        const totalBlinks = Math.floor(Math.random() * 20) + 20; 
        
        function spinRound() {
            // Pick aleatório temporário
            const randomIndex = Math.floor(Math.random() * dicasRoleta.length);
            const selection = dicasRoleta[randomIndex];
            
            dicaDisplay.textContent = selection.text;
            // Remove 'sorteando' color override by setting both, CSS will handle it
            dicaDisplay.className = `dica-texto sorteando ${selection.class}`;
            
            counter++;
            playAudio(audioRoleta);

            if (counter < totalBlinks) {
                let nextTime = baseTime + (counter * 4); // Desacelera matematicamente
                setTimeout(spinRound, nextTime);
            } else {
                finishRaffle();
            }
        }
        
        spinRound();
    }

    function finishRaffle() {
        // Seleção do resultado final robusta
        const finalSelection = dicasRoleta[Math.floor(Math.random() * dicasRoleta.length)];
        
        // Aplica os textos e cor específica daquele nível
        dicaDisplay.textContent = finalSelection.text;
        dicaDisplay.className = `dica-texto ${finalSelection.class}`; // Remove sorteando, Add classe específica Ex: resultado-dificil
        
        // Dá um "PoP" no container para chamar atenção
        roletaContainer.classList.add('pop-color');
        
        playAudio(audioVitoria); 
        
        // Reabilita
        setTimeout(() => {
            isSorteando = false;
            btnSortear.disabled = false;
            btnSortear.textContent = "🎰 GIRAR NOVAMENTE";
            btnSortear.classList.add('golden-glow');
        }, 1000);
    }

    // ==========================================
    // Áudios (Placeholders)
    // ==========================================
    function playAudio(audioObj) { }
    const audioCerto = null, audioErrado = null, audioRoleta = null, audioVitoria = null;

});

/* =========================================
   Cartas Feature JS (Integrated)
   ========================================= */
const bancoDeCartas = [
    {
        id: 1,
        categoria: "Energia e Clima",
        cor: "red",
        pergunta: "Qual fenômeno físico-atmosférico resulta da absorção e reemissão de radiação infravermelha por determinados gases presentes na atmosfera terrestre, contribuindo para a manutenção da temperatura média do planeta?",
        resposta: "Efeito estufa",
        dicas: [
            "Envolve gases como CO₂, metano e vapor d'água.",
            "Sem esse fenômeno a Terra seria muito mais fria.",
            "Quando intensificado pode causar aquecimento global."
        ]
    },
    {
        id: 2,
        categoria: "Sustentabilidade",
        cor: "red",
        pergunta: "Qual conceito amplamente discutido em conferências ambientais internacionais propõe um modelo de desenvolvimento que equilibra crescimento econômico, preservação ambiental e justiça social?",
        resposta: "Desenvolvimento sustentável",
        dicas: [
            "Equilíbrio entre economia e meio ambiente.",
            "Busca atender às necessidades atuais sem comprometer as futuras.",
            "O conceito foi popularizado em relatórios ambientais da ONU."
        ]
    },
    {
        id: 3,
        categoria: "Biologia",
        cor: "red",
        pergunta: "Qual processo bioquímico realizado por organismos autotróficos promove a conversão de energia luminosa em energia química armazenada em compostos orgânicos?",
        resposta: "Fotossíntese",
        dicas: [
            "Processo usado pelas plantas para produzir alimento.",
            "Utiliza dióxido de carbono e água.",
            "Ocorre nos cloroplastos."
        ]
    },
    {
        id: 4,
        categoria: "Recursos Fósseis",
        cor: "red",
        pergunta: "Qual recurso energético fóssil sólido, formado a partir da transformação geológica de matéria vegetal ao longo de milhões de anos, é amplamente utilizado na geração termoelétrica e possui elevado teor de carbono?",
        resposta: "Carvão mineral",
        dicas: [
            "Combustível fóssil sólido.",
            "Muito usado em usinas termoelétricas.",
            "É um dos combustíveis fósseis mais antigos utilizados pela indústria."
        ]
    },
    {
        id: 5,
        categoria: "Gestão de Resíduos",
        cor: "red",
        pergunta: "Qual processo biológico controlado promove a decomposição aeróbica de resíduos orgânicos, transformando-os em um composto rico em nutrientes utilizado na fertilização do solo?",
        resposta: "Compostagem",
        dicas: [
            "Transforma lixo orgânico em adubo.",
            "Utiliza restos de alimentos e resíduos vegetais.",
            "O processo depende da ação de microrganismos decompositores."
        ]
    },
    {
        id: 6,
        categoria: "Energia Renovável",
        cor: "red",
        pergunta: "Qual categoria de fonte energética renovável baseia-se no aproveitamento de matéria orgânica de origem vegetal ou animal para a produção de calor, combustíveis ou eletricidade?",
        resposta: "Energia de biomassa",
        dicas: [
            "Energia gerada a partir de matéria orgânica.",
            "Utiliza resíduos agrícolas e florestais.",
            "Pode envolver combustão, digestão anaeróbica ou fermentação."
        ]
    },
    {
        id: 7,
        categoria: "Reciclagem",
        cor: "green",
        pergunta: "Qual material amplamente utilizado em latas de bebidas possui elevada taxa de reciclagem devido à facilidade de reaproveitamento?",
        resposta: "Alumínio",
        dicas: [
            "É o metal 'Al' da tabela periódica.",
            "É comum em embalagens de refrigerante.",
            "É um metal leve com alto valor de reciclagem."
        ]
    },
    {
        id: 8,
        categoria: "Consumo Consciente",
        cor: "green",
        pergunta: "Qual atitude cotidiana está associada ao consumo consciente de energia elétrica em ambientes domésticos?",
        resposta: "Apagar as luzes ao sair de um ambiente",
        dicas: [
            "Desligar a luz quando não estiver usando.",
            "Evita consumo desnecessário de eletricidade.",
            "Relaciona-se à redução do desperdício energético."
        ]
    },
    {
        id: 9,
        categoria: "Energia Renovável",
        cor: "green",
        pergunta: "Qual recurso natural renovável é explorado para produzir eletricidade por meio do movimento das massas de ar?",
        resposta: "Energia eólica",
        dicas: [
            "Depende da movimentação atmosférica causada por diferenças de pressão.",
            "Utiliza turbinas chamadas aerogeradores.",
            "A conversão ocorre a partir da energia cinética de massas de ar."
        ]
    },
    {
        id: 10,
        categoria: "Eficiência Energética",
        cor: "green",
        pergunta: "Considerando o conceito de eficiência energética, qual tecnologia de iluminação apresenta menor consumo de energia elétrica e maior vida útil?",
        resposta: "Lâmpada LED",
        dicas: [
            "É a lâmpada mais econômica atualmente.",
            "Transforma mais energia em luz e menos em calor.",
            "Utiliza diodos emissores de luz."
        ]
    },
    {
        id: 11,
        categoria: "Gestão Ambiental",
        cor: "green",
        pergunta: "Dentro das práticas de gestão ambiental urbana, qual procedimento consiste na separação de resíduos sólidos de acordo com o tipo de material?",
        resposta: "Coleta seletiva",
        dicas: [
            "Separar o lixo reciclável do lixo comum.",
            "Separa materiais como plástico, papel, metal e vidro.",
            "Facilita processos industriais de reciclagem."
        ]
    },
    {
        id: 12,
        categoria: "Energia Solar",
        cor: "green",
        pergunta: "No contexto da geração de energia renovável, qual tecnologia converte diretamente a radiação solar em eletricidade por meio de células semicondutoras?",
        resposta: "Energia solar fotovoltaica",
        dicas: [
            "Produz eletricidade a partir da luz do Sol.",
            "A conversão ocorre quando a luz incide sobre painéis solares.",
            "Utiliza células geralmente feitas de silício."
        ]
    },
    {
        id: 13,
        categoria: "Matriz Energética",
        cor: "yellow",
        pergunta: "No contexto da conversão de energia na matriz energética global, qual tecnologia baseia-se na transformação da energia cinética de correntes atmosféricas em energia elétrica por meio de sistemas rotacionais acoplados a geradores?",
        resposta: "Energia eólica",
        dicas: [
            "Depende da força do vento.",
            "A estrutura principal envolve turbinas instaladas em áreas de grande circulação de ar.",
            "A conversão ocorre a partir da energia cinética de massas de ar."
        ]
    },
    {
        id: 14,
        categoria: "Mudanças Climáticas",
        cor: "yellow",
        pergunta: "No estudo das alterações climáticas contemporâneas, qual composto gasoso, produto frequente da oxidação completa de combustíveis fósseis, possui papel central no aumento da retenção de radiação infravermelha na atmosfera terrestre?",
        resposta: "Dióxido de carbono (CO₂)",
        dicas: [
            "É liberado na queima de gasolina, carvão e petróleo.",
            "É liberado em grande quantidade por veículos e indústrias.",
            "É um dos principais gases de efeito estufa."
        ]
    },
    {
        id: 15,
        categoria: "Geração Hidrelétrica",
        cor: "yellow",
        pergunta: "Qual sistema de geração elétrica baseia-se na exploração da energia potencial gravitacional associada a grandes massas de água acumuladas em reservatórios artificiais?",
        resposta: "Usina hidrelétrica",
        dicas: [
            "Utiliza a força da água para gerar energia.",
            "Esse sistema costuma exigir a construção de barragens.",
            "A conversão energética ocorre quando a água movimenta turbinas."
        ]
    },
    {
        id: 16,
        categoria: "Práticas Sustentáveis",
        cor: "yellow",
        pergunta: "No âmbito das práticas sustentáveis aplicadas à gestão de resíduos sólidos, qual procedimento industrial permite que materiais previamente descartados sejam processados e reinseridos como matéria-prima em novos ciclos produtivos?",
        resposta: "Reciclagem",
        dicas: [
            "Transformar lixo em novos produtos.",
            "É comum com papel, plástico, metal e vidro.",
            "O processo reduz a necessidade de extração de novos recursos naturais."
        ]
    },
    {
        id: 17,
        categoria: "Biocombustíveis",
        cor: "yellow",
        pergunta: "Entre os combustíveis classificados como renováveis, qual substância líquida produzida por fermentação de biomassa vegetal possui grande relevância na matriz energética brasileira, especialmente no setor de transportes?",
        resposta: "Etanol",
        dicas: [
            "Combustível usado em carros flex.",
            "No Brasil, é produzido principalmente da cana-de-açúcar.",
            "É obtido principalmente da fermentação de açúcares presentes em vegetais."
        ]
    },
    {
        id: 18,
        categoria: "Consumo Sustentável",
        cor: "yellow",
        pergunta: "Qual conceito associado às práticas sustentáveis refere-se à adoção de padrões de consumo que buscam minimizar desperdícios, otimizar o uso de recursos naturais e reduzir impactos ambientais?",
        resposta: "Consumo consciente",
        dicas: [
            "Usar recursos com responsabilidade.",
            "Envolve reduzir desperdícios de água e energia.",
            "Relaciona comportamento humano e preservação ambiental."
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cards-container');
    const drawBtn = document.getElementById('btn-draw');

    function drawCards() {
        if(!cardsContainer) return;
        
        cardsContainer.innerHTML = '';
        cardsContainer.style.opacity = '0';
        
        const shuffled = [...bancoDeCartas].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        setTimeout(() => {
            selected.forEach((carta, index) => {
                const cardEl = itemToHTML(carta, index);
                cardsContainer.appendChild(cardEl);
            });
            cardsContainer.style.opacity = '1';
        }, 150);
    }

    function itemToHTML(carta, index) {
        const wrapper = document.createElement('div');
        wrapper.className = `card-wrapper ${carta.cor}`;
        wrapper.style.animationDelay = `${index * 0.15}s`;

        wrapper.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <div class="logo-circle" style="transform: scale(0.6); margin-bottom: 20px; animation: none;">
                        <span class="leaf-icon">🌿</span>
                    </div>
                    <h3 style="font-size: 1.5rem; letter-spacing: 2px;">CARTA SECRETA</h3>
                    <p style="color: var(--gold); margin-top: 10px; font-size: 0.9rem; text-transform: uppercase; font-weight: bold;">Toque para revelar</p>
                </div>
                <div class="card-back">
                    <div class="card-category">Carta ${carta.id} • ${carta.categoria}</div>
                    <div class="card-question">${carta.pergunta}</div>
                    
                    <div class="hints-container" id="hints-${carta.id}">
                        ${carta.dicas.map((dica, i) => `
                            <div class="hint" id="hint-${carta.id}-${i}"><strong style="color: var(--gold);">Dica ${i + 1}:</strong> ${dica}</div>
                        `).join('')}
                    </div>

                    <div class="answer-container" id="answer-${carta.id}">
                        <div class="answer-label">Resposta</div>
                        <div class="answer-text">${carta.resposta}</div>
                    </div>

                    <div class="actions" id="actions-${carta.id}">
                        <button class="btn btn-small outline-btn hint-btn" data-card="${carta.id}">Mostrar Dica 1</button>
                        <button class="btn btn-small btn-success answer-btn" data-card="${carta.id}">Revelar Resposta</button>
                    </div>
                </div>
            </div>
        `;

        let isRevealed = false;
        wrapper.addEventListener('click', (e) => {
            if (e.target.closest('.btn')) return; // ignora se clicou num butão interno da diretiva
            if (!isRevealed) {
                isRevealed = true;
                wrapper.classList.add('revealed');
            }
        });

        let currentHint = 0;
        const hintsBtn = wrapper.querySelector('.hint-btn');
        hintsBtn.addEventListener('click', () => {
            const hintEl = wrapper.querySelector(`#hint-${carta.id}-${currentHint}`);
            if (hintEl) {
                hintEl.style.display = 'block';
                currentHint++;
                
                if (currentHint < 3) {
                    hintsBtn.textContent = `Mostrar Dica ${currentHint + 1}`;
                } else {
                    hintsBtn.style.display = 'none';
                }
            }
        });

        const answerBtn = wrapper.querySelector('.answer-btn');
        answerBtn.addEventListener('click', () => {
            const answerContainer = wrapper.querySelector(`#answer-${carta.id}`);
            answerContainer.style.display = 'block';
            answerBtn.style.display = 'none';
        });

        return wrapper;
    }

    if(drawBtn) {
        drawBtn.addEventListener('click', () => {
            drawBtn.style.transform = 'scale(0.95)';
            setTimeout(() => drawBtn.style.transform = '', 150);
            drawCards();
        });
    }

    if(cardsContainer) {
        cardsContainer.style.transition = 'opacity 0.3s ease';
        drawCards();
    }
});
