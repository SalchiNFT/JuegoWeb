// public/Training/Training.js

const MAX_HP = 10;
let playerHP = MAX_HP; 
let cpuHP = MAX_HP;
let running = true;

let playerName = "";
let atkSelection = [];
let defSelection = [];
let selectedAttack = null; 
let selectedDefense = null; 
let currentCharacterId = null; // 💡 Nuevo: ID del personaje desde MongoDB

// Definimos la URL base de nuestra API (Asegúrate que el puerto coincida con server.js)
const API_BASE_URL = 'http://localhost:3000/api/characters';


// Variables fijas del combate
const cpuAtkOptions = ["Fuego", "Agua", "Tierra", "Electricidad", "Viento"];
const cpuDefOptions = ["Escudo Fuego", "Escudo Agua", "Escudo Tierra", "Escudo Electricidad", "Escudo Viento"];
const titleEl = document.getElementById("title");
const logContent = document.getElementById("logContent");

const beats = {
    "Ataque Fuerte": "Bloqueo",
    "Bloqueo": "Contraataque",
    "Contraataque": "Ataque Fuerte"
};

const elementalStrengths = {
    "Agua":         { weakTo: "Electricidad", strongAgainst: ["Fuego"] },
    "Fuego":        { weakTo: "Agua", strongAgainst: ["Viento"] },
    "Viento":       { weakTo: "Fuego", strongAgainst: ["Tierra"] },
    "Tierra":       { weakTo: "Viento", strongAgainst: ["Electricidad"] },
    "Electricidad": { weakTo: "Tierra", strongAgainst: ["Agua"] }
};

// --- UTILERIAS Y UI (Se mantienen igual) ---

function getRandomElement(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function flash(id){
    const el = document.getElementById(id);
    el.style.transition="0.3s";
    el.style.transform="scale(1.2)";
    el.style.background="#8b1e23";
    setTimeout(()=>{
        el.style.transform="scale(1)";
        el.style.background="#3f4b64";
    },300);
}

function showEffect(icon){
    const el = document.createElement("div");
    el.className = "attackEffect";
    el.innerText = icon;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),700);
}

function updateHPDisplay(idPrefix, currentHP) {
    const fillEl = document.querySelector(`#${idPrefix}HPContainer .hp-bar-fill`);
    const textEl = document.querySelector(`#${idPrefix}HPContainer .hp-text`);
    
    if (!fillEl || !textEl) return;

    const percentage = (currentHP / MAX_HP) * 100;
    
    fillEl.style.width = percentage + '%';
    textEl.innerText = `${currentHP}/${MAX_HP}`;

    if (percentage > 50) {
        fillEl.style.backgroundColor = '#4CAF50';
    } else if (percentage > 20) {
        fillEl.style.backgroundColor = '#FFC107';
    } else {
        fillEl.style.backgroundColor = '#F44336';
    }
}

function getElementalEffectText(mod) {
    if (mod > 0) return '<span class="super-effective elemental-effect">¡Super Efectivo!</span>';
    if (mod < 0) return '<span class="not-effective elemental-effect">No Efectivo.</span>';
    return '<span class="normal-effective elemental-effect">Daño normal.</span>';
}

function logTurn(action, atkChoice, defChoice, cpuChoice, cpuAtk, cpuDef, result, pDmg, cDmg, pEff, cEff){
    const div = document.createElement("div");
    let cls = 'draw';
    
    if (cDmg > 0 && pDmg == 0) cls = 'win';
    else if (pDmg > 0 && cDmg == 0) cls = 'lose';
    
    div.className = `log-entry ${cls}`;
    
    let actionText = `
        <strong>Turno:</strong> 
        ${playerName}: ${action} (${atkChoice} / ${defChoice.replace('Escudo ', 'S-')}) | 
        CPU: ${cpuChoice} (${cpuAtk} / ${cpuDef.replace('Escudo ', 'S-')})
        <br>
    `;

    let damageDetails = '';
    if (cDmg > 0) {
        damageDetails += `<span class="win">${playerName} daña a CPU: -${cDmg} HP.</span> ${pEff || ''}`;
    }
    if (pDmg > 0) {
        if (cDmg > 0) damageDetails += ' | ';
        damageDetails += `<span class="lose">CPU daña a ${playerName}: -${pDmg} HP.</span> ${cEff || ''}`;
    }

    if (!damageDetails) {
        damageDetails = 'Resultado: Empate sin daño. ' + result;
    } else {
        damageDetails = `Resultado: ${result}. ${damageDetails}`;
    }

    div.innerHTML = actionText + damageDetails;
    logContent.prepend(div);
    logContent.scrollTop = 0;
}

// --- LOGICA DE CARTAS Y ELEMENTOS (Se mantienen igual) ---

function selectCard(clickedButton, elementValue, type) {
    const allCardsOfType = document.querySelectorAll(`.${type}-card`);

    allCardsOfType.forEach(btn => btn.classList.remove('selected'));
    clickedButton.classList.add('selected');

    if (type === 'attack') {
        selectedAttack = elementValue;
    } else {
        selectedDefense = elementValue;
    }
}

function calculateElementalMod(attackerElement, defenderShield) {
    let modifier = 0;
    
    if (!attackerElement) return 0;

    const defenderElement = defenderShield.split(" ")[1] || defenderShield; 

    if (attackerElement === defenderElement) {
        return 0; 
    }
    
    const atkData = elementalStrengths[attackerElement];
    
    if (atkData) {
        if (atkData.strongAgainst.includes(defenderElement)) {
            modifier += 1;
        }
        
        if (atkData.weakTo === defenderElement) {
            modifier -= 1;
        }
    }
    
    return modifier;
}


// --- LÓGICA DE ACTUALIZACIÓN DE ESTADO DEL SERVIDOR ---

async function updateCharacterHP(newHP) {
    if (!currentCharacterId) return;

    try {
        await fetch(`${API_BASE_URL}/${currentCharacterId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ hp: newHP }),
        });
        // No necesitamos la respuesta, solo confirmar que se guardó.
        console.log(`HP (${newHP}) guardado en la DB.`);

    } catch (error) {
        console.error('Error al actualizar HP en la DB:', error);
        alert('Advertencia: El HP no se pudo guardar en el servidor.');
    }
}


// --- LOGICA DE COMBATE PRINCIPAL ---

function cpuPickMove(){
    const options = Object.keys(beats);
    return options[Math.floor(Math.random()*3)];
}

function checkGameOver(){
    if(playerHP<=0 || cpuHP<=0){
        running=false;
        if(playerHP>0 && cpuHP<=0) alert("¡Ganaste la partida!");
        else if(cpuHP>0 && playerHP<=0) alert("¡Perdiste la partida!");
        else alert("¡Doble KO! Empate final.");

        // 💡 Nuevo: Guardar el HP final en la base de datos al terminar el combate
        updateCharacterHP(playerHP); 
    }
}

export function play(action){
    if(!running) return;

    const pAtkChoice = selectedAttack;
    const pDefChoice = selectedDefense;
    
    if(!pAtkChoice || !pDefChoice){
        alert("Debes seleccionar una carta de ataque y una de defensa para jugar.");
        return;
    }
    
    // ... (Lógica de CPU pick move, iconos, y daño - se mantiene igual)
    const cpuChoice = cpuPickMove();
    const cpuAtk = getRandomElement(cpuAtkOptions);
    const cpuDef = getRandomElement(cpuDefOptions);

    const icons = {"Ataque Fuerte":"💥","Contraataque":"🌀","Bloqueo":"🛡"};
    showEffect(icons[action]);

    let resultText = "";
    let pDmg = 0;
    let cDmg = 0;
    let pElementalText = '';
    let cElementalText = '';

    // 1. Lógica de Daño
    if(action===cpuChoice){
        resultText = "Empate de movimiento";
        
        const pElementalMod = calculateElementalMod(pAtkChoice, cpuDef);
        cDmg = Math.max(0, 1 + pElementalMod);
        pElementalText = getElementalEffectText(pElementalMod);

        const cpuElementalMod = calculateElementalMod(cpuAtk, pDefChoice); 
        pDmg = Math.max(0, 1 + cpuElementalMod);
        cElementalText = getElementalEffectText(cpuElementalMod);

    } else if(beats[action]===cpuChoice){
        resultText = `${playerName} gana el movimiento`;
        
        const pElementalMod = calculateElementalMod(pAtkChoice, cpuDef);
        cDmg = Math.max(0, 1 + pElementalMod);
        pElementalText = getElementalEffectText(pElementalMod);
        
        pDmg = 0;

    }else{
        resultText = `CPU gana el movimiento`;

        const cpuElementalMod = calculateElementalMod(cpuAtk, pDefChoice); 
        pDmg = Math.max(0, 1 + cpuElementalMod);
        cElementalText = getElementalEffectText(cpuElementalMod);

        cDmg = 0;
    }
    
    // 2. Aplicar Daño
    cpuHP -= cDmg;
    playerHP -= pDmg;
    
    if (cDmg > 0) flash("cpuChar");
    if (pDmg > 0) flash("playerChar");

    playerHP = Math.max(0, playerHP);
    cpuHP = Math.max(0, cpuHP);

    // 3. Actualizar UI y Log
    updateHPDisplay('player', playerHP); 
    updateHPDisplay('cpu', cpuHP); 

    logTurn(action, pAtkChoice, pDefChoice, cpuChoice, cpuAtk, cpuDef, resultText, pDmg, cDmg, pElementalText, cElementalText);
    
    checkGameOver();

    // 💡 Nuevo: Guardar HP después de CADA turno, por si el usuario abandona
    updateCharacterHP(playerHP);
}

export function resetGame(){
    if (!confirm("¿Estás seguro de que quieres volver a la Aldea? El HP actual será guardado.")) {
        return;
    }
    
    // El HP ya se guardó con updateCharacterHP(playerHP);
    
    // Redirige a la Aldea (Ruta corregida)
    window.location.href = '../Village/Village.html';
}

// --- INICIALIZACIÓN DE LA PÁGINA (CARGA EL ESTADO DESDE LA API) ---

async function initializeGame() {
    // 1. Obtener el ID del personaje guardado en localStorage
    currentCharacterId = localStorage.getItem('currentCharacterId');
    
    if (!currentCharacterId) {
        alert("No se encontró un personaje. Vuelve a la Aldea y crea uno en el Sanctuary.");
        window.location.href = '../Village/Village.html';
        return;
    }

    try {
        // 2. Llamar a la API para obtener los datos del personaje por ID
        const response = await fetch(`${API_BASE_URL}/${currentCharacterId}`);
        
        if (!response.ok) {
             throw new Error("Personaje no encontrado en la base de datos.");
        }
        
        const characterData = await response.json();

        // 3. Cargar datos del personaje
        playerName = characterData.name;
        atkSelection = characterData.playerAtk;
        defSelection = characterData.playerDef;
        playerHP = characterData.hp || MAX_HP; 
        cpuHP = MAX_HP;
        running = true;

        // 4. Renderizar las cartas del jugador
        titleEl.innerText = `¡${playerName} VS Máquina!`;
        const attackArea = document.getElementById("attackCardArea");
        const defenseArea = document.getElementById("defenseCardArea");
        attackArea.innerHTML = "";
        defenseArea.innerHTML = "";

        atkSelection.forEach(element => {
            const btn = document.createElement("button");
            btn.innerText = element;
            btn.className = "element-card attack-card";
            btn.onclick = () => selectCard(btn, element, 'attack'); 
            attackArea.appendChild(btn);
        });

        defSelection.forEach(element => {
            const btn = document.createElement("button");
            btn.innerText = element;
            btn.className = "element-card defense-card";
            btn.onclick = () => selectCard(btn, element, 'defense');
            defenseArea.appendChild(btn);
        });
        
        // 5. Renderizar HP
        updateHPDisplay('player', playerHP); 
        updateHPDisplay('cpu', cpuHP); 
        logContent.innerHTML = "";

    } catch (error) {
        alert("Error al cargar el personaje: " + error.message);
        console.error('Error de carga de personaje:', error);
        window.location.href = '../Village/Village.html';
    }
}

document.addEventListener('DOMContentLoaded', initializeGame);