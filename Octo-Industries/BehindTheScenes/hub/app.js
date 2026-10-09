let games = Array.isArray(window.OCTO_GAMES) ? [...window.OCTO_GAMES] : [];
let byId = new Map(games.map((game) => [game.id, game]));
const grid = document.querySelector('#game-grid');
const searchInput = document.querySelector('#game-search');
const homeSearchInput = document.querySelector('#home-game-search');
const categoryList = document.querySelector('#category-list');
const topCategoryList = document.querySelector('#top-category-list');
const resultSummary = document.querySelector('#results-summary');
const emptyState = document.querySelector('#empty-state');
const recentList = document.querySelector('#recent-list');
const recentlyAddedList = document.querySelector('#recently-added-list');
const trendingGrid = document.querySelector('#trending-grid');
const homeTrendingPreview = document.querySelector('#home-trending-preview');
const homeAddedPreview = document.querySelector('#home-added-preview');
const homeLibraryGrid = document.querySelector('#home-library-grid');
const comingGrid = document.querySelector('#coming-grid');
const newsGrid = document.querySelector('#news-grid');
let roadmapItems = [];
let featuredGames = games.filter((game) => game.featured);
let slides = featuredGames.length ? featuredGames : games;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let activeCategory = 'All';
let slideIndex = 0;
let searchTimer;
let activeGallery;
let galleryIndex = 0;
const gamesPerPage = 15;
let currentPage = 1;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function readRecent() {
  try {
    const stored = JSON.parse(localStorage.getItem('octo-industries.recent') || '[]');
    return Array.isArray(stored) ? stored.filter((id) => byId.has(id)) : [];
  } catch {
    return [];
  }
}

function readPlayCounts() {
  try {
    const stored = JSON.parse(localStorage.getItem('octo-industries.play-counts') || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function markPlayed(game) {
  try {
    const recent = [game.id, ...readRecent().filter((id) => id !== game.id)].slice(0, 3);
    localStorage.setItem('octo-industries.recent', JSON.stringify(recent));
    const playCounts = readPlayCounts();
    playCounts[game.id] = (Number(playCounts[game.id]) || 0) + 1;
    localStorage.setItem('octo-industries.play-counts', JSON.stringify(playCounts));
  } catch {
    return;
  }
}

function imageMarkup(game, className, contain = false) {
  if (!game.thumbnail) return '';
  return `<img class="${className}" data-game-id="${escapeHtml(game.id)}" src="${escapeHtml(game.thumbnail)}" alt="" loading="${className === 'featured-image' ? 'eager' : 'lazy'}"${contain ? ' data-contain="true"' : ''}>`;
}

function categories() {
  const counts = new Map();
  for (const game of games) counts.set(game.category, (counts.get(game.category) || 0) + 1);
  const options = [['All', games.length], ...[...counts.entries()].sort(([first], [second]) => first.localeCompare(second))];
  const markup = options.map(([name, count]) => `
    <button class="category-chip${activeCategory === name ? ' is-active' : ''}" type="button" data-category="${escapeHtml(name)}" aria-pressed="${activeCategory === name}">
      ${escapeHtml(name === 'All' ? 'All games' : name)} <span>${String(count).padStart(2, '0')}</span>
    </button>`).join('');
  if (categoryList) categoryList.innerHTML = markup;
  if (topCategoryList) topCategoryList.innerHTML = options.map(([name, count]) => `
    <button class="top-category-pill${activeCategory === name ? ' is-active' : ''}" type="button" data-category="${escapeHtml(name)}" aria-pressed="${activeCategory === name}">
      ${escapeHtml(name === 'All' ? 'All' : name)} <span>${String(count).padStart(2, '0')}</span>
    </button>`).join('');
}

function gameCard(game, index, localPlayCount = null) {
  const tags = [game.category, ...(game.tags || [])].filter((tag, position, list) => list.indexOf(tag) === position).slice(0, 2);
  const hasThumbnail = Boolean(game.thumbnail);
  const hasGallery = Array.isArray(game.screenshots) && game.screenshots.length > 0;
  return `
    <article class="game-card" style="animation-delay:${Math.min(index * 45, 225)}ms" data-game-id="${escapeHtml(game.id)}">
      <a class="game-art" data-category="${escapeHtml(game.category)}" href="${escapeHtml(game.launch)}" data-launch-id="${escapeHtml(game.id)}" aria-label="Play ${escapeHtml(game.title)}">
        ${hasThumbnail ? imageMarkup(game, 'game-image') : `<span class="art-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>`}
        ${localPlayCount !== null ? `<span class="trend-indicator">${localPlayCount} local plays</span>` : ''}
        <span class="art-live"><i></i> READY TO PLAY</span><span class="art-category">${escapeHtml(game.category.toUpperCase())}</span>
      </a>
      <div class="game-card-copy">
        <div><div class="game-heading-line"><h3>${escapeHtml(game.title)}</h3><span class="category-label">${escapeHtml(game.category.toUpperCase())}</span></div><p class="game-description">${escapeHtml(game.description)}</p></div>
        <div class="game-card-foot"><div class="game-tags">${tags.map((tag) => `<span class="game-tag">#${escapeHtml(tag.toLowerCase())}</span>`).join('')}</div><div class="game-card-actions">${hasGallery ? `<button class="gallery-link" type="button" data-gallery-id="${escapeHtml(game.id)}" aria-label="View ${escapeHtml(game.title)} screenshots">IMAGES</button>` : ''}<a class="play-link" href="${escapeHtml(game.launch)}" data-launch-id="${escapeHtml(game.id)}"><span aria-hidden="true">▶</span> PLAY</a></div></div>
      </div>
    </article>`;
}

function renderGalleryImage() {
  if (!activeGallery) return;
  const image = document.querySelector('#gallery-image');
  const screenshot = activeGallery.screenshots[galleryIndex];
  image.src = screenshot;
  image.alt = `${activeGallery.title} gameplay screenshot ${galleryIndex + 1}`;
  document.querySelector('#gallery-caption').textContent = `Screenshot ${galleryIndex + 1} of ${activeGallery.screenshots.length}`;
  document.querySelector('#gallery-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(activeGallery.screenshots.length).padStart(2, '0')}`;
  document.querySelectorAll('#gallery-thumbnails [data-gallery-index]').forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === galleryIndex));
  });
  document.querySelector('#gallery-previous').disabled = activeGallery.screenshots.length < 2;
  document.querySelector('#gallery-next').disabled = activeGallery.screenshots.length < 2;
}

function openGallery(game) {
  if (!Array.isArray(game.screenshots) || !game.screenshots.length) return;
  activeGallery = game;
  galleryIndex = 0;
  document.querySelector('#gallery-title').textContent = game.title;
  document.querySelector('#gallery-thumbnails').innerHTML = game.screenshots.map((screenshot, index) => `
    <button type="button" data-gallery-index="${index}" aria-label="Show screenshot ${index + 1}" aria-pressed="${index === 0}">
      <img src="${escapeHtml(screenshot)}" alt="" loading="lazy">
    </button>`).join('');
  renderGalleryImage();
  document.querySelector('#screenshot-gallery').showModal();
  document.querySelector('#gallery-close').focus();
}

function getMatches() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return games.filter((game) => {
    const categoryMatch = activeCategory === 'All' || game.category === activeCategory;
    const searchIndex = [game.title, game.category, game.description, ...(game.tags || [])].join(' ').toLocaleLowerCase();
    return categoryMatch && (!query || searchIndex.includes(query));
  });
}

function renderGames() {
  const matches = getMatches();
  const sorting = document.querySelector('#game-sort').value;
  matches.sort((first, second) => {
    if (sorting === 'title-desc') return second.title.localeCompare(first.title);
    if (sorting === 'category') return first.category.localeCompare(second.category) || first.title.localeCompare(second.title);
    if (sorting === 'recent') return (Date.parse(second.addedAt || '') || 0) - (Date.parse(first.addedAt || '') || 0) || first.title.localeCompare(second.title);
    return first.title.localeCompare(second.title);
  });

  const totalPages = Math.max(1, Math.ceil(matches.length / gamesPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const offset = (currentPage - 1) * gamesPerPage;
  const pageMatches = matches.slice(offset, offset + gamesPerPage);
  const pagination = document.querySelector('#game-pagination');
  const pageStatus = document.querySelector('#page-status');
  const previousButton = document.querySelector('#games-previous');
  const nextButton = document.querySelector('#games-next');

  grid.innerHTML = pageMatches.map((game, index) => gameCard(game, index)).join('');
  grid.hidden = matches.length === 0;
  emptyState.hidden = matches.length > 0;
  grid.setAttribute('aria-busy', 'false');
  resultSummary.textContent = matches.length === games.length && activeCategory === 'All' && !searchInput.value.trim()
    ? `${games.length} games, all ready to play`
    : `${matches.length} ${matches.length === 1 ? 'game' : 'games'} found`;
  document.querySelector('#search-clear').hidden = !searchInput.value;

  const showPagination = matches.length > gamesPerPage;
  pagination.hidden = !showPagination;
  if (pageStatus) {
    pageStatus.textContent = showPagination ? `Page ${currentPage} of ${totalPages}` : 'Page 1 of 1';
  }
  if (previousButton) previousButton.disabled = currentPage <= 1;
  if (nextButton) nextButton.disabled = currentPage >= totalPages;
}

function renderRecent() {
  const recent = readRecent().map((id) => byId.get(id)).filter(Boolean);
  document.querySelector('#recent-empty').hidden = recent.length > 0;
  recentList.innerHTML = recent.map((game) => `
    <a class="recent-item" href="${escapeHtml(game.launch)}" data-launch-id="${escapeHtml(game.id)}">
      <span class="recent-thumb">${game.thumbnail ? imageMarkup(game, 'recent-image') : escapeHtml(game.title.slice(0, 1))}</span>
      <span class="recent-copy"><b>${escapeHtml(game.title)}</b><span>${escapeHtml(game.category)} · Quick Resume</span></span>
      <span class="recent-go" aria-hidden="true">RESUME</span>
    </a>`).join('');
}

function renderHomeOverview() {
  const categoryCount = new Set(games.map((game) => game.category).filter(Boolean)).size;
  const playCounts = readPlayCounts();
  const trendingCount = games.filter((game) => Number(playCounts[game.id]) > 0).length;
  const recentCount = readRecent().length;
  document.querySelector('#home-total-games').textContent = games.length;
  document.querySelector('#home-ready-count').textContent = games.length;
  document.querySelector('#home-category-count').textContent = categoryCount;
  document.querySelector('#home-trending-count').textContent = trendingCount;
  document.querySelector('#home-continue-count').textContent = recentCount;
  document.querySelector('#home-browse-count').textContent = games.length;
}

function gamePreviewRow(game, detail) {
  return `<a class="home-game-row" href="${escapeHtml(game.launch)}" data-launch-id="${escapeHtml(game.id)}" aria-label="Play ${escapeHtml(game.title)}">
    <span class="home-game-thumb">${game.thumbnail ? imageMarkup(game, 'recent-image') : escapeHtml(game.title.slice(0, 1))}</span>
    <span class="home-game-copy"><b>${escapeHtml(game.title)}</b><span>${escapeHtml(detail)}</span></span>
    <span class="home-game-action" aria-hidden="true">PLAY</span>
  </a>`;
}

function gameAddedDate(game) {
  const value = game.addedAt || game.publishedAt || game.createdAt;
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function renderTrending() {
  if (!trendingGrid) return;
  const playCounts = readPlayCounts();
  const rankedGames = [...games].sort((first, second) =>
    (Number(playCounts[second.id]) || 0) - (Number(playCounts[first.id]) || 0)
    || Number(second.featured) - Number(first.featured)
    || first.title.localeCompare(second.title));
  trendingGrid.innerHTML = rankedGames.length
    ? rankedGames.slice(0, 24).map((game, index) => gameCard(game, index, Number(playCounts[game.id]) || 0)).join('')
    : '<p class="view-empty">No games are available right now.</p>';
  if (homeTrendingPreview) {
    homeTrendingPreview.innerHTML = rankedGames.slice(0, 4)
      .map((game) => gamePreviewRow(game, `${Number(playCounts[game.id]) || 0} local plays · ${game.category}`)).join('');
  }
}

function renderHomeLibrary() {
  if (!homeLibraryGrid) return;
  const picks = [...games].sort((first, second) => Number(second.featured) - Number(first.featured) || first.title.localeCompare(second.title));
  homeLibraryGrid.innerHTML = picks.slice(0, 10).map((game, index) => gameCard(game, index)).join('');
}

function renderRecentlyAdded() {
  const recentGames = games.filter((game) => gameAddedDate(game) > 0)
    .sort((first, second) => gameAddedDate(second) - gameAddedDate(first))
    .slice(0, 6);
  document.querySelector('#recently-added-empty').hidden = recentGames.length > 0;
  recentlyAddedList.innerHTML = recentGames.map((game) => `
    <a class="recent-item" href="${escapeHtml(game.launch)}" data-launch-id="${escapeHtml(game.id)}">
      <span class="recent-thumb">${game.thumbnail ? imageMarkup(game, 'recent-image') : escapeHtml(game.title.slice(0, 1))}</span>
      <span class="recent-copy"><b>${escapeHtml(game.title)}</b><span>${escapeHtml(game.category)} · Added ${escapeHtml(new Date(gameAddedDate(game)).toLocaleDateString())}</span></span>
      <span class="recent-go" aria-hidden="true">↗</span>
    </a>`).join('');
  if (homeAddedPreview) {
    homeAddedPreview.innerHTML = recentGames
      .map((game) => gamePreviewRow(game, `${game.category} · Added ${new Date(gameAddedDate(game)).toLocaleDateString()}`)).join('');
    document.querySelector('#home-added-empty').hidden = recentGames.length > 0;
  }
}

const roadmapStatusLabels = {
  idea: 'Idea', planned: 'Planned', 'in-progress': 'In Progress', testing: 'Testing', 'on-hold': 'On Hold',
};

function roadmapCard(item) {
  return `<article class="coming-card">
    <div class="coming-card-top"><span class="roadmap-status-badge" data-status="${escapeHtml(item.status)}">${escapeHtml(roadmapStatusLabels[item.status] || item.status)}</span><span class="coming-category">${escapeHtml(item.category)}</span></div>
    <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
    <time datetime="${escapeHtml(item.updatedAt)}">Updated ${escapeHtml(new Date(item.updatedAt).toLocaleDateString())}</time>
  </article>`;
}

function roadmapPreviewRow(item) {
  return `<article class="home-roadmap-row"><span class="roadmap-status-badge" data-status="${escapeHtml(item.status)}">${escapeHtml(roadmapStatusLabels[item.status] || item.status)}</span><b>${escapeHtml(item.title)}</b><time datetime="${escapeHtml(item.updatedAt)}">${escapeHtml(new Date(item.updatedAt).toLocaleDateString())}</time></article>`;
}

function renderRoadmapViews() {
  const activeItems = roadmapItems.filter((item) => !['released', 'archived'].includes(item.status))
    .sort((first, second) => Date.parse(second.updatedAt || '') - Date.parse(first.updatedAt || ''));
  const newsItems = activeItems.filter((item) => item.category === 'content');
  const comingItems = activeItems.filter((item) => item.category !== 'content');
  if (newsGrid) newsGrid.innerHTML = newsItems.length ? newsItems.map(roadmapCard).join('') : '<p class="view-empty">No news right now.</p>';
  if (comingGrid) comingGrid.innerHTML = comingItems.length ? comingItems.map(roadmapCard).join('') : '<p class="view-empty">No upcoming items right now.</p>';
  const latestUpdate = newsItems[0];
  document.querySelector('#home-update-module').hidden = !latestUpdate;
  document.querySelector('#home-update-preview').innerHTML = latestUpdate ? roadmapPreviewRow(latestUpdate) : '';
  const updateLink = document.querySelector('#home-update-link');
  const updateView = 'news';
  updateLink.href = `/?view=${updateView}`;
  updateLink.dataset.hubView = updateView;
  updateLink.textContent = updateView === 'news' ? 'View news' : 'View roadmap';
  document.querySelector('#home-roadmap-module').hidden = comingItems.length === 0;
  document.querySelector('#home-roadmap-preview').innerHTML = comingItems.slice(0, 2).map(roadmapPreviewRow).join('');
}

function setDrawerOpen(open) {
  const menuToggle = document.querySelector('#menu-toggle');
  document.querySelector('#primary-nav').classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
  document.querySelector('#nav-backdrop').hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close Hub menu' : 'Open Hub menu');
}

const hubViewMetadata = {
  home: { title: 'Octo Industries | Game Hub', description: 'Continue playing, browse featured games, or find your next game in the Octo Industries Hub.' },
  games: { title: 'Games | Octo Industries', description: 'Search and filter the Octo Industries game collection by category, title, and tag.' },
  trending: { title: 'Trending Games | Octo Industries', description: 'Browse games ranked by plays recorded on this device in the Octo Industries Hub.' },
  'recently-added': { title: 'Recently Added | Octo Industries', description: 'Find newly added games in the Octo Industries game collection.' },
  news: { title: 'News | Octo Industries', description: 'Read the latest Octo Industries game hub news and announcements.' },
  'coming-soon': { title: 'Coming Soon | Octo Industries', description: 'See upcoming games and updates planned for Octo Industries.' },
  about: { title: 'About | Octo Industries', description: 'Learn about Octo Industries, an independent gaming platform created by Mr. Octo.' },
  contact: { title: 'Contact | Octo Industries', description: 'Contact Mr. Octo about Octo Industries, partnerships, suggestions, or issues.' },
};

function updateHubMetadata(view) {
  const metadata = hubViewMetadata[view];
  const viewUrl = new URL(window.location.href);
  viewUrl.searchParams.set('view', view);
  const canonicalUrl = new URL(window.location.pathname, window.location.origin);
  if (view !== 'home') canonicalUrl.searchParams.set('view', view);
  document.title = metadata.title;
  document.querySelector('meta[name="description"]').content = metadata.description;
  document.querySelector('meta[property="og:title"]').content = metadata.title;
  document.querySelector('meta[property="og:description"]').content = metadata.description;
  document.querySelector('meta[property="og:url"]').content = canonicalUrl.href;
  document.querySelector('link[rel="canonical"]').href = canonicalUrl.href;
}

function setHubView(name, { focusSearch = false, focusHeading = false, focusTarget = '', pushState = false } = {}) {
  const panels = [...document.querySelectorAll('[data-hub-panel]')];
  const view = panels.some((panel) => panel.dataset.hubPanel === name) ? name : 'games';
  const currentView = new URLSearchParams(window.location.search).get('view') || 'home';
  if (pushState && currentView !== view) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('view', view);
    window.history.pushState({ view }, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  }
  panels.forEach((panel) => { panel.hidden = panel.dataset.hubPanel !== view; });
  document.querySelectorAll('#primary-nav [data-hub-view]').forEach((button) => {
    const active = button.dataset.hubView === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  updateHubMetadata(view);
  setDrawerOpen(false);
  requestAnimationFrame(() => {
    if (focusSearch) searchInput.focus({ preventScroll: true });
    else if (focusTarget) document.querySelector(focusTarget)?.focus({ preventScroll: true });
    else if (focusHeading) panels.find((panel) => panel.dataset.hubPanel === view)?.querySelector('h1')?.focus({ preventScroll: true });
  });
}

function renderFeatured() {
  if (!slides.length) return;
  const game = slides[slideIndex];
  const featureArt = document.querySelector('#featured-art');
  featureArt.innerHTML = `${game.thumbnail ? imageMarkup(game, 'featured-image') : '<span class="feature-orbit"></span><span class="feature-spark"></span>'}`;
  featureArt.dataset.category = game.category;
  document.querySelector('#featured-title').textContent = game.title;
  document.querySelector('#featured-description').textContent = game.description;
  document.querySelector('#featured-category').textContent = `${game.category.toUpperCase()} / FEATURED GAME`;
  document.querySelector('#feature-count').innerHTML = `${String(slideIndex + 1).padStart(2, '0')} <b>/ ${String(slides.length).padStart(2, '0')}</b>`;
  document.querySelector('#feature-index').textContent = String(slideIndex + 1).padStart(2, '0');
  document.querySelector('#featured-play').href = game.launch;
  document.querySelector('#featured-play').dataset.launchId = game.id;
  document.querySelector('#featured-play').setAttribute('aria-label', `Play featured game: ${game.title}`);
  document.querySelector('#feature-progress').innerHTML = slides.map((_, index) => `<i class="${index === slideIndex ? 'is-active' : ''}"></i>`).join('');
}

function showSlide(offset) {
  slideIndex = (slideIndex + offset + slides.length) % slides.length;
  renderFeatured();
}

function bindEvents() {
  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.gameId) return;
    const game = byId.get(image.dataset.gameId);
    image.remove();
    if (image.classList.contains('game-image')) {
      const fallback = document.createElement('span');
      fallback.className = 'art-index';
      fallback.setAttribute('aria-hidden', 'true');
      fallback.textContent = String(games.indexOf(game) + 1).padStart(2, '0');
      image.closest('.game-art').prepend(fallback);
    } else if (image.classList.contains('featured-image')) {
      const orbit = document.createElement('span');
      orbit.className = 'feature-orbit';
      const spark = document.createElement('span');
      spark.className = 'feature-spark';
      image.closest('.featured-art').append(orbit, spark);
    } else if (image.classList.contains('recent-image')) {
      image.closest('.recent-thumb').textContent = game?.title.slice(0, 1) || '?';
    }
  }, true);

  const categoryButtons = [categoryList, topCategoryList].filter(Boolean);
  categoryButtons.forEach((list) => {
    list.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      if (list === topCategoryList) setHubView('games', { pushState: true, focusHeading: true });
      activeCategory = button.dataset.category;
      currentPage = 1;
      categories();
      renderGames();
    });
  });

  const updateSearch = (event) => {
    searchInput.value = event.currentTarget.value;
    homeSearchInput.value = searchInput.value;
    currentPage = 1;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(renderGames, reducedMotion ? 0 : 70);
  };
  searchInput.addEventListener('input', updateSearch);
  homeSearchInput.addEventListener('input', updateSearch);
  document.querySelector('#home-search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    searchInput.value = homeSearchInput.value;
    renderGames();
    setHubView('games', { pushState: true, focusSearch: true });
  });
  document.querySelector('#game-sort').addEventListener('change', () => {
    currentPage = 1;
    renderGames();
  });

  document.querySelector('#games-previous').addEventListener('click', () => {
    currentPage = Math.max(1, currentPage - 1);
    renderGames();
  });
  document.querySelector('#games-next').addEventListener('click', () => {
    const matches = getMatches();
    const totalPages = Math.max(1, Math.ceil(matches.length / gamesPerPage));
    currentPage = Math.min(totalPages, currentPage + 1);
    renderGames();
  });

  document.querySelector('#search-clear').addEventListener('click', () => {
    searchInput.value = '';
    homeSearchInput.value = '';
    searchInput.focus();
    currentPage = 1;
    renderGames();
  });

  document.querySelector('#clear-filters').addEventListener('click', () => {
    activeCategory = 'All';
    searchInput.value = '';
    homeSearchInput.value = '';
    currentPage = 1;
    categories();
    renderGames();
    searchInput.focus();
  });

  document.querySelectorAll('[data-hub-view]').forEach((button) => button.addEventListener('click', (event) => {
    if (button.tagName === 'A') event.preventDefault();
    setHubView(button.dataset.hubView, { pushState: true, focusHeading: true, focusTarget: button.dataset.focusTarget || '' });
  }));
  document.querySelector('[data-hub-action="search"]').addEventListener('click', () => setHubView('games', { focusSearch: true, focusHeading: false, pushState: true }));

  document.querySelector('#feature-previous').addEventListener('click', () => showSlide(-1));
  document.querySelector('#feature-next').addEventListener('click', () => showSlide(1));

  document.querySelector('#gallery-close').addEventListener('click', () => {
    document.querySelector('#screenshot-gallery').close();
  });
  document.querySelector('#gallery-previous').addEventListener('click', () => {
    if (!activeGallery) return;
    galleryIndex = (galleryIndex - 1 + activeGallery.screenshots.length) % activeGallery.screenshots.length;
    renderGalleryImage();
  });
  document.querySelector('#gallery-next').addEventListener('click', () => {
    if (!activeGallery) return;
    galleryIndex = (galleryIndex + 1) % activeGallery.screenshots.length;
    renderGalleryImage();
  });
  document.querySelector('#gallery-thumbnails').addEventListener('click', (event) => {
    const thumbnail = event.target.closest('[data-gallery-index]');
    if (!thumbnail || !activeGallery) return;
    galleryIndex = Number(thumbnail.dataset.galleryIndex);
    renderGalleryImage();
  });
  document.querySelector('#screenshot-gallery').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });

  let touchStart;
  document.querySelector('#featured-frame').addEventListener('touchstart', (event) => {
    touchStart = event.changedTouches[0].clientX;
  }, { passive: true });
  document.querySelector('#featured-frame').addEventListener('touchend', (event) => {
    if (touchStart === undefined) return;
    const difference = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(difference) > 54) showSlide(difference < 0 ? 1 : -1);
    touchStart = undefined;
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const gallery = event.target.closest('[data-gallery-id]');
    if (gallery && byId.has(gallery.dataset.galleryId)) {
      openGallery(byId.get(gallery.dataset.galleryId));
      return;
    }
    const launch = event.target.closest('[data-launch-id]');
    if (launch && byId.has(launch.dataset.launchId)) {
      markPlayed(byId.get(launch.dataset.launchId));
      renderTrending();
    }
    if (event.target.closest('#primary-nav a')) setDrawerOpen(false);
  });

  const menuToggle = document.querySelector('#menu-toggle');
  menuToggle.addEventListener('click', () => setDrawerOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
  document.querySelector('#nav-backdrop').addEventListener('click', () => {
    setDrawerOpen(false);
    menuToggle.focus();
  });

  document.addEventListener('keydown', (event) => {
    if (document.querySelector('#screenshot-gallery').open && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      galleryIndex = (galleryIndex + (event.key === 'ArrowRight' ? 1 : -1) + activeGallery.screenshots.length) % activeGallery.screenshots.length;
      renderGalleryImage();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setHubView('games', { focusSearch: true, pushState: true });
    }
    if (event.key === 'Escape') {
      const drawerWasOpen = document.querySelector('#menu-toggle').getAttribute('aria-expanded') === 'true';
      setDrawerOpen(false);
      if (drawerWasOpen) document.querySelector('#menu-toggle').focus();
      const focusedSearch = document.activeElement === searchInput || document.activeElement === homeSearchInput;
      if (focusedSearch && (searchInput.value || homeSearchInput.value)) {
        searchInput.value = '';
        homeSearchInput.value = '';
        renderGames();
      }
    }
  });
  window.addEventListener('popstate', () => {
    setHubView(new URLSearchParams(window.location.search).get('view') || 'home');
  });

}

function browserDeviceInfo() {
  const ua = navigator.userAgent || '';
  const platform = navigator.userAgentData?.platform || navigator.platform || '';
  const deviceType = navigator.userAgentData?.mobile
    ? 'Mobile'
    : /iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? 'Tablet'
      : 'Desktop';
  const operatingSystem = /Windows/i.test(platform + ua) ? 'Windows'
    : /Android/i.test(platform + ua) ? 'Android'
      : /iPhone|iPad|iPod|iOS/i.test(platform + ua) ? 'iOS'
        : /Mac OS|Macintosh/i.test(platform + ua) ? 'macOS'
          : /Linux/i.test(platform + ua) ? 'Linux' : 'Unknown';
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
      : /SamsungBrowser\//.test(ua) ? 'Samsung Internet'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Chrome\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) ? 'Safari' : 'Unknown';
  return {
    deviceType,
    operatingSystem,
    browser,
    screenResolution: Number.isFinite(screen.width) && Number.isFinite(screen.height)
      ? `${screen.width} × ${screen.height}` : '',
    octoVersion: document.querySelector('meta[name="octo-version"]')?.content || window.OCTO_BUILD_VERSION || '',
  };
}

function bindFeedbackForm() {
  const dialog = document.querySelector('#feedback-dialog');
  const form = document.querySelector('#feedback-form');
  const type = document.querySelector('#feedback-type');
  const game = document.querySelector('#feedback-game');
  const gameLabel = document.querySelector('#feedback-game-label');
  const status = document.querySelector('#feedback-status');
  for (const entry of games) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.title;
    game.append(option);
  }
  const open = () => {
    setDrawerOpen(false);
    dialog.showModal();
  };
  document.querySelectorAll('#feedback-open, [data-feedback-open]').forEach((button) => button.addEventListener('click', open));
  document.querySelector('#feedback-close').addEventListener('click', () => dialog.close());
  document.querySelector('#feedback-cancel').addEventListener('click', () => dialog.close());
  type.addEventListener('change', () => {
    const isIssue = type.value === 'issue';
    game.hidden = !isIssue;
    gameLabel.hidden = !isIssue;
    if (!isIssue) game.value = '';
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = document.querySelector('#feedback-submit');
    button.disabled = true;
    status.hidden = false;
    status.textContent = 'Sending your feedback…';
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          type: type.value,
          gameId: game.value,
          message: document.querySelector('#feedback-message').value,
          deviceInfo: browserDeviceInfo(),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Could not send feedback. Please try again.');
      form.reset();
      game.hidden = true;
      gameLabel.hidden = true;
      status.textContent = 'Thanks — your feedback was sent.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

function drawAmbient() {
  const canvas = document.querySelector('#ambient');
  const context = canvas?.getContext('2d');
  if (!context || reducedMotion) return;
  let width = 0;
  let height = 0;
  let previousFrame = 0;
  let pointer = { x: -1000, y: -1000 };
  const particles = [];

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.25);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const amount = Math.min(34, Math.max(16, Math.round(width * height / 41000)));
    particles.length = 0;
    for (let index = 0; index < amount; index += 1) {
      particles.push({ x: Math.random() * width, y: Math.random() * height, dx: (Math.random() - .5) * .19, dy: -.08 - Math.random() * .14, radius: 0.7 + Math.random() * 1.4 });
    }
  }

  function frame(time) {
    if (document.hidden) {
      requestAnimationFrame(frame);
      return;
    }
    if (time - previousFrame < 32) {
      requestAnimationFrame(frame);
      return;
    }
    previousFrame = time;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < 125) {
        particle.x -= dx / distance * .12;
        particle.y -= dy / distance * .12;
      }
      particle.x += particle.dx;
      particle.y += particle.dy;
      if (particle.y < -6) { particle.y = height + 6; particle.x = Math.random() * width; }
      if (particle.x < -6) particle.x = width + 6;
      if (particle.x > width + 6) particle.x = -6;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fillStyle = 'rgba(93, 207, 226, .40)';
      context.fill();
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  requestAnimationFrame(frame);
}

function start() {
  const bootScreen = document.querySelector('#boot-screen');
  bindFeedbackForm();
  requestAnimationFrame(() => bootScreen?.classList.add('is-ready'));
  window.setTimeout(() => bootScreen?.remove(), 550);

  if (!games.length) {
    grid.hidden = true;
    emptyState.hidden = false;
    emptyState.querySelector('h3').textContent = 'The collection is offline.';
    emptyState.querySelector('p').textContent = 'Run npm --prefix Octo-Industries/BehindTheScenes run sync to discover games and build the local catalog.';
    resultSummary.textContent = 'No game catalog found';
  } else {
    document.querySelector('#header-count').textContent = String(games.length).padStart(2, '0');
    document.querySelector('#library-count').innerHTML = `${String(games.length).padStart(2, '0')} GAMES IN THE COLLECTION <span>↘</span>`;
    categories();
    renderFeatured();
    renderGames();
    renderRecent();
    renderTrending();
    drawAmbient();
  }
  renderHomeOverview();
  renderRecentlyAdded();
  renderHomeLibrary();
  bindEvents();
}

async function loadPublicCatalog() {
  const response = await fetch('/api/catalog', { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status}).`);
  const catalog = await response.json();
  if (!Array.isArray(catalog)) throw new Error('The server returned an invalid game catalog.');
  games = catalog;
  byId = new Map(games.map((game) => [game.id, game]));
  featuredGames = games.filter((game) => game.featured);
  slides = featuredGames.length ? featuredGames : games;
  slideIndex = 0;
}

async function loadRoadmap() {
  try {
    const response = await fetch('/api/roadmap', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Roadmap request failed (${response.status}).`);
    const roadmap = await response.json();
    if (!Array.isArray(roadmap)) throw new Error('The server returned an invalid roadmap.');
    roadmapItems = roadmap;
  } catch (error) {
    console.error('Unable to load the public roadmap.', error);
    roadmapItems = [];
  }
  renderRoadmapViews();
}

const initialHubView = new URLSearchParams(window.location.search).get('view') || 'home';
setHubView(initialHubView);

Promise.all([
  loadPublicCatalog().catch((error) => console.error('Unable to load the live game catalog; using the generated catalog instead.', error)),
  loadRoadmap(),
]).finally(start);