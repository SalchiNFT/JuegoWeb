const express = require('express');
const router = express.Router();
const Character = require('../models/Character');

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
// RUTA 1: INICIAR O REPETIR COMBATE (POST /api/arena/start)
// ------------------------------------------
// 🚨 SIN MIDDLEWARE DE AUTENTICACIÓN
router.post('/start', async (req, res) => {
    const { characterId, attackElement, defenseElement } = req.body;
    
    if (!characterId || !attackElement || !defenseElement) {
        return res.status(400).json({ message: 'Faltan parámetros para iniciar el combate.' });
    }

    try {
        const character = await Character.findById(characterId); 
        if (!character) {
            return res.status(404).json({ message: 'Personaje no encontrado.' });
        }
        
        const fullAttackElement = attackElement + ' - ATK';
        const fullDefenseElement = defenseElement + ' - DEF';
        if (!character.playerAtk.includes(fullAttackElement) || !character.playerDef.includes(fullDefenseElement)) {
            return res.status(400).json({ message: 'El personaje no posee los elementos seleccionados.' });
        }
        
        // El oponente elige elementos iniciales
        const opponentAtkInitial = getRandomOpponentElement();
        const opponentDefInitial = getRandomOpponentElement();
        
        const initialState = {
            playerHp: BASE_HP,
            opponentHp: BASE_HP,
            characterId: characterId, 
            playerAtk: attackElement, 
            playerDef: defenseElement,
            opponentAtk: opponentAtkInitial, 
            opponentDef: opponentDefInitial, 
            round: 0,
            log: []
        };
        
        res.json({
            success: true,
            message: 'Combate de Arena iniciado (Sin Autenticación).',
            initialState: initialState
        });

    } catch (error) {
        console.error('Error al iniciar el combate de Arena:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar el combate.' });
    }
});


// ------------------------------------------
// RUTA 2: RESOLVER RONDA (POST /api/arena/round)
// ------------------------------------------
// 🚨 SIN MIDDLEWARE DE AUTENTICACIÓN
router.post('/round', async (req, res) => {
    const { gameState, playerMove } = req.body; 
    
    if (!gameState || !playerMove || !gameState.playerAtk || !gameState.playerDef) {
        return res.status(400).json({ message: 'Faltan parámetros de la ronda o elementos seleccionados.' });
    }
    
    // El oponente elige nuevos elementos y movimiento aleatorios en cada ronda
    const opponentAtkNew = getRandomOpponentElement();
    const opponentDefNew = getRandomOpponentElement();
    
    const opponentMoves = Object.keys(MOVE_RELATION); 
    const opponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];

    // 1. Resolver la ronda
    const roundResult = resolveRound(
        playerMove, 
        gameState.playerAtk, 
        gameState.playerDef, 
        opponentMove, 
        opponentAtkNew, 
        opponentDefNew 
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
        opponentAtk: opponentAtkNew, 
        opponentDef: opponentDefNew, 
        playerDamageTaken: roundResult.playerDamage,
        opponentDamageTaken: roundResult.opponentDamage,
        result: roundResult.resultMessage
    };

    // 4. Actualizar el estado del juego para la PRÓXIMA ronda
    const newGameState = {
        ...gameState,
        playerHp: newPlayerHp,
        opponentHp: newOpponentHp,
        playerAtk: gameState.playerAtk, 
        playerDef: gameState.playerDef, 
        opponentAtk: opponentAtkNew, 
        opponentDef: opponentDefNew, 
        round: gameState.round + 1,
        log: [...gameState.log, roundLog]
    };
    
    // 5. Verificar si el combate terminó
    const combatFinished = newPlayerHp <= 0 || newOpponentHp <= 0;
    
    // 6. Si terminó, aplicar la recompensa/penalización de la Arena
    let finalMessage = '';
    if (combatFinished) {
        const playerWon = newOpponentHp <= 0 && newPlayerHp > 0;
        const charId = gameState.characterId; 
        
        try {
            if (playerWon) {
                finalMessage = '¡VICTORIA EN LA ARENA! El personaje gana 5 HP.';
                await Character.findByIdAndUpdate(charId, { $inc: { hp: 5 } }); 
            } else {
                finalMessage = '¡DERROTA EN LA ARENA! El personaje pierde 5 HP.';
                await Character.findByIdAndUpdate(charId, { $inc: { hp: -5 } }); 
            }
        } catch (error) {
            console.error('Error al actualizar HP del personaje tras el combate (sin autenticar):', error);
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