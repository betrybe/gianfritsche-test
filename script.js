const QUERY = 'computador';

function createProductImageElement(imageSource) {
  const img = document.createElement('img');
  img.className = 'item__image';
  img.src = imageSource;
  return img;
}

function createCustomElement(element, className, innerText) {
  const e = document.createElement(element);
  e.className = className;
  e.innerText = innerText;
  return e;
}

function createProductItemElement({ sku, name, image }) {
  const section = document.createElement('section');
  section.className = 'item';

  section.appendChild(createCustomElement('span', 'item__sku', sku));
  section.appendChild(createCustomElement('span', 'item__title', name));
  section.appendChild(createProductImageElement(image));
  section.appendChild(createCustomElement('button', 'item__add', 'Adicionar ao carrinho!'));

  return section;
}

function getSkuFromProductItem(item) {
  return item.querySelector('span.item__sku').innerText;
}

/**
 * The function updateLocalStorageCart() loads the cart from localStorage and applies the operation.
 * The function handles the JSON parse and stringify for using localStorage.
 * If there is no cart in the localStorage a new cart is created. 
 * If the write param is set to true, the result of the operation is written back to localStorage.
 * @param operation - function that handles the cart array
 * @param write - flag to write the updated cart to localStorage (default true)
 */
function updateLocalStorageCart(operation, write = true) {
  let cart = localStorage.getItem('cart');
  if (cart === null) {
    cart = [];
  } else {
    cart = JSON.parse(cart);
  }
  cart = operation(cart);
  if (write) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
}

/**
 * Given an item index removes it from the local storage cart
 * @param index - the index of the item to remove
 */
function removeItemFromLocalStorageCart(index) {
  updateLocalStorageCart((cartArray) => {
    cartArray.splice(index, 1);
    return cartArray;
  });
}

/**
 * Identify the index of the element in the cart
 * @param item - HTML element
 * @returns the index of the item in the cart
 */
function getItemIndex(item) {
  const cart = document.getElementsByClassName('cart__items')[0];
  return Array.prototype.indexOf.call(cart.childNodes, item);
}

/**
 * Iterate over the cart, compute the total price, and update the value on the page.
 */
function updateTotalPrice() {
  const span = document.getElementsByClassName('total-price')[0];
  let total = 0;
  updateLocalStorageCart((cartArray) => {
    total = cartArray.reduce((acc, obj) => acc + obj.salePrice, 0);
    return cartArray;
  }, false);
  span.innerText = total;
}

/**
 * Removes the item from the page and localStorage carts and updates the total price
 * @param item - HTML element
 */
function removeItem(item) {
  removeItemFromLocalStorageCart(getItemIndex(item));
  item.parentNode.removeChild(item);
  updateTotalPrice();
}

/**
 * Applies the remove rules on the clicked item from the cart (see `removeItem()`)
 * @param event 
 */
function cartItemClickListener(event) {
  removeItem(event.target);
}

function createCartItemElement({ sku, name, salePrice }) {
  const li = document.createElement('li');
  li.className = 'cart__item';
  li.innerText = `SKU: ${sku} | NAME: ${name} | PRICE: $${salePrice}`;
  li.addEventListener('click', cartItemClickListener);
  return li;
}

/**
 * Insert item object to cart and update localStorage.
 * @param item - Object {sku, name, salePrice}
 */
function insertItemToLocalStorageCart(item) {
  updateLocalStorageCart((cartArray) => {
    cartArray.push(item);
    return cartArray;
  });
}

/**
 * Add item received from API to cart.
 * Builds an object with only the relevant information, update page cart, localStorage cart, and total price.
 * @param item - Object from api.mercadolibre
 */
function addItemToCart(item) {
  const cart = document.getElementsByClassName('cart__items')[0];
  const obj = {
    sku: item.id,
    name: item.title,
    salePrice: item.price,
  };
  cart.appendChild(createCartItemElement(obj));
  insertItemToLocalStorageCart(obj);
  updateTotalPrice();
}

/**
 * Create, configure and add a loading hint on the page.
 * @returns the loading element added to the page for further removal.
 */
function turnLoadingOn() {
  const loading = document.createElement('p');
  loading.classList.add('loading');
  loading.innerText = 'loading...';
  document.getElementsByClassName('cart')[0].appendChild(loading);
  return loading;
}

/**
 * Removes a given loading element from the page
 * @param loading - the loading HTML element inserted to the page
 */
function turnLoadingOff(loading) {
  loading.parentNode.removeChild(loading);
}

/**
 * Encapsulates the operations to fetch a JSON
 * @param url - API endpoint
 * @param callback - a function that handles the JSON result
 */
function fetchJSON(url, callback) {
  const loading = turnLoadingOn();
  fetch(url).then((response) => response.json().then((json) => {
    callback(json);
    turnLoadingOff(loading);
  }));
}

/**
 * Applies the insert rules for the clicked item in the product list (see `addItemToCart()`)
 * @param event
 */
function addItemClickListener(event) {
  const sku = getSkuFromProductItem(event.target.parentNode);
  fetchJSON(`https://api.mercadolibre.com/items/${sku}`, addItemToCart);
}

/**
 * Create and configure the product list given the array of items (see `createProductItemElement()`)
 * @param items - array of itens from the api.mercadolibre
 */
function createProductList(items) {
  const section = document.getElementsByClassName('items')[0];
  items.results.forEach((item) => section.appendChild(createProductItemElement({
    sku: item.id,
    name: item.title,
    image: item.thumbnail,
  })));
  const addButtons = [...document.getElementsByClassName('item__add')];
  addButtons.forEach((button) => button.addEventListener('click', addItemClickListener));
}

function emptyCartClickListener() {
  localStorage.removeItem('cart');
  document.getElementsByClassName('cart__items')[0].innerHTML = '';
  updateTotalPrice();
}

function configureEmptyCartButton() {
  const emptyCartBtn = document.getElementsByClassName('empty-cart')[0];
  emptyCartBtn.addEventListener('click', emptyCartClickListener);
}

function createCartFromLocalStorage() {
  const cartList = document.getElementsByClassName('cart__items')[0];
  updateLocalStorageCart((cartArray) => {
    cartArray.forEach((obj) => cartList.appendChild(createCartItemElement(obj)));
    return cartArray;
  }, false);
  updateTotalPrice();
}

window.onload = () => {
  fetchJSON(`https://api.mercadolibre.com/sites/MLB/search?q=${QUERY}`, createProductList);
  createCartFromLocalStorage();
  configureEmptyCartButton();
};
