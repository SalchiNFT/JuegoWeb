// Village/Village.js

// Redirige a la pantalla de Creación de Personaje (Sanctuary)
function goToSanctuary() {
    // Ruta corregida: Sube de Village/ y entra en Sanctuary/
    window.location.href = '../Sanctuary/Sanctuary.html';
}

// Redirige a la pantalla de Combate (Training)
function goToTraining() {
    // Verifica si el personaje existe antes de permitir ir a entrenar
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
        alert("Primero debes crear un personaje en el Sanctuary antes de entrenar.");
        goToSanctuary();
    } else {
        // Ruta corregida: Sube de Village/ y entra en Training/
        window.location.href = '../Training/Training.html';
    }
}