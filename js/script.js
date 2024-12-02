let currentIndex = 0;

function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-item');
    
    if (index >= slides.length) {
        currentIndex = 0; // Regresar al inicio
    } else if (index < 0) {
        currentIndex = slides.length - 1; // Ir al final
    } else {
        currentIndex = index; // Mantener el índice actual
    }
    
    const offset = -currentIndex * 100; // Mueve el carrusel
    document.querySelector('.carousel-inner').style.transform = `translateX(${offset}%)`;
}

function moveSlide(direction) {
    showSlide(currentIndex + direction);
}

// Mostrar la primera imagen al cargar
showSlide(currentIndex);
