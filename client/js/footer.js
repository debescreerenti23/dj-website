// Función para generar el footer universal
function cargarFooter() {
    const footerTemplate = `
        <footer>
            javilindj - All Rights Reserved &copy; <span id="year">${new Date().getFullYear()}</span>
        </footer>
    `;

    // Lo insertamos al final del body
    document.body.insertAdjacentHTML('beforeend', footerTemplate);
}

// Ejecutamos la función
cargarFooter();

/* CSS a aplicar

footer {
    text-align: center;
    padding: 20px;
    font-family: 'Inter', sans-serif;
    color: #64748b;
    border-top: 1px solid rgba(0,0,0,0.05);
    margin-top: 40px;
}

*/