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

function removeItemFromLocalStorageCart(item) {
  const cart = document.getElementsByClassName('cart__items')[0];
  const index = Array.prototype.indexOf.call(cart.childNodes, item);
  updateLocalStorageCart((cartArray) => {
    cartArray.splice(index, 1);
    return cartArray;
  });
}

function removeItem(item) {
  removeItemFromLocalStorageCart(item);
  item.parentNode.removeChild(item);
}

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

function insertItemToLocalStorageCart(item) {
  updateLocalStorageCart((cartArray) => {
    cartArray.push(item);
    return cartArray;
  });
}

function addItemToCart(item) {
  const cart = document.getElementsByClassName('cart__items')[0];
  const obj = {
    sku: item.id,
    name: item.title,
    salePrice: item.price,
  };
  cart.appendChild(createCartItemElement(obj));
  insertItemToLocalStorageCart(obj);
}

function fetchJSON(url, callback) {
  fetch(url).then((response) => response.json().then(callback));
}

function addItemClickListener(event) {
  const sku = getSkuFromProductItem(event.target.parentNode);
  fetchJSON(`https://api.mercadolibre.com/items/${sku}`, addItemToCart);
}

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

function createCartFromLocalStorage() {
  const cartList = document.getElementsByClassName('cart__items')[0];
  updateLocalStorageCart((cartArray) => {
    cartArray.forEach((obj) => cartList.appendChild(createCartItemElement(obj)));
    return cartArray;
  }, false);
}

window.onload = () => {
  fetchJSON(`https://api.mercadolibre.com/sites/MLB/search?q=${QUERY}`, createProductList);
  createCartFromLocalStorage();
};
