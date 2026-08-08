
'use strict';

const DATA_URL = 'data/animals.json';
const ERROR_IMAGE = 'assets/image-error.svg';

// Template recipient. Change this value later if needed.
const FORM_RECIPIENT = 'fajri.250401010116@student.unsia.ac.id';

let animalsCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupThemePicker();
  setupMobileMenu();
  setupNavigation();
  setupYear();
  setupBackToTop();
  setupContactForm();
  setupQuiz();

  try {
    animalsCache = await loadAnimals();
    renderFeaturedAnimals();
    setupAnimalDirectory();
    populateAnimalFormOptions();
  } catch (error) {
    console.error(error);
    document.querySelectorAll('[data-animal-load-error]').forEach((node) => {
      node.classList.remove('hidden');
    });
  }
});

async function loadAnimals() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Gagal membaca ${DATA_URL}: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('animals.json harus berupa array.');
  return data;
}

function setupYear() {
  document.querySelectorAll('[data-current-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function setupNavigation() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((link) => {
    link.setAttribute('aria-current', 'page');
  });
}

function setupMobileMenu() {
  const button = document.querySelector('[data-mobile-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!button || !menu) return;

  button.addEventListener('click', () => {
    const hidden = menu.classList.toggle('hidden');
    button.setAttribute('aria-expanded', String(!hidden));
  });
}

function setupThemePicker() {
  const stored = localStorage.getItem('endangered-theme-color') || '#047857';
  applyTheme(stored);

  const pickers = [...document.querySelectorAll('[data-theme-picker]')];

  pickers.forEach((picker) => {
    picker.value = normalizeHex(stored);
    picker.addEventListener('input', () => {
      const color = picker.value;
      applyTheme(color);
      localStorage.setItem('endangered-theme-color', color);

      pickers.forEach((otherPicker) => {
        if (otherPicker !== picker) otherPicker.value = normalizeHex(color);
      });

      syncThemeButtons(color);
      syncCustomThemeSwatches(color);
    });
  });

  document.querySelectorAll('[data-theme-color]').forEach((button) => {
    button.addEventListener('click', () => {
      const color = button.dataset.themeColor;
      applyTheme(color);
      localStorage.setItem('endangered-theme-color', color);

      pickers.forEach((picker) => {
        picker.value = normalizeHex(color);
      });

      syncThemeButtons(color);
      syncCustomThemeSwatches(color);
    });
  });

  syncThemeButtons(stored);
  syncCustomThemeSwatches(stored);
}

function syncCustomThemeSwatches(color) {
  document.querySelectorAll('[data-custom-theme-swatch]').forEach((swatch) => {
    swatch.style.background = normalizeHex(color);
  });
}

function applyTheme(hex) {
  const normalized = normalizeHex(hex);
  const rgb = hexToRgb(normalized);
  const dark = mix(rgb, { r: 15, g: 23, b: 42 }, 0.30);
  const soft = mix(rgb, { r: 255, g: 255, b: 255 }, 0.90);
  const contrast = luminance(rgb) > 0.58 ? '#0f172a' : '#ffffff';

  const root = document.documentElement;
  root.style.setProperty('--theme', normalized);
  root.style.setProperty('--theme-dark', rgbToHex(dark));
  root.style.setProperty('--theme-soft', rgbToHex(soft));
  root.style.setProperty('--theme-contrast', contrast);
}

function syncThemeButtons(color) {
  const normalized = normalizeHex(color).toLowerCase();
  document.querySelectorAll('[data-theme-color]').forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(normalizeHex(button.dataset.themeColor).toLowerCase() === normalized)
    );
  });
}

function normalizeHex(hex) {
  const value = String(hex || '#047857').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return '#' + value.slice(1).split('').map((x) => x + x).join('');
  }
  return '#047857';
}

function hexToRgb(hex) {
  const value = normalizeHex(hex).slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('');
}

function mix(a, b, amount) {
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  };
}

function luminance({ r, g, b }) {
  const values = [r, g, b].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function renderFeaturedAnimals() {
  const container = document.querySelector('[data-featured-animals]');
  if (!container) return;
  container.innerHTML = animalsCache.slice(0, 3).map((animal) => createCard(animal)).join('');
  bindCardEvents(container);
}

function setupAnimalDirectory() {
  const grid = document.getElementById('animalGrid');
  if (!grid) return;

  const search = document.getElementById('animalSearch');
  const habitat = document.getElementById('habitatFilter');
  const group = document.getElementById('groupFilter');
  const status = document.getElementById('statusFilter');
  const clear = document.getElementById('clearFilters');

  fillSelect(habitat, uniqueValues('habitat'), 'Semua habitat');
  fillSelect(group, uniqueValues('group'), 'Semua kelompok');
  fillSelect(status, uniqueValues('status'), 'Semua status');

  const render = () => {
    const q = (search?.value || '').trim().toLocaleLowerCase('id-ID');
    const habitatValue = habitat?.value || '';
    const groupValue = group?.value || '';
    const statusValue = status?.value || '';

    const filtered = animalsCache.filter((animal) => {
      const haystack = [
        animal.name,
        animal.scientificName,
        animal.location,
        animal.habitat,
        animal.group,
      ].join(' ').toLocaleLowerCase('id-ID');

      return (!q || haystack.includes(q))
        && (!habitatValue || animal.habitat === habitatValue)
        && (!groupValue || animal.group === groupValue)
        && (!statusValue || animal.status === statusValue);
    });

    grid.innerHTML = filtered.map(createCard).join('');
    bindCardEvents(grid);

    const count = document.getElementById('resultCount');
    if (count) count.textContent = `${filtered.length} dari ${animalsCache.length} hewan`;

    const empty = document.getElementById('emptyState');
    if (empty) empty.classList.toggle('hidden', filtered.length > 0);
  };

  search?.addEventListener('input', render);
  habitat?.addEventListener('change', render);
  group?.addEventListener('change', render);
  status?.addEventListener('change', render);

  clear?.addEventListener('click', () => {
    if (search) search.value = '';
    if (habitat) habitat.value = '';
    if (group) group.value = '';
    if (status) status.value = '';
    render();
  });

  setupAnimalModal();
  render();

  const animalId = new URLSearchParams(window.location.search).get('animal');

  if (animalId) {
    openAnimalModal(animalId);
  }
}

function uniqueValues(key) {
  return [...new Set(animalsCache.map((animal) => animal[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'id')
  );
}

function fillSelect(select, values, firstLabel) {
  if (!select) return;
  select.innerHTML = `<option value="">${escapeHtml(firstLabel)}</option>`
    + values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
}

function createCard(animal) {
  const image = animal.image || ERROR_IMAGE;
  return `
    <article class="animal-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <figure class="relative">
        <img
          src="${escapeHtml(image)}"
          alt="${escapeHtml(animal.alt || animal.name)}"
          class="h-64 w-full object-cover"
          loading="lazy"
          data-fallback-image
        >
        <figcaption class="status-${escapeHtml(animal.statusKey)} absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-black">
          ${escapeHtml(animal.status)}
        </figcaption>
      </figure>
      <div class="p-6">
        <div class="mb-4 flex flex-wrap gap-2 text-xs font-bold">
          <span class="theme-soft theme-text rounded-full px-3 py-1">${escapeHtml(animal.group)}</span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-slate-600">${escapeHtml(animal.habitat)}</span>
        </div>
        <h3 class="text-xl font-black">${escapeHtml(animal.name)}</h3>
        <p class="mt-1 text-sm italic text-slate-500">${escapeHtml(animal.scientificName)}</p>
        <p class="mt-4 min-h-[84px] text-sm leading-7 text-slate-600">${escapeHtml(animal.summary)}</p>
        <button
          type="button"
          class="theme-ring theme-text mt-5 font-black hover:underline"
          data-details="${escapeHtml(animal.id)}"
        >
          Detail + media →
        </button>
      </div>
    </article>`;
}

function bindCardEvents(scope) {
  scope.querySelectorAll('[data-details]').forEach((button) => {
    button.addEventListener('click', () => openAnimalModal(button.dataset.details));
  });
  bindImageFallback(scope);
}

function bindImageFallback(scope = document) {
  scope.querySelectorAll('img[data-fallback-image]').forEach((img) => {
    if (img.dataset.fallbackBound === '1') return;
    img.dataset.fallbackBound = '1';
    img.addEventListener('error', () => {
      img.src = ERROR_IMAGE;
      img.classList.add('bg-slate-100', 'object-contain');
      img.alt = `Gambar ${img.alt || 'hewan'} tidak tersedia`;
    }, { once: true });
  });
}

function setupAnimalModal() {
  const modal = document.getElementById('animalModal');
  if (!modal) return;

  modal.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', closeAnimalModal);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeAnimalModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeAnimalModal();
    }
  });
}

function openAnimalModal(id) {
  const animal = animalsCache.find((item) => item.id === id);
  const modal = document.getElementById('animalModal');

  if (!animal) return;

  if (!modal) {
    window.location.href =
      `animals.html?animal=${encodeURIComponent(id)}`;
    return;
  }

  const content = modal.querySelector('[data-modal-content]');
  if (!content) return;

  content.innerHTML = `
    <div class="grid lg:grid-cols-[.85fr_1.15fr]">
      <div class="bg-slate-100">
        <img
          src="${escapeHtml(animal.image || ERROR_IMAGE)}"
          alt="${escapeHtml(animal.alt || animal.name)}"
          class="h-full min-h-[360px] w-full object-cover"
          data-fallback-image
        >
      </div>

      <div class="p-6 sm:p-8">
        <span class="status-${escapeHtml(animal.statusKey)} inline-flex rounded-full px-3 py-1 text-xs font-black">
          ${escapeHtml(animal.status)}
        </span>

        <h2 id="animalModalTitle" class="mt-4 text-3xl font-black">${escapeHtml(animal.name)}</h2>
        <p class="mt-1 italic text-slate-500">${escapeHtml(animal.scientificName)}</p>
        <p class="mt-5 leading-8 text-slate-600">${escapeHtml(animal.description)}</p>

        <dl class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-slate-50 p-4">
            <dt class="text-xs font-black uppercase tracking-wider text-slate-500">Habitat</dt>
            <dd class="mt-1 font-bold">${escapeHtml(animal.habitat)}</dd>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <dt class="text-xs font-black uppercase tracking-wider text-slate-500">Persebaran</dt>
            <dd class="mt-1 font-bold">${escapeHtml(animal.location)}</dd>
          </div>
        </dl>

        <div class="mt-7 grid gap-6 sm:grid-cols-2">
          <section>
            <h3 class="font-black text-rose-700">Ancaman utama</h3>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              ${(animal.threats || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>
          <section>
            <h3 class="theme-text font-black">Aksi konservasi</h3>
            <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              ${(animal.actions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </section>
        </div>

        <section class="mt-8">
          <h3 class="text-xl font-black">Multimedia</h3>
          <div class="mt-4 grid gap-5">
            ${renderVideo(animal.video)}
            ${renderAudio(animal.audio)}
          </div>
        </section>

        <div class="mt-7 flex flex-wrap gap-3">
          <a
            href="${escapeHtml(animal.source || '#')}"
            target="_blank"
            rel="noopener noreferrer"
            class="theme-bg theme-ring rounded-xl px-5 py-3 font-black"
          >
            Referensi hewan ↗
          </a>
        </div>
      </div>
    </div>`;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overflow-hidden');
  bindImageFallback(content);
  modal.querySelector('[data-close-modal]')?.focus();
}

function renderVideo(video) {
  if (video?.available && video.url) {
    return `
      <div class="rounded-2xl border border-slate-200 p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <strong>Video</strong>
          ${sourceLink(video)}
        </div>
        <video controls preload="metadata" class="aspect-video w-full rounded-xl bg-black">
          <source src="${escapeHtml(video.url)}" type="${escapeHtml(video.type || 'video/webm')}">
          Browser tidak mendukung video ini.
        </video>
        ${mediaNote(video)}
      </div>`;
  }

  return `
    <div class="rounded-2xl border border-slate-200 p-4">
      <strong>Video</strong>
      <div class="media-disabled mt-3" aria-disabled="true">
        <div>
          <div class="text-4xl">▶</div>
          <p class="mt-2 font-black">Video belum tersedia untuk spesies ini</p>
          <p class="mt-1 text-sm">${escapeHtml(video?.note || 'Media belum tersedia.')}</p>
        </div>
      </div>
    </div>`;
}

function renderAudio(audio) {
  if (audio?.available && audio.url) {
    return `
      <div class="rounded-2xl border border-slate-200 p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <strong>Audio</strong>
          ${sourceLink(audio)}
        </div>
        <audio controls preload="none" class="w-full">
          <source src="${escapeHtml(audio.url)}"${audio.type?.startsWith('audio/') ? ` type="${escapeHtml(audio.type)}"` : ''}>
          Browser tidak mendukung audio ini.
        </audio>
        ${mediaNote(audio)}
      </div>`;
  }

  return `
    <div class="rounded-2xl border border-slate-200 p-4">
      <strong>Audio</strong>
      <div class="media-disabled mt-3 min-h-[120px]" aria-disabled="true">
        <div>
          <div class="text-3xl">🔇</div>
          <p class="mt-2 font-black">Audio belum tersedia untuk spesies ini</p>
          <p class="mt-1 text-sm">${escapeHtml(audio?.note || 'Media belum tersedia.')}</p>
        </div>
      </div>
    </div>`;
}

function sourceLink(media) {
  if (!media?.sourcePage) return '';
  return `<a href="${escapeHtml(media.sourcePage)}" target="_blank" rel="noopener noreferrer" class="theme-text text-xs font-black hover:underline">Sumber media ↗</a>`;
}

function mediaNote(media) {
  const parts = [media?.note, media?.credit, media?.license].filter(Boolean);
  if (!parts.length) return '';
  return `<p class="mt-3 text-xs leading-5 text-slate-500">${parts.map(escapeHtml).join(' · ')}</p>`;
}

function stopModalMedia(modal) {
  modal.querySelectorAll('video, audio').forEach((media) => {
    media.pause();

    try {
      media.currentTime = 0;
    } catch (error) {
      // Ignore
    }

    media.load();
  });
}

function removeAnimalParam() {
  const url = new URL(window.location.href);

  if (!url.searchParams.has('animal')) return;

  url.searchParams.delete('animal');
  window.history.replaceState({}, '', url);
}

function closeAnimalModal() {
  const modal = document.getElementById('animalModal');
  if (!modal) return;

  stopModalMedia(modal);

  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overflow-hidden');

  removeAnimalParam();
}


function populateAnimalFormOptions() {
  const select = document.querySelector('[name="favoriteAnimal"]');
  if (!select || !animalsCache.length) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">Pilih hewan</option>' +
    animalsCache
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'id'))
      .map((animal) => `<option value="${escapeHtml(animal.name)}">${escapeHtml(animal.name)}</option>`)
      .join('');

  if (currentValue && animalsCache.some((animal) => animal.name === currentValue)) {
    select.value = currentValue;
  }
}

function setupContactForm() {
  const form = document.getElementById('participationForm');
  if (!form) return;

  const output = document.getElementById('formStatus');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    form.querySelectorAll('[required]').forEach((field) => {
      field.setAttribute('aria-invalid', String(!field.checkValidity()));
    });

    if (!form.checkValidity()) {
      if (output) {
        output.className = 'mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800';
        output.textContent = 'Form belum lengkap. Periksa kolom wajib terlebih dahulu.';
      }
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const activities = data.getAll('activities').join(', ') || '-';
    const body = [
      'FORM PARTISIPASI ENDANGERED WORLD',
      '',
      `Nama: ${data.get('name') || '-'}`,
      `Email: ${data.get('email') || '-'}`,
      `Tanggal lahir: ${data.get('birthDate') || '-'}`,
      `Hewan favorit: ${data.get('favoriteAnimal') || '-'}`,
      `Partisipasi: ${data.get('participation') || '-'}`,
      `Kegiatan: ${activities}`,
      `Pengalaman: ${data.get('experience') || '0'}`,
      '',
      'Pesan:',
      `${data.get('message') || '-'}`,
    ].join('\n');

    const subject = `Minat Partisipasi Endangered World - ${data.get('name') || 'Pengunjung'}`;
    const mailto = `mailto:${FORM_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (output) {
      output.className = 'mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-semibold text-slate-700';
      output.innerHTML = `Pesan Anda sudah disiapkan. Aplikasi email akan dibuka agar Anda dapat memeriksa kembali informasi sebelum mengirimnya.`;
    }

    window.location.href = mailto;
  });

  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.removeAttribute('aria-invalid'));
  });
}

function setupQuiz() {
  const form = document.getElementById('quizForm');
  const output = document.getElementById('quizResult');
  if (!form || !output) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const keys = { q1: 'b', q2: 'c', q3: 'a' };
    const score = Object.entries(keys).reduce(
      (sum, [question, answer]) => sum + (data.get(question) === answer ? 1 : 0),
      0
    );
    const total = Object.keys(keys).length;
    const message = score === total
      ? 'Bagus sekali. Semua jawaban Anda benar.'
      : score === total - 1
        ? 'Hampir sempurna. Coba periksa kembali satu jawaban yang masih keliru.'
        : 'Masih ada beberapa konsep yang perlu ditinjau kembali pada materi di atas.';

    output.classList.remove('hidden');
    output.innerHTML = `
      <strong>Skor Anda: ${score}/${total}</strong>
      <p>${message}</p>
    `;
  });
}

function setupBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;
  const update = () => button.classList.toggle('hidden', window.scrollY < 500);
  window.addEventListener('scroll', update, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  update();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
