// public/js/authChecker.js

/**
 * Función para verificar la sesión del usuario.
 * Si no hay userId en sessionStorage, redirige a la página de login.
 * También añade la funcionalidad de Logout a un botón con el id="logoutBtn".
 */
export const checkAuthAndRedirect = () => {
    const userId = sessionStorage.getItem('userId');
    const username = sessionStorage.getItem('username');
    const path = window.location.pathname;
    
    // 1. Verificar si la página es de autenticación
    if (path.includes('/Auth/Login.html')) {
        // Si ya está logueado, redirigir al Village, incluso si está en la página de Login.
        if (userId) {
             window.location.href = '../Village/Village.html';
        }
        return; // No ejecutar más lógica si estamos en la página de Login
    }

    // 2. Proteger las páginas del juego
    if (!userId) {
        // Si no está logueado, forzar la redirección al Login
        alert('Sesión expirada o no iniciada. Por favor, inicie sesión.');
        window.location.href = '../Auth/Login.html';
        return; // Detener la ejecución del script del módulo
    }

    // 3. Mostrar nombre de usuario (opcional)
    const usernameSpan = document.getElementById('currentUsername');
    if (usernameSpan) {
        usernameSpan.textContent = username;
    }

    // 4. Configurar el botón de Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
};

/**
 * Maneja la lógica de cerrar sesión (Logout)
 */
const handleLogout = async () => {
    try {
        // Petición al backend para destruir la sesión de Passport
        const response = await fetch('/api/auth/logout');
        
        if (response.ok) {
            sessionStorage.removeItem('userId');
            sessionStorage.removeItem('username');
            alert('Sesión cerrada exitosamente.');
            window.location.href = '../Auth/Login.html'; // Redirigir al Login
        } else {
             alert('Error al cerrar sesión en el servidor.');
        }

    } catch (error) {
        console.error('Error al intentar cerrar sesión:', error);
    }
};