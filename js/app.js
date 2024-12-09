
// Función para obtener productos de la API
async function fetchProducts() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '<h2>Cargando productos...</h2>'; // Indicador de carga
    try {
        const response = await fetch('https://api.mercadolibre.com/sites/MLA/search?q=merceria');
        if (!response.ok) throw new Error('Error en la red');
        const products = await response.json();
        displayProducts(products.results);
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('No se pudieron cargar los productos.');
    }
}

// Función para mostrar productos en el DOM
function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = ''; // Limpiar contenido previo
    products.forEach(product => {
        const productCard = `
             <div class='card' id='product-${product.id}'>
                <div class='card-info' >
                    <h3>${product.title}</h3>
                    <img src='${product.thumbnail}' alt='${product.title}' /> <!-- Cargar la imagen aquí -->

                    <p>$${product.price.toFixed(2)}</p>
                </div>
                <div class='card-actions'>
                    <input type='number' min='1' value='1' id='quantity-${product.id}' style='width: 60px;'>
                    <button onclick='addToCart("${product.id}", ${product.price})'>Añadir al carrito</button>
               <button onclick='showDescription("${product.id}")'>Ver descripción</button> <!-- Botón de descripción -->
                </div>
                <div class='product-description' id='description-${product.id}' style='display: none;'>
                    <!-- Aquí se insertará la descripción -->
                </div>
            </div>`;
            
        productList.innerHTML += productCard;
    });
}

// Función para mostrar la descripción del producto
async function showDescription(productId) {
    const descriptionContainer = document.getElementById(`description-${productId}`);

    // Si ya se muestra la descripción, alterna su visibilidad
    if (descriptionContainer.style.display === 'block') {
        descriptionContainer.style.display = 'none';
        return;
    }

    try {
        // Obtén los detalles del producto desde la API
        const response = await fetch(`https://api.mercadolibre.com/items/${productId}`);
        if (!response.ok) throw new Error('Error al obtener la descripción del producto');

        const productDetails = await response.json();

        // Usa condition para mostrar si es nuevo o usado
        const condition = productDetails.condition === 'new' ? 'Nuevo' : 'Usado';
        const description = productDetails.description || 'Descripción no disponible';

        // Actualiza el contenedor con la descripción
        descriptionContainer.innerHTML = `
            <p><strong>Condición:</strong> ${condition}</p>
            <p><strong>Descripción:</strong> ${description}</p>`;
        descriptionContainer.style.display = 'block';
    } catch (error) {
        console.error('Error al obtener la descripción:', error);
        alert('No se pudo cargar la descripción del producto.');
    }
}

// Función para obtener un producto por ID
async function fetchProduct(productId) {
    const response = await fetch(`https://api.mercadolibre.com/items/${productId}`);
    
    if (!response.ok) throw new Error('Error al obtener el producto');
    
    return response.json(); 
}
// Función para agregar productos al carrito (localStorage)
function addToCart(productId, productPrice) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value);
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Obtener el producto para añadir su información
    fetchProduct(productId).then(product => {
        const existingProductIndex = cart.findIndex(item => item.id === productId);
        
        if (existingProductIndex > -1) {
            cart[existingProductIndex].quantity += quantity; // Actualiza cantidad
        } else {
            cart.push({ 
                id: productId, 
                price: productPrice, 
                quantity, 
                thumbnail: product.thumbnail, // Almacena la URL de la imagen
                title: product.title // Almacena el título del producto
            }); 
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));

        // Restablecer la cantidad a 1 después de agregar al carrito
        quantityInput.value = 1; // Restablecer a 1
        
        alert(`Se han agregado ${quantity} unidades del producto ${productId} al carrito`);
    }).catch(error => {
        console.error('Error al agregar al carrito:', error);
    });
}

// Función para mostrar los productos en el carrito
async function displayCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    cartItemsContainer.innerHTML = ''; // Limpiar contenido previo
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0; // Inicializar total

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
        document.getElementById('total').innerText = 'Total: $0.00';
        return;
    }

    
    // Mostrar productos sin tarjeta
    for (const item of cart) {
        const itemTotal = item.price * item.quantity; // Calcular total por ítem
        total += itemTotal; // Sumar al total general
        
        const cartItem = `
        <div class='cart-item' id='cart-item-${item.id}'>
            <div class='card-info'>
                <img src='${item.thumbnail}' alt='${item.title}' />
                <h5 style="color: black;">${item.title}</h5> <!-- Cambiar a negro -->
                <p class="car">Precio: $${item.price.toFixed(2)} por unidad</p>
                <p class="car">Total por producto: $${itemTotal.toFixed(2)}</p>
            </div>
            <div class='card-actions'>
                Cantidad: 
                <input type='number' min='1' value='${item.quantity}' id='quantity-${item.id}' style='width: 60px;' onchange='updateQuantity("${item.id}")'>
                <button onclick='addMore("${item.id}", ${item.price})' class='btn btn-success'>Agregar</button>
                <button onclick='removeOneFromCart("${item.id}")' class='btn btn-warning'>Eliminar una unidad</button>
                <button onclick='removeFromCart("${item.id}")' class='btn btn-danger'>Eliminar todo</button>
            </div>
        </div>`;
        
        cartItemsContainer.innerHTML += cartItem; // Agregar el producto al contenedor
    }

    // Actualizar el total en la interfaz
    document.getElementById('total').innerText = `Total: $${total.toFixed(2)}`;
}


// Función para agregar más unidades de un producto en el carrito
function addMore(productId, productPrice) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    
    if (existingProductIndex > -1) {
        cart[existingProductIndex].quantity += 1; // Incrementar cantidad
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
    }
}

// Función para actualizar la cantidad de un producto en el carrito
function updateQuantity(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const newQuantity = parseInt(quantityInput.value);
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    
    if (existingProductIndex > -1 && newQuantity > 0) {
        cart[existingProductIndex].quantity = newQuantity; // Actualizar cantidad
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart(); 
    }
}

// Función para eliminar una unidad del carrito
function removeOneFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    
    if (existingProductIndex > -1) {
        /*const userConfirmed = confirm(`¿Estás seguro de que deseas eliminar una unidad del producto ${productId}?`);
        
        if (userConfirmed) {*/
        if (existingProductIndex > -1) {
            if (cart[existingProductIndex].quantity > 1) {
                cart[existingProductIndex].quantity -= 1;
            } else { 
                alert(`Producto ${productId} eliminado del carrito`);
                cart.splice(existingProductIndex, 1); // Eliminar producto si cantidad es 0
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            displayCart(); 
        }
    }
}

// Función para eliminar completamente un producto del carrito
function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const userConfirmed = confirm(`¿Estás seguro de que deseas eliminar el producto ${productId} del carrito?`);
    
    if (userConfirmed) {
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(`Producto ${productId} eliminado del carrito`);
        displayCart(); 
    }
}

// Evento para vaciar el carrito
document.getElementById('clear-cart')?.addEventListener('click', () => {
    const userConfirmed = confirm("¿Quieres vaciar el carrito? Si lo haces, no podrás deshacer esta acción.");
    
    if (userConfirmed) {
        localStorage.removeItem('cart'); // Vaciar el carrito
        displayCart(); // Actualizar visualización del carrito
        alert("El carrito ha sido vaciado.");
    } else {
        alert("El carrito no se ha vaciado."); // Confirmación de que no se realizó la acción
    }
});

// Evento para manejar la compra
document.getElementById('buy-button')?.addEventListener('click', () => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert("El carrito está vacío. Agrega productos antes de comprar.");
        return;
    }

   // Mostrar el formulario de métodos de pago
   document.getElementById('payment-methods').style.display = 'block';
});

// Manejar la confirmación del pago
document.getElementById('confirm-payment')?.addEventListener('click', function() {
   const selectedPayment = document.getElementById('payment-select').value;
   alert(`Pago confirmado con: ${selectedPayment}`);

   // Ocultar el formulario después de la confirmación
   document.getElementById('payment-methods').style.display = 'none';

   // Limpiar el carrito después de comprar
   localStorage.removeItem('cart');
   displayCart(); // Actualiza visualización del carrito
});

// Mostrar los productos en el carrito al cargar la página si estamos en la página del carrito
if (window.location.pathname.includes("carrito.html")) {
   displayCart();
} else {
   fetchProducts(); // Llamar a la función para obtener productos al cargar la página
}

// Mostrar los productos en el carrito al cargar la página si estamos en la página del carrito 
if (window.location.pathname.includes("carrito.html")) { 
   displayCart(); 
} else { 
   fetchProducts(); // Llamar a la función para obtener productos al cargar la página 
}
