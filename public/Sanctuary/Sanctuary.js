import { checkAuthAndRedirect } from '../js/authChecker.js';

document.addEventListener('DOMContentLoaded', () => {

    checkAuthAndRedirect();

    const slotsContainer = document.getElementById('characterSlots');

    // 🔑 El límite ahora viene del HTML
    const MAX_SLOTS = Number(slotsContainer.dataset.maxSlots) || 3;

    const ELEMENTS = ['Agua', 'Fuego', 'Viento', 'Tierra', 'Electricidad'];

    const creationArea = document.getElementById('creationArea');
    const form = document.getElementById('creationForm');
    const messageBox = document.getElementById('messageBox');
    const attackSelection = document.getElementById('attackSelection');
    const defenseSelection = document.getElementById('defenseSelection');
    const cancelButton = document.getElementById('cancelCreation');

    let currentCharacters = [];

    const displayMessage = (msg, error = true) => {
        messageBox.textContent = msg;
        messageBox.className = error ? 'error' : 'success';
    };

    const showCreationForm = () => {
        if (currentCharacters.length >= MAX_SLOTS) return;
        creationArea.classList.remove('hidden');
        messageBox.textContent = '';
    };

    const hideCreationForm = () => {
        creationArea.classList.add('hidden');
        form.reset();
    };

    const renderSelections = () => {
        attackSelection.innerHTML = '';
        defenseSelection.innerHTML = '';

        ELEMENTS.forEach(el => {
            attackSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="attacks" value="${el}">
                    ${el}
                </label>
            `;
            defenseSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="defenses" value="${el}">
                    ${el}
                </label>
            `;
        });

        attachLimit('attacks');
        attachLimit('defenses');
    };

    const attachLimit = (name) => {
        document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
                if (checked.length > 2) cb.checked = false;
            });
        });
    };

    const renderSlots = () => {
        slotsContainer.innerHTML = '';

        // Slots llenos
        currentCharacters.slice(0, MAX_SLOTS).forEach(c => {
            const slot = document.createElement('div');
            slot.className = 'slot full';
            slot.innerHTML = `
                <strong>${c.name}</strong><br>
                HP: ${c.hp}<br>
                Workshop: ${c.stats.workshop} |
                Fields: ${c.stats.fields} |
                Laboratory: ${c.stats.laboratory} |
                Arena: ${c.stats.arena}
            `;
            slotsContainer.appendChild(slot);
        });

        // Slots vacíos (hasta MAX_SLOTS)
        for (let i = currentCharacters.length; i < MAX_SLOTS; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot empty';
            slot.textContent = '+';
            slot.onclick = showCreationForm;
            slotsContainer.appendChild(slot);
        }
    };

    const fetchCharacters = async () => {
        const res = await fetch('/api/characters');
        currentCharacters = await res.json();
        renderSlots();
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const atk = [...document.querySelectorAll('input[name="attacks"]:checked')].map(c => c.value);
        const def = [...document.querySelectorAll('input[name="defenses"]:checked')].map(c => c.value);

        if (atk.length !== 2 || def.length !== 2) {
            displayMessage('Selecciona 2 ataques y 2 defensas');
            return;
        }

        if (currentCharacters.length >= MAX_SLOTS) {
            displayMessage('No hay más slots disponibles');
            return;
        }

        const characterData = {
            name,
            hp: 10,
            playerAtk: atk,
            playerDef: def,
            stats: {
                workshop: 1,
                fields: 1,
                laboratory: 1,
                arena: 1,
                expedition: {
                    woodcutting: 1,
                    leather: 1,
                    mining: 1,
                    quarry: 1
                }
            },
            appearance: {
                hair: 0,
                face: 0,
                hoodie: 0,
                pants: 0,
                shoes: 0
            }
        };

        await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(characterData)
        });

        hideCreationForm();
        fetchCharacters();
    });

    cancelButton.addEventListener('click', hideCreationForm);

    renderSelections();
    fetchCharacters();
});
