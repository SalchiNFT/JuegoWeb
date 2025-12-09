// public/Auth/Login.js

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENTOS DE LA UI ---
    const authMessage = document.getElementById('authMessage');
    const loginSection = document.getElementById('loginSection');
    const registerSection = document.getElementById('registerSection');
    
    // Forms y Botones
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleAuth = document.getElementById('toggleAuth');
    const toggleAuthBack = document.getElementById('toggleAuthBack');


    // --- UTILITIES ---
    const displayAuthMessage = (message, isError = true) => {
        authMessage.textContent = message;
        authMessage.classList.remove('hidden');
        authMessage.style.color = isError ? '#e74c3c' : '#2ecc71'; // Usado para el CSS styling
        authMessage.style.borderColor = isError ? '#e74c3c' : '#2ecc71'; 
    };

    // Si ya existe una sesión (algo en sessionStorage), redirigir directamente al Village
    const checkSessionAndRedirect = () => {
        // En un entorno de producción, la verificación de sesión se hace con una petición al servidor.
        // Aquí confiamos en el almacenamiento local para simplificar el flujo.
        if (sessionStorage.getItem('userId')) {
            window.location.href = '../Village/Village.html';
        }
    };

    const toggleForm = () => {
        loginSection.classList.toggle('hidden');
        registerSection.classList.toggle('hidden');
        authMessage.classList.add('hidden');
    };


    // --- EVENT LISTENERS UI ---
    toggleAuth.addEventListener('click', toggleForm);
    toggleAuthBack.addEventListener('click', toggleForm);
    
    
    // --- 1. REGISTRO ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Registro e inicio de sesión automático exitoso
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('username', data.username);
                displayAuthMessage(`¡Registro e inicio de sesión exitoso! Redirigiendo...`, false);
                setTimeout(() => {
                    window.location.href = '../Village/Village.html';
                }, 1000); 
            } else {
                const errorMessage = data.errors ? data.errors.join(', ') : data.message;
                displayAuthMessage(`Error de Registro: ${errorMessage}`, true);
            }

        } catch (error) {
            displayAuthMessage('Error de conexión con el servidor de autenticación.', true);
        }
    });


    // --- 2. LOGIN ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                sessionStorage.setItem('userId', data.userId);
                sessionStorage.setItem('username', data.username);
                displayAuthMessage(`Inicio de sesión exitoso. Redirigiendo...`, false);
                setTimeout(() => {
                    window.location.href = '../Village/Village.html';
                }, 1000);
            } else {
                displayAuthMessage(data.message || 'Credenciales inválidas.', true);
            }

        } catch (error) {
            displayAuthMessage('Error de conexión con el servidor de autenticación.', true);
        }
    });


    // --- INICIALIZACIÓN ---
    checkSessionAndRedirect(); 
});