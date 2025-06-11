document.addEventListener("DOMContentLoaded", function() {
    const phoneNumberInput = document.getElementById("phone-number-input");
    const orderButton = document.getElementById("order-button");
    const cartItemsContainer = document.getElementById("cart-items");
    const sentinel = document.getElementById("sentinel");

    const modalContainer = document.querySelector(".modal-container");
    const reviewsContainer = document.querySelector(".reviews-container");
    const productCardsContainer = document.querySelector(".product-cards-container");

    let page = 1;
    const pageSize = 6;
    let total = Infinity;
    let loading = false;

    function addProductOnCart(item) {
        const cartItem = cartItemsContainer.querySelector(`[data-id="${item.id}"]`);
        if (cartItem) {
            cartItem.querySelector("#cart-item-quantity").textContent = ("x" + item.quantity);
            cartItem.querySelector("#cart-item-amount").textContent = ((item.price * item.quantity) + " ₽");
        } else {
            cartItemsContainer.insertAdjacentHTML("beforeend", `
                <div class="__content-item" data-id="${item.id}">
                    <span id="cart-item-name">${item.name}</span>
                    <span id="cart-item-quantity">${"x" + item.quantity}</span>
                    <span id="cart-item-amount">${(item.price * item.quantity) + " ₽"}</span>
                </div>
            `);
        }
    }

    function removeProductOnCart(itemId) {
        const cartItem = cartItemsContainer.querySelector(`[data-id="${itemId}"]`);
        if (cartItem) {
            cartItem.remove();
        }
    }

    function inputRequired(item) {
        item.classList.add("input--required");
        setTimeout(() => item.classList.remove("input--required"), 2500);
    }

    function renderRewies(items) {
        let temp = "";

        items.forEach((item, index) => {
            temp += `
                <article class="review-card" data-id="${item.id}">
                    <div>Отзыв ${index}</div>
                    <div>Полученный с api</div>
                    <div>HTML</div>
                    ${item.text}
                </article>
            `;
        });

        reviewsContainer.insertAdjacentHTML("beforeend", temp);
    }

    function renderProducts(items) {
        let temp = "";

        items.forEach(item => {
            temp += `
                <article class="product-card" data-id="${item.id}">
                    <header class="__header">
                        <img class="__header-image" src="${item.image_url}" alt="">
                    </header>
                    <div class="__content">
                        <div class="__content-top">
                            <div id="product-name" class="__content-title">
                                ${item.title}
                            </div>
                            <span class="__content-description">${item.description}</span>
                        </div>
                        <div class="__content-bottom">
                            <div class="__content-price">
                                <span>цена: </span>
                                <span id="product-price">${item.price + " ₽"}</span>
                            </div>
                        </div>
                    </div>
                    <footer class="__footer">
                        <div id="buy-button-container" class="button-container">
                            <button data-action="buy">купить</button>
                        </div>
                        <div id="quantity-input-container" class="button-container button-container--hide">
                            <button id="minus-button" data-action="minus">-</button>
                            <input id="quantity-input" type="number" name="" placeholder="" value="1">
                            <button id="plus-button" data-action="plus">+</button>
                        </div>
                    </footer>
                </article>`;
        });

        productCardsContainer.insertAdjacentHTML("beforeend", temp);
    }

    phoneNumberInput.addEventListener("input", function() {
        let input = phoneNumberInput.value.replace(/\D/g, "");

        if (input === "") {
            phoneNumberInput.value = "";
            return;
        }

        if (!input.startsWith("7")) {
            input = "7" + input;
        }

        if (input.length > 11) {
            input = input.slice(0, 11);
        }

        const formattedPhone = input
            .replace(/^(\d)/, '+$1')
            .replace(/^(\+7)(\d{3})/, '$1 ($2')
            .replace(/(\d{3})(\d{3})/, '$1) $2')
            .replace(/(\d{3})(\d{2})(\d{2})$/, '$1-$2-$3');
        // .replace(/(\d{3})(\d{4})$/, '$1-$2');

        phoneNumberInput.value = formattedPhone;
    });

    productCardsContainer.addEventListener("click", function(event) {
        event.stopPropagation();

        const actionElement = event.target.closest("[data-action]");
        if (!actionElement) return;

        const productCard = event.target.closest(".product-card");
        if (!productCard) return;

        const buyButtonContainer = productCard.querySelector("#buy-button-container");
        const quantityInputContainer = productCard.querySelector("#quantity-input-container");
        if (!buyButtonContainer && !quantityInputContainer) return;

        const productId = productCard.getAttribute("data-id");

        // console.log(buyButtonContainer, quantityInputContainer);

        if (actionElement.dataset.action === "buy") {
            addProductOnCart({
                id: productId,
                quantity: 1,
                name: productCard.querySelector("#product-name").textContent,
                price: productCard.querySelector("#product-price").textContent.replace(/[^0-9]/g, "")
            });
            buyButtonContainer.classList.add("button-container--hide");
            quantityInputContainer.classList.remove("button-container--hide");
        } else if (actionElement.dataset.action === "minus" || actionElement.dataset.action === "plus") {
            const buttonParent = actionElement.closest(".button-container");
            const quantityInput = buttonParent.querySelector("#quantity-input");
            let currentQuantity = parseInt(quantityInput.value, 10) || 1;
            const min = parseInt(quantityInput.min, 10) || 1;
            const max = parseInt(quantityInput.max, 10) || Infinity;

            if (actionElement.dataset.action === "minus" && currentQuantity > min) {
                currentQuantity--;
            } else if (actionElement.dataset.action === "minus" && currentQuantity === min) {
                removeProductOnCart(productId);
                buyButtonContainer.classList.remove("button-container--hide");
                quantityInputContainer.classList.add("button-container--hide");
                return;
            } else if (actionElement.dataset.action === "plus" && currentQuantity < max) {
                currentQuantity++;
            }
            quantityInput.value = currentQuantity;

            addProductOnCart({
                id: productId,
                quantity: currentQuantity,
                price: productCard.querySelector("#product-price").textContent.replace(/[^0-9]/g, "")
            });
        }
    });

    productCardsContainer.addEventListener("blur", async(event) => {
        if (event.target && event.target.matches("#quantity-input")) {
            const quantityInput = event.target;

            const productCard = event.target.closest(".product-card");
            if (!productCard) return;

            const productId = productCard.getAttribute("data-id");

            const min = parseInt(quantityInput.min, 10) || 1;
            const max = parseInt(quantityInput.max, 10) || Infinity;
            let value = parseInt(quantityInput.value, 10) || min;

            if (value < min) value = min;
            if (value > max) value = max;

            quantityInput.value = value;

            addProductOnCart({
                id: productId,
                quantity: value,
                price: productCard.querySelector("#product-price").textContent.replace(/[^0-9]/g, "")
            });
        }
    }, true);

    productCardsContainer.addEventListener("input", (event) => {
        if (event.target && event.target.matches("#quantity-input")) {
            const quantityInput = event.target;

            const min = parseInt(quantityInput.min, 10) || 1;
            const max = parseInt(quantityInput.max, 10) || Infinity;

            let value = quantityInput.value.replace(/\D/g, '');
            value = value.slice(0, 4);

            if (value < min) value = min;
            if (value > max) value = max;

            quantityInput.value = value;
        }
    });

    orderButton.addEventListener("click", async function(event) {
        event.preventDefault();

        const digits = phoneNumberInput.value.replace(/\D/g, "");
        if (!/^7\d{10}$/.test(digits)) {
            inputRequired(phoneNumberInput);
            return;
        }

        const cartItems = cartItemsContainer.querySelectorAll(".__content-item");
        let data = [];
        cartItems.forEach(item => {
            data.push({
                id: item.getAttribute("data-id"),
                quantity: item.querySelector("cart-item-quantity")
            });
        });

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phone: digits,
                    cart: data
                })
            };

            const response = await fetch("/order", requestOptions);
            const result = await response.json();

            if (response.ok && result.success) {
                modalContainer.classList.add("modal-container--active");
                modalContainer.querySelector(".__content").textContent = "Заказ успешно создан";
            } else {
                modalContainer.classList.add("modal-container--active");
                modalContainer.querySelector(".__content").textContent = result.error;
                console.log("Ошибка при оформлении заказа:", result.error);
            }
        } catch (error) {
            console.error("Ошибка при отправке заказа:", error);
        } finally {
            setTimeout(() => modalContainer.classList.remove("modal-container--active"), 2500);
        }
    });

    async function loadReviews() {
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            };

            const response = await fetch("/reviews", requestOptions);
            const result = await response.json();

            if (response.ok && result.success) {
                renderRewies(result.reviews);
                return;
            } else {
                console.error("Не удалось получить отзывы:", result);
                return;
            }
        } catch (error) {
            console.error(error);
        }
    }

    loadReviews();

    async function loadProducts() {
        if (loading) return;
        if ((page - 1) * pageSize >= total) {
            observer.disconnect();
            return;
        }

        loading = true;
        try {
            const requestOptions = {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            };

            const response = await fetch(`/products?page=${page}&pageSize=${pageSize}`, requestOptions);
            const result = await response.json();

            if (response.ok && result.success) {
                total = result.total;
                renderProducts(result.items);
                page = result.page;
                total = result.total;
            } else {
                console.error("Ошибка в ответе:", result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            loading = false;
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadProducts();
            }
        });
    }, {
        root: null,
        rootMargin: '0px',
        threshold: 1.0
    });

    observer.observe(sentinel);
});