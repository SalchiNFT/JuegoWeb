// public/Village/Village.js (LIMPIO)

import { checkAuthAndRedirect } from '../js/authChecker.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 🚨 Llamar al verificador de autenticación
    checkAuthAndRedirect();
    
    // El resto del código del Village puede ir aquí.
    // Por ejemplo: Lógica para cargar recursos, estado de edificios, etc.
    
    console.log('Village cargado y usuario autenticado.');
});