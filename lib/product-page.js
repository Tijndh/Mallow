function renderProductPage(options) {
    const template = String(options && options.template ? options.template : '');
    const product = options && options.product ? options.product : null;
    const baseUrl = String(options && options.baseUrl ? options.baseUrl : '').replace(/\/+$/, '');
    if (!template || !product || !baseUrl) {
        throw new Error('Product page rendering mist template, product of baseUrl.');
    }

    const slug = normalizeSlug(product.slug || product.id);
    const canonicalUrl = baseUrl + '/producten/' + encodeURIComponent(slug);
    const imageUrl = absoluteAssetUrl(product.image, baseUrl);
    const title = String(product.name || 'Product') + ' | Mallow';
    const description = cleanDescription(product.subtitle || product.description || product.name);
    const price = formatEuro(product.price);
    const metadata = buildMetadata({
        product: product,
        title: title,
        description: description,
        canonicalUrl: canonicalUrl,
        imageUrl: imageUrl
    });

    let html = template;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>');
    html = html.replace('</head>', metadata + '\n</head>');
    html = replaceElementContent(html, 'product-title', escapeHtml(product.name || 'Product'));
    html = replaceElementContent(html, 'bc-name', escapeHtml(product.name || 'Product'));
    html = replaceElementContent(html, 'product-subtitle', escapeHtml(product.subtitle || ''));
    html = replaceElementContent(html, 'product-price', escapeHtml(product.comingSoon ? 'Prijs volgt' : price));
    html = replaceElementContent(html, 'product-volume', escapeHtml(product.volume || ''));
    html = replaceElementContent(html, 'rating-text', buildRatingText(product));
    html = replaceElementContent(html, 'product-benefits', buildBenefits(product.benefits));
    html = replaceElementContent(html, 'c-track', buildInitialImage(imageUrl, product.name));
    html = replaceElementContent(html, 'accordion', buildAccordion(product));
    html = replaceElementContent(html, 'stock-status', escapeHtml(product.stockLabel || ''));
    return html;
}

function buildMetadata(context) {
    const product = context.product;
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: String(product.name || 'Product'),
        description: context.description,
        image: context.imageUrl ? [context.imageUrl] : undefined,
        sku: String(product.id || ''),
        brand: {
            '@type': 'Brand',
            name: String(product.brand || 'Mallow')
        }
    };

    if (!product.comingSoon && Number(product.price) > 0) {
        structuredData.offers = {
            '@type': 'Offer',
            url: context.canonicalUrl,
            priceCurrency: 'EUR',
            price: Number(product.price).toFixed(2),
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            shippingDetails: buildShippingDetails(),
            hasMerchantReturnPolicy: buildReturnPolicy(context.canonicalUrl)
        };
    }
    if (Number(product.ratingValue) > 0 && Number(product.ratingCount) > 0) {
        structuredData.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(product.ratingValue),
            reviewCount: Number(product.ratingCount)
        };
    }

    removeUndefined(structuredData);
    const structuredGraph = [
        structuredData,
        buildBreadcrumbData(context.canonicalUrl, product.name || 'Product'),
        buildFaqData(product)
    ];
    return [
        '  <meta name="description" content="' + escapeAttribute(context.description) + '">',
        '  <link rel="canonical" href="' + escapeAttribute(context.canonicalUrl) + '">',
        '  <meta property="og:type" content="product">',
        '  <meta property="og:site_name" content="Mallow">',
        '  <meta property="og:title" content="' + escapeAttribute(context.title) + '">',
        '  <meta property="og:description" content="' + escapeAttribute(context.description) + '">',
        '  <meta property="og:url" content="' + escapeAttribute(context.canonicalUrl) + '">',
        context.imageUrl ? '  <meta property="og:image" content="' + escapeAttribute(context.imageUrl) + '">' : '',
        '  <meta name="twitter:card" content="summary_large_image">',
        '  <script type="application/ld+json">' + safeJson(structuredGraph) + '</script>'
    ].filter(Boolean).join('\n');
}

function buildBreadcrumbData(canonicalUrl, productName) {
    const rootUrl = canonicalUrl.replace(/\/producten\/[^/]+$/, '');
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: rootUrl + '/'
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Shop',
                item: rootUrl + '/shop.html'
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: String(productName || 'Product'),
                item: canonicalUrl
            }
        ]
    };
}

function buildShippingDetails() {
    return {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: ['NL', 'BE', 'DE']
        },
        shippingRate: {
            '@type': 'MonetaryAmount',
            value: '4.95',
            currency: 'EUR'
        },
        deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY'
            },
            transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 3,
                unitCode: 'DAY'
            }
        }
    };
}

function buildReturnPolicy(canonicalUrl) {
    const rootUrl = canonicalUrl.replace(/\/producten\/[^/]+$/, '');
    return {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'NL',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
        url: rootUrl + '/retouren.html'
    };
}
function buildFaqData(product) {
    if (!Array.isArray(product.faq) || !product.faq.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: product.faq.filter(function (item) {
            return item && item.q && item.a;
        }).map(function (item) {
            return {
                '@type': 'Question',
                name: String(item.q || ''),
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: String(item.a || '')
                }
            };
        })
    };
}

function buildFaqHtml(items) {
    return '<ul>' + items.filter(function (item) {
        return item && item.q && item.a;
    }).map(function (item) {
        return '<li><strong>' + escapeHtml(item.q) + '</strong><br><span>' + escapeHtml(item.a) + '</span></li>';
    }).join('') + '</ul>';
}
function buildAccordion(product) {
    const sections = [];
    if (product.description) sections.push(['Beschrijving', '<p>' + escapeHtml(product.description) + '</p>']);
    if (Array.isArray(product.benefits) && product.benefits.length) sections.push(['Voordelen in detail', buildList(product.benefits)]);
    if (Array.isArray(product.transparencyRows) && product.transparencyRows.length) {
        const rows = product.transparencyRows.map(function (row) {
            return '<li><strong>' + escapeHtml(row.ingredient || '') + '</strong><br>' +
                '<span>Herkomst: ' + escapeHtml(row.origin || '') + '</span><br>' +
                '<span>' + escapeHtml(row.function || '') + '</span></li>';
        }).join('');
        sections.push(['Ingrediënten & Herkomst', '<ul>' + rows + '</ul>']);
    }
    if (Array.isArray(product.usageSteps) && product.usageSteps.length) sections.push(['Gebruik', buildList(product.usageSteps)]);
    if (Array.isArray(product.faq) && product.faq.length) sections.push(['Veelgestelde vragen', buildFaqHtml(product.faq)]);

    return sections.map(function (section, index) {
        return '<div class="acc-item' + (index === 0 ? ' is-open' : '') + '">' +
            '<button class="acc-trigger"><span>' + escapeHtml(section[0]) + '</span><span class="acc-icon"></span></button>' +
            '<div class="acc-panel">' + section[1] + '</div></div>';
    }).join('');
}

function buildBenefits(items) {
    if (!Array.isArray(items)) return '';
    return items.slice(0, 3).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('');
}

function buildList(items) {
    return '<ul>' + items.filter(Boolean).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>';
}

function buildInitialImage(imageUrl, name) {
    if (!imageUrl) return '';
    return '<div class="carousel-slide"><img src="' + escapeAttribute(imageUrl) + '" alt="' + escapeAttribute(name || 'Product') + '" loading="eager"></div>';
}

function buildRatingText(product) {
    const rating = Number(product.ratingValue);
    if (!(rating > 0)) return '';
    return escapeHtml(String(rating).replace('.', ',') + '/5 (' + Number(product.ratingCount || 0) + ' reviews)');
}

function replaceElementContent(html, id, content) {
    const pattern = new RegExp('(<[^>]+id=["\\\']' + escapeRegExp(id) + '["\\\'][^>]*>)[\\s\\S]*?(<\\/[^>]+>)', 'i');
    return html.replace(pattern, '$1' + content + '$2');
}

function absoluteAssetUrl(value, baseUrl) {
    const source = String(value || '').trim();
    if (!source) return '';
    if (/^https?:\/\//i.test(source)) return source;
    return baseUrl + '/' + source.replace(/^\/+/, '');
}

function normalizeSlug(value) {
    return String(value || '').trim().toLowerCase();
}

function cleanDescription(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function formatEuro(value) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}

function safeJson(value) {
    return JSON.stringify(removeNulls(value)).replace(/</g, '\\u003c');
}

function removeNulls(value) {
    if (Array.isArray(value)) {
        return value.filter(function (item) { return item !== null && item !== undefined; }).map(removeNulls);
    }
    if (value && typeof value === 'object') {
        Object.keys(value).forEach(function (key) {
            if (value[key] === null || value[key] === undefined) {
                delete value[key];
            } else {
                value[key] = removeNulls(value[key]);
            }
        });
    }
    return value;
}
function removeUndefined(value) {
    Object.keys(value).forEach(function (key) {
        if (value[key] === undefined) delete value[key];
    });
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
    renderProductPage: renderProductPage,
    normalizeSlug: normalizeSlug
};
