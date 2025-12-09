// public/Sanctuary/Sanctuary.js

document.addEventListener('DOMContentLoaded', () => {
    const MAX_SLOTS = 10;
    const ELEMENTS = ['Agua', 'Fuego', 'Viento', 'Tierra', 'Electricidad'];

    const slotsContainer = document.getElementById('characterSlots');
    const creationArea = document.getElementById('creationArea');
    const form = document.getElementById('creationForm');
    const messageBox = document.getElementById('messageBox');
    const attackSelection = document.getElementById('attackSelection');
    const defenseSelection = document.getElementById('defenseSelection');
    const cancelButton = document.getElementById('cancelCreation');

    let currentCharacters = [];

    // --- UTILITIES ---
    const displayMessage = (message, isError = true) => {
        messageBox.textContent = message;
        messageBox.className = 'visible';
        if (!isError) {
            messageBox.style.backgroundColor = '#d4edda'; // Verde claro para éxito
            messageBox.style.color = '#155724'; // Texto verde oscuro
        } else {
            messageBox.style.backgroundColor = '#fbecec'; // Rojo claro para error
            messageBox.style.color = '#c0392b'; // Texto rojo oscuro
        }
    };
    const hideCreationForm = () => {
        creationArea.classList.add('hidden');
        form.reset();
        messageBox.classList.remove('visible');
    };
    const showCreationForm = () => {
        creationArea.classList.remove('hidden');
        document.getElementById('name').focus();
    };


    // --- 1. RENDERIZACIÓN INICIAL DE SLOTS Y ELEMENTOS ---

    // Genera las opciones de elementos para ataque y defensa
    const renderElementSelections = () => {
        ELEMENTS.forEach(element => {
            // Ataques
            attackSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="attacks" value="${element} - ATK"> 
                    ${element}
                </label>
            `;
            // Defensas
            defenseSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="defenses" value="${element} - DEF"> 
                    ${element}
                </label>
            `;
        });
    };
    renderElementSelections(); // Llamar al inicio

    // Genera los slots vacíos y llenos
    const renderCharacterSlots = () => {
        slotsContainer.innerHTML = ''; // Limpiar el contenedor

        // Renderizar slots llenos
        currentCharacters.forEach(character => {
            const slot = document.createElement('div');
            slot.className = 'slot full';
            slot.innerHTML = `
                <p><strong>${character.name}</strong></p>
                <small>HP: ${character.hp}</small>
                <small>ATK: ${character.playerAtk.length} | DEF: ${character.playerDef.length}</small>
            `;
            // Puedes añadir un listener aquí para ir al personaje o ver detalles:
            // slot.addEventListener('click', () => window.location.href = `../Character/Details.html?id=${character._id}`);
            slotsContainer.appendChild(slot);
        });

        // Renderizar slots vacíos
        const emptySlotsCount = MAX_SLOTS - currentCharacters.length;
        for (let i = 0; i < emptySlotsCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot empty';
            slot.innerHTML = '+';
            slot.title = 'Crear nuevo personaje';
            slot.addEventListener('click', showCreationForm);
            slotsContainer.appendChild(slot);
        }

        if (currentCharacters.length >= MAX_SLOTS) {
             displayMessage(`Has alcanzado el límite máximo de ${MAX_SLOTS} personajes.`, false);
        } else if (currentCharacters.length > 0) {
             displayMessage(`Tienes ${currentCharacters.length} personajes creados. Haz clic en (+) para crear más.`, false);
        }
    };

    // Obtener personajes del Backend
    const fetchCharacters = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/characters');
            
            if (response.ok) {
                currentCharacters = await response.json();
                renderCharacterSlots();
            } else {
                displayMessage('Error al cargar los personajes existentes.', true);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            displayMessage('Error de conexión con el servidor. Asegúrate de que node server.js esté corriendo.', true);
        }
    };
    
    // --- 2. LÓGICA DE VALIDACIÓN Y ENVÍO ---

    // Validar selección de checkboxes (máximo 2)
    const validateSelection = (event) => {
        const groupName = event.target.name;
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        let checkedCount = 0;
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                checkedCount++;
            }
        });
        
        // 🚨 VALIDACIÓN CRÍTICA: Máximo 2
        if (checkedCount > 2) {
            displayMessage(`Solo puedes seleccionar un máximo de 2 elementos para ${groupName}.`, true);
            event.target.checked = false; // Desmarcar el último
        } else {
            messageBox.classList.remove('visible');
        }
    };
    
    // Aplicar validación a ambos grupos
    const attackCheckboxes = document.querySelectorAll('input[name="attacks"]');
    const defenseCheckboxes = document.querySelectorAll('input[name="defenses"]');
    attackCheckboxes.forEach(cb => cb.addEventListener('change', validateSelection));
    defenseCheckboxes.forEach(cb => cb.addEventListener('change', validateSelection));
    cancelButton.addEventListener('click', hideCreationForm);

    // Manejar el envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageBox.classList.remove('visible');

        const name = document.getElementById('name').value.trim();
        const selectedAttacks = Array.from(attackCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const selectedDefenses = Array.from(defenseCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

        // 1. Validación de nombre
        if (name.length === 0 || name.length > 20) {
            displayMessage("El nombre es obligatorio y debe tener un máximo de 20 caracteres.", true);
            return;
        }

        // 2. Validación de cantidad de selecciones (2/2)
        if (selectedAttacks.length !== 2 || selectedDefenses.length !== 2) {
            displayMessage("Debes seleccionar exactamente 2 elementos de ataque y 2 de defensa.", true);
            return;
        }

        // 3. Preparar datos (usando playerAtk/playerDef para el backend)
        const characterData = {
            name: name,
            hp: 10, 
            playerAtk: selectedAttacks, 
            playerDef: selectedDefenses 
        };

        try {
            // 4. Enviar datos al Backend
            const response = await fetch('http://localhost:3000/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(characterData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`¡Personaje ${result.name} creado con éxito!`);
                hideCreationForm(); // Ocultar el formulario
                fetchCharacters();  // Recargar la lista de slots
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.errors ? errorData.errors.join(', ') : errorData.message || response.statusText;
                displayMessage(`Error al crear el personaje: ${errorMessage}`, true);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            displayMessage('Error de conexión con el servidor. Asegúrate de que node server.js esté corriendo.', true);
        }
    });

    // --- 3. INICIO ---
    fetchCharacters();
});