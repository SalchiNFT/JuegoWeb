// public/Village/Village.js

import { checkAuthAndRedirect } from '../js/authChecker.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 🚨 Llamar al verificador de autenticación
    checkAuthAndRedirect();

    // --- ELEMENTOS DE LA UI ---
    const resourceDisplay = document.getElementById('resourceDisplay');

    // --- ESTADO LOCAL Y RECURSOS INICIALES ---
    const BASE_MAX_CAPACITY = 1000;
    
    // Simulación de los recursos actuales del jugador
    const currentResources = {
        Comida: { current: 37, max: BASE_MAX_CAPACITY },
        Madera: { current: 150, max: BASE_MAX_CAPACITY },
        Piedra: { current: 50, max: BASE_MAX_CAPACITY },
        Hierro: { current: 0, max: BASE_MAX_CAPACITY },
        Cuero: { current: 200, max: BASE_MAX_CAPACITY }
    };


    // --- RENDERIZACIÓN DE RECURSOS ---
    const renderResources = (resources) => {
        resourceDisplay.innerHTML = ''; // Limpiar el contenedor

        const resourceKeys = Object.keys(resources);
        
        resourceKeys.forEach(key => {
            const item = resources[key];
            const percent = (item.current / item.max) * 100;
            
            // Determinar clase para resaltado visual
            let valueClass = '';
            if (percent < 50 && item.current > 0) { // Si están por debajo de la mitad
                valueClass = 'low-limit';
            } else if (percent >= 95) { // Si están cerca del límite
                valueClass = 'high-limit';
            }

            const resourceDiv = document.createElement('div');
            resourceDiv.className = 'resource-item';
            
            // Asignar icono basado en el nombre (usando emojis)
            let icon = '';
            switch(key) {
                case 'Comida': icon = '🍎'; break;
                case 'Madera': icon = '🌳'; break;
                case 'Piedra': icon = '⛰️'; break;
                case 'Hierro': icon = '⚙️'; break;
                case 'Cuero': icon = '🦬'; break;
                default: icon = '✨';
            }

            resourceDiv.innerHTML = `
                ${icon} ${key}: 
                <span class="resource-value ${valueClass}">
                    ${item.current} / ${item.max}
                </span>
            `;
            
            resourceDisplay.appendChild(resourceDiv);
        });
    };

    // --- LÓGICA DE CARGA (Simulación) ---
    const fetchResources = async () => {
        // En un juego real, aquí harías un fetch a la API para obtener el estado actual
        renderResources(currentResources);
        console.log('Village cargado y usuario autenticado. Recursos iniciales renderizados.');
    };


    // --- INICIO DE LA APLICACIÓN ---
    fetchResources();
});