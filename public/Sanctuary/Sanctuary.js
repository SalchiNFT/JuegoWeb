// public/Sanctuary/Sanctuary.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('creationForm');
    const attackCheckboxes = document.querySelectorAll('input[name="attacks"]');
    const defenseCheckboxes = document.querySelectorAll('input[name="defenses"]');
    const messageBox = document.getElementById('messageBox');
    
    // Función para mostrar mensajes de error
    const displayMessage = (message) => {
        messageBox.textContent = message;
        messageBox.classList.add('visible');
    };
    
    // Función para validar la selección (máximo 3)
    const validateSelection = (event) => {
        const groupName = event.target.name;
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        let checkedCount = 0;
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                checkedCount++;
            }
        });
        
        if (checkedCount > 3) {
            displayMessage(`Solo puedes seleccionar un máximo de 3 opciones para ${groupName}.`);
            event.target.checked = false; // Desmarcar el último
        } else {
            messageBox.classList.remove('visible');
        }
    };
    
    // Aplicar validación a ambos grupos
    attackCheckboxes.forEach(cb => cb.addEventListener('change', validateSelection));
    defenseCheckboxes.forEach(cb => cb.addEventListener('change', validateSelection));

    // Manejar el envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageBox.classList.remove('visible');

        const name = document.getElementById('name').value.trim();
        const selectedAttacks = Array.from(attackCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        const selectedDefenses = Array.from(defenseCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

        // 1. Validación de nombre
        if (name.length === 0 || name.length > 20) {
            displayMessage("El nombre es obligatorio y debe tener un máximo de 20 caracteres.");
            return;
        }

        // 2. Validación de cantidad de selecciones
        if (selectedAttacks.length !== 3 || selectedDefenses.length !== 3) {
            displayMessage("Debes seleccionar exactamente 3 ataques y 3 defensas.");
            return;
        }

        // 🚨 CORRECCIÓN CRÍTICA: Los nombres de los campos deben coincidir con el modelo de Mongoose
        const characterData = {
            name: name,
            hp: 10, // Valor inicial (por defecto en el modelo)
            playerAtk: selectedAttacks, // 🚨 Nuevo nombre de campo para el Backend
            playerDef: selectedDefenses // 🚨 Nuevo nombre de campo para el Backend
        };

        try {
            // 3. Enviar datos al Backend
            const response = await fetch('http://localhost:3000/api/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(characterData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`¡Personaje ${result.name} creado con éxito! ID: ${result.characterId}`);
                // Redirigir a la Aldea después de la creación
                window.location.href = '../Village/Village.html'; 
            } else {
                const errorData = await response.json();
                // Mostrar errores de validación del backend (ej: si el nombre falla el trim, etc.)
                const errorMessage = errorData.errors ? errorData.errors.join(', ') : errorData.message || response.statusText;
                displayMessage(`Error al crear el personaje: ${errorMessage}`);
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            displayMessage('Error de conexión con el servidor. Asegúrate de que node server.js esté corriendo.');
        }
    });
});