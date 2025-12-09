// public/Training/Training.js

import { checkAuthAndRedirect } from '../js/authChecker.js'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Proteger la página
    checkAuthAndRedirect();
    
    // --- ESTADO LOCAL ---
    let currentCharacters = [];
    let selectedCharacterId = null;
    let selectedCharacter = null; 
    let selectedAttack = null; 
    let selectedDefense = null; 
    let gameState = null; 
    
    // --- ELEMENTOS DE LA UI ---
    const characterListContainer = document.getElementById('characterList');
    const elementSelectionArea = document.getElementById('elementSelectionArea');
    const messageBox = document.getElementById('messageBox');
    const selectedCharacterNameSpan = document.getElementById('selectedCharacterName');
    
    // Controles iniciales
    const initialSelectionControls = document.getElementById('initialSelectionControls');
    const availableAttackElementsDiv = document.getElementById('availableAttackElements');
    const availableDefenseElementsDiv = document.getElementById('availableDefenseElements');
    const startTrainingBtn = document.getElementById('startTrainingBtn');
    const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');

    // Elementos de imagen y HP
    const playerImage = document.getElementById('playerImage');
    const opponentImage = document.getElementById('opponentImage');
    const playerHpBar = document.getElementById('playerHpBar');
    const opponentHpBar = document.getElementById('opponentHpBar');
    const playerHpText = document.getElementById('playerHpText');
    const opponentHpText = document.getElementById('opponentHpText');
    
    // Controles de combate
    const combatControls = document.getElementById('combatControls');
    const roundNumberSpan = document.getElementById('roundNumber');
    const moveButtons = document.querySelectorAll('.combat-move-buttons button');
    
    // Elementos de selección por ronda
    const roundAttackElementsDiv = document.getElementById('roundAttackElements');
    const roundDefenseElementsDiv = document.getElementById('roundDefenseElements');
    const roundSelectionControls = document.getElementById('roundSelectionControls');
    const currentRoundAttackSpan = document.getElementById('currentRoundAttack');
    const currentRoundDefenseSpan = document.getElementById('currentRoundDefense');
    
    // Menú de fin de combate
    const combatEndMenu = document.getElementById('combatEndMenu');
    const combatEndTitle = document.getElementById('combatEndTitle');
    const startNewCombatBtn = document.getElementById('startNewCombatBtn');
    const repeatCombatBtn = document.getElementById('repeatCombatBtn');
    const exitTrainingBtn = document.getElementById('exitTrainingBtn');

    // Log de combate
    const combatLogArea = document.getElementById('combatLogArea');
    const combatLogDiv = document.getElementById('combatLog');


    // --- UTILITIES ---
    const BASE_HP = 100;
    const displayMessage = (message, isError = true) => {
        messageBox.textContent = message;
        messageBox.classList.remove('hidden');
        messageBox.style.backgroundColor = isError ? '#fbecec' : '#d4edda';
        messageBox.style.color = isError ? '#c0392b' : '#155724';
        messageBox.style.borderColor = isError ? '#c0392b' : '#155724';
    };
    const hideMessage = () => {
        messageBox.classList.add('hidden');
    };
    const enableStartButton = () => {
        startTrainingBtn.disabled = !(selectedAttack && selectedDefense);
    };

    const updateHpDisplay = (playerHp, opponentHp) => {
        const playerHpPercent = (playerHp / BASE_HP) * 100;
        const opponentHpPercent = (opponentHp / BASE_HP) * 100;

        playerHpBar.style.width = `${Math.max(0, playerHpPercent)}%`;
        playerHpText.textContent = `${Math.max(0, playerHp)} / ${BASE_HP}`;
        
        opponentHpBar.style.width = `${Math.max(0, opponentHpPercent)}%`;
        opponentHpText.textContent = `${Math.max(0, opponentHp)} / ${BASE_HP}`;
    };

    // Renderizar el historial de combate
    const renderCombatLog = () => {
        combatLogDiv.innerHTML = '';
        gameState.log.slice().reverse().forEach(entry => { 
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-round-entry';
            
            entryDiv.innerHTML = `
                <div class="log-round-header">Ronda ${entry.round}</div>
                <div class="log-actions-container">
                    
                    <div class="log-move-box">
                        <h5>${entry.playerMove}</h5>
                        <div class="log-move-details">
                            <span class="attack-element">ATK: ${entry.playerAtk}</span>
                            <span class="defense-element">DEF: ${entry.playerDef}</span>
                        </div>
                    </div>

                    <div class="log-move-box">
                        <h5>${entry.opponentMove}</h5>
                        <div class="log-move-details">
                            <span class="attack-element">ATK: ${entry.opponentAtk}</span>
                            <span class="defense-element">DEF: ${entry.opponentDef}</span>
                        </div>
                    </div>

                </div>
                <div class="log-damage-result">
                    ${entry.result}
                    <br>
                    Recibido: <strong>${entry.playerDamageTaken}</strong> | Infligido: <strong>${entry.opponentDamageTaken}</strong>
                </div>
            `;
            combatLogDiv.appendChild(entryDiv);
        });
        // Desplazar al inicio (última ronda)
        combatLogDiv.scrollTop = 0;
    };


    // --- 2. RENDERIZACIÓN DE PERSONAJES ---
    const renderCharacterList = () => {
        characterListContainer.innerHTML = ''; 
        hideMessage();

        if (currentCharacters.length === 0) {
            displayMessage('No tienes personajes disponibles para entrenar. Ve al Sanctuary para crear uno.', false);
            return;
        }

        currentCharacters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            if (character._id === selectedCharacterId) {
                card.classList.add('selected');
            }
            card.setAttribute('data-id', character._id);
            const atkElements = character.playerAtk.map(e => e.replace(' - ATK', '')).join(', ');
            const defElements = character.playerDef.map(e => e.replace(' - DEF', '')).join(', ');

            card.innerHTML = `
                <img src="/ImagenPersonaje.jpg" alt="${character.name}">
                <div style="display: inline-block; vertical-align: top; margin-left: 10px;">
                    <h4>${character.name}</h4>
                    <p>HP: ${character.hp} / 100</p>
                    <p>ATK: ${atkElements} | DEF: ${defElements}</p>
                </div>
            `;
            
            card.addEventListener('click', () => handleCharacterSelection(character));
            characterListContainer.appendChild(card);
        });
    };
    
    // --- 3. CARGA DE PERSONAJES DESDE EL BACKEND ---
    const fetchCharacters = async () => {
        try {
            const response = await fetch('/api/characters'); 
            
            if (response.ok) {
                currentCharacters = await response.json();
                renderCharacterList();
            } else if (response.status === 401) {
                window.location.href = '/Auth/Login.html';
            } else {
                displayMessage(`Error (${response.status}) al cargar los personajes.`, true);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            displayMessage('Error de conexión con el servidor. Verifica la URL o el estado del backend.', true); 
        }
    };
    
    // --- 4. SELECCIÓN DE PERSONAJE ---
    const handleCharacterSelection = (character) => {
        selectedAttack = null;
        selectedDefense = null;
        
        selectedCharacterId = character._id;
        selectedCharacter = character; 
        selectedCharacterNameSpan.textContent = character.name;
        
        playerImage.src = '/ImagenPersonaje.jpg'; 
        playerImage.classList.remove('hidden');
        opponentImage.classList.remove('hidden'); 

        updateHpDisplay(BASE_HP, BASE_HP); 
        
        renderElementSelections(character, availableAttackElementsDiv, 'trainingAttack', 'initial');
        renderElementSelections(character, availableDefenseElementsDiv, 'trainingDefense', 'initial');
        
        elementSelectionArea.classList.remove('hidden');
        initialSelectionControls.classList.remove('hidden'); 
        combatControls.classList.add('hidden'); 
        combatEndMenu.classList.add('hidden'); 
        combatLogArea.classList.add('hidden'); 
        roundSelectionControls.classList.add('hidden'); 

        document.querySelectorAll('input[name="trainingAttack"]:checked').forEach(r => r.checked = false);
        document.querySelectorAll('input[name="trainingDefense"]:checked').forEach(r => r.checked = false);

        renderCharacterList(); 
        enableStartButton();
    };

    // --- 5. RENDERIZACIÓN DE ELEMENTOS ---
    const renderElementSelections = (character, container, name, type, currentSelection = null) => {
        container.innerHTML = '';
        
        const isAttack = name.includes('Attack');
        const elements = isAttack ? character.playerAtk : character.playerDef;
        const suffix = isAttack ? ' - ATK' : ' - DEF';

        elements.forEach(element => {
            const elementValue = element.replace(suffix, ''); 
            const isChecked = elementValue === currentSelection;
            const elementId = `${name}-${elementValue.replace(/\s/g, '_')}`; // ID único

            // Generamos el input y el texto directamente dentro del label.
            const label = document.createElement('label');
            label.setAttribute('for', elementId);
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = name;
            input.value = elementValue;
            input.id = elementId;
            if (isChecked) {
                input.checked = true;
            }

            label.appendChild(input);
            label.appendChild(document.createTextNode(elementValue)); // Texto del elemento
            
            container.appendChild(label);
        });
        
        // Asignar listeners de cambio
        document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            radio.removeEventListener('change', handleElementChange);
            radio.setAttribute('data-listener-type', type);
            radio.addEventListener('change', handleElementChange);
        });
    };
    
    // Función central para manejar los cambios de radio button
    const handleElementChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        const type = e.target.getAttribute('data-listener-type');

        if (name === 'trainingAttack') {
            selectedAttack = value;
        } else if (name === 'trainingDefense') {
            selectedDefense = value;
        } else if (name === 'roundAttack') {
            gameState.playerAtk = value; 
            currentRoundAttackSpan.textContent = value;
        } else if (name === 'roundDefense') {
            gameState.playerDef = value; 
            currentRoundDefenseSpan.textContent = value;
        }
        
        if (type === 'initial') {
            enableStartButton();
        }
    };
    
    // --- 5.5 RENDERIZACIÓN DE ELEMENTOS POR RONDA ---
    const renderRoundSelections = () => {
        const currentAtk = gameState.playerAtk;
        const currentDef = gameState.playerDef;
        
        renderElementSelections(selectedCharacter, roundAttackElementsDiv, 'roundAttack', 'round', currentAtk);
        renderElementSelections(selectedCharacter, roundDefenseElementsDiv, 'roundDefense', 'round', currentDef);
        
        currentRoundAttackSpan.textContent = currentAtk;
        currentRoundDefenseSpan.textContent = currentDef;

        roundSelectionControls.classList.remove('hidden');
    };


    // --- 6. INICIO DE COMBATE ---
    const startCombat = async (atkElement, defElement) => {
        startTrainingBtn.disabled = true;
        repeatCombatBtn.disabled = true;
        displayMessage('Iniciando combate...', false);
        
        try {
            const response = await fetch('/api/training/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterId: selectedCharacterId,
                    attackElement: atkElement,
                    defenseElement: defElement
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                gameState = data.initialState;
                hideMessage();
                
                gameState.playerAtk = atkElement;
                gameState.playerDef = defElement;
                
                initialSelectionControls.classList.add('hidden');
                combatControls.classList.remove('hidden');
                combatLogArea.classList.remove('hidden');
                roundNumberSpan.textContent = gameState.round;
                combatLogDiv.innerHTML = 'El historial de combate aparecerá aquí.';
                
                renderRoundSelections();
                
                updateHpDisplay(gameState.playerHp, gameState.opponentHp);
                moveButtons.forEach(btn => btn.disabled = false); 
                
            } else {
                displayMessage(`Error al iniciar: ${data.message}`, true);
            }

        } catch (error) {
            console.error('Error de red al iniciar combate:', error);
            displayMessage('Error de conexión con el servidor al iniciar el combate.', true);
        } finally {
            startTrainingBtn.disabled = false;
            repeatCombatBtn.disabled = false;
        }
    };

    startTrainingBtn.addEventListener('click', () => {
        if (selectedCharacterId && selectedAttack && selectedDefense) {
            startCombat(selectedAttack, selectedDefense);
        }
    });


    // --- 7. RESOLVER RONDA ---
    const handleMoveSelection = async (playerMove) => {
        if (!gameState || gameState.playerHp <= 0 || gameState.opponentHp <= 0) return;
        
        if (!gameState.playerAtk || !gameState.playerDef) {
            displayMessage('Por favor, selecciona elementos de Ataque y Defensa para la ronda.', true);
            return;
        }
        
        moveButtons.forEach(btn => btn.disabled = true); 
        
        let data; 

        try {
            const response = await fetch('/api/training/round', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameState: gameState, 
                    playerMove: playerMove
                })
            });

            data = await response.json(); 
            
            if (response.ok) {
                gameState = data.gameState;
                updateHpDisplay(gameState.playerHp, gameState.opponentHp);
                renderCombatLog();
                roundNumberSpan.textContent = gameState.round;
                
                if (data.combatFinished) {
                    combatControls.classList.add('hidden');
                    combatEndMenu.classList.remove('hidden');
                    combatEndTitle.textContent = data.finalMessage;
                    roundSelectionControls.classList.add('hidden');
                    fetchCharacters(); 
                } else {
                    renderRoundSelections();
                }
                
            } else {
                displayMessage(`Error de ronda: ${data.message}`, true);
            }

        } catch (error) {
            console.error('Error de red al resolver ronda:', error);
            displayMessage('Error de conexión con el servidor al resolver la ronda.', true);
        } finally {
            if (!data || !data.combatFinished) {
                moveButtons.forEach(btn => btn.disabled = false);
            }
        }
    };

    // Asignar listeners a los botones de movimiento
    moveButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const move = e.target.getAttribute('data-move');
            handleMoveSelection(move);
        });
    });


    // --- 8. MANEJO DE BOTONES FINALES ---

    repeatCombatBtn.addEventListener('click', () => {
        if (selectedAttack && selectedDefense) {
            combatEndMenu.classList.add('hidden');
            startCombat(selectedAttack, selectedDefense); 
        } else {
            displayMessage('No se pudo encontrar la selección inicial para repetir el combate.', true);
        }
    });

    exitTrainingBtn.addEventListener('click', () => {
        window.location.href = '../Village/Village.html';
    });

    startNewCombatBtn.addEventListener('click', () => {
        selectedCharacterId = null;
        selectedCharacter = null;
        selectedAttack = null;
        selectedDefense = null;
        gameState = null;
        
        elementSelectionArea.classList.add('hidden');
        combatLogArea.classList.add('hidden');
        combatEndMenu.classList.add('hidden');
        
        fetchCharacters();
    });

    // Cancelar Selección Inicial
    cancelSelectionBtn.addEventListener('click', () => {
        selectedCharacterId = null;
        selectedCharacter = null;
        selectedAttack = null;
        selectedDefense = null;
        gameState = null;
        elementSelectionArea.classList.add('hidden');
        
        playerImage.classList.add('hidden');
        opponentImage.classList.add('hidden');
        updateHpDisplay(BASE_HP, BASE_HP);

        renderCharacterList();
        enableStartButton();
    });

    // --- 9. INICIO DE LA APLICACIÓN ---
    fetchCharacters(); 
});