const MAX_HP = 10;
let playerHP = MAX_HP;
let cpuHP = MAX_HP;
let running = true;

let playerName = "";
let atkSelection = [];
let defSelection = [];

let selectedAttack = null; 
let selectedDefense = null; 

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

function getRandomElement(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function checkElementSelection(selector, count) {
    return Array.from(document.querySelectorAll(selector + ':checked')).length === count;
}


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


function startGame(){
    playerName = document.getElementById("playerName").value || "Jugador";
    atkSelection = Array.from(document.querySelectorAll(".atk:checked")).map(c=>c.value);
    defSelection = Array.from(document.querySelectorAll(".def:checked")).map(c=>c.value);

    if(!checkElementSelection(".atk", 3) || !checkElementSelection(".def", 3)){
        alert("Debes seleccionar exactamente 3 elementos de ataque y 3 de defensa.");
        return;
    }
    
    document.body.classList.remove('setup-bg');
    document.body.classList.add('game-bg');

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

    selectedAttack = null;
    selectedDefense = null;


    document.getElementById("setup").classList.add("hidden");
    document.getElementById("gameArea").classList.remove("hidden");

    titleEl.innerText = `¡${playerName} VS Máquina!`;
    logContent.innerHTML="";
    running = true;
    
    updateHPDisplay('player', playerHP); 
    updateHPDisplay('cpu', cpuHP); 
}

function cpuPickMove(){
    const options = Object.keys(beats);
    return options[Math.floor(Math.random()*3)];
}

function showEffect(icon){
    const el = document.createElement("div");
    el.className = "attackEffect";
    el.innerText = icon;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),700);
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

function calculateElementalMod(attackerElement, defenderShield) {
    let modifier = 0;
    
    if (!attackerElement) return 0;

    const defenderElement = defenderShield.split(" ")[1] || defenderShield; 

    // MODIFICACIÓN GUARDADA: Daño normal garantizado si el ataque y la defensa son del mismo elemento.
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


function play(action){
    if(!running) return;

    const pAtkChoice = selectedAttack;
    const pDefChoice = selectedDefense;
    
    if(!pAtkChoice || !pDefChoice){
        alert("Debes seleccionar una carta de ataque y una de defensa para jugar.");
        return;
    }
    
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
    
    cpuHP -= cDmg;
    playerHP -= pDmg;
    
    if (cDmg > 0) flash("cpuChar");
    if (pDmg > 0) flash("playerChar");

    playerHP = Math.max(0, playerHP);
    cpuHP = Math.max(0, cpuHP);


    updateHPDisplay('player', playerHP); 
    updateHPDisplay('cpu', cpuHP); 

    logTurn(action, pAtkChoice, pDefChoice, cpuChoice, cpuAtk, cpuDef, resultText, pDmg, cDmg, pElementalText, cElementalText);
    
    checkGameOver();
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

function checkGameOver(){
    if(playerHP<=0 || cpuHP<=0){
        running=false;
        if(playerHP>0 && cpuHP<=0) alert("¡Ganaste la partida!");
        else if(cpuHP>0 && playerHP<=0) alert("¡Perdiste la partida!");
        else alert("¡Doble KO! Empate final.");
    }
}

function resetGame(){
    if (!confirm("¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso actual de la partida.")) {
        return;
    }
    
    playerHP=MAX_HP;
    cpuHP=MAX_HP;
    running=false;
    
    selectedAttack = null;
    selectedDefense = null;
    
    document.getElementById("gameArea").classList.add("hidden");
    document.getElementById("setup").classList.remove("hidden");
    logContent.innerHTML="";
    
    document.body.classList.remove('game-bg');
    document.body.classList.add('setup-bg');
    
    document.querySelectorAll('.element-card').forEach(btn => btn.classList.remove('selected'));
}

document.addEventListener('DOMContentLoaded', () => {
    const atkCheckboxes = document.querySelectorAll('.atk');
    const defCheckboxes = document.querySelectorAll('.def');

    function handleCheckboxLimit(checkboxes) {
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checkedCount = Array.from(checkboxes).filter(c => c.checked).length;
                if (checkedCount > 3) {
                    cb.checked = false;
                    alert("Solo puedes seleccionar 3 elementos.");
                }
                }
            );
        }
    );
    }
    
    handleCheckboxLimit(atkCheckboxes);
    handleCheckboxLimit(defCheckboxes);
});