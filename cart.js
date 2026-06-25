(function (window, document) {
    'use strict';

    var STORAGE_KEY = 'mallow_cart_v1';
    var FREE_SHIPPING_THRESHOLD = 50;
    var STANDARD_SHIPPING_COST = 4.95;
    var miniCartSuggestIndex = 0;
    var lastCartCount = null;
    var miniCartSuggestLastWheelDirection = 0;
    var miniCartSuggestLastWheelAt = 0;
    var PRODUCT_CATALOG = [
        {
            id: 'mallow-day',
            name: 'Mallow Day',
            price: 22.95,
            image: 'https://lokagrootvoorst.nl/wp-content/uploads/2025/12/Honingbalsem-768x1024.jpg',
            category: 'cremes',
            url: '/producten/mallow-day'
        },
        {
            id: 'mallow-night',
            name: 'Mallow Night',
            price: 22.95,
            image: 'https://lokagrootvoorst.nl/wp-content/uploads/2025/12/Castorbalsem-768x1024.jpg',
            category: 'cremes',
            url: '/producten/mallow-night'
        },
        {
            id: 'mallow-rescue',
            name: 'Mallow Rescue',
            price: 24.95,
            image: 'https://lokagrootvoorst.nl/wp-content/uploads/2025/12/zonnebloembalsem-768x1024.jpg',
            category: 'cremes',
            url: '/producten/mallow-rescue'
        },
        {
            id: 'mallow-calm',
            name: 'Vlierbloesemcreme',
            price: 23.95,
            image: 'https://lokagrootvoorst.nl/wp-content/uploads/2025/12/Honingbalsem-768x1024.jpg',
            category: 'cremes',
            url: '/producten/mallow-calm'
        },
        {
            id: 'zuiverende-zeep',
            name: 'Zuiverende Zeep',
            price: 10.95,
            image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'zeepjes',
            url: '/producten/zuiverende-zeep'
        },
        {
            id: 'Havermout-zeep',
            name: 'Havermout Zeep',
            price: 11.95,
            image: 'havermout%20zeep.png',
            category: 'zeepjes',
            url: '/producten/havermout-zeep'
        },
        {
            id: 'honing-zeep',
            name: 'Honing Zeep',
            price: 11.95,
            image: 'honing%20zeep.png',
            category: 'zeepjes',
            url: '/producten/honing-zeep'
        },
        {
            id: 'premium-bottenbouillon',
            name: 'Premium Bottenbouillon',
            price: 7.50,
            image: 'https://www.clovermeadowsbeef.com/wp-content/uploads/2022/11/beef-bone-broth.png',
            category: 'voeding',
            url: '/producten/premium-bottenbouillon'
        },
        {
            id: 'tallow-kaars',
            name: 'Tallow Kaars',
            price: 6.99,
            image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            category: 'overig',
            url: '/producten/tallow-kaars'
        }
    ];

    function normalizeCatalogItem(item) {
        if (!item) {
            return null;
        }

        var id = String(item.id || item.slug || '');
        if (!id) {
            return null;
        }

        return {
            id: id,
            name: String(item.name || 'Product'),
            price: parsePrice(item.price),
            image: String(item.image || ''),
            category: String(item.category || ''),
            url: item.url ? String(item.url) : ('/producten/' + encodeURIComponent(String(id).toLowerCase()))
        };
    }

    function getCatalogList() {
        var externalList = window.MallowCatalog && Array.isArray(window.MallowCatalog.list)
            ? window.MallowCatalog.list
            : null;

        if (!externalList || !externalList.length) {
            return PRODUCT_CATALOG.slice();
        }

        var mapped = externalList.map(function (product) {
            if (window.MallowCatalog && typeof window.MallowCatalog.toCartItem === 'function') {
                var base = window.MallowCatalog.toCartItem(product);
                if (base) {
                    base.category = product && product.category ? String(product.category) : '';
                    return normalizeCatalogItem(base);
                }
            }

            return normalizeCatalogItem(product);
        }).filter(Boolean);

        return mapped.length ? mapped : PRODUCT_CATALOG.slice();
    }

    function slugify(input) {
        return String(input || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function parsePrice(value) {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : 0;
        }

        var clean = String(value || '').replace(/[^0-9,.-]/g, '');
        if (!clean) {
            return 0;
        }

        if (clean.indexOf(',') > -1 && clean.indexOf('.') > -1) {
            if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
                clean = clean.replace(/,/g, '');
            }
        } else {
            clean = clean.replace(',', '.');
        }

        var parsed = parseFloat(clean);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatEuro(value) {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(value || 0);
    }

    function loadCart() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    function getCart() {
        return loadCart();
    }

    function setCart(cart) {
        saveCart(cart);
        updateCartCount();
        renderMiniCart();
        renderCartPage();
        renderCartSuggestions();
    }

    function getItemCount() {
        return getCart().reduce(function (sum, item) {
            return sum + (Number(item.quantity) || 0);
        }, 0);
    }

    function getSubtotal() {
        return getCart().reduce(function (sum, item) {
            return sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0));
        }, 0);
    }

    function getShipping(subtotal) {
        var value = typeof subtotal === 'number' ? subtotal : getSubtotal();
        if (value <= 0 || value >= FREE_SHIPPING_THRESHOLD) {
            return 0;
        }
        return STANDARD_SHIPPING_COST;
    }

    function getTotal() {
        var subtotal = getSubtotal();
        return subtotal + getShipping(subtotal);
    }

    function getFreeShippingStatus(subtotal) {
        var threshold = Math.max(0, Number(FREE_SHIPPING_THRESHOLD) || 0);
        var value = Math.max(0, Number(subtotal) || 0);
        var remaining = Math.max(0, threshold - value);
        var progress = threshold ? Math.min(100, (value / threshold) * 100) : 100;
        var reached = threshold === 0 || value >= threshold;
        var message = reached
            ? 'Je hebt gratis verzending!'
            : (value > 0
                ? 'Nog ' + formatEuro(remaining) + ' tot gratis verzending.'
                : 'Gratis verzending vanaf ' + formatEuro(threshold) + '.');

        return {
            reached: reached,
            remaining: remaining,
            progress: progress,
            message: message
        };
    }

    function addItem(item, quantity, options) {
        var qty = Number(quantity) || 1;
        var config = options && typeof options === 'object' ? options : {};
        if (qty < 1) {
            qty = 1;
        }

        var normalized = {
            id: (item && item.id) ? String(item.id) : slugify(item && item.name ? item.name : 'product'),
            name: item && item.name ? String(item.name) : 'Product',
            price: parsePrice(item && item.price ? item.price : 0),
            image: item && item.image ? String(item.image) : '',
            url: item && item.url ? String(item.url) : 'shop.html'
        };

        var cart = getCart();
        var existing = cart.find(function (cartItem) {
            return cartItem.id === normalized.id;
        });

        if (existing) {
            existing.quantity = (Number(existing.quantity) || 0) + qty;
            existing.price = normalized.price;
            existing.name = normalized.name;
            existing.image = normalized.image;
            existing.url = normalized.url;
        } else {
            normalized.quantity = qty;
            cart.push(normalized);
        }

        setCart(cart);
        if (config.openMiniCart !== false) {
            openMiniCart();
        }
        return getCart();
    }

    function updateItemQuantity(id, quantity) {
        var qty = Number(quantity) || 0;
        var cart = getCart();
        var index = cart.findIndex(function (item) {
            return item.id === id;
        });

        if (index < 0) {
            return;
        }

        if (qty <= 0) {
            cart.splice(index, 1);
        } else {
            cart[index].quantity = qty;
        }

        setCart(cart);
    }

    function removeItem(id) {
        var cart = getCart().filter(function (item) {
            return item.id !== id;
        });
        setCart(cart);
    }

    function clearCart() {
        setCart([]);
    }

    function escapeHtml(input) {
        return String(input || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function updateCartCount() {
        var count = getItemCount();
        var shouldAnimate = lastCartCount !== null && count !== lastCartCount;
        ensureCartButtonStyles();

        document.querySelectorAll('.js-cart-count').forEach(function (el) {
            el.textContent = String(count);
            if (shouldAnimate) {
                pulseCartCount(el);
            }
        });

        lastCartCount = count;
    }

    function pulseCartCount(el) {
        if (!el) {
            return;
        }

        el.classList.remove('is-bumping');
        void el.offsetWidth;
        el.classList.add('is-bumping');

        if (el._mallowCartCountTimer) {
            window.clearTimeout(el._mallowCartCountTimer);
        }

        el._mallowCartCountTimer = window.setTimeout(function () {
            el.classList.remove('is-bumping');
        }, 360);
    }

    function findCatalogItemById(id) {
        var needle = String(id || '');
        var catalog = getCatalogList();
        for (var i = 0; i < catalog.length; i += 1) {
            if (catalog[i].id === needle) {
                return catalog[i];
            }
        }
        return null;
    }

    function getItemCategory(item) {
        if (!item) {
            return '';
        }

        if (item.category) {
            return String(item.category);
        }

        var fromCatalog = findCatalogItemById(item.id);
        if (fromCatalog && fromCatalog.category) {
            return String(fromCatalog.category);
        }

        var url = String(item.url || '');
        var hashIndex = url.indexOf('#');
        if (hashIndex > -1 && hashIndex < url.length - 1) {
            return url.slice(hashIndex + 1);
        }

        return '';
    }

    function getSuggestedProducts(limit) {
        var max = Math.max(0, Math.floor(Number(limit) || 0));
        if (!max) {
            return [];
        }

        var cart = getCart();
        var cartIds = {};
        var preferredCategories = {};

        cart.forEach(function (item) {
            cartIds[item.id] = true;
            var category = getItemCategory(item);
            if (category) {
                preferredCategories[category] = true;
            }
        });

        var suggestions = getCatalogList().filter(function (product) {
            return !cartIds[product.id];
        }).sort(function (a, b) {
            var aScore = preferredCategories[a.category] ? 1 : 0;
            var bScore = preferredCategories[b.category] ? 1 : 0;
            if (aScore !== bScore) {
                return bScore - aScore;
            }
            return (a.price || 0) - (b.price || 0);
        }).slice(0, max);

        if (suggestions.length < max) {
            getCatalogList().forEach(function (product) {
                if (suggestions.length >= max) {
                    return;
                }
                var exists = suggestions.some(function (entry) {
                    return entry.id === product.id;
                });
                if (!exists) {
                    suggestions.push(product);
                }
            });
        }

        return suggestions.map(function (product) {
            return {
                product: product,
                preferred: !!preferredCategories[product.category]
            };
        });
    }

    function getCartItemQuantity(id) {
        var needle = String(id || '');
        var cart = getCart();
        for (var i = 0; i < cart.length; i += 1) {
            if (cart[i].id === needle) {
                return Number(cart[i].quantity) || 0;
            }
        }
        return 0;
    }

    function getMiniCartSuggestionVisibleCount() {
        return window.matchMedia('(max-width: 520px)').matches ? 1 : 2;
    }

    function renderMiniCartSuggestionCard(item) {
        return '' +
            '<article class="mallow-mini-cart-suggest-card">' +
                '<a class="mallow-mini-cart-suggest-image-link" href="' + escapeHtml(item.url || 'shop.html') + '">' +
                    (item.image ? '<img class="mallow-mini-cart-suggest-img" src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' : '<div class="mallow-mini-cart-suggest-img"></div>') +
                '</a>' +
                '<div>' +
                    '<a class="mallow-mini-cart-suggest-name" href="' + escapeHtml(item.url || 'shop.html') + '">' + escapeHtml(item.name) + '</a>' +
                    '<p class="mallow-mini-cart-suggest-price">' + formatEuro(item.price) + '</p>' +
                '</div>' +
                '<button class="mallow-mini-cart-suggest-add js-mini-cart-suggest-add" type="button" data-id="' + escapeHtml(item.id) + '" aria-label="Voeg ' + escapeHtml(item.name) + ' toe">+</button>' +
            '</article>';
    }

    function computeMiniCartSuggestionTranslate(viewport, track, position, visibleCount) {
        var styles = window.getComputedStyle(track);
        var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        var count = Math.max(1, Number(visibleCount) || 1);
        var cardWidth = (viewport.clientWidth - (gap * (count - 1))) / count;
        return -position * (cardWidth + gap);
    }

    function stepMiniCartSuggestions(delta) {
        var panel = document.getElementById('mallow-mini-cart');
        if (!panel) {
            return;
        }

        var viewport = panel.querySelector('.js-mini-cart-suggest-viewport');
        var track = panel.querySelector('.js-mini-cart-suggestions');
        var suggestPrevButton = panel.querySelector('.js-mini-cart-suggest-prev');
        var suggestNextButton = panel.querySelector('.js-mini-cart-suggest-next');
        if (!viewport || !track) {
            return;
        }

        var total = Number(track.getAttribute('data-count')) || 0;
        var visible = Number(track.getAttribute('data-visible')) || 0;
        if (total <= visible || total <= 1) {
            return;
        }

        var currentPosition = Number(track.getAttribute('data-position'));
        if (!Number.isFinite(currentPosition)) {
            currentPosition = miniCartSuggestIndex;
        }

        var maxIndex = Math.max(0, total - visible);
        var nextPosition = Math.max(0, Math.min(maxIndex, currentPosition + (delta > 0 ? 1 : -1)));
        if (nextPosition === currentPosition) {
            return;
        }
        miniCartSuggestIndex = nextPosition;
        if (suggestPrevButton) {
            suggestPrevButton.disabled = nextPosition <= 0;
        }
        if (suggestNextButton) {
            suggestNextButton.disabled = nextPosition >= maxIndex;
        }

        window.requestAnimationFrame(function () {
            track.style.transform = 'translateX(' + computeMiniCartSuggestionTranslate(viewport, track, nextPosition, visible) + 'px)';
            track.setAttribute('data-position', String(nextPosition));
        });
    }

    function handleMiniCartSuggestionWheel(event) {
        var panel = document.getElementById('mallow-mini-cart');
        if (!panel) {
            return;
        }

        var track = panel.querySelector('.js-mini-cart-suggestions');
        if (!track) {
            return;
        }

        var total = Number(track.getAttribute('data-count')) || 0;
        var visible = Number(track.getAttribute('data-visible')) || 0;
        if (total <= visible || total <= 1) {
            return;
        }

        var hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
        var primaryDelta = hasHorizontalIntent ? event.deltaX : event.deltaY;
        if (Math.abs(primaryDelta) < 6) {
            return;
        }
        var direction = primaryDelta > 0 ? 1 : -1;

        event.preventDefault();

        var now = Date.now();
        if (direction === miniCartSuggestLastWheelDirection && (now - miniCartSuggestLastWheelAt) < 90) {
            return;
        }

        miniCartSuggestLastWheelDirection = direction;
        miniCartSuggestLastWheelAt = now;
        stepMiniCartSuggestions(direction);
    }

    function ensureMiniCartStyles() {
        if (document.getElementById('mallow-mini-cart-style')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'mallow-mini-cart-style';
        style.textContent = [
            'body.mallow-mini-cart-open{overflow:hidden;}',
            '.mallow-mini-cart-toggle{position:fixed;right:1rem;bottom:1rem;z-index:997;border:1px solid rgba(38,65,50,0.14);background:rgba(255,255,255,0.92);color:#264132;border-radius:999px;display:inline-flex;align-items:center;gap:0.55rem;padding:0.6rem 0.82rem;cursor:pointer;box-shadow:0 12px 30px rgba(38,65,50,0.12);font-size:0.68rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;backdrop-filter:blur(12px);transition:transform 0.22s ease,background 0.22s ease,box-shadow 0.22s ease,border-color 0.22s ease;}',
            '.mallow-mini-cart-toggle:hover,.mallow-mini-cart-toggle:focus-visible{transform:translateY(-2px);background:#fff;box-shadow:0 16px 36px rgba(38,65,50,0.16);}',
            '.mallow-mini-cart-toggle .js-cart-count{min-width:1.15rem;height:1.15rem;border-radius:999px;background:var(--color-canopy-green, var(--green, #264132));color:#fff;display:inline-flex;align-items:center;justify-content:center;padding:0 0.2rem;font-size:0.63rem;font-weight:700;transition:transform 0.24s ease,box-shadow 0.24s ease,background-color 0.24s ease;}',
            '.mallow-mini-cart-toggle:hover .js-cart-count,.mallow-mini-cart-toggle:focus-visible .js-cart-count{transform:scale(1.06);background:var(--color-canopy-green-hover, var(--green-hover, #1F342A));box-shadow:0 8px 18px rgba(38,65,50,0.18);}',
            '.mallow-mini-cart-backdrop{position:fixed;inset:0;background:rgba(38,65,50,0.2);opacity:0;pointer-events:none;transition:opacity 0.25s ease;z-index:998;}',
            '.mallow-mini-cart-backdrop.is-open{opacity:1;pointer-events:auto;}',
            '.mallow-mini-cart{position:fixed;top:0;right:0;width:min(580px,82vw);height:100vh;background:#f7f4ed;border-left:1px solid rgba(74,69,62,0.12);transform:translateX(100%);transition:transform 0.25s ease;box-shadow:-18px 0 38px rgba(38,65,50,0.14);z-index:999;display:flex;flex-direction:column;}',
            '.mallow-mini-cart.is-open{transform:translateX(0);}',
            '.mallow-mini-cart-head{display:flex;align-items:center;justify-content:space-between;gap:0.9rem;padding:1rem 1rem 0.85rem;border-bottom:1px solid rgba(74,69,62,0.1);}',
            '.mallow-mini-cart-head h2{font-size:1.02rem;line-height:1.2;color:#264132;font-weight:600;letter-spacing:0.04em;}',
            '.mallow-mini-cart-close{border:none;background:transparent;font-size:1.4rem;line-height:1;cursor:pointer;color:#4a453e;padding:0;opacity:0.72;}',
            '.mallow-mini-cart-close:hover{opacity:1;}',
            '.mallow-mini-cart-status{padding:0.85rem 1rem 0.75rem;border-bottom:1px solid rgba(74,69,62,0.08);}',
            '.mallow-mini-cart-status-text{font-size:0.8rem;line-height:1.4;color:#264132;font-weight:600;margin-bottom:0.55rem;}',
            '.mallow-mini-cart-progress{width:100%;height:4px;border-radius:999px;background:rgba(38,65,50,0.08);overflow:hidden;}',
            '.mallow-mini-cart-progress span{display:block;height:100%;width:0;background:#264132;border-radius:inherit;transition:width 0.35s ease;}',
            '.mallow-mini-cart-items{padding:0 1rem;overflow:auto;display:flex;flex-direction:column;flex:1;}',
            '.mallow-mini-cart-empty{padding:1rem 0;color:#837b70;font-size:0.84rem;}',
            '.mallow-mini-cart-item{display:grid;grid-template-columns:60px minmax(0,1fr);gap:0.72rem;align-items:start;padding:0.9rem 0;border-bottom:1px solid rgba(74,69,62,0.1);}',
            '.mallow-mini-cart-image-link{display:block;width:60px;aspect-ratio:1/1;border-radius:13px;overflow:hidden;background:rgba(235,230,216,0.92);}',
            '.mallow-mini-cart-img{width:100%;height:100%;object-fit:cover;display:block;background:#ebe6d8;}',
            '.mallow-mini-cart-body{min-width:0;}',
            '.mallow-mini-cart-top{display:flex;justify-content:space-between;gap:0.65rem;align-items:flex-start;}',
            '.mallow-mini-cart-name{display:block;font-size:0.86rem;line-height:1.28;color:#264132;font-weight:600;}',
            '.mallow-mini-cart-remove{border:none;background:transparent;color:#837b70;cursor:pointer;font-size:1rem;line-height:1;padding:0;opacity:0.72;}',
            '.mallow-mini-cart-remove:hover{opacity:1;color:#264132;}',
            '.mallow-mini-cart-price{font-size:0.74rem;color:#837b70;margin-top:0.28rem;}',
            '.mallow-mini-cart-bottom{margin-top:0.68rem;display:flex;justify-content:space-between;align-items:center;gap:0.65rem;}',
            '.mallow-mini-cart-line-total{font-size:0.94rem;color:#264132;font-weight:600;white-space:nowrap;}',
            '.mallow-mini-cart-stepper{display:inline-flex;align-items:center;gap:0.32rem;min-height:34px;padding:0.12rem 0.18rem;border:1px solid rgba(74,69,62,0.16);border-radius:11px;background:rgba(255,255,255,0.86);}',
            '.mallow-mini-cart-stepper button{width:26px;height:26px;border:none;border-radius:8px;background:transparent;color:#264132;font-size:1rem;line-height:1;cursor:pointer;}',
            '.mallow-mini-cart-stepper button:hover{background:var(--color-green-wash, var(--green-wash, #DFE7DF));}',
            '.mallow-mini-cart-stepper span{min-width:1.2rem;text-align:center;font-size:0.84rem;font-weight:600;color:#264132;}',
            '.mallow-mini-cart-suggest{border-top:1px solid rgba(74,69,62,0.1);padding:0.95rem 1rem;display:flex;flex-direction:column;gap:0.7rem;}',
            '.mallow-mini-cart-suggest-head{display:flex;align-items:center;justify-content:space-between;gap:0.9rem;}',
            '.mallow-mini-cart-suggest-title{font-size:0.98rem;line-height:1.2;color:#264132;font-weight:600;}',
            '.mallow-mini-cart-suggest-nav{display:flex;align-items:center;gap:0.45rem;}',
            '.mallow-mini-cart-suggest-arrow{width:1.9rem;height:1.9rem;border:none;border-radius:999px;background:rgba(255,255,255,0.88);color:#264132;font-size:1rem;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(38,65,50,0.08);}',
            '.mallow-mini-cart-suggest-arrow:hover{background:#fff;}',
            '.mallow-mini-cart-suggest-arrow:disabled{opacity:0.35;cursor:default;}',
            '.mallow-mini-cart-suggest-viewport{overflow:hidden;touch-action:pan-y;overscroll-behavior-x:contain;overscroll-behavior-y:contain;}',
            '.mallow-mini-cart-suggest-grid{display:flex;gap:0.75rem;transform:translateX(0);will-change:transform;transition:transform 0.42s cubic-bezier(0.22,1,0.36,1);}',
            '.mallow-mini-cart-suggest-card{flex:0 0 calc((100% - (0.75rem * (var(--mallow-mini-cart-visible, 2) - 1))) / var(--mallow-mini-cart-visible, 2));display:grid;grid-template-columns:60px minmax(0,1fr) 1.95rem;gap:0.65rem;align-items:center;border:1px solid rgba(74,69,62,0.08);padding:0.72rem;background:rgba(255,255,255,0.76);min-width:0;}',
            '.mallow-mini-cart-suggest-image-link{display:block;width:60px;aspect-ratio:1/1;border-radius:13px;overflow:hidden;background:rgba(235,230,216,0.92);}',
            '.mallow-mini-cart-suggest-img{width:100%;height:100%;object-fit:cover;display:block;background:#ebe6d8;}',
            '.mallow-mini-cart-suggest-name{display:block;font-size:0.8rem;color:#264132;line-height:1.22;font-weight:600;}',
            '.mallow-mini-cart-suggest-price{font-size:0.76rem;color:#4a453e;margin-top:0.18rem;}',
            '.mallow-mini-cart-suggest-add{width:1.95rem;height:1.95rem;border-radius:999px;border:1px solid rgba(38,65,50,0.24);background:transparent;color:#264132;font-size:1rem;line-height:1;cursor:pointer;transition:all 0.25s ease;display:inline-flex;align-items:center;justify-content:center;justify-self:end;align-self:center;padding:0;}',
            '.mallow-mini-cart-suggest-add:hover{background:#264132;border-color:#264132;color:#fff;}',
            '.mallow-mini-cart-foot{border-top:1px solid rgba(74,69,62,0.1);padding:0.9rem 1rem 1rem;display:flex;flex-direction:column;gap:0.6rem;background:rgba(255,255,255,0.42);}',
            '.mallow-mini-cart-row{display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;}',
            '.mallow-mini-cart-free-note{font-size:0.74rem;color:#264132;line-height:1.4;}',
            '.mallow-mini-cart-action{display:inline-flex;justify-content:center;align-items:center;padding:0.86rem 0.95rem;background:#264132;color:#fff;border:1px solid #264132;text-decoration:none;font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;cursor:pointer;}',
            '.mallow-mini-cart-action:hover{background:var(--color-canopy-green-hover, var(--green-hover, #1F342A));border-color:var(--color-canopy-green-hover, var(--green-hover, #1F342A));}',
            '.mallow-mini-cart-action:disabled{opacity:0.6;cursor:not-allowed;background:#264132;border-color:#264132;}',
            '.mallow-mini-cart-secondary{display:block;width:fit-content;margin:0 auto;color:#837b70;font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;border-bottom:1px solid rgba(74,69,62,0.22);padding-bottom:0.25rem;}',
            '.mallow-mini-cart-secondary:hover{color:#264132;border-color:#264132;}',
            '@media (max-width:760px){.mallow-mini-cart-toggle{right:0.7rem;bottom:0.7rem;padding:0.55rem 0.75rem;}.mallow-mini-cart{width:min(420px,88vw);}.mallow-mini-cart-suggest-card{flex-basis:100%;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureCartButtonStyles() {
        if (document.getElementById('mallow-cart-button-style')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'mallow-cart-button-style';
        style.textContent = [
            '.cart-link{transition:transform 0.22s ease,color 0.22s ease;}',
            '.cart-link > span:first-child{transition:transform 0.22s ease;}',
            '.cart-link .cart-count{transition:transform 0.24s ease,box-shadow 0.24s ease,background-color 0.24s ease;}',
            '.cart-link:hover,.cart-link:focus-visible{transform:translateY(-1px);}',
            '.cart-link:hover > span:first-child,.cart-link:focus-visible > span:first-child{transform:translateY(-1px);}',
            '.cart-link:hover .cart-count,.cart-link:focus-visible .cart-count{transform:translateY(-1px) scale(1.04);background:var(--color-canopy-green-hover, var(--green-hover, #1F342A));box-shadow:0 8px 18px rgba(38,65,50,0.18);}',
            '.js-cart-count.is-bumping{animation:mallowCartCountPop 0.34s cubic-bezier(0.22,1,0.36,1);}',
            '@keyframes mallowCartCountPop{0%{transform:scale(1);}45%{transform:scale(1.18);}100%{transform:scale(1);}}'
        ].join('');
        document.head.appendChild(style);
    }

    function ensureScrollHeaderStyles() {
        if (document.getElementById('mallow-scroll-header-style')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'mallow-scroll-header-style';
        style.textContent = '' +
            '.mallow-scroll-header{will-change:transform;transition:transform 0.28s ease;}' +
            '.mallow-scroll-header.is-hidden{transform:translateY(calc(-100% - 0.75rem));}';
        document.head.appendChild(style);
    }

    function ensureMobileNavStyles() {
        if (document.getElementById('mallow-mobile-nav-style')) {
            return;
        }

        var style = document.createElement('style');
        style.id = 'mallow-mobile-nav-style';
        style.textContent = [
            'body.mallow-mobile-nav-open{overflow:hidden;}',
            '.mallow-mobile-nav-toggle{display:none;flex-shrink:0;align-items:center;justify-content:center;gap:0.6rem;min-height:2.8rem;padding:0.68rem 0.85rem;border-radius:999px;border:1px solid rgba(38,65,50,0.14);background:rgba(255,255,255,0.84);color:var(--color-canopy-green, var(--color-green, #264132));cursor:pointer;box-shadow:0 10px 28px rgba(38,65,50,0.12);backdrop-filter:blur(12px);transition:transform 0.22s ease,background-color 0.22s ease,border-color 0.22s ease,box-shadow 0.22s ease,color 0.22s ease;}',
            '.mallow-mobile-nav-toggle:hover,.mallow-mobile-nav-toggle:focus-visible{transform:translateY(-1px);background:#fff;box-shadow:0 14px 32px rgba(38,65,50,0.16);}',
            '.mallow-mobile-nav-toggle:focus-visible,.mallow-mobile-nav-close:focus-visible,.mallow-mobile-nav-links a:focus-visible{outline:2px solid currentColor;outline-offset:3px;}',
            '.mallow-mobile-nav-toggle-text{font-size:0.68rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;}',
            '.mallow-mobile-nav-toggle-icon{display:inline-grid;gap:0.24rem;}',
            '.mallow-mobile-nav-toggle-bar{display:block;width:1rem;height:2px;border-radius:999px;background:currentColor;transition:transform 0.22s ease,opacity 0.22s ease;}',
            '.mallow-mobile-nav-toggle[aria-expanded="true"] .mallow-mobile-nav-toggle-bar:nth-child(1){transform:translateY(0.28rem) rotate(45deg);}',
            '.mallow-mobile-nav-toggle[aria-expanded="true"] .mallow-mobile-nav-toggle-bar:nth-child(2){opacity:0;}',
            '.mallow-mobile-nav-toggle[aria-expanded="true"] .mallow-mobile-nav-toggle-bar:nth-child(3){transform:translateY(-0.28rem) rotate(-45deg);}',
            '.home-header .mallow-mobile-nav-toggle{color:inherit;border-color:rgba(255,255,255,0.24);background:rgba(255,255,255,0.08);box-shadow:none;}',
            '.home-header.is-scrolled .mallow-mobile-nav-toggle{color:var(--color-canopy-green, #264132);border-color:rgba(38,65,50,0.14);background:rgba(255,255,255,0.84);box-shadow:0 10px 26px rgba(38,65,50,0.12);}',
            '.shop-header .mallow-mobile-nav-toggle,.page-header .mallow-mobile-nav-toggle,.cart-header .mallow-mobile-nav-toggle,.vision-header .mallow-mobile-nav-toggle,.head .mallow-mobile-nav-toggle{color:var(--color-canopy-green, var(--color-green, #264132));background:rgba(255,255,255,0.84);border-color:rgba(38,65,50,0.14);}',
            '.mallow-mobile-nav-backdrop{position:fixed;inset:0;background:rgba(20,32,26,0.42);opacity:0;pointer-events:none;transition:opacity 0.22s ease;z-index:1198;}',
            '.mallow-mobile-nav-backdrop.is-open{opacity:1;pointer-events:auto;}',
            '.mallow-mobile-nav-drawer{position:fixed;top:0;right:0;width:min(420px,88vw);height:100vh;height:100dvh;background:#f7f4ed;border-left:1px solid rgba(74,69,62,0.12);box-shadow:-18px 0 40px rgba(38,65,50,0.16);transform:translateX(100%);transition:transform 0.24s cubic-bezier(0.22,1,0.36,1);z-index:1199;display:flex;flex-direction:column;}',
            '.mallow-mobile-nav-drawer.is-open{transform:translateX(0);}',
            '.mallow-mobile-nav-head{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1rem 1rem 0.9rem;border-bottom:1px solid rgba(38,65,50,0.1);}',
            '.mallow-mobile-nav-eyebrow{display:block;margin-bottom:0.25rem;font-size:0.68rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;color:rgba(38,65,50,0.72);}',
            '.mallow-mobile-nav-title{font-family:var(--font-serif, serif);font-size:2rem;line-height:1;color:var(--color-canopy-green, var(--color-green, #264132));}',
            '.mallow-mobile-nav-close{display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;border-radius:999px;border:1px solid rgba(38,65,50,0.14);background:rgba(255,255,255,0.85);color:var(--color-canopy-green, var(--color-green, #264132));font-size:1.4rem;cursor:pointer;transition:transform 0.22s ease,background-color 0.22s ease,border-color 0.22s ease;}',
            '.mallow-mobile-nav-close:hover{transform:translateY(-1px);background:#fff;}',
            '.mallow-mobile-nav-links{display:flex;flex-direction:column;gap:0.55rem;padding:1rem;overflow:auto;flex:1;}',
            '.mallow-mobile-nav-links a{display:flex;align-items:center;gap:0.85rem;min-height:3.35rem;padding:0.95rem 1rem;border:1px solid rgba(38,65,50,0.08);border-radius:18px;background:rgba(255,255,255,0.72);font-size:0.82rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;color:var(--color-canopy-green, var(--color-green, #264132));transition:transform 0.22s ease,background-color 0.22s ease,border-color 0.22s ease,box-shadow 0.22s ease;}',
            '.mallow-mobile-nav-links a:hover{transform:translateX(-2px);background:#fff;border-color:rgba(38,65,50,0.14);box-shadow:0 12px 24px rgba(38,65,50,0.08);}',
            '.mallow-mobile-nav-links a.is-active{background:rgba(38,65,50,0.08);border-color:rgba(38,65,50,0.14);}',
            '.mallow-mobile-nav-links a.cart-link{padding-right:0.85rem;}',
            '.mallow-mobile-nav-links a .js-cart-count{margin-left:auto;min-width:1.2rem;height:1.2rem;}',
            '.mallow-mobile-nav-links a::after{display:none !important;}',
            '.mallow-mobile-nav-home-link{margin-bottom:0.35rem;}',
            '.mallow-mobile-nav-note{padding:0.95rem 1rem 1.15rem;border-top:1px solid rgba(38,65,50,0.1);font-size:0.86rem;line-height:1.55;color:rgba(74,69,62,0.84);background:rgba(255,255,255,0.34);}',
            '.mallow-mobile-nav-enabled .mallow-mobile-nav-toggle{display:inline-flex;}',
            '@media (prefers-reduced-motion: reduce){.mallow-mobile-nav-toggle,.mallow-mobile-nav-close,.mallow-mobile-nav-links a,.mallow-mobile-nav-backdrop,.mallow-mobile-nav-drawer,.mallow-mobile-nav-toggle-bar{transition:none;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function isHomePageLocation() {
        var pathname = String(window.location.pathname || '').toLowerCase();
        return /(?:^|\/)(?:index\.html)?$/.test(pathname);
    }

    function createMobileNavLink(sourceLink) {
        var clone = sourceLink.cloneNode(true);
        clone.removeAttribute('data-mini-cart-link-bound');
        clone.classList.add('mallow-mobile-nav-link');
        return clone;
    }

    function ensureMobileNavigation() {
        if (!document.body || document.body.getAttribute('data-mobile-nav-bound')) {
            return;
        }

        var header = document.querySelector('.home-header, .shop-header, .page-header, .cart-header, .vision-header, .head, header');
        if (!header) {
            return;
        }

        var nav = header.querySelector('nav');
        if (!nav || !nav.querySelector('a[href]')) {
            return;
        }

        ensureMobileNavStyles();

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'mallow-mobile-nav-toggle';
        toggle.setAttribute('aria-label', 'Open menu');
        toggle.setAttribute('aria-controls', 'mallow-mobile-nav');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '' +
            '<span class="mallow-mobile-nav-toggle-text">Menu</span>' +
            '<span class="mallow-mobile-nav-toggle-icon" aria-hidden="true">' +
                '<span class="mallow-mobile-nav-toggle-bar"></span>' +
                '<span class="mallow-mobile-nav-toggle-bar"></span>' +
                '<span class="mallow-mobile-nav-toggle-bar"></span>' +
            '</span>';
        header.appendChild(toggle);

        var backdrop = document.createElement('div');
        backdrop.className = 'mallow-mobile-nav-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');

        var drawer = document.createElement('aside');
        drawer.id = 'mallow-mobile-nav';
        drawer.className = 'mallow-mobile-nav-drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', 'Mobiele navigatie');
        drawer.setAttribute('aria-hidden', 'true');

        var drawerHead = document.createElement('div');
        drawerHead.className = 'mallow-mobile-nav-head';

        var drawerTitleWrap = document.createElement('div');
        var drawerEyebrow = document.createElement('span');
        drawerEyebrow.className = 'mallow-mobile-nav-eyebrow';
        drawerEyebrow.textContent = 'Navigatie';

        var drawerTitle = document.createElement('strong');
        drawerTitle.className = 'mallow-mobile-nav-title';
        drawerTitle.textContent = 'Mallow.';

        drawerTitleWrap.appendChild(drawerEyebrow);
        drawerTitleWrap.appendChild(drawerTitle);

        var closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'mallow-mobile-nav-close';
        closeButton.setAttribute('aria-label', 'Sluit menu');
        closeButton.innerHTML = '&times;';

        drawerHead.appendChild(drawerTitleWrap);
        drawerHead.appendChild(closeButton);
        drawer.appendChild(drawerHead);

        var links = document.createElement('div');
        links.className = 'mallow-mobile-nav-links';

        var homeLink = document.createElement('a');
        homeLink.href = 'index.html';
        homeLink.className = 'mallow-mobile-nav-home-link';
        homeLink.textContent = 'Home';
        if (isHomePageLocation()) {
            homeLink.classList.add('is-active');
        }
        links.appendChild(homeLink);

        nav.querySelectorAll('a[href]').forEach(function (link) {
            var href = String(link.getAttribute('href') || '').trim().toLowerCase();
            if (!href || href === 'index.html' || href === './index.html') {
                return;
            }

            links.appendChild(createMobileNavLink(link));
        });

        drawer.appendChild(links);

        var note = document.createElement('p');
        note.className = 'mallow-mobile-nav-note';
        note.textContent = 'Rustige, lokale verzorging zonder overbodige omwegen.';
        drawer.appendChild(note);

        document.body.appendChild(backdrop);
        document.body.appendChild(drawer);

        var lastFocusedElement = null;

        function closeMobileNav(restoreFocus) {
            document.body.classList.remove('mallow-mobile-nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open menu');
            backdrop.classList.remove('is-open');
            backdrop.setAttribute('aria-hidden', 'true');
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');

            if (restoreFocus !== false && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }

        function openMobileNav() {
            if (!header.classList.contains('mallow-mobile-nav-enabled')) {
                return;
            }

            lastFocusedElement = document.activeElement;
            document.body.classList.add('mallow-mobile-nav-open');
            header.classList.remove('is-hidden');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Sluit menu');
            backdrop.classList.add('is-open');
            backdrop.setAttribute('aria-hidden', 'false');
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            closeButton.focus();
        }

        function syncMobileNavState() {
            var navHidden = window.getComputedStyle(nav).display === 'none';
            header.classList.toggle('mallow-mobile-nav-enabled', navHidden);
            if (!navHidden) {
                closeMobileNav(false);
            }
        }

        toggle.addEventListener('click', function () {
            if (drawer.classList.contains('is-open')) {
                closeMobileNav();
                return;
            }

            openMobileNav();
        });

        closeButton.addEventListener('click', function () {
            closeMobileNav();
        });

        backdrop.addEventListener('click', function () {
            closeMobileNav();
        });

        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMobileNav(false);
            });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
                closeMobileNav();
            }
        });

        window.addEventListener('resize', syncMobileNavState);

        document.body.setAttribute('data-mobile-nav-bound', 'true');
        syncMobileNavState();
    }

    function bindAutoRevealHeader() {
        var header = document.querySelector('.shop-header, .page-header, .cart-header, .vision-header, .head, header');
        if (!header || header.getAttribute('data-scroll-header-bound')) {
            return;
        }

        var computedStyle = window.getComputedStyle(header);
        var position = String(computedStyle && computedStyle.position ? computedStyle.position : '').toLowerCase();
        if (position !== 'sticky' && position !== 'fixed') {
            return;
        }

        ensureScrollHeaderStyles();
        header.classList.add('mallow-scroll-header');
        header.setAttribute('data-scroll-header-bound', 'true');

        var lastScrollY = Math.max(window.scrollY || window.pageYOffset || 0, 0);
        var isHomeHeader = header.classList.contains('home-header');
        var homeHeroSection = isHomeHeader ? document.querySelector('.hero') : null;
        var ticking = false;
        var downThreshold = 10;
        var upThreshold = 4;
        var revealOffset = 24;
        var homeHeaderSolid = false;

        function setHidden(hidden) {
            header.classList.toggle('is-hidden', !!hidden);
        }

        function getHomeRevealStart() {
            if (!isHomeHeader || !homeHeroSection) {
                return revealOffset;
            }

            return Math.max(revealOffset, homeHeroSection.offsetTop + homeHeroSection.offsetHeight);
        }

        function syncScrolledState(scrollY) {
            if (!isHomeHeader) {
                header.classList.toggle('is-scrolled', scrollY > revealOffset);
                return;
            }

            homeHeaderSolid = scrollY >= getHomeRevealStart();
            header.classList.toggle('is-scrolled', homeHeaderSolid);
        }

        function updateHeaderState() {
            var currentScrollY = Math.max(window.scrollY || window.pageYOffset || 0, 0);
            var delta = currentScrollY - lastScrollY;
            var hideStart = header.offsetHeight + revealOffset;
            var homeRevealStart = getHomeRevealStart();

            syncScrolledState(currentScrollY);

            if (isHomeHeader && currentScrollY < homeRevealStart) {
                if (currentScrollY <= revealOffset) {
                    setHidden(false);
                } else {
                    setHidden(true);
                }

                lastScrollY = currentScrollY;
                ticking = false;
                return;
            }

            if (currentScrollY <= revealOffset) {
                setHidden(false);
            } else if (delta >= downThreshold && currentScrollY > hideStart) {
                setHidden(true);
            } else if (delta <= -upThreshold) {
                setHidden(false);
            }

            lastScrollY = currentScrollY;
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (ticking) {
                return;
            }

            ticking = true;
            window.requestAnimationFrame(updateHeaderState);
        }, { passive: true });

        updateHeaderState();
    }

    function ensureMiniCart() {
        if (!document.body) {
            return;
        }

        ensureMiniCartStyles();

        if (!document.getElementById('mallow-mini-cart')) {
            var wrapper = document.createElement('div');
            wrapper.innerHTML = '' +
                '<button id="mallow-mini-cart-toggle" class="mallow-mini-cart-toggle" type="button" aria-label="Toon winkelwagen">' +
                    '<span aria-hidden="true">&#128722;</span>' +
                    '<span class="js-cart-count">0</span>' +
                '</button>' +
                '<div id="mallow-mini-cart-backdrop" class="mallow-mini-cart-backdrop" hidden></div>' +
                '<aside id="mallow-mini-cart" class="mallow-mini-cart" aria-hidden="true">' +
                    '<div class="mallow-mini-cart-head">' +
                        '<h2>Winkelwagen</h2>' +
                        '<button class="mallow-mini-cart-close js-mini-cart-close" type="button" aria-label="Sluit winkelwagen">&times;</button>' +
                    '</div>' +
                    '<div class="mallow-mini-cart-status">' +
                        '<p class="mallow-mini-cart-status-text js-mini-cart-status-text">Gratis verzending vanaf ' + formatEuro(FREE_SHIPPING_THRESHOLD) + '.</p>' +
                        '<div class="mallow-mini-cart-progress" aria-hidden="true"><span class="js-mini-cart-progress-bar"></span></div>' +
                    '</div>' +
                    '<div class="mallow-mini-cart-items js-mini-cart-items"></div>' +
                    '<p class="mallow-mini-cart-empty js-mini-cart-empty" hidden>Je winkelwagen is leeg.</p>' +
                    '<section class="mallow-mini-cart-suggest">' +
                        '<div class="mallow-mini-cart-suggest-head">' +
                            '<p class="mallow-mini-cart-suggest-title">Zie ook</p>' +
                            '<div class="mallow-mini-cart-suggest-nav">' +
                                '<button class="mallow-mini-cart-suggest-arrow js-mini-cart-suggest-prev" type="button" aria-label="Vorige suggesties">&#8249;</button>' +
                                '<button class="mallow-mini-cart-suggest-arrow js-mini-cart-suggest-next" type="button" aria-label="Volgende suggesties">&#8250;</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mallow-mini-cart-suggest-viewport js-mini-cart-suggest-viewport"><div class="mallow-mini-cart-suggest-grid js-mini-cart-suggestions"></div></div>' +
                    '</section>' +
                    '<div class="mallow-mini-cart-foot">' +
                        '<div class="mallow-mini-cart-row"><span>Subtotaal</span><strong class="js-mini-cart-subtotal">' + formatEuro(0) + '</strong></div>' +
                        '<p class="mallow-mini-cart-free-note js-mini-cart-free-note">Nog ' + formatEuro(FREE_SHIPPING_THRESHOLD) + ' tot gratis verzending.</p>' +
                        '<button class="mallow-mini-cart-action js-mini-cart-checkout" type="button">Afrekenen</button>' +
                        '<a class="mallow-mini-cart-secondary" href="cart.html">Naar winkelwagen</a>' +
                    '</div>' +
                '</aside>';

            while (wrapper.firstChild) {
                document.body.appendChild(wrapper.firstChild);
            }
        }

        var toggle = document.getElementById('mallow-mini-cart-toggle');
        var backdrop = document.getElementById('mallow-mini-cart-backdrop');
        var panel = document.getElementById('mallow-mini-cart');
        var closeButton = document.querySelector('.js-mini-cart-close');
        var suggestPrevButton = document.querySelector('.js-mini-cart-suggest-prev');
        var suggestNextButton = document.querySelector('.js-mini-cart-suggest-next');
        var suggestionsViewport = document.querySelector('.js-mini-cart-suggest-viewport');

        if (toggle && !toggle.getAttribute('data-bound')) {
            toggle.setAttribute('data-bound', 'true');
            toggle.addEventListener('click', function () {
                toggleMiniCart();
            });
        }

        if (backdrop && !backdrop.getAttribute('data-bound')) {
            backdrop.setAttribute('data-bound', 'true');
            backdrop.addEventListener('click', function () {
                closeMiniCart();
            });
        }

        if (closeButton && !closeButton.getAttribute('data-bound')) {
            closeButton.setAttribute('data-bound', 'true');
            closeButton.addEventListener('click', function () {
                closeMiniCart();
            });
        }

        if (suggestPrevButton && !suggestPrevButton.getAttribute('data-bound')) {
            suggestPrevButton.setAttribute('data-bound', 'true');
            suggestPrevButton.addEventListener('click', function () {
                stepMiniCartSuggestions(-1);
            });
        }

        if (suggestNextButton && !suggestNextButton.getAttribute('data-bound')) {
            suggestNextButton.setAttribute('data-bound', 'true');
            suggestNextButton.addEventListener('click', function () {
                stepMiniCartSuggestions(1);
            });
        }

        if (suggestionsViewport && !suggestionsViewport.getAttribute('data-wheel-bound')) {
            suggestionsViewport.setAttribute('data-wheel-bound', 'true');
            suggestionsViewport.addEventListener('wheel', handleMiniCartSuggestionWheel, { passive: false });
        }

        if (panel && !panel.getAttribute('data-bound')) {
            panel.setAttribute('data-bound', 'true');
            panel.addEventListener('click', function (event) {
                var removeButton = event.target.closest('.js-mini-cart-remove');
                if (removeButton) {
                    var removeCard = removeButton.closest('.mallow-mini-cart-item');
                    if (removeCard) {
                        removeItem(removeCard.getAttribute('data-id'));
                    }
                    return;
                }

                var suggestionAddButton = event.target.closest('.js-mini-cart-suggest-add');
                if (suggestionAddButton) {
                    var suggestionId = suggestionAddButton.getAttribute('data-id');
                    var suggestionItem = findCatalogItemById(suggestionId);
                    if (!suggestionItem) {
                        return;
                    }

                    addItem(suggestionItem, 1);
                    notify(suggestionItem.name + ' toegevoegd aan winkelwagen.');
                    return;
                }

                var miniCheckoutButton = event.target.closest('.js-mini-cart-checkout');
                if (miniCheckoutButton) {
                    startStripeCheckout(miniCheckoutButton);
                    return;
                }

                var qtyButton = event.target.closest('.js-mini-cart-qty');
                if (!qtyButton) {
                    return;
                }

                var qtyCard = qtyButton.closest('.mallow-mini-cart-item');
                if (!qtyCard) {
                    return;
                }

                var id = qtyCard.getAttribute('data-id');
                var delta = Number(qtyButton.getAttribute('data-delta')) || 0;
                var currentQty = getCartItemQuantity(id);

                if (!currentQty) {
                    return;
                }

                updateItemQuantity(id, currentQty + delta);
            });
        }

        if (!ensureMiniCart.escapeBound) {
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape') {
                    closeMiniCart();
                }
            });
            ensureMiniCart.escapeBound = true;
        }

        if (!ensureMiniCart.resizeBound) {
            window.addEventListener('resize', function () {
                if (isMiniCartOpen()) {
                    renderMiniCart();
                }
            });
            ensureMiniCart.resizeBound = true;
        }

        document.querySelectorAll('a.cart-link').forEach(function (link) {
            if (link.getAttribute('data-mini-cart-link-bound')) {
                return;
            }

            link.setAttribute('data-mini-cart-link-bound', 'true');
            link.addEventListener('click', function (event) {
                if (event.defaultPrevented) {
                    return;
                }

                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                }

                event.preventDefault();
                openMiniCart();
            });
        });
    }

    function isMiniCartOpen() {
        var panel = document.getElementById('mallow-mini-cart');
        return !!(panel && panel.classList.contains('is-open'));
    }

    function openMiniCart() {
        ensureMiniCart();
        var panel = document.getElementById('mallow-mini-cart');
        var backdrop = document.getElementById('mallow-mini-cart-backdrop');
        if (!panel || !backdrop) {
            return;
        }
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop.hidden = false;
        backdrop.classList.add('is-open');
        document.body.classList.add('mallow-mini-cart-open');
    }

    function closeMiniCart() {
        var panel = document.getElementById('mallow-mini-cart');
        var backdrop = document.getElementById('mallow-mini-cart-backdrop');
        if (!panel || !backdrop) {
            return;
        }
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        backdrop.classList.remove('is-open');
        backdrop.hidden = true;
        document.body.classList.remove('mallow-mini-cart-open');
    }

    function toggleMiniCart() {
        if (isMiniCartOpen()) {
            closeMiniCart();
        } else {
            openMiniCart();
        }
    }

    function renderMiniCart() {
        var panel = document.getElementById('mallow-mini-cart');
        if (!panel) {
            return;
        }

        var itemsEl = panel.querySelector('.js-mini-cart-items');
        var emptyEl = panel.querySelector('.js-mini-cart-empty');
        var suggestionsSectionEl = panel.querySelector('.mallow-mini-cart-suggest');
        var subtotalEl = panel.querySelector('.js-mini-cart-subtotal');
        var freeNoteEl = panel.querySelector('.js-mini-cart-free-note');
        var suggestionsEl = panel.querySelector('.js-mini-cart-suggestions');
        var suggestionsViewportEl = panel.querySelector('.js-mini-cart-suggest-viewport');
        var miniCheckoutButton = panel.querySelector('.js-mini-cart-checkout');
        var statusTextEl = panel.querySelector('.js-mini-cart-status-text');
        var progressBarEl = panel.querySelector('.js-mini-cart-progress-bar');
        var suggestPrevButton = panel.querySelector('.js-mini-cart-suggest-prev');
        var suggestNextButton = panel.querySelector('.js-mini-cart-suggest-next');
        var cart = getCart();

        if (!itemsEl || !emptyEl || !subtotalEl || !freeNoteEl || !suggestionsEl || !suggestionsViewportEl || !miniCheckoutButton || !suggestionsSectionEl || !statusTextEl || !progressBarEl || !suggestPrevButton || !suggestNextButton) {
            return;
        }

        if (!cart.length) {
            itemsEl.innerHTML = '';
            emptyEl.hidden = false;
        } else {
            emptyEl.hidden = true;
            itemsEl.innerHTML = cart.map(function (item) {
                var lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                return '' +
                    '<article class="mallow-mini-cart-item" data-id="' + escapeHtml(item.id) + '">' +
                        '<a class="mallow-mini-cart-image-link" href="' + escapeHtml(item.url || 'shop.html') + '">' +
                            (item.image ? '<img class="mallow-mini-cart-img" src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' : '<div class="mallow-mini-cart-img"></div>') +
                        '</a>' +
                        '<div class="mallow-mini-cart-body">' +
                            '<div class="mallow-mini-cart-top">' +
                                '<a class="mallow-mini-cart-name" href="' + escapeHtml(item.url || 'shop.html') + '">' + escapeHtml(item.name) + '</a>' +
                                '<button class="mallow-mini-cart-remove js-mini-cart-remove" type="button" aria-label="Verwijderen">&times;</button>' +
                            '</div>' +
                            '<p class="mallow-mini-cart-price">Per stuk: ' + formatEuro(item.price) + '</p>' +
                            '<div class="mallow-mini-cart-bottom">' +
                                '<div class="mallow-mini-cart-stepper">' +
                                    '<button class="js-mini-cart-qty" type="button" data-delta="-1" aria-label="Verlaag aantal">-</button>' +
                                    '<span>' + escapeHtml(item.quantity) + '</span>' +
                                    '<button class="js-mini-cart-qty" type="button" data-delta="1" aria-label="Verhoog aantal">+</button>' +
                                '</div>' +
                                '<strong class="mallow-mini-cart-line-total">' + formatEuro(lineTotal) + '</strong>' +
                            '</div>' +
                        '</div>' +
                    '</article>';
            }).join('');
        }

        var subtotal = getSubtotal();
        var shippingStatus = getFreeShippingStatus(subtotal);
        subtotalEl.textContent = formatEuro(subtotal);
        miniCheckoutButton.disabled = cart.length === 0;
        statusTextEl.textContent = shippingStatus.message;
        progressBarEl.style.width = shippingStatus.progress + '%';
        freeNoteEl.textContent = shippingStatus.message;

        var miniSuggestions = getSuggestedProducts(4);
        var visibleCount = getMiniCartSuggestionVisibleCount();
        if (!miniSuggestions.length) {
            suggestionsSectionEl.hidden = true;
            suggestionsEl.innerHTML = '';
            suggestPrevButton.hidden = true;
            suggestNextButton.hidden = true;
            suggestPrevButton.disabled = true;
            suggestNextButton.disabled = true;
            return;
        }

        suggestionsSectionEl.hidden = false;
        var totalSuggestions = miniSuggestions.length;
        miniCartSuggestIndex = totalSuggestions ? ((miniCartSuggestIndex % totalSuggestions) + totalSuggestions) % totalSuggestions : 0;
        suggestionsEl.style.setProperty('--mallow-mini-cart-visible', String(visibleCount));
        suggestionsEl.setAttribute('data-count', String(totalSuggestions));
        suggestionsEl.setAttribute('data-visible', String(visibleCount));

        if (totalSuggestions <= visibleCount) {
            suggestPrevButton.hidden = true;
            suggestNextButton.hidden = true;
            suggestPrevButton.disabled = true;
            suggestNextButton.disabled = true;
            suggestionsEl.innerHTML = miniSuggestions.map(function (entry) {
                return renderMiniCartSuggestionCard(entry.product);
            }).join('');
            suggestionsEl.style.transform = 'translateX(0px)';
            suggestionsEl.setAttribute('data-position', '0');
            return;
        }

        suggestPrevButton.hidden = false;
        suggestNextButton.hidden = false;
        var maxIndex = Math.max(0, totalSuggestions - visibleCount);
        if (miniCartSuggestIndex > maxIndex) {
            miniCartSuggestIndex = maxIndex;
        }
        suggestPrevButton.disabled = miniCartSuggestIndex <= 0;
        suggestNextButton.disabled = miniCartSuggestIndex >= maxIndex;
        suggestionsEl.innerHTML = miniSuggestions.map(function (entry) {
            return renderMiniCartSuggestionCard(entry.product);
        }).join('');

        suggestionsEl.style.transform = 'translateX(' + computeMiniCartSuggestionTranslate(suggestionsViewportEl, suggestionsEl, miniCartSuggestIndex, visibleCount) + 'px)';
        suggestionsEl.setAttribute('data-position', String(miniCartSuggestIndex));
    }

    function ensureToast() {
        var existing = document.getElementById('cart-status');
        if (existing) {
            return existing;
        }

        var toast = document.createElement('div');
        toast.id = 'cart-status';
        toast.setAttribute('aria-live', 'polite');
        toast.style.position = 'fixed';
        toast.style.top = '2rem';
        toast.style.left = '50%';
        toast.style.zIndex = '9999';
        toast.style.background = 'rgba(255, 252, 247, 0.88)';
        toast.style.backdropFilter = 'blur(12px)';
        toast.style.color = '#264132';
        toast.style.border = '1px solid rgba(38, 65, 50, 0.12)';
        toast.style.borderRadius = '999px';
        toast.style.padding = '0.65rem 1.4rem';
        toast.style.fontSize = '0.68rem';
        toast.style.fontWeight = '600';
        toast.style.textTransform = 'uppercase';
        toast.style.letterSpacing = '0.12em';
        toast.style.boxShadow = '0 12px 30px rgba(38, 65, 50, 0.08)';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(-20px)';
        toast.style.transition = 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        toast.style.pointerEvents = 'none';
        document.body.appendChild(toast);
        return toast;
    }

    var toastTimer = null;
    function notify(message, isError) {
        var toast = ensureToast();
        toast.textContent = message;
        toast.style.background = isError ? 'rgba(127, 47, 47, 0.88)' : 'rgba(255, 252, 247, 0.88)';
        toast.style.color = isError ? '#fff' : '#264132';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        if (toastTimer) {
            clearTimeout(toastTimer);
        }
        toastTimer = setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 1800);
    }

    function renderCartPage() {
        var listEl = document.getElementById('cart-items');
        if (!listEl) {
            return;
        }

        var emptyEl = document.getElementById('cart-empty');
        var contentEl = document.getElementById('cart-content');
        var subtotalEl = document.getElementById('cart-subtotal');
        var shippingEl = document.getElementById('cart-shipping');
        var totalEl = document.getElementById('cart-total');
        var freeNoteEl = document.getElementById('cart-free-note');
        var shippingMessageEl = document.getElementById('cart-shipping-message');
        var progressBarEl = document.getElementById('cart-progress-bar');

        var cart = getCart();
        var subtotal = getSubtotal();
        var shipping = getShipping(subtotal);
        var total = subtotal + shipping;
        var shippingStatus = getFreeShippingStatus(subtotal);

        if (!cart.length) {
            if (emptyEl) {
                emptyEl.hidden = false;
            }
            if (contentEl) {
                contentEl.hidden = true;
            }
            listEl.innerHTML = '';
        } else {
            if (emptyEl) {
                emptyEl.hidden = true;
            }
            if (contentEl) {
                contentEl.hidden = false;
            }

            listEl.innerHTML = cart.map(function (item) {
                var lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                return '' +
                    '<article class="cart-item" data-id="' + escapeHtml(item.id) + '">' +
                        '<a class="cart-item-image-link" href="' + escapeHtml(item.url || 'shop.html') + '">' +
                            (item.image ? '<img class="cart-item-image" src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' : '<div class="cart-item-image cart-item-image-placeholder"></div>') +
                        '</a>' +
                        '<div class="cart-item-main">' +
                            '<a class="cart-item-name" href="' + escapeHtml(item.url || 'shop.html') + '">' + escapeHtml(item.name) + '</a>' +
                            '<p class="cart-item-unit">Per stuk: ' + formatEuro(item.price) + '</p>' +
                            '<div class="cart-item-controls">' +
                                '<div class="cart-item-stepper">' +
                                    '<button class="js-cart-step" type="button" data-delta="-1" aria-label="Verlaag aantal">-</button>' +
                                    '<span class="cart-item-stepper-value">' + escapeHtml(item.quantity) + '</span>' +
                                    '<button class="js-cart-step" type="button" data-delta="1" aria-label="Verhoog aantal">+</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="cart-item-meta">' +
                            '<p class="cart-item-line-total">' + formatEuro(lineTotal) + '</p>' +
                            '<button class="cart-item-remove js-cart-remove" type="button">Verwijderen</button>' +
                        '</div>' +
                    '</article>';
            }).join('');

            listEl.querySelectorAll('.js-cart-step').forEach(function (button) {
                button.addEventListener('click', function () {
                    var card = button.closest('.cart-item');
                    if (!card) {
                        return;
                    }
                    var id = card.getAttribute('data-id');
                    var delta = Number(button.getAttribute('data-delta')) || 0;
                    var currentQty = getCartItemQuantity(id);
                    if (!currentQty) {
                        return;
                    }
                    updateItemQuantity(id, currentQty + delta);
                });
            });

            listEl.querySelectorAll('.js-cart-remove').forEach(function (button) {
                button.addEventListener('click', function () {
                    var card = button.closest('.cart-item');
                    if (!card) {
                        return;
                    }
                    removeItem(card.getAttribute('data-id'));
                });
            });
        }

        if (subtotalEl) {
            subtotalEl.textContent = formatEuro(subtotal);
        }
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'Gratis' : formatEuro(shipping);
        }
        if (totalEl) {
            totalEl.textContent = formatEuro(total);
        }
        if (shippingMessageEl) {
            shippingMessageEl.textContent = shippingStatus.message;
        }
        if (progressBarEl) {
            progressBarEl.style.width = shippingStatus.progress + '%';
        }
        if (freeNoteEl) {
            freeNoteEl.textContent = shippingStatus.message;
        }
    }

    function renderCartSuggestions() {
        var sectionEl = document.getElementById('cart-suggestions');
        var gridEl = document.getElementById('cart-suggestions-grid');
        if (!sectionEl || !gridEl) {
            return;
        }

        var suggestions = getSuggestedProducts(4);

        if (!suggestions.length) {
            sectionEl.hidden = true;
            gridEl.innerHTML = '';
            return;
        }

        sectionEl.hidden = false;
        gridEl.innerHTML = suggestions.map(function (entry) {
            var item = entry.product;
            var reason = entry.preferred ? 'Past bij je selectie' : 'Goede aanvulling';
            return '' +
                '<article class="cart-suggestion-card">' +
                    '<a class="cart-suggestion-image-link" href="' + escapeHtml(item.url) + '">' +
                        '<img class="cart-suggestion-image" src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">' +
                    '</a>' +
                    '<div class="cart-suggestion-content">' +
                        '<a class="cart-suggestion-name" href="' + escapeHtml(item.url) + '">' + escapeHtml(item.name) + '</a>' +
                        '<p class="cart-suggestion-reason">' + escapeHtml(reason) + '</p>' +
                        '<p class="cart-suggestion-price">' + formatEuro(item.price) + '</p>' +
                    '</div>' +
                    '<button class="cart-suggestion-add js-suggestion-add" type="button" data-id="' + escapeHtml(item.id) + '" aria-label="Voeg ' + escapeHtml(item.name) + ' toe">+</button>' +
                '</article>';
        }).join('');

        gridEl.querySelectorAll('.js-suggestion-add').forEach(function (button) {
            button.addEventListener('click', function () {
                var id = button.getAttribute('data-id');
                var item = findCatalogItemById(id);
                if (!item) {
                    return;
                }

                addItem(item, 1, { openMiniCart: false });
                notify(item.name + ' toegevoegd aan winkelwagen.');
            });
        });
    }

    function getClearCartModalElements() {
        return {
            backdrop: document.getElementById('clear-cart-modal'),
            cancel: document.getElementById('clear-cart-cancel'),
            confirm: document.getElementById('clear-cart-confirm')
        };
    }

    function isClearCartModalOpen() {
        var modal = document.getElementById('clear-cart-modal');
        return !!(modal && !modal.hidden);
    }

    function openClearCartModal() {
        var elements = getClearCartModalElements();
        if (!elements.backdrop) {
            return;
        }

        elements.backdrop.hidden = false;
        if (elements.cancel) {
            elements.cancel.focus();
        }
    }

    function closeClearCartModal() {
        var elements = getClearCartModalElements();
        if (!elements.backdrop) {
            return;
        }

        elements.backdrop.hidden = true;
    }

    function bindCartPageActions() {
        var clearButton = document.getElementById('clear-cart-btn');
        var modalElements = getClearCartModalElements();
        if (clearButton) {
            clearButton.addEventListener('click', function () {
                openClearCartModal();
            });
        }

        if (modalElements.backdrop && !modalElements.backdrop.getAttribute('data-bound')) {
            modalElements.backdrop.setAttribute('data-bound', 'true');
            modalElements.backdrop.addEventListener('click', function (event) {
                if (event.target === modalElements.backdrop) {
                    closeClearCartModal();
                }
            });
        }

        if (modalElements.cancel && !modalElements.cancel.getAttribute('data-bound')) {
            modalElements.cancel.setAttribute('data-bound', 'true');
            modalElements.cancel.addEventListener('click', function () {
                closeClearCartModal();
            });
        }

        if (modalElements.confirm && !modalElements.confirm.getAttribute('data-bound')) {
            modalElements.confirm.setAttribute('data-bound', 'true');
            modalElements.confirm.addEventListener('click', function () {
                closeClearCartModal();
                clearCart();
                notify('Winkelwagen leeggemaakt.');
            });
        }

        if (!bindCartPageActions.escapeBound) {
            document.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && isClearCartModalOpen()) {
                    closeClearCartModal();
                }
            });
            bindCartPageActions.escapeBound = true;
        }

        var checkoutButton = document.getElementById('checkout-btn');
        if (checkoutButton) {
            checkoutButton.addEventListener('click', function () {
                startStripeCheckout(checkoutButton);
            });
        }
    }

    function buildCheckoutRequestItems() {
        return getCart().map(function (item) {
            return {
                id: String(item.id || ''),
                quantity: Math.max(1, Math.floor(Number(item.quantity) || 1))
            };
        }).filter(function (item) {
            return item.id;
        });
    }

    function startStripeCheckout(checkoutButton) {
        var requestItems = buildCheckoutRequestItems();
        if (!requestItems.length) {
            notify('Je winkelwagen is leeg.', true);
            return;
        }

        var originalLabel = '';
        if (checkoutButton) {
            originalLabel = checkoutButton.textContent;
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Bezig...';
        }

        fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origin: window.location.origin,
                items: requestItems
            })
        }).then(function (response) {
            return response.json().catch(function () {
                return {};
            }).then(function (data) {
                if (!response.ok) {
                    var message = data && data.error ? data.error : 'Kon checkout niet starten.';
                    throw new Error(message);
                }

                if (!data || !data.url) {
                    throw new Error('Geen checkout URL ontvangen.');
                }

                window.location.assign(data.url);
            });
        }).catch(function (error) {
            notify(error && error.message ? error.message : 'Kon checkout niet starten.', true);
            if (checkoutButton) {
                checkoutButton.disabled = false;
                checkoutButton.textContent = originalLabel;
            }
        });
    }

    function handleCheckoutReturnState() {
        var params = new URLSearchParams(window.location.search || '');
        var state = String(params.get('checkout') || '').toLowerCase();
        if (!state) {
            return;
        }

        if (state === 'success') {
            clearCart();
            notify('Betaling gelukt. Bedankt voor je bestelling.');
        } else if (state === 'cancelled') {
            notify('Checkout geannuleerd. Je winkelwagen is bewaard.');
        }

        if (window.history && typeof window.history.replaceState === 'function') {
            var cleanUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    window.MallowCart = {
        addItem: addItem,
        removeItem: removeItem,
        updateItemQuantity: updateItemQuantity,
        clearCart: clearCart,
        getCart: getCart,
        getSubtotal: getSubtotal,
        getShipping: getShipping,
        getTotal: getTotal,
        getItemCount: getItemCount,
        parsePrice: parsePrice,
        formatEuro: formatEuro,
        slugify: slugify,
        updateCartCount: updateCartCount,
        openMiniCart: openMiniCart,
        closeMiniCart: closeMiniCart,
        renderMiniCart: renderMiniCart,
        renderCartPage: renderCartPage,
        renderCartSuggestions: renderCartSuggestions,
        notify: notify
    };

    document.addEventListener('DOMContentLoaded', function () {
        ensureMobileNavigation();
        bindAutoRevealHeader();
        ensureMiniCart();
        handleCheckoutReturnState();
        updateCartCount();
        renderMiniCart();
        renderCartPage();
        renderCartSuggestions();
        bindCartPageActions();
    });
})(window, document);
