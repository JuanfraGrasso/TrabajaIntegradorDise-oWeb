const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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

const storage = {
    get(key, fallback = null) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
    del(key) { localStorage.removeItem(key); }
};

function initTheme() {
    const saved = storage.get('theme') || 'light';
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const btn = $('#theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', saved === 'light');
    setBrandLogoForTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    storage.set('theme', next);
    const btn = $('#theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', next === 'light');
    setBrandLogoForTheme(next);
}

function setBrandLogoForTheme(theme) {
    const isDark = theme === 'dark';
    const lightSrc = 'images/logo.png';
    const darkSrc = 'images/logo_blanco.png';
    $$('.brand-img').forEach(img => {
        img.setAttribute('src', isDark ? darkSrc : lightSrc);
    });
}

function initNav() {
    const menu = $('.nav-links');
    const burger = $('#burger');
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
    $$('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (href.endsWith(path)) {
            a.setAttribute('aria-current', 'page');
        }
    });
}

function initToTop() {
    const btn = $('#to-top');
    if (!btn) return;
    const reveal = () => {
        if (window.scrollY > 400) btn.classList.add('visible'); else btn.classList.remove('visible');
    };
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initReveal() {
    const els = $$('.reveal');
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

let lastFocused = null;
function openModal(contentNode) {
    let backdrop = $('#modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.id = 'modal-backdrop';
        backdrop.innerHTML = `
			<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
				<header>
					<h3 id="modal-title">Vista</h3>
					<button class="btn-icon" id="modal-close" aria-label="Cerrar">✕</button>
				</header>
				<div class="content"></div>
			</div>`;
        document.body.appendChild(backdrop);
    }
    const content = backdrop.querySelector('.content');
    content.innerHTML = '';
    if (contentNode) content.appendChild(contentNode);
    lastFocused = document.activeElement;
    backdrop.classList.add('open');
    $('#modal-close')?.focus();
}
function closeModal() {
    const backdrop = $('#modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    if (lastFocused) lastFocused.focus();
}
on('click', '#modal-close', closeModal);
on('click', '#modal-backdrop', (e, el) => { if (e.target === el) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

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
    const track = $('.carousel-track');
    const slides = $$('.carousel-slide');
    const prev = $('.carousel .prev');
    const next = $('.carousel .next');
    if (!track || !slides.length) return;
    let index = 0;
    function update() { track.style.transform = `translateX(-${index * 100}%)`; }
    function go(dir) { index = (index + dir + slides.length) % slides.length; update(); }
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    let timer = setInterval(() => go(1), 5000);
    $('.carousel')?.addEventListener('mouseenter', () => clearInterval(timer));
    $('.carousel')?.addEventListener('mouseleave', () => timer = setInterval(() => go(1), 5000));
}

function textMatch(text, query) { return text.toLowerCase().includes(query.toLowerCase()); }

function initLocales() {
    if (!isOnPage('locales')) return;
    const search = $('#search-locales');
    const category = $('#filter-categoria');
    const results = $('#lista-locales');
    const empty = $('#locales-empty');
    if (!results) return;
    const cards = $$('.card[data-nombre]');
    const apply = () => {
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

function initOfertas() {
    if (!isOnPage('ofertas')) return;
    const search = $('#search-ofertas');
    const sort = $('#sort-ofertas');
    const min = $('#min-precio');
    const max = $('#max-precio');
    const cards = $$('.card[data-precio]');
    const empty = $('#ofertas-empty');

    function apply() {
        const q = search?.value.trim() || '';
        const minV = Number(min?.value || 0);
        const maxV = Number(max?.value || 999999);
        let filtered = cards.filter(c => {
            const precio = Number(c.dataset.precio || 0);
            const nombre = c.dataset.nombre || '';
            return (!q || textMatch(nombre, q)) && precio >= minV && precio <= maxV;
        });
        const mode = sort?.value || 'relevancia';
        if (mode === 'precio-asc') filtered.sort((a, b) => Number(a.dataset.precio) - Number(b.dataset.precio));
        if (mode === 'precio-desc') filtered.sort((a, b) => Number(b.dataset.precio) - Number(a.dataset.precio));
        cards.forEach(c => c.style.display = 'none');
        filtered.forEach(c => c.style.display = 'grid');
        if (empty) empty.hidden = filtered.length !== 0;
    }
    [search, sort, min, max].forEach(el => el?.addEventListener(el?.tagName === 'SELECT' ? 'change' : 'input', apply));
    apply();
}

function initContacto() {
    if (!isOnPage('contacto')) return;
    const form = $('#contacto-form');
    if (!form) return;
    const key = 'contacto-draft-v1';

    const draft = storage.get(key, {});
    Object.entries(draft).forEach(([name, val]) => {
        const el = form.elements.namedItem(name);
        if (el && 'value' in el) el.value = val;
        if (el && el.type === 'checkbox') el.checked = Boolean(val);
    });

    form.addEventListener('input', () => {
        const data = Object.fromEntries(new FormData(form).entries());
        data['acepto'] = form.elements['acepto']?.checked || false;
        storage.set(key, data);
    });

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

    $$('#contacto-form input, #contacto-form textarea, #contacto-form select').forEach(el => {
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
        storage.del(key);
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

document.addEventListener('DOMContentLoaded', () => {
    document.body.dataset.page = getPageSlug();
    $$('#year').forEach(el => el.textContent = new Date().getFullYear());

    initTheme();
    initNav();
    initToTop();
    initReveal();
    initAccordion();
    initGallery();
    initCarousel();
    initLocales();
    initOfertas();
    initContacto();
    initNewsletter();

    $('#theme-toggle')?.addEventListener('click', toggleTheme);
});

