// public/Sanctuary/Sanctuary.js

import { checkAuthAndRedirect } from '../js/authChecker.js'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // 🚨 1. Proteger la página primero
    checkAuthAndRedirect();
    
    // --- CONSTANTES ---
    const MAX_SLOTS = 10;
    const ELEMENTS = ['Agua', 'Fuego', 'Viento', 'Tierra', 'Electricidad'];
    
    // 🚨 2. No necesitamos el userId en el script, Passport lo maneja, pero lo mantenemos para referencia:
    // const CURRENT_USER_ID = sessionStorage.getItem('userId'); 

    // --- ELEMENTOS DE LA UI ---
    const slotsContainer = document.getElementById('characterSlots');
    const creationArea = document.getElementById('creationArea');
    const form = document.getElementById('creationForm');
    const messageBox = document.getElementById('messageBox');
    const attackSelection = document.getElementById('attackSelection');
    const defenseSelection = document.getElementById('defenseSelection');
    const cancelButton = document.getElementById('cancelCreation');
    const attackCheckboxes = document.querySelectorAll('input[name="attacks"]');
    const defenseCheckboxes = document.querySelectorAll('input[name="defenses"]');

    let currentCharacters = [];

    // --- UTILITIES ---
    const displayMessage = (message, isError = true) => {
        messageBox.textContent = message;
        messageBox.className = 'visible';
        messageBox.style.backgroundColor = isError ? '#fbecec' : '#d4edda';
        messageBox.style.color = isError ? '#c0392b' : '#155724';
    };
    const hideCreationForm = () => {
        creationArea.classList.add('hidden');
        form.reset();
        messageBox.classList.remove('visible');
    };
    const showCreationForm = () => {
        // Limpiar el estado de error
        messageBox.classList.remove('visible');
        // Mostrar formulario
        creationArea.classList.remove('hidden');
        document.getElementById('name').focus();
    };


    // --- 3. RENDERIZACIÓN DE SLOTS Y ELEMENTOS ---

    // Genera las opciones de elementos para ataque y defensa
    const renderElementSelections = () => {
        attackSelection.innerHTML = ''; // Limpiar
        defenseSelection.innerHTML = ''; // Limpiar
        ELEMENTS.forEach(element => {
            attackSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="attacks" value="${element} - ATK"> 
                    ${element}
                </label>
            `;
            defenseSelection.innerHTML += `
                <label>
                    <input type="checkbox" name="defenses" value="${element} - DEF"> 
                    ${element}
                </label>
            `;
        });
        // Re-asignar listeners a los nuevos elementos
        attachSelectionListeners();
    };

    // Genera los slots vacíos y llenos
    const renderCharacterSlots = () => {
        slotsContainer.innerHTML = ''; 

        // Renderizar slots llenos
        currentCharacters.forEach(character => {
            const slot = document.createElement('div');
            slot.className = 'slot full';
            slot.innerHTML = `
                <p><strong>${character.name}</strong></p>
                <small>HP: ${character.hp}</small>
                <small>ATK: ${character.playerAtk.length} | DEF: ${character.playerDef.length}</small>
            `;
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
             hideCreationForm();
        } else if (currentCharacters.length > 0) {
             // Si hay personajes y slots libres, ocultar el mensaje de éxito inicial
             messageBox.classList.remove('visible');
        }
    };

    // 🚨 4. Obtener personajes del Backend (Seguro)
    const fetchCharacters = async () => {
        try {
            // La petición GET no necesita body ni query, Passport la protege
            const response = await fetch('/api/characters'); 
            
            if (response.ok) {
                currentCharacters = await response.json();
                renderCharacterSlots();
            } else if (response.status === 401) {
                // Si la sesión expiró (401), el checkAuthAndRedirect() ya debió redirigir
                console.error("Sesión expirada durante fetch. Redirección pendiente.");
            } else {
                displayMessage(`Error (${response.status}) al cargar los personajes.`, true);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            displayMessage('Error de conexión con el servidor. Asegúrate de que node server.js esté corriendo.', true);
        }
    };
    
    // --- 5. LÓGICA DE VALIDACIÓN Y ENVÍO ---

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
        
        // VALIDACIÓN CRÍTICA: Máximo 2
        if (checkedCount > 2) {
            displayMessage(`Solo puedes seleccionar un máximo de 2 elementos para ${groupName}.`, true);
            event.target.checked = false; // Desmarcar el último
        } else {
            messageBox.classList.remove('visible');
        }
    };
    
    // Función para asignar listeners (llamada después de renderElementSelections)
    const attachSelectionListeners = () => {
        document.querySelectorAll('input[name="attacks"]').forEach(cb => cb.addEventListener('change', validateSelection));
        document.querySelectorAll('input[name="defenses"]').forEach(cb => cb.addEventListener('change', validateSelection));
        cancelButton.addEventListener('click', hideCreationForm);
    };

    // Manejar el envío del formulario (Seguro)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageBox.classList.remove('visible');

        const name = document.getElementById('name').value.trim();
        
        // Obtener los checkboxes de nuevo (ya que se renderizan dinámicamente)
        const currentAttackCheckboxes = document.querySelectorAll('input[name="attacks"]');
        const currentDefenseCheckboxes = document.querySelectorAll('input[name="defenses"]');
        
        const selectedAttacks = Array.from(currentAttackCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const selectedDefenses = Array.from(currentDefenseCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

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

        // 3. Preparar datos (SIN userId, el Backend lo inyecta)
        const characterData = {
            name: name,
            hp: 10, 
            playerAtk: selectedAttacks, 
            playerDef: selectedDefenses 
        };

        try {
            // 4. Enviar datos al Backend (POST seguro)
            const response = await fetch('/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(characterData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`¡Personaje ${result.name} creado con éxito!`);
                hideCreationForm(); 
                fetchCharacters();  // Recargar la lista de slots
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.errors ? errorData.errors.join(', ') : errorData.message || response.statusText;
                displayMessage(`Error al crear el personaje: ${errorMessage}`, true);
            }

        } catch (error) {
            displayMessage('Error de conexión con el servidor.', true);
        }
    });

    // --- 6. INICIO DE LA APLICACIÓN ---
    renderElementSelections();
    fetchCharacters(); 
});