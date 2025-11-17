const storage = {
    get(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    del(key) { localStorage.removeItem(key); }
};

function getPageSlug() {
    const file = (location.pathname.split('/').pop() || 'index.html');
    return file.replace('.html', '');
}

function on(type, sel, handler, opts) {
    document.addEventListener(type, (e) => {
        const target = e.target.closest(sel);
        if (target) handler(e, target);
    }, opts);
}

function isOnPage(id) {
    return (document.body.dataset.page === id) || (getPageSlug() === id);
}

function initTheme() {
    const saved = storage.get('theme') || 'light';
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.querySelector('#theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', saved === 'light');
    setBrandLogoForTheme(theme);
}

function toggleTheme() {
    const current = storage.get('theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    storage.set('theme', next);
    const btn = document.querySelector('#theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', next === 'light');
    setBrandLogoForTheme(next);
}

function setBrandLogoForTheme(theme) {
    const isDark = theme === 'dark';
    const lightSrc = 'images/logo_nuevo.png';
    const darkSrc = 'images/logo_nuevo_blanco.png';
    Array.from(document.querySelectorAll('.brand-img')).forEach(img => {
        img.setAttribute('src', isDark ? darkSrc : lightSrc);
    });
}

function initNav() {
    const menu = document.querySelector('.nav-links');
    const burger = document.querySelector('#burger');
    if (!menu || !burger) return;
    burger.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', open);
    });
    on('click', '.nav-links a', () => {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            burger.setAttribute('aria-expanded', false);
        }
    });
    const path = location.pathname.split('/').pop() || 'index.html';
    Array.from(document.querySelectorAll('.nav-links a')).forEach(a => {
        const href = a.getAttribute('href');
        if (href.endsWith(path)) {
            a.setAttribute('aria-current', 'page');
        }
    });
}

function initReveal() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
            if (en.isIntersecting) {
                en.target.classList.add('visible');
                io.unobserve(en.target);
            }
        });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    els.forEach(el => io.observe(el));
}

function initAccordion() {
    if (!isOnPage('servicios')) return;
    on('click', '.accordion-header', (e, btn) => {
        const item = btn.closest('.accordion-item');
        if (!item) return;
        const open = item.hasAttribute('open');
        if (open) item.removeAttribute('open'); else item.setAttribute('open', '');
        const panel = item.querySelector('.accordion-panel');
        btn.setAttribute('aria-expanded', String(!open));
        if (panel) panel.hidden = open;
    });
}

function openModal(contentNode) {
    let backdrop = document.querySelector('#modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'modal-backdrop';
        backdrop.innerHTML = `
			<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
				<header id="modal-btn-header">
					<button class="btn-icon" id="modal-close" aria-label="Cerrar">✕</button>
				</header>
				<div class="content"></div>
			</div>`;
        document.body.appendChild(backdrop);
    }
    const content = backdrop.querySelector('.content');
    content.innerHTML = '';
    if (contentNode) content.appendChild(contentNode);
    backdrop.classList.add('open');
}

function closeModal() {
    const backdrop = document.querySelector('#modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
}

function initGallery() {
    if (!isOnPage('gastronomia')) return;
    on('click', '.gallery .item', (e, item) => {
        const img = item.querySelector('img');
        const node = document.createElement('div');
        node.title = img?.alt || '';
        node.innerHTML = `<img src="${img?.src || ''}" alt="${img?.alt || ''}">`;
        openModal(node);
    });
}

function initCarousel() {
    if (!isOnPage('entretenimientos')) return;
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prev = document.querySelector('.carousel .prev');
    const next = document.querySelector('.carousel .next');
    const dots = Array.from(document.querySelectorAll('.carousel-indicators button'));

    if (!track || !slides.length) return;
    let index = 0;

    function update() {
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    }

    function go(dir) { 
        index = (index + dir + slides.length) % slides.length; update(); 
    }

    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    dots.forEach((btn, i) => btn.addEventListener('click', () => { index = i; update(); }));
    update();
}

function textMatch(text, query) 
{ return text.toLowerCase().includes(query.toLowerCase()); 

}

function initLocales() {
    if (!isOnPage('locales')) return;
    const search = document.querySelector('#search-locales');
    const category = document.querySelector('#filter-categoria');
    const results = document.querySelector('#lista-locales');
    const empty = document.querySelector('#locales-empty');

    if (!results) return;
    const cards = Array.from(document.querySelectorAll('.card[data-nombre]'));
    function apply() {
        const q = search?.value.trim() || '';
        const cat = category?.value || '';
        let visible = 0;
        cards.forEach(card => {
            const nombre = card.dataset.nombre || '';
            const rubro = card.dataset.rubro || '';
            const ok = (!q || textMatch(nombre, q)) && (!cat || rubro === cat);
            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
    };
    search?.addEventListener('input', apply);
    category?.addEventListener('change', apply);
    apply();
}

function initLocalesMap() {
    if (!isOnPage('locales')) return;
    on('click', '.btn-ubicacion', (e, btn) => {
        const x = parseFloat(btn.dataset.x || '50');
        const y = parseFloat(btn.dataset.y || '50');
        const nombre = btn.dataset.nombre || 'Ubicación';
        const node = document.createElement('div');
        node.className = 'map-view';
        node.innerHTML = `
            <img src="images/mapa.png" alt="Mapa de la galería" />
            <div class="map-marker" style="left:${x}%; top:${y}%;"></div>
            <div class="map-label" style="left:${x}%; top:${y}%;">${nombre}</div>
        `;
        openModal(node);
        const title = document.querySelector('#modal-title');
        if (title) title.textContent = 'Mapa';
    });
}

function initOfertas() {
    if (!isOnPage('ofertas')) return;
    const search = document.querySelector('#search-ofertas');
    const min = document.querySelector('#min-precio');
    const max = document.querySelector('#max-precio');
    const cards = Array.from(document.querySelectorAll('.card[data-precio]'));
    const empty = document.querySelector('#ofertas-empty');

    function apply() {
        const q = search?.value.trim() || '';
        const minV = Number(min?.value || 0);
        const maxV = Number(max?.value || 999999);
        let visible = 0;
        cards.forEach(card => {
            const precio = Number(card.dataset.precio) || '';
            const nombre = card.dataset.nombre || '';
            const ok = (!q || textMatch(nombre, q)) && precio >= minV && precio <= maxV;;
            card.style.display = ok ? '' : 'none';
            if (ok) visible++;
        });
        if (empty) empty.hidden = visible !== 0;
    }
    [search, min, max].forEach(el => el?.addEventListener(el?.tagName === 'SELECT' ? 'change' : 'input', apply));
    apply();
}

function initContacto() {
    if (!isOnPage('contacto')) return;
    const form = document.querySelector('#contacto-form');
    if (!form) return;
    
    function showError(input, msg) {
        input.classList.add('is-invalid');
        let box = input.closest('.field')?.querySelector('.error-msg');
        if (box) box.textContent = msg;
    }
    function clearError(input) {
        input.classList.remove('is-invalid');
        let box = input.closest('.field')?.querySelector('.error-msg');
        if (box) box.textContent = '';
    }

    Array.from(document.querySelectorAll('#contacto-form input, #contacto-form textarea, #contacto-form select')).forEach(el => {
        el.addEventListener('input', () => clearError(el));
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let ok = true;
        const nombre = form.elements['nombre'];
        const email = form.elements['email'];
        const telefono = form.elements['telefono'];
        const motivo = form.elements['motivo'];
        const mensaje = form.elements['mensaje'];
        const acepto = form.elements['acepto'];

        if (!nombre.value.trim()) { showError(nombre, 'Ingresá tu nombre.'); ok = false; }
        if (!email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { showError(email, 'Email inválido.'); ok = false; }
        if (telefono.value && !telefono.value.match(/^[0-9\s()+-]{6,}$/)) { showError(telefono, 'Teléfono inválido.'); ok = false; }
        if (!motivo.value) { showError(motivo, 'Seleccioná un motivo.'); ok = false; }
        if (mensaje.value.trim().length < 10) { showError(mensaje, 'El mensaje debe tener al menos 10 caracteres.'); ok = false; }
        if (!acepto.checked) { showError(acepto, 'Debés aceptar los términos.'); ok = false; }

        if (!ok) return;
        form.reset();
        const node = document.createElement('div');
        node.innerHTML = '<p>¡Gracias por contactarte! Te responderemos a la brevedad.</p>';
        openModal(node);
    });
}

function initNewsletter() {
    on('submit', 'form[data-newsletter]', (e, form) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]');
        if (!email?.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            email?.classList.add('is-invalid');
            form.querySelector('.error-msg')?.replaceChildren(document.createTextNode('Email inválido.'));
            return;
        }
        
        form.reset();
        const node = document.createElement('div');
        node.innerHTML = '<p>Suscripción realizada con éxito.</p>';
        openModal(node);
    });
}

function initChatbot() {
    if (!isOnPage('contacto')) return;
    const chat = document.querySelector('#chatbot');
    const win = document.querySelector('#chat-window');
    const form = document.querySelector('#chat-form');
    const input = document.querySelector('#chat-input');
    if (!chat || !win || !form || !input) return;

    const optionsText = (
        'Elegí una opción:\n' +
        '1) Locales\n' +
        '2) Horarios\n' +
        '3) Ubicación\n' +
        '4) Ofertas\n' +
        '5) Gastronomía\n' +
        '6) Entretenimientos\n' +
        '7) Servicios\n' +
        '8) Contacto'
    );

    const responses = {
        stores: 'Podés ver todos los locales en <a href="locales.html">Locales</a>. Usá el buscador por nombre o rubro para filtrar.',
        hours: 'Horarios: Lunes a Domingo de 10 a 22 hs.',
        location: 'Estamos en Av. Principal 123, Ciudad. Cómo llegar: Colectivos 15, 43, 72 • Subte: Línea C (Est. Centro).',
        offers: 'Encontrá las promociones vigentes en <a href="ofertas.html">Ofertas</a>. Podés filtrar por precio y ordenar.',
        food: 'Descubrí propuestas de <a href="gastronomia.html">Gastronomía</a> con una galería de imágenes ampliables.',
        fun: 'Mirá <a href="entretenimientos.html">Entretenimientos</a> con carrusel de actividades.',
        services: 'Consultá <a href="servicios.html">Servicios</a> y abrí los detalles en el acordeón.',
        contact: 'Escribinos por <a href="contacto.html">este formulario</a> o a <a href="mailto:contacto@galeriaurbana.test">contacto@galeriaurbana.test</a>.'
    };

    const mapToKey = (txt) => {
        const t = (txt || '').trim().toLowerCase();
        if (['1', 'locales', 'tiendas', 'negocios'].includes(t)) return 'stores';
        if (['2', 'horarios', 'horario', 'hours'].includes(t)) return 'hours';
        if (['3', 'ubicacion', 'ubicación', 'direccion', 'dirección', 'mapa', 'location'].includes(t)) return 'location';
        if (['4', 'ofertas', 'promo', 'promociones'].includes(t)) return 'offers';
        if (['5', 'gastronomia', 'gastronomía', 'comida', 'food'].includes(t)) return 'food';
        if (['6', 'entretenimientos', 'entretenimiento', 'ocio', 'fun'].includes(t)) return 'fun';
        if (['7', 'servicios', 'service', 'services'].includes(t)) return 'services';
        if (['8', 'contacto', 'contact', 'email'].includes(t)) return 'contact';
        return null;
    };

    function addMsg(text, from = 'bot', asHTML = false) {
        const div = document.createElement('div');
        div.className = `chat-msg ${from === 'user' ? 'from-user' : 'from-bot'}`;
        if (asHTML) div.innerHTML = text; else div.textContent = text;
        win.appendChild(div);
        win.scrollTop = win.scrollHeight;
    }

    function showMenu() {
        addMsg('Hola, soy tu asistente virtual. Puedo ayudarte con información del centro.');
        addMsg(optionsText);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value;
        if (!val.trim()) return;
        addMsg(val, 'user');
        const key = mapToKey(val);
        if (!key) {
            addMsg('Opción no válida. Probá nuevamente con el número o la palabra clave.');
            addMsg(optionsText);
        } else {
            addMsg(responses[key], 'bot', true);
            addMsg('¿Querés consultar otra cosa?');
            addMsg(optionsText);
        }
        input.value = '';
        input.focus();
    });

    showMenu();
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.dataset.page = getPageSlug();
    Array.from(document.querySelectorAll('#year')).forEach(el => el.textContent = new Date().getFullYear());

    initTheme();
    initNav();
    initReveal();
    initAccordion();
    initGallery();
    initCarousel();
    initLocales();
    initLocalesMap();
    initOfertas();
    initContacto();
    initChatbot();
    initNewsletter();

    document.querySelector('#theme-toggle')?.addEventListener('click', toggleTheme);

    on('click', '#modal-close', closeModal);
    on('click', '#modal-backdrop', (e, el) => { if (e.target === el) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

});

