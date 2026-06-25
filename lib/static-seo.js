const ARTICLE_DATES = {
    'insights-huidverzorging.html': '2026-04-02',
    'insights-rundervet.html': '2026-04-02',
    'insights-eczeem.html': '2026-04-02'
};

const PAGE_SEO = {
    'index.html': {
        title: 'Mallow | Zachte botanische verzorging',
        description: 'Mallow maakt zachte botanische huidverzorging met zorgvuldig gekozen ingredienten voor dagelijkse rust, comfort en hydratatie.',
        path: '/',
        type: 'website',
        image: 'hero foto vervanger.png',
        structuredData: function (context) {
            return [
                {
                    '@context': 'https://schema.org',
                    '@type': 'Organization',
                    name: 'Mallow',
                    url: context.baseUrl,
                    logo: context.baseUrl + '/hero%20foto%20vervanger.png'
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebSite',
                    name: 'Mallow',
                    url: context.baseUrl,
                    inLanguage: 'nl-NL',
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: context.baseUrl + '/shop.html?q={search_term_string}',
                        'query-input': 'required name=search_term_string'
                    }
                }
            ];
        }
    },
    'shop.html': {
        title: 'Shop | Mallow',
        description: 'Bekijk de verzorgingsproducten van Mallow: zachte balsems, cremes en zepen voor een rustige dagelijkse routine.',
        path: '/shop.html',
        type: 'website',
        image: 'FOTO honing balsem banner concept.png',
        collection: 'products'
    },
    'cart.html': {
        title: 'Winkelwagen | Mallow',
        description: 'Controleer je Mallow winkelwagen en rond je bestelling veilig af.',
        path: '/cart.html',
        type: 'website'
    },
    'blog.html': {
        title: 'Insights | Mallow',
        description: 'Lees rustige, praktische artikelen van Mallow over huidverzorging, ingredienten en eenvoudige routines.',
        path: '/blog.html',
        type: 'website'
    },
    'insights.html': {
        title: 'Insights | Mallow',
        description: 'Een overzicht van Mallow artikelen over huid, ingredienten en zachte verzorgingsroutines.',
        path: '/insights.html',
        type: 'website',
        collection: 'articles'
    },
    'insights-huidverzorging.html': {
        title: 'Welke stoffen in gewone huidverzorging kunnen je huid onrustig maken? | Mallow',
        description: 'Een nuchtere uitleg over geurstoffen, harde reinigers en drukke routines, zodat je zachtere keuzes kunt maken voor je huid.',
        path: '/insights-huidverzorging.html',
        type: 'article',
        articleSection: 'Educatie'
    },
    'insights-rundervet.html': {
        title: 'Waarom kiezen sommige mensen voor rundervet op de huid? | Mallow',
        description: 'Over korte ingredientenlijsten, rijke balsems en waarom eenvoud voor een droge huid vaak prettiger voelt dan een drukke routine.',
        path: '/insights-rundervet.html',
        type: 'article',
        articleSection: 'Ingredienten'
    },
    'insights-eczeem.html': {
        title: 'Een rustigere huid bij eczeem: drie zachte gewoontes | Mallow',
        description: 'Drie zachte dagelijkse gewoontes die kunnen helpen om prikkels te verlagen en de huidbarriere meer rust te geven.',
        path: '/insights-eczeem.html',
        type: 'article',
        articleSection: 'Eczeem'
    },
    'onze-visie.html': {
        title: 'Onze visie | Mallow',
        description: 'Lees waar Mallow voor staat: eenvoudige verzorging, eerlijke ingredienten en een zachte benadering van huid en routine.',
        path: '/onze-visie.html',
        type: 'website'
    },
    'onze-samenwerkingen.html': {
        title: 'Onze samenwerkingen | Mallow',
        description: 'Ontdek hoe Mallow kijkt naar lokale ingredienten, betrouwbare partners en transparante herkomst.',
        path: '/onze-samenwerkingen.html',
        type: 'website'
    },
    'privacy.html': {
        title: 'Privacybeleid | Mallow',
        description: 'Lees hoe Mallow omgaat met persoonsgegevens, bestellingen en privacy.',
        path: '/privacy.html',
        type: 'website',
        noindex: true
    },
    'retouren.html': {
        title: 'Retourbeleid | Mallow',
        description: 'Lees hoe retourneren, ruilen en herroepingsrecht bij Mallow werken.',
        path: '/retouren.html',
        type: 'website'
    },
    'verzending.html': {
        title: 'Verzendbeleid | Mallow',
        description: 'Lees meer over verzendkosten, levertijden en bezorging van Mallow bestellingen.',
        path: '/verzending.html',
        type: 'website'
    },
    'voorwaarden.html': {
        title: 'Algemene voorwaarden | Mallow',
        description: 'Bekijk de algemene voorwaarden voor aankopen en gebruik van de Mallow website.',
        path: '/voorwaarden.html',
        type: 'website',
        noindex: true
    }
};

function renderStaticPage(options) {
    const html = String(options && options.html ? options.html : '');
    const fileName = String(options && options.fileName ? options.fileName : '');
    const baseUrl = String(options && options.baseUrl ? options.baseUrl : '').replace(/\/+$/, '');
    const meta = PAGE_SEO[fileName];
    if (!html || !meta || !baseUrl || !/\.html$/i.test(fileName)) {
        return html;
    }

    const title = meta.title || 'Mallow';
    const canonicalUrl = baseUrl + meta.path;
    const imageUrl = meta.image ? absoluteAssetUrl(meta.image, baseUrl) : '';
    const additions = buildHeadTags({
        meta: meta,
        title: title,
        canonicalUrl: canonicalUrl,
        imageUrl: imageUrl,
        baseUrl: baseUrl,
        products: options.products || {}
    });

    return html
        .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>')
        .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
        .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
        .replace('</head>', additions + '\n</head>');
}

function buildHeadTags(context) {
    const meta = context.meta;
    const type = meta.type === 'article' ? 'article' : 'website';
    const tags = [
        '    <meta name="description" content="' + escapeAttribute(meta.description) + '">',
        meta.noindex ? '    <meta name="robots" content="noindex,follow">' : '',
        '    <link rel="canonical" href="' + escapeAttribute(context.canonicalUrl) + '">',
        '    <meta property="og:type" content="' + type + '">',
        '    <meta property="og:site_name" content="Mallow">',
        '    <meta property="og:title" content="' + escapeAttribute(context.title) + '">',
        '    <meta property="og:description" content="' + escapeAttribute(meta.description) + '">',
        '    <meta property="og:url" content="' + escapeAttribute(context.canonicalUrl) + '">',
        context.imageUrl ? '    <meta property="og:image" content="' + escapeAttribute(context.imageUrl) + '">' : '',
        '    <meta name="twitter:card" content="' + (context.imageUrl ? 'summary_large_image' : 'summary') + '">',
        '    <script type="application/ld+json">' + safeJson(buildStructuredData(context)) + '</script>'
    ];

    return tags.filter(Boolean).join('\n');
}

function buildStructuredData(context) {
    const meta = context.meta;
    if (meta.collection === 'products') {
        return buildCollectionPage(context, 'Onze producten', buildProductItems(context));
    }
    if (meta.collection === 'articles') {
        return buildCollectionPage(context, 'Mallow insights', buildArticleItems(context));
    }
    if (typeof meta.structuredData === 'function') {
        return meta.structuredData(context);
    }

    if (meta.type === 'article') {
        const articleFile = meta.path.replace(/^\//, '');
        const articleDate = ARTICLE_DATES[articleFile] || '2026-04-02';
        return {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: meta.title.replace(/\s+\|\s+Mallow$/i, ''),
            description: meta.description,
            url: context.canonicalUrl,
            inLanguage: 'nl-NL',
            articleSection: meta.articleSection,
            author: {
                '@type': 'Organization',
                name: 'Mallow'
            },
            publisher: {
                '@type': 'Organization',
                name: 'Mallow',
                url: context.baseUrl
            },
            datePublished: articleDate,
            dateModified: articleDate
        };
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: meta.title,
        description: meta.description,
        url: context.canonicalUrl,
        inLanguage: 'nl-NL',
        isPartOf: {
            '@type': 'WebSite',
            name: 'Mallow',
            url: context.baseUrl
        }
    };
}

function buildCollectionPage(context, name, items) {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: name,
            description: context.meta.description,
            url: context.canonicalUrl,
            inLanguage: 'nl-NL',
            isPartOf: {
                '@type': 'WebSite',
                name: 'Mallow',
                url: context.baseUrl
            },
            mainEntity: {
                '@type': 'ItemList',
                itemListElement: items
            }
        },
        buildBreadcrumbData(context.baseUrl, [
            { name: 'Home', url: context.baseUrl + '/' },
            { name: context.meta.path === '/shop.html' ? 'Shop' : 'Insights', url: context.canonicalUrl }
        ])
    ];
}

function buildProductItems(context) {
    return Object.keys(context.products || {}).map(function (productId, index) {
        const product = context.products[productId];
        const slug = String(product && (product.slug || product.id) ? (product.slug || product.id) : '').toLowerCase();
        return {
            '@type': 'ListItem',
            position: index + 1,
            url: context.baseUrl + '/producten/' + encodeURIComponent(slug),
            name: String(product && product.name ? product.name : productId)
        };
    }).filter(function (item) { return item.url.indexOf('/producten/') > -1; });
}

function buildArticleItems(context) {
    const articles = [
        { name: 'Welke stoffen in gewone huidverzorging kunnen je huid onrustig maken?', url: '/insights-huidverzorging.html' },
        { name: 'Waarom kiezen sommige mensen voor rundervet op de huid?', url: '/insights-rundervet.html' },
        { name: 'Een rustigere huid bij eczeem: drie zachte gewoontes', url: '/insights-eczeem.html' }
    ];
    return articles.map(function (article, index) {
        return {
            '@type': 'ListItem',
            position: index + 1,
            url: context.baseUrl + article.url,
            name: article.name
        };
    });
}

function buildBreadcrumbData(baseUrl, items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map(function (item, index) {
            return {
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url
            };
        })
    };
}
function getSitemapStaticPages() {
    return Object.keys(PAGE_SEO)
        .map(function (fileName) {
            const meta = PAGE_SEO[fileName];
            return {
                path: meta.path,
                priority: meta.path === '/' ? '1.0' : (meta.type === 'article' ? '0.7' : '0.6'),
                changefreq: meta.type === 'article' ? 'monthly' : 'weekly',
                noindex: Boolean(meta.noindex)
            };
        })
        .filter(function (entry) { return !entry.noindex; });
}

function absoluteAssetUrl(value, baseUrl) {
    const source = String(value || '').trim();
    if (!source) return '';
    if (/^https?:\/\//i.test(source)) return source;
    return baseUrl + '/' + source.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
}

function safeJson(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
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

module.exports = {
    renderStaticPage: renderStaticPage,
    getSitemapStaticPages: getSitemapStaticPages
};
