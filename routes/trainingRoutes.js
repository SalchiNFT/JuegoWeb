// routes/trainingRoutes.js

const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

// Middleware de protección
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'No autorizado. Por favor, inicia sesión.' });
};


// ------------------------------------------
// LÓGICA DE COMBATE
// ------------------------------------------

const BASE_HP = 100;
const BASE_DAMAGE = 10;
const ELEMENT_MODIFIER = 10; 

// Lista de los 5 elementos disponibles para el oponente
const ALL_ELEMENTS = ['Agua', 'Fuego', 'Viento', 'Tierra', 'Electricidad'];

// Define las fortalezas elementales
const ELEMENTAL_STRENGTHS = {
    'Agua': 'Fuego',
    'Fuego': 'Viento',
    'Viento': 'Tierra',
    'Tierra': 'Electricidad',
    'Electricidad': 'Agua',
};

const MOVE_RELATION = {
    'Ataque fuerte': 'Bloqueo',
    'Bloqueo': 'Contraataque',
    'Contraataque': 'Ataque fuerte',
};

const getRandomOpponentElement = () => {
    const index = Math.floor(Math.random() * ALL_ELEMENTS.length);
    return ALL_ELEMENTS[index];
};

const getElementDamageModifier = (attackElement, defenseElement) => {
    const defElementClean = defenseElement.replace(' - DEF', ''); 
    
    if (ELEMENTAL_STRENGTHS[attackElement] === defElementClean) {
        return ELEMENT_MODIFIER; // Fuerte (+10)
    }
    
    for (const strongElement in ELEMENTAL_STRENGTHS) {
        if (ELEMENTAL_STRENGTHS[strongElement] === attackElement && strongElement === defElementClean) {
            return -ELEMENT_MODIFIER; // Débil (-10)
        }
    }
    
    return 0; // Neutral (0)
};

const resolveRound = (playerMove, playerAtkElement, playerDefElement, opponentMove, opponentAtkElement, opponentDefElement) => {
    
    let playerDamage = 0;
    let opponentDamage = 0;
    let resultMessage = '';

    // 1. COMPARAR MOVIMIENTO
    if (MOVE_RELATION[playerMove] === opponentMove) {
        
        resultMessage = '¡Victoria de movimiento! El oponente fue superado.';
        const elementMod = getElementDamageModifier(playerAtkElement, opponentDefElement);
        opponentDamage = BASE_DAMAGE + elementMod;
        
    } 
    else if (MOVE_RELATION[opponentMove] === playerMove) {
        
        resultMessage = '¡Derrota de movimiento! Fuiste superado.';
        const elementMod = getElementDamageModifier(opponentAtkElement, playerDefElement);
        playerDamage = BASE_DAMAGE + elementMod;

    } 
    else {
        
        resultMessage = '¡Empate de movimientos! Ambos reciben daño.';

        // Jugador ataca al oponente
        let playerAttackMod = getElementDamageModifier(playerAtkElement, opponentDefElement);
        opponentDamage = BASE_DAMAGE + playerAttackMod;
        
        // Oponente ataca al jugador
        let opponentAttackMod = getElementDamageModifier(opponentAtkElement, playerDefElement);
        playerDamage = BASE_DAMAGE + opponentAttackMod;
        
    }

    playerDamage = Math.max(0, playerDamage);
    opponentDamage = Math.max(0, opponentDamage);
    
    return {
        resultMessage,
        playerDamage,
        opponentDamage,
        playerMove,
        opponentMove
    };
};

// ------------------------------------------
// RUTA 1: INICIAR O REPETIR COMBATE (POST /api/training/start)
// ------------------------------------------
router.post('/start', isAuthenticated, async (req, res) => {
    const { characterId, attackElement, defenseElement } = req.body;
    
    if (!characterId || !attackElement || !defenseElement) {
        return res.status(400).json({ message: 'Faltan parámetros de entrenamiento.' });
    }

    try {
        const character = await Character.findById(characterId);
        if (!character || character.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Personaje no encontrado o acceso denegado.' });
        }
        
        const fullAttackElement = attackElement + ' - ATK';
        const fullDefenseElement = defenseElement + ' - DEF';
        if (!character.playerAtk.includes(fullAttackElement) || !character.playerDef.includes(fullDefenseElement)) {
            return res.status(400).json({ message: 'El personaje no posee los elementos seleccionados.' });
        }
        
        // El oponente elige elementos iniciales (puede ser aleatorio o fijo)
        const opponentAtkInitial = getRandomOpponentElement();
        const opponentDefInitial = getRandomOpponentElement();
        
        const initialState = {
            playerHp: BASE_HP,
            opponentHp: BASE_HP,
            playerAtk: attackElement, 
            playerDef: defenseElement,
            opponentAtk: opponentAtkInitial, // Oponente elige un elemento de ATK
            opponentDef: opponentDefInitial, // Oponente elige un elemento de DEF
            round: 0,
            log: []
        };
        
        res.json({
            success: true,
            message: 'Combate iniciado.',
            initialState: initialState
        });

    } catch (error) {
        console.error('Error al iniciar el combate:', error);
        // El error de conexión del cliente (`image_ca0728.jpg`) se genera si el cliente 
        // no recibe una respuesta. Aseguramos una respuesta 500 en caso de fallo del servidor.
        res.status(500).json({ message: 'Error interno del servidor al iniciar el combate.' });
    }
});


// ------------------------------------------
// RUTA 2: RESOLVER RONDA (POST /api/training/round)
// ------------------------------------------
router.post('/round', isAuthenticated, async (req, res) => {
    const { gameState, playerMove } = req.body; 
    
    if (!gameState || !playerMove || !gameState.playerAtk || !gameState.playerDef) {
        return res.status(400).json({ message: 'Faltan parámetros de la ronda o elementos seleccionados.' });
    }
    
    // 🚨 El oponente elige nuevos elementos aleatorios en cada ronda
    const opponentAtkNew = getRandomOpponentElement();
    const opponentDefNew = getRandomOpponentElement();
    
    // Simulación simple de movimiento del oponente
    const opponentMoves = Object.keys(MOVE_RELATION); 
    const opponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];

    // 1. Resolver la ronda usando los elementos que el cliente acaba de enviar (Player)
    // y los elementos aleatorios generados (Opponent)
    const roundResult = resolveRound(
        playerMove, 
        gameState.playerAtk, // Elemento de ATK elegido por el jugador para esta ronda
        gameState.playerDef, // Elemento de DEF elegido por el jugador para esta ronda
        opponentMove, 
        opponentAtkNew, // Elemento de ATK elegido por el oponente para esta ronda
        opponentDefNew // Elemento de DEF elegido por el oponente para esta ronda
    );

    // 2. Calcular nuevo HP
    let newPlayerHp = Math.max(0, gameState.playerHp - roundResult.playerDamage);
    let newOpponentHp = Math.max(0, gameState.opponentHp - roundResult.opponentDamage);

    // 3. Crear registro de log 
    const roundLog = {
        round: gameState.round + 1,
        playerMove: playerMove,
        opponentMove: opponentMove,
        playerAtk: gameState.playerAtk, 
        playerDef: gameState.playerDef, 
        opponentAtk: opponentAtkNew, // Guardar el elemento que usó el oponente en esta ronda
        opponentDef: opponentDefNew, // Guardar el elemento que usó el oponente en esta ronda
        playerDamageTaken: roundResult.playerDamage,
        opponentDamageTaken: roundResult.opponentDamage,
        result: roundResult.resultMessage
    };

    // 4. Actualizar el estado del juego para la PRÓXIMA ronda
    const newGameState = {
        ...gameState,
        playerHp: newPlayerHp,
        opponentHp: newOpponentHp,
        playerAtk: gameState.playerAtk, // Mantener la última selección del jugador para pre-selección
        playerDef: gameState.playerDef, // Mantener la última selección del jugador para pre-selección
        opponentAtk: opponentAtkNew, // Guardar los elementos que usó el oponente para el log (aunque en la próxima ronda se reescribirán)
        opponentDef: opponentDefNew, // Guardar los elementos que usó el oponente para el log
        round: gameState.round + 1,
        log: [...gameState.log, roundLog]
    };
    
    // 5. Verificar si el combate terminó
    const combatFinished = newPlayerHp <= 0 || newOpponentHp <= 0;
    
    // 6. Si terminó, aplicar la recompensa (solo si el jugador ganó)
    let finalMessage = '';
    if (combatFinished) {
        const playerWon = newOpponentHp <= 0 && newPlayerHp > 0;
        
        if (playerWon) {
             finalMessage = '¡VICTORIA! El oponente ha sido derrotado.';
        } else {
             finalMessage = '¡DERROTA! Has perdido el combate.';
        }
    }
    
    // 7. Devolver el nuevo estado del juego al cliente
    res.json({
        success: true,
        gameState: newGameState,
        combatFinished: combatFinished,
        finalMessage: finalMessage
    });
});


module.exports = router;