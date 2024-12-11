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
                <div class='card-info'>
                    <h3>${product.title}</h3>
                    <img src='${product.thumbnail}' alt='${product.title}' />
                    <p>Precio:$${product.price.toFixed(2)}</p>
                   
                </div>
                <div class='card-actions'>
                    <input type='number' min='1' value='1' id='quantity-${product.id}' style='width: 60px; '>
                    <button onclick='addToCart("${product.id}", ${product.price}, ${product.available_quantity})'>Añadir al carrito</button>
                    <button onclick='showDescription("${product.id}")'>Ver descripción</button>
                </div>
                <div class='product-description' id='description-${product.id}' style='display: none;'></div>
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
function addToCart(productId, productPrice, availableQuantity) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantityToAdd = parseInt(quantityInput.value);

    // Verificar si hay suficiente stock
    if (quantityToAdd > availableQuantity) {
        alert('No hay suficiente stock disponible.');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Obtener el producto para añadir su información
    fetchProduct(productId).then(product => {
        const existingProductIndex = cart.findIndex(item => item.id === productId);

        if (existingProductIndex > -1) {
            // Actualiza cantidad si ya existe en el carrito
            const currentQuantity = cart[existingProductIndex].quantity;
            const newQuantity = currentQuantity + quantityToAdd;

            // Verificar si hay suficiente stock disponible antes de actualizar
            if (newQuantity > availableQuantity) {
                alert('No hay suficiente stock disponible.');
                return;
            }
           
            cart[existingProductIndex].quantity = newQuantity; // Actualiza la cantidad en el carrito
            
        } else {
            // Añade nuevo producto al carrito
            cart.push({
                id: productId,
                price: productPrice,
                quantity: quantityToAdd,
                available_quantity: availableQuantity, // Almacena la cantidad disponible
                thumbnail: product.thumbnail,
                title: product.title,
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));

        
        // Restablecer la cantidad a 1 después de agregar al carrito
        quantityInput.value = 1; // Restablecer a 1
        
        
    }).catch(error => {
        console.error('Error al agregar al carrito:', error);
    });
    localStorage.setItem('cart', JSON.stringify(cart));
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

    for (const item of cart) {
        const itemTotal = item.price * item.quantity; // Calcular total por ítem
        total += itemTotal; // Sumar al total general

        const cartItem = `
            <div class='cart-item' id='cart-item-${item.id}'>
                <div class='card-info'>
                    <img src='${item.thumbnail}' alt='${item.title}' />
                    <h5 style="color: black;">${item.title}</h5>
                    <p class="car">Precio: $${item.price.toFixed(2)} por unidad</p>
                    <p class="car">Stock disponible: ${item.available_quantity - item.quantity}</p> <!-- Stock actualizado -->
                    <p class="car">Total por producto: $${itemTotal.toFixed(2)}</p>
                </div>
                <div class='card-actions'>
                    Cantidad: <span id='quantity-${item.id}'>${item.quantity}</span> <!-- Mostrar cantidad como texto -->
                    <button onclick='addMore("${item.id}", ${item.price})' class='btn btn-success'>Agregar</button>
                    <button onclick='removeOneFromCart("${item.id}")' class='btn btn-warning'>Eliminar una unidad</button>
                    <button onclick='removeFromCart("${item.id}")' class='btn btn-danger'>Eliminar todo</button>
                </div>
            </div>`;
        
        cartItemsContainer.innerHTML += cartItem; // Agregar el producto al contenedor
    }

    document.getElementById('total').innerText = `Total: $${total.toFixed(2)}`; // Actualizar total en la interfaz
}


// Función para agregar más unidades de un producto en el carrito
function addMore(productId, productPrice) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    
    if (existingProductIndex > -1) {
        const currentQuantity = cart[existingProductIndex].quantity;
        
        // Obtener el stock disponible desde el carrito
        const availableQuantity = cart[existingProductIndex].available_quantity;

        if (currentQuantity + 1 > availableQuantity) {
            alert('No hay suficiente stock disponible.');
            return;
        }

        cart[existingProductIndex].quantity += 1; // Incrementar cantidad
        localStorage.setItem('cart', JSON.stringify(cart));
        
        displayCart(); // Actualizar visualización del carrito
    }
}

// Función para eliminar una unidad del carrito
function removeOneFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingProductIndex = cart.findIndex(item => item.id === productId);
    
    if (existingProductIndex > -1) {
        const product = cart[existingProductIndex];
        
        if (product.quantity > 1) {
            // Reducir la cantidad en el carrito
            product.quantity -= 1;
        } else {
            // Si la cantidad es 1, confirmar antes de eliminar el producto del carrito
            const userConfirmed = confirm(`Estás eliminando la última unidad del producto "${product.title}". ¿Quieres eliminarlo del carrito?`);
            
            if (userConfirmed) {
                cart = cart.filter(item => item.id !== productId);
                alert(`El producto "${product.title}" sera eliminado del carrito.`);
            } else {
                return; // No hacer nada si el usuario cancela
            }
        }

        // Actualizar el stock disponible en la interfaz
        const stockElement = document.getElementById(`stock-${productId}`);
        if (stockElement) {
            const currentStock = parseInt(stockElement.innerText) || 0;
            stockElement.innerText = currentStock + 1;
        }

        // Guardar los cambios en localStorage
        localStorage.setItem('cart', JSON.stringify(cart));

        // Actualizar la visualización del carrito
        displayCart();
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
         alert("El carrito no se ha vaciado."); 
     } 
});

// Evento para manejar la compra 
document.getElementById('buy-button')?.addEventListener('click', () => { 
     let cart = JSON.parse(localStorage.getItem('cart')) || []; 
     if (cart.length === 0) { 
         alert("El carrito está vacío. Agrega productos antes de comprar."); 
         return; 
     } 
     document.getElementById('payment-methods').style.display = 'block'; 
});

// Manejar la confirmación del pago 
document.getElementById('confirm-payment')?.addEventListener('click', function() { 
     const selectedPayment = document.getElementById('payment-select').value; 
     alert(`Pago confirmado con: ${selectedPayment}`); 
     document.getElementById('payment-methods').style.display = 'none'; 
     localStorage.removeItem('cart'); // Limpiar el carrito después de comprar 
     displayCart(); // Actualiza visualización del carrito 
});

// Mostrar los productos en el carrito al cargar la página si estamos en la página del carrito 
if (window.location.pathname.includes("carrito.html")) { 
     displayCart(); 
} else { 
     fetchProducts(); // Llamar a la función para obtener productos al cargar la página 
}
