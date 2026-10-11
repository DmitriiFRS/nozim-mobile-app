(() => {
  'use strict';
  const STORAGE_KEY = 'folio.prototype.v1';
  const app = document.querySelector('#app');
  const seed = () => JSON.parse(JSON.stringify(window.FOLIO_SEED));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon = name => html`<img class="icon" src="assets/icons/${name}.svg" alt="" aria-hidden="true">`;
  const t = text => window.FolioI18n.text(text);
  const html = (strings,...values) => strings.reduce((result,part,index) => result + window.FolioI18n.literal(part) + (values[index] ?? ''),'');
  let storageWarning = '';
  let state = seed();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const value = JSON.parse(saved);
      if (!value.profile || !Array.isArray(value.works) || !Array.isArray(value.certificates) || typeof value.profile.name !== 'string' || value.works.some(work => !work || typeof work.id !== 'string' || typeof work.title !== 'string') || value.certificates.some(cert => !cert || typeof cert.id !== 'string')) throw new Error('Invalid saved data');
      state = value;
    }
  } catch { storageWarning = 'Сохранённые данные недоступны. Загружен демонстрационный профиль.'; }
  // Existing browser data predates configurable tabs. Preserve it and add defaults.
  function normalizeTabs(tabs) {
    const defaults = seed().profileTabs;
    if (!Array.isArray(tabs)) return defaults;
    const result = [], ids = new Set();
    for (const tab of tabs) {
      if (!tab || typeof tab.id !== 'string' || ids.has(tab.id)) continue;
      const builtin = defaults.find(item => item.id === tab.id);
      if (!builtin && (tab.type !== 'custom' || !/^custom-[a-z0-9-]+$/i.test(tab.id))) continue;
      ids.add(tab.id);
      result.push({id:tab.id,type:builtin?.type || 'custom',title:String(tab.title || builtin?.title || 'Новая вкладка').slice(0,32),enabled:tab.enabled !== false,content:String(tab.content || '').slice(0,3000)});
    }
    defaults.forEach(tab => {if (!ids.has(tab.id)) result.push(tab);});
    if (!result.some(tab => tab.enabled && tab.type !== 'certificates')) result.find(tab => tab.id === 'works').enabled = true;
    return result;
  }
  state.profileTabs = normalizeTabs(state.profileTabs);
  state.products = Array.isArray(state.products) ? state.products.filter(item=>item && typeof item.id === 'string' && typeof item.title === 'string') : [];
  state.productCategories = Array.isArray(state.productCategories) ? state.productCategories.filter(item=>item && typeof item.id === 'string' && typeof item.name === 'string') : [];
  if (!Array.isArray(state.reviews)) state.reviews = seed().reviews;
  // Migrate category names from existing work without changing saved portfolio content.
  function normalizeCategories() {
    const categories = [], ids = new Set(), names = new Set();
    for (const item of Array.isArray(state.categories) ? state.categories : []) {
      if (!item || typeof item.id !== 'string' || !/^category-[a-z0-9-]+$/i.test(item.id) || ids.has(item.id)) continue;
      const name = String(item.name || '').trim().slice(0,80);
      if (!name || names.has(name.toLocaleLowerCase())) continue;
      categories.push({id:item.id,name}); ids.add(item.id); names.add(name.toLocaleLowerCase());
    }
    state.works.forEach(work => {
      let category = categories.find(item => item.id === work.categoryId);
      const name = String(work.category || '').trim().slice(0,80);
      if (!category && name) category = categories.find(item => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      if (!category && name) {
        let index = categories.length + 1;
        while (ids.has('category-'+index)) index++;
        category = {id:'category-'+index,name}; categories.push(category); ids.add(category.id);
      }
      work.categoryId = category?.id || ''; work.category = category?.name || '';
    });
    state.categories = categories;
  }
  normalizeCategories();
  let categoriesDraft = null;
  let cleanupGlass = () => {};
  let cleanupGallery = () => {};
  let cleanupRichText = () => {};
  let workDraft = null;
  let toastTimer;
  let activeFilter = 'all';
  let productFilter = 'all';
  const currencies = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('currency') : ['USD','EUR','GBP','UZS','RUB','KZT','AED','TRY','CNY','JPY','CHF','CAD','AUD','INR'];
  const stockLabels = {available:'В наличии',order:'Под заказ',unavailable:'Нет в наличии'};
  const productPrice = product => Number(product.price).toLocaleString(window.FolioI18n.language,{style:'currency',currency:currencies.includes(product.currency) ? product.currency : 'USD',currencyDisplay:'code'});
  let route = 'home';
  let authDraft = {email:'',step:'email',mode:'',sentAt:0};
  const AUTH_KEY = 'folio.demo-session.v1';
  const hasDemoSession = () => { try { return localStorage.getItem(AUTH_KEY) === 'active'; } catch { return false; } };
  function completeDemoAuth() {
    try { localStorage.setItem(AUTH_KEY,'active'); } catch {}
    location.hash = route === 'signup' ? 'create-profile' : 'home';
    toast('Демонстрационный вход выполнен');
  }
  let pendingUploads = {};
  let tabsDraft = null;
  let lastRenderedHash = null;
  let workReturnHash = '#home';
  try {
    const savedReturn = sessionStorage.getItem('folio.work-return');
    if (/^#(home|settings|works|products|create|about|reviews|certificates|product\/[a-z0-9-]+|work\/[a-z0-9-]+|section\/custom-[a-z0-9-]+)$/i.test(savedReturn || '')) workReturnHash = savedReturn;
  } catch { /* Return navigation still works when browser storage is unavailable. */ }
  const publishedCertificates = () => state.certificates.filter(item => item.published === true);
  const reviews = () => state.reviews.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string' && item.text.trim() && Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5);
  const reviewCountLabel = count => window.FolioI18n.language === 'en' ? `${count} ${count === 1 ? 'review' : 'reviews'}` : `${count} ${count % 10 === 1 && count % 100 !== 11 ? 'отзыв' : count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14) ? 'отзыва' : 'отзывов'}`;
  const ratingAverage = () => (reviews().reduce((sum,item)=>sum+item.rating,0)/reviews().length).toLocaleString(window.FolioI18n.language,{minimumFractionDigits:1,maximumFractionDigits:1});
  const visibleProfileTabs = () => state.profileTabs.filter(tab => tab.enabled && (tab.type !== 'certificates' || publishedCertificates().length > 0) && (tab.type !== 'reviews' || reviews().length > 0) && (tab.type !== 'products' || state.products.length > 0) && (tab.type !== 'works' || state.works.length > 0));
  const tabHref = tab => tab.type === 'custom' ? html`#section/${tab.id}` : html`#${tab.type}`;
  const displayTabTitle = tab => tab.title === seed().profileTabs.find(item => item.id === tab.id)?.title ? t(tab.title) : tab.title;
  const tabTitle = (type,fallback) => { const tab = state.profileTabs.find(item => item.type === type); return tab ? displayTabTitle(tab) : t(fallback); };
  function profileSectionLink(tab) {
    const symbol = ({works:'photo',products:'package',about:'user',certificates:'certificate',reviews:'star',custom:'external-link'})[tab.type];
    const count = tab.type === 'products' ? state.products.length : tab.type === 'works' ? state.works.length : tab.type === 'certificates' ? publishedCertificates().length : tab.type === 'reviews' ? reviews().length : null;
    return html`<a href="${tabHref(tab)}" data-profile-tab="${tab.id}" class="glass-button profile-section-link" data-glass><span class="section-symbol">${icon(symbol)}</span><span class="section-name">${esc(displayTabTitle(tab))}</span>${count !== null ? html`<span class="section-count" aria-hidden="true">${count}</span>` : ''}<span class="section-arrow">${icon('chevron-right')}</span></a>`;
  }
  function toast(message) {
    const element = document.querySelector('#toast');
    clearTimeout(toastTimer);
    element.textContent = t(message);
    element.classList.add('visible');
    toastTimer = setTimeout(() => element.classList.remove('visible'), 3800);
  }
  function save(next) {
    try {
      // Store each gallery image once; legacy image/images aliases are rebuilt on load.
      const stored = {...next,products:(next.products || []).map(({image,images,...data})=>data),works:next.works.map(work=>{
        if (!Array.isArray(work.photos)) return work;
        const {image,images,...data} = work;
        return data;
      })};
      localStorage.setItem(STORAGE_KEY,JSON.stringify(stored)); state = next; return true;
    }
    catch { return false; }
  }
  const imageSrc = src => {
    const value = String(src || '');
    return /^assets\/images\/[a-z0-9-]+\.jpg$/i.test(value) || /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : '';
  };
  function normalizePhotos(work) {
    const ids = new Set();
    let photos;
    if (Array.isArray(work.photos)) {
      photos = work.photos.filter(photo => photo && imageSrc(photo.src)).map((photo,index)=>{
        let id = /^photo-[a-z0-9-]+$/i.test(photo.id || '') && !ids.has(photo.id) ? photo.id : 'photo-'+(index+1);
        while (ids.has(id)) id += '-copy';
        ids.add(id);
        return {id,src:imageSrc(photo.src),caption:String(photo.caption || '').slice(0,1600)};
      });
    } else {
      const sources = [...new Set([work.image,...(Array.isArray(work.images) ? work.images : [])].filter(src=>imageSrc(src)))];
      photos = sources.map((src,index)=>({id:'photo-'+(index+1),src,caption:index === 0 ? String(work.description || '') : ''}));
    }
    work.photos = photos; work.image = photos[0]?.src || ''; work.images = photos.map(photo=>photo.src);
  }
  state.works.forEach(normalizePhotos);
  state.products.forEach(normalizePhotos);
  function imageMarkup(src, alt, extra = '') {
    const safe = imageSrc(src);
    return safe ? html`<img src="${safe}" alt="${esc(alt)}" ${extra}>` : icon('photo');
  }
  function glassLink(href, text, symbol, classes = '') {
    return html`<a href="${esc(href)}" class="glass-button ${classes}" data-glass>${symbol ? icon(symbol) : ''}${esc(t(text))}</a>`;
  }
  function toolbar(title, back = 'home', custom = false) {
    return html`<header class="page-toolbar"><a href="#${back}" class="glass-button icon-button" data-glass aria-label="Назад">${icon('arrow-left')}</a><h1>${esc(custom ? title : t(title))}</h1></header>`;
  }
  function profileHeader() {
    const p = state.profile;
    return html`<div class="cover">
      ${imageMarkup(p.cover, t('Обложка портфолио'))}
      <div class="status-bar" aria-hidden="true"><span>9:41</span><span class="status-indicators"><span class="signal"><i></i><i></i><i></i></span><span class="battery"></span></span></div>
      <div class="cover-toolbar"><a class="mini-wordmark" href="#home" aria-label="Folio, главная">folio.</a><button class="glass-button icon-button" data-glass data-action="menu" aria-label="Управление профилем" aria-expanded="false" aria-controls="profile-menu">${icon('dots')}</button></div>
    </div>
    <div class="profile-block">
      <div class="profile-top">${imageMarkup(p.avatar, p.name, 'class="avatar"')}<span class="availability">Открыт к предложениям</span></div>
      <h1>${esc(p.name)}</h1><p class="profession">${esc(p.profession)}</p>
      <p class="location">${icon('map-pin')}${esc(p.city)}</p>
      ${String(p.experience || '').trim() ? html`<p class="profile-experience">${icon('briefcase')}<span class="experience-text">Опыт работы: <span>${esc(String(p.experience).trim())}</span></span></p>` : ''}
      ${String(p.headline || '').trim() ? html`<p class="profile-summary">${esc(p.headline.trim())}</p>` : ''}
      ${reviews().length ? html`<a class="profile-rating" href="#reviews" aria-label="${esc(t('Открыть отзывы'))}">${icon('star')}<strong>${ratingAverage()}</strong><span>· ${esc(reviewCountLabel(reviews().length))}</span>${icon('chevron-right')}</a>` : ''}
      <div class="contacts glass-panel" aria-label="Контакты специалиста">
        ${[['instagram','brand-instagram','Instagram'],['telegram','brand-telegram','Telegram'],['whatsapp','brand-whatsapp','WhatsApp'],['phone','phone','Телефон'],['email','mail','Электронная почта']].map(([type,symbol,label]) => html`<button class="glass-button icon-button" data-glass data-contact="${type}" aria-label="${esc(t(label))}">${icon(symbol)}</button>`).join('')}
      </div><p class="contact-hint">Выберите удобный способ связаться</p>
    </div>
    <div class="profile-menu" id="profile-menu"><a href="#create-profile">${icon('pencil')} Изменить профиль</a><a href="#edit-tabs">${icon('pencil')} Настроить вкладки</a><a href="#create">${icon('plus')} Добавить публикацию</a><button data-action="share">${icon('share')} Поделиться профилем</button><button data-action="certificate-demo">Показать / скрыть демо-сертификат</button><button data-action="reset">Восстановить демо</button></div>
    <nav class="profile-sections" aria-label="Разделы портфолио">
      ${visibleProfileTabs().map(profileSectionLink).join('')}
    </nav><div class="tab-settings-link"><a class="text-link" href="#edit-tabs">${icon('pencil')}Настроить вкладки</a></div>`;
  }
  function createChoice() {
    return html`${toolbar('Что хотите добавить?',workReturnHash.slice(1))}<section class="screen-content"><p class="page-intro">Покажите выполненный проект или предложите свой продукт.</p><div class="publication-choices">${[['create-work','Работу','photo','Проекты, опыт и результаты'],['create-product','Продукт','package','Фото, цена за штуку и наличие']].map(([href,title,symbol,description])=>html`<a class="glass-button publication-choice" data-glass href="#${href}">${icon(symbol)}<span><strong>${esc(t(title))}</strong><small>${esc(t(description))}</small></span>${icon('chevron-right')}</a>`).join('')}</div></section>`;
  }
  function productsScreen() {
    if (!state.productCategories.some(item=>item.id===productFilter)) productFilter = 'all';
    const items = state.products.filter(item=>productFilter==='all' || item.categoryId===productFilter);
    return html`${toolbar(tabTitle('products','Продукты'))}<section class="screen-content"><div class="works-controls"><a class="text-link" href="#product-categories">${icon('pencil')}Управлять категориями</a></div><div class="filter-row" aria-label="Категории продуктов">${[{id:'all',name:t('Все')},...state.productCategories].map(item=>html`<button class="filter ${productFilter===item.id ? 'active' : ''}" data-product-filter="${esc(item.id)}" aria-pressed="${productFilter===item.id}">${esc(item.name)}</button>`).join('')}</div>${items.length ? html`<div class="work-grid all-works">${items.map(product=>html`<a href="#product/${encodeURIComponent(product.id)}" class="work-card product-card"><div class="work-card-image">${imageMarkup(product.image,product.title,'loading="lazy"')}</div><h3>${esc(product.title)}</h3><p class="product-card-price">${esc(productPrice(product))}<span> / шт.</span></p><p class="product-stock ${product.stock==='unavailable' ? 'stock-unavailable' : ''}">${esc(t(stockLabels[product.stock] || stockLabels.available))}</p><p class="work-card-description">${esc(product.description)}</p></a>`).join('')}</div>` : html`<div class="empty-state">${icon('package')}<h2>${esc(t(state.products.length ? 'В этой категории пока нет продуктов.' : 'Добавьте первый продукт'))}</h2><p>Укажите цену, наличие и покажите фотографии.</p></div>`}${glassLink('#create-product','Добавить продукт','plus','primary full-button')}</section>`;
  }
  function productScreen(id) {
    const product = state.products.find(item=>item.id===id);
    if (!product) return html`${toolbar('Продукт не найден','products')}<section class="screen-content"><p>Этого продукта больше нет в каталоге.</p>${glassLink('#products','Вернуться к продуктам','arrow-left','full-button')}</section>`;
    return html`<header class="work-page-header"><a class="glass-button icon-button" data-glass href="#products" aria-label="Назад">${icon('arrow-left')}</a><div class="work-toolbar-actions"><a class="glass-button icon-button" data-glass href="#edit-product/${encodeURIComponent(id)}" aria-label="Редактировать продукт">${icon('pencil')}</a><button class="glass-button icon-button" data-glass data-action="share-work" aria-label="Поделиться">${icon('share')}</button></div></header><div class="work-intro"><p class="project-category">${esc(product.category)}</p><h1 class="project-title">${esc(product.title)}</h1><p class="product-detail-price">${esc(productPrice(product))}<span> / шт.</span></p><p class="product-stock ${product.stock==='unavailable' ? 'stock-unavailable' : ''}">${esc(t(stockLabels[product.stock] || stockLabels.available))}</p></div><section class="project-overview"><h2>О продукте</h2><div class="rich-text-content">${window.FolioRichText.sanitize(product.descriptionHtml || window.FolioRichText.fromPlain(product.description))}</div></section>${workGallery(product)}<section class="screen-content"><p class="page-intro">${esc(t(product.stock==='unavailable' ? 'Уточните у владельца, когда продукт снова появится.' : 'Уточните условия заказа напрямую у владельца.'))}</p><button class="glass-button primary full-button" data-glass data-contact="phone">${icon('phone')}Связаться по поводу продукта</button></section>`;
  }
  function productForm(id='') {
    const original = id ? state.products.find(item=>item.id===id) : {};
    if (!original) return productScreen(id);
    if (!workDraft || workDraft.id!==id || workDraft.kind!=='product') workDraft = {...original,id,kind:'product',currency:original.currency || 'UZS',stock:original.stock || 'available',photos:JSON.parse(JSON.stringify(original.photos || []))};
    const product = workDraft;
    const back = id ? '#product/'+encodeURIComponent(id) : workReturnHash;
    return html`${toolbar(id ? 'Редактировать продукт' : 'Новый продукт',back.slice(1))}<form id="work-form" class="form-section" data-product="true" data-work-id="${esc(id)}">${field('title','Название продукта',product.title,{required:true,placeholder:'Например, деревянный стол'})}<div class="field"><label for="category">Категория</label><input id="category" name="category" maxlength="80" value="${esc(product.category || '')}" list="product-categories" placeholder="${esc(t('Выберите или введите свою'))}"><datalist id="product-categories">${state.productCategories.map(item=>html`<option value="${esc(item.name)}"></option>`).join('')}</datalist><small>Новая категория сохранится вместе с продуктом.</small></div><div class="product-price-fields"><div class="field"><label for="price">Цена за штуку *</label><input type="number" id="price" name="price" min="0" max="9999999999" step="any" required inputmode="decimal" value="${esc(product.price ?? '')}" placeholder="0"></div><div class="field"><label for="currency">Валюта *</label><select id="currency" name="currency" required>${currencies.map(currency=>html`<option value="${currency}" ${product.currency===currency ? 'selected' : ''}>${currency}</option>`).join('')}</select></div></div><div class="field"><label for="stock">Наличие *</label><select id="stock" name="stock" required>${Object.entries(stockLabels).map(([value,label])=>html`<option value="${value}" ${product.stock===value ? 'selected' : ''}>${esc(t(label))}</option>`).join('')}</select></div>${descriptionEditor(product).replace(t('О проекте'),t('О продукте')).replace(t('Форматируйте описание проекта, добавляйте списки и ссылки.'),t('Форматируйте описание продукта, добавляйте списки и ссылки.'))}${photosEditor()}<p class="form-error" id="form-error" role="alert"></p><div class="form-actions">${glassLink(back,'Отмена','')}<button class="glass-button primary" data-glass type="submit">${icon('check')}${esc(t(id ? 'Сохранить изменения' : 'Опубликовать'))}</button></div><p class="form-status">Цена фиксированная, за одну штуку. Данные сохраняются в этом браузере.</p>${id ? html`<button type="button" class="text-link delete-work" data-action="delete-product">Удалить продукт</button>` : ''}</form><dialog id="product-delete-dialog"><h2>Удалить продукт?</h2><p>Продукт и его фотографии будут удалены из каталога.</p><div class="dialog-actions"><button class="glass-button" data-glass data-action="cancel-delete-product">Отмена</button><button class="glass-button" data-glass data-action="confirm-delete-product">Удалить</button></div></dialog>`;
  }
  function workCard(work) {
    return html`<a class="work-card" href="#work/${encodeURIComponent(work.id)}"><div class="work-card-image">${imageMarkup(work.image, work.title, 'loading="lazy"')}</div><h3>${esc(work.title)}</h3><p class="work-card-description">${esc(work.description)}</p></a>`;
  }
  function emptyWorks() {
    return html`<div class="empty-state">${icon('photo')}<h2>Первая работа ждёт вас</h2><p>Добавьте фотографии и расскажите о результате.</p>${glassLink('#create-work','Добавить работу','plus','full-button')}</div>`;
  }
  function welcomeScreen() {
    return html`<section class="welcome-screen"><a class="auth-wordmark" href="#welcome" aria-label="Folio">folio<span>.</span></a><div class="welcome-copy"><h1>Покажите,<br>что вы умеете</h1><p>Соберите работы, расскажите о своём опыте и делитесь портфолио с клиентами одной ссылкой.</p></div><div class="welcome-example" aria-label="Пример портфолио"><div class="example-cover">${imageMarkup('assets/images/house.jpg',t('Пример работы'))}</div><div class="example-person">${imageMarkup('assets/images/avatar.jpg','')}<div><strong>Александр Иванов</strong><span>Архитектор</span></div>${icon('arrow-up-right')}</div><div class="example-works">${imageMarkup('assets/images/interior.jpg',t('Пример работы'))}${imageMarkup('assets/images/cover.jpg',t('Пример работы'))}</div><p>Пример вашего будущего портфолио</p></div><div class="welcome-actions">${glassLink('#signup','Создать портфолио','arrow-right','primary full-button')}<a href="#signin" class="auth-switch">Уже есть аккаунт? <strong>Войти</strong></a></div></section>`;
  }
  function authScreen(mode) {
    if (authDraft.mode !== mode) authDraft = {email:'',step:'email',mode,sentAt:0};
    const signup = mode === 'signup', code = authDraft.step === 'code';
    return html`<section class="auth-screen"><header class="auth-header"><a class="glass-button icon-button" data-glass href="#welcome" aria-label="Назад">${icon('arrow-left')}</a><a class="auth-wordmark" href="#welcome">folio<span>.</span></a></header><div class="auth-copy"><h1>${esc(t(signup ? 'Создайте своё портфолио' : 'С возвращением'))}</h1><p>${esc(t(signup ? 'Сохраните свой опыт и работы в одном месте. Выберите удобный способ начать.' : 'Войдите, чтобы продолжить работу над своим портфолио.'))}</p></div>${!code ? html`<div class="auth-providers"><button type="button" class="glass-button full-button" data-glass data-action="demo-google">Продолжить с Google</button><button type="button" class="glass-button full-button" data-glass data-action="demo-apple">Продолжить с Apple</button></div><div class="auth-divider"><span>или через почту</span></div>` : ''}<form id="auth-form" class="auth-form"><h2>${esc(t(code ? 'Проверьте почту' : 'Электронная почта'))}</h2>${code ? html`<p class="auth-email-note">${esc(t('Код для входа на адрес'))}<br><strong>${esc(authDraft.email)}</strong></p><div class="field"><label for="auth-code">Код подтверждения</label><input id="auth-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required placeholder="000000" aria-describedby="auth-demo-note"></div>` : html`<div class="field"><label class="visually-hidden" for="auth-email">Электронная почта</label><input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="name@example.com" value="${esc(authDraft.email)}"></div>`}<p class="form-error" id="auth-error" role="alert"></p><button type="submit" class="glass-button primary full-button" data-glass>${esc(t(code ? 'Подтвердить и продолжить' : 'Получить код'))}${icon('arrow-right')}</button>${code ? html`<div class="auth-code-actions"><button type="button" class="text-link" data-action="auth-change-email">Изменить почту</button><button type="button" class="text-link" data-action="auth-resend">Отправить повторно</button></div>` : html`<p class="auth-password-note">Без пароля. Вход по коду из письма.</p>`}</form><p class="auth-demo-note" id="auth-demo-note">${esc(t(code ? 'В макете письма не отправляются. Используйте код 123456.' : 'Демонстрационный режим: Google и Apple откроют следующий экран без настоящей авторизации. Письма не отправляются.'))}</p><a class="auth-switch" href="${signup ? '#signin' : '#signup'}">${esc(t(signup ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать портфолио'))}</a></section>`;
  }
  function homeScreen() {
    return profileHeader();
  }
  function worksContent() {
    const categories = [{id:'all',name:t('Все')},...state.categories];
    if (!categories.some(category => category.id === activeFilter)) activeFilter = 'all';
    const works = state.works.filter(work => activeFilter === 'all' || work.categoryId === activeFilter);
    return html`<div class="works-controls"><a href="#categories-edit" class="text-link">${icon('pencil')}Управлять категориями</a></div><div class="filter-row" aria-label="Категории работ">${categories.map(category => html`<button class="filter ${category.id === activeFilter ? 'active' : ''}" data-filter="${esc(category.id)}" aria-pressed="${category.id === activeFilter}">${esc(category.name)}</button>`).join('')}</div>${state.works.length ? (works.length ? html`<div class="work-grid all-works">${works.map(workCard).join('')}</div>` : '<div class="empty-state"><p>'+esc(t('В этой категории пока нет работ.'))+'</p></div>') + glassLink('#create-work','Добавить работу','plus','full-button primary') : emptyWorks()}`;
  }
  function captureCategoriesDraft() {
    const form = app.querySelector('#categories-form');
    if (!form || !categoriesDraft) return;
    categoriesDraft.forEach(category => { category.name = form.elements.namedItem('category-'+category.id)?.value.trim() || ''; });
  }
  function editCategory(command,id) {
    captureCategoriesDraft();
    if (command === 'add') {
      id = 'category-' + (window.crypto?.randomUUID?.() || Date.now());
      categoriesDraft.push({id,name:''});
    } else if (command === 'remove') categoriesDraft = categoriesDraft.filter(category => category.id !== id);
    render(false);
    if (command === 'add') document.getElementById('category-'+id)?.focus();
    else app.querySelector('[data-category-command=add]')?.focus();
  }
  function categoriesForm() {
    const products = route === 'product-categories';
    const back = products ? 'products' : 'works';
    if (!categoriesDraft) categoriesDraft = JSON.parse(JSON.stringify(products ? state.productCategories : state.categories));
    return html`${toolbar(products ? 'Категории продуктов' : 'Категории работ',back)}<form class="form-section" id="categories-form"><p class="page-intro">${esc(t(products ? 'Создайте категории для своих продуктов. Переименование обновит связанные продукты.' : 'Создайте категории под вашу профессию. Переименование обновит категорию у всех связанных работ.'))}</p><div class="category-editor-list">${categoriesDraft.map(category => html`<div class="category-editor-row"><div class="field"><label for="category-${category.id}">Название категории</label><input id="category-${category.id}" name="category-${category.id}" maxlength="80" required value="${esc(category.name)}" placeholder="${esc(t(products ? 'Например, мебель' : 'Например, ремонт квартир'))}"></div><button type="button" class="glass-button icon-button" data-glass data-category-command="remove" data-category-id="${esc(category.id)}" aria-label="${esc(t('Удалить категорию'))}: ${esc(category.name)}">${icon('x')}</button></div>`).join('')}</div>${!categoriesDraft.length ? '<p class="page-intro">'+esc(t(products ? 'Создайте первую категорию или оставьте продукты без категории.' : 'Создайте первую категорию или оставьте работы без категории.'))+'</p>' : ''}<button type="button" class="glass-button full-button" data-glass data-category-command="add">${icon('plus')}Добавить категорию</button><p class="form-status">${esc(t(products ? 'Удаление категории не удаляет продукты. Изменения применятся после сохранения.' : 'Удаление категории не удаляет работы. Изменения применятся после сохранения.'))}</p><p class="form-error" role="alert" id="form-error"></p><div class="form-actions">${formActions(back)}</div></form>`;
  }
  function worksScreen() {
    return html`${toolbar(tabTitle('works','Работы'),'home',true)}<section class="screen-content"><p class="page-intro">Каждая работа рассказывает о вашем опыте.<br>Соберите лучшие в одном месте.</p>${worksContent()}</section>`;
  }
  function workGallery(work) {
    const photos = work.photos;
    if (!photos.length) return html`<div class="work-gallery-empty">${icon('photo')}<p>В этой работе пока нет фотографий.</p>${glassLink('#edit-work/'+encodeURIComponent(work.id),'Добавить фотографии','plus')}</div>`;
    return html`<section class="work-gallery" aria-label="Фотографии работы" aria-roledescription="${esc(t('Галерея'))}" tabindex="0"><figure><div class="work-gallery-stage"><div class="work-gallery-track">${photos.map((photo,index)=>html`<div class="work-gallery-slide" role="group" aria-label="${index+1} / ${photos.length}" data-caption="${esc(photo.caption)}">${imageMarkup(photo.src,work.title+' — '+t('Фото')+' '+(index+1),index ? 'loading="lazy" draggable="false"' : 'draggable="false"')}</div>`).join('')}</div><div class="gallery-counter" aria-hidden="true">1 / ${photos.length}</div><div class="gallery-arrows" ${photos.length < 2 ? 'hidden' : ''}><button type="button" class="glass-button icon-button" data-glass data-gallery-step="-1" aria-label="Предыдущее фото">${icon('arrow-left')}</button><button type="button" class="glass-button icon-button" data-glass data-gallery-step="1" aria-label="Следующее фото">${icon('arrow-right')}</button></div></div>${photos.length > 1 ? html`<div class="gallery-thumbnails" aria-label="Выбрать фотографию">${photos.map((photo,index)=>html`<button type="button" data-gallery-index="${index}" aria-label="${esc(t('Фото'))} ${index+1}">${imageMarkup(photo.src,'')}</button>`).join('')}</div>` : ''}<figcaption class="photo-caption"><span class="photo-caption-label">Фото 1</span><p class="photo-caption-text">${esc(photos[0].caption || t('Описание фотографии пока не добавлено.'))}</p></figcaption></figure><p class="sr-only gallery-status" role="status" aria-live="polite" aria-atomic="true"></p></section>`;
  }
  function workScreen(id) {
    const work = state.works.find(item => item.id === id);
    if (!work) return html`${toolbar('Работа не найдена','works')}<section class="screen-content"><p class="page-intro">Этой работы больше нет в портфолио.</p>${glassLink('#works','Вернуться к работам','arrow-left')}</section>`;
    return html`<header class="work-page-header"><a class="glass-button icon-button" data-glass href="#works" aria-label="Назад к работам">${icon('arrow-left')}</a><div class="work-toolbar-actions"><a class="glass-button icon-button" data-glass href="#edit-work/${encodeURIComponent(work.id)}" aria-label="Редактировать работу">${icon('pencil')}</a><button class="glass-button icon-button" data-glass data-action="share-work" aria-label="Поделиться работой">${icon('share')}</button></div></header><div class="work-intro"><p class="project-category">${esc(work.category)}</p><h1 class="project-title">${esc(work.title)}</h1><div class="project-meta"><span>${esc(work.location)}</span><span>${esc(work.year)}</span></div></div><section class="project-overview"><h2>О проекте</h2><div class="rich-text-content">${window.FolioRichText.sanitize(work.descriptionHtml || window.FolioRichText.fromPlain(work.description))}</div></section>${workGallery(work)}<article class="screen-content work-details"><div class="prose">${work.result ? html`<h2>Результат</h2><p>${esc(work.result)}</p>` : ''}</div><div class="project-author">${imageMarkup(state.profile.avatar,state.profile.name)}<div><strong>${esc(state.profile.name)}</strong><p>${esc(state.profile.profession)}</p></div></div><button class="glass-button primary full-button" data-glass data-contact="phone">${icon('phone')}Обсудить похожий проект</button></article>`;
  }
  function reviewsScreen() {
    const items = reviews();
    if (!items.length) return html`${toolbar('Отзывы')}<section class="screen-content"><div class="empty-state">${icon('star')}<h2>Отзывов пока нет</h2><p>Здесь появятся впечатления заказчиков о работе со специалистом.</p></div></section>`;
    return html`${toolbar(tabTitle('reviews','Отзывы'),'home',true)}<section class="screen-content reviews-content"><div class="reviews-summary">${icon('star')}<strong>${ratingAverage()}</strong><span>${esc(t('из 5'))} · ${esc(reviewCountLabel(items.length))}</span></div><p class="reviews-demo">Демонстрационные отзывы для макета.</p><div class="reviews-list">${items.map((review,index)=>{
      const work = state.works.find(item=>item.id===review.workId);
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(review.date || '') ? new Date(review.date+'T12:00:00') : null;
      const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString(window.FolioI18n.language,{day:'numeric',month:'long',year:'numeric'}) : '';
      const initials = String(review.name || '').trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('');
      return html`<article class="review"><header class="review-header"><div class="review-avatar" aria-hidden="true">${imageSrc(review.avatar) ? imageMarkup(review.avatar,'','loading="lazy"') : esc(initials)}</div><div><h2>${esc(review.name || t('Заказчик'))}</h2>${date ? html`<time datetime="${esc(review.date)}">${esc(date)}</time>` : ''}</div></header><div class="review-stars" role="img" aria-label="${review.rating} ${esc(t('из 5'))}">${Array.from({length:5},(_,i)=>html`<span class="${i<review.rating ? 'filled' : ''}">${icon(i<review.rating ? 'star-filled' : 'star')}</span>`).join('')}</div><details class="review-body"><summary><span class="review-preview">${esc(review.text)}</span><span class="review-expand">${esc(t('Читать полностью'))}</span><span class="review-collapse">${esc(t('Свернуть'))}</span></summary><p class="review-full">${esc(review.text)}</p></details>${work ? html`<a class="review-work text-link" href="#work/${encodeURIComponent(work.id)}">${icon('photo')}${esc(work.title)}${icon('arrow-up-right')}</a>` : ''}</article>`;
    }).join('')}</div></section>`;
  }
  function aboutContent() {
    const p = state.profile;
    return html`<h2 class="about-headline">${esc(p.headline)}</h2><p class="prose">${esc(p.about)}</p><div class="detail-row"><span>Опыт работы</span><strong>${esc(p.experience || t('Не указан'))}</strong></div><div class="detail-row"><span>Город</span><strong>${esc(p.city)}</strong></div><h2 class="section-title">Чем могу помочь</h2><div class="skill-list">${(p.skills || []).map(skill => html`<span>${esc(skill)}</span>`).join('')}</div>${visibleProfileTabs().some(tab => tab.type === 'certificates') ? glassLink('#certificates', 'Посмотреть сертификаты','certificate','full-button') : ''}${glassLink('#create-profile','Изменить профиль','pencil','full-button')}<p class="demo-label">Это пример профиля. Имя, опыт и проекты можно изменить.</p>`;
  }
  function aboutScreen() {
    return html`${toolbar(tabTitle('about','О себе'),'home',true)}<section class="screen-content">${aboutContent()}</section>`;
  }
  function certificatesContent() {
    const certificates = publishedCertificates();
    return html`<p class="page-intro">Обучение и профессиональное развитие.</p>${certificates.map(cert => html`<article class="certificate-row"><div class="certificate-symbol">${icon('certificate')}</div><div><h2>${esc(cert.title)}</h2><p>${esc(cert.issuer)}${cert.year ? ' · '+esc(cert.year) : ''}</p><div class="certificate-status">Опубликован в портфолио</div>${cert.image ? imageMarkup(cert.image,cert.title,'class="published-certificate-photo" loading="lazy"') : ''}</div></article>`).join('')}${glassLink('#certificates-edit','Управлять сертификатами','pencil','full-button')}<p class="demo-label">Публикация сертификата не означает проверку его подлинности.</p>`;
  }
  function certificatesScreen() {
    if (!publishedCertificates().length) return html`${toolbar('Раздел пока скрыт')}<section class="screen-content"><p class="page-intro">Сертификаты появятся после публикации первой записи.</p>${glassLink('#certificate-edit/new','Добавить сертификат','certificate')}</section>`;
    return html`${toolbar(tabTitle('certificates','Сертификаты'),'home',true)}<section class="screen-content">${certificatesContent()}</section>`;
  }
  function customSectionScreen(id) {
    const tab = visibleProfileTabs().find(item => item.id === id && item.type === 'custom');
    if (!tab) return html`${toolbar('Раздел недоступен')}<section class="screen-content"><p class="page-intro">Эта вкладка скрыта или удалена.</p></section>`;
    const content = tab.content ? html`<div class="prose custom-tab-content">${esc(tab.content)}</div>` : html`<div class="empty-state"><p>Добавьте описание в настройках этой вкладки.</p>${glassLink('#edit-tabs','Добавить описание','pencil','full-button')}</div>`;
    return html`${toolbar(tab.title,'home',true)}<section class="screen-content">${content}</section>`;
  }
  function tabsForm() {
    if (!tabsDraft) tabsDraft = JSON.parse(JSON.stringify(state.profileTabs));
    return html`${toolbar('Вкладки профиля')}<form id="tabs-form" class="form-section"><p class="page-intro">Переименуйте разделы, измените порядок или добавьте свою вкладку, например «Услуги».</p><div class="tab-editor-list">${tabsDraft.map((tab,index) => html`<section class="tab-editor-row" data-tab-id="${tab.id}"><div class="tab-editor-heading"><label class="tab-visibility"><input type="checkbox" name="enabled-${tab.id}" ${tab.enabled ? 'checked' : ''}>Показывать</label><div class="tab-order"><button type="button" data-tab-command="up" data-tab-id="${tab.id}" ${index === 0 ? 'disabled' : ''} aria-label="Переместить вкладку ${esc(tab.title)} выше">${icon('arrow-left')}</button><button type="button" data-tab-command="down" data-tab-id="${tab.id}" ${index === tabsDraft.length - 1 ? 'disabled' : ''} aria-label="Переместить вкладку ${esc(tab.title)} ниже">${icon('arrow-right')}</button>${tab.type === 'custom' ? html`<button type="button" data-tab-command="remove" data-tab-id="${tab.id}" aria-label="Удалить вкладку ${esc(tab.title)}">${icon('x')}</button>` : ''}</div></div><div class="field"><label for="title-${tab.id}">Название вкладки</label><input id="title-${tab.id}" name="title-${tab.id}" maxlength="32" required value="${esc(tab.title)}"></div>${tab.type === 'custom' ? html`<div class="field"><label for="content-${tab.id}">Содержание</label><textarea id="content-${tab.id}" name="content-${tab.id}" maxlength="3000" placeholder="Расскажите об услугах, подходе или условиях работы">${esc(tab.content)}</textarea></div>` : html`<p class="tab-editor-hint">${t(({works:'Показывает опубликованные работы.',about:'Показывает информацию из вашего профиля.',certificates:'Появится только при наличии опубликованного сертификата.'})[tab.type])}</p>`}</section>`).join('')}</div><button type="button" class="glass-button full-button" data-glass data-tab-command="add">${icon('plus')}Добавить вкладку</button><p class="form-error" id="form-error" role="alert"></p><div class="form-actions">${glassLink('#home','Отмена','')}<button type="submit" class="glass-button primary" data-glass>${icon('check')}Сохранить</button></div><p class="form-status">Настройки сохраняются в этом браузере. Оставьте хотя бы одну вкладку видимой.</p></form>`;
  }
  function captureTabsDraft() {
    const form = document.querySelector('#tabs-form');
    if (!form) return;
    const data = new FormData(form);
    tabsDraft.forEach(tab => {
      tab.title = String(data.get(`title-${tab.id}`) || '').trim();
      tab.enabled = data.has(`enabled-${tab.id}`);
      if (tab.type === 'custom') tab.content = String(data.get(`content-${tab.id}`) || '').trim();
    });
  }
  function editTab(command,id) {
    captureTabsDraft();
    const index = tabsDraft.findIndex(tab => tab.id === id);
    if (command === 'add') {
      id = 'custom-' + (window.crypto?.randomUUID?.() || Date.now());
      tabsDraft.push({id,type:'custom',title:t('Новая вкладка'),enabled:true,content:''});
    } else if (command === 'remove' && tabsDraft[index]?.type === 'custom') tabsDraft.splice(index,1);
    else if (command === 'up' && index > 0) [tabsDraft[index-1],tabsDraft[index]] = [tabsDraft[index],tabsDraft[index-1]];
    else if (command === 'down' && index >= 0 && index < tabsDraft.length-1) [tabsDraft[index],tabsDraft[index+1]] = [tabsDraft[index+1],tabsDraft[index]];
    render(false);
    if (command === 'add') document.getElementById(`title-${id}`)?.focus();
    else if (command !== 'remove') app.querySelector(`[data-tab-id="${id}"] [data-tab-command="${command}"]`)?.focus();
  }
  function field(name,label,value = '', options = {}) {
    const {type='text', required=false, placeholder='', area=false, help=''} = options;
    return html`<div class="field"><label for="${name}">${esc(t(label))}${required ? ' *' : ''}</label>${area ? html`<textarea id="${name}" name="${name}" maxlength="1600" ${required ? 'required' : ''} placeholder="${esc(t(placeholder))}">${esc(value)}</textarea>` : html`<input id="${name}" name="${name}" type="${type}" maxlength="${type === 'url' ? 300 : 160}" value="${esc(value)}" ${required ? 'required' : ''} placeholder="${esc(t(placeholder))}">`}${help ? html`<small>${esc(t(help))}</small>` : ''}</div>`;
  }
  function upload(name,label) {
    return html`<div class="field"><label class="upload-zone" for="${name}">${icon('upload')}${esc(t(label))}<span>JPG, PNG или WebP, до 2 МБ</span></label><input class="file-input" id="${name}" name="${name}" type="file" accept="image/jpeg,image/png,image/webp"><div id="${name}-preview"></div></div>`;
  }
  function profileForm() {
    const p = state.profile;
    const cert = state.certificates.find(item => item.id === 'profile-certificate') || {};
    return html`${toolbar('Создание профиля','about')}<form class="form-section" id="profile-form"><p class="page-intro">Расскажите, кто вы и что умеете.<br>Демо-данные можно заменить своими.</p>${upload('avatar','Выбрать фото профиля')}${upload('cover','Выбрать обложку')}${field('name','Имя и фамилия',p.name,{required:true})}${field('profession','Профессия',p.profession,{required:true,help:'Любая профессия: строитель, дизайнер, фотограф и другие.'})}${field('city','Город',p.city,{required:true})}${field('headline','Коротко о себе',p.headline,{placeholder:'Что вы делаете лучше всего?'})}${field('about','О себе',p.about,{area:true})}${field('experience','Опыт работы',p.experience,{placeholder:'Например, 8 лет'})}${field('skills','Услуги и навыки',(p.skills || []).join(', '),{help:'Перечислите через запятую.'})}<h2 class="form-divider">Контакты</h2>${field('phone','Телефон',p.phone,{type:'tel',placeholder:'+998 90 123 45 67'})}${field('email','Электронная почта',p.email,{type:'email',placeholder:'name@example.com'})}${field('instagram','Instagram',p.instagram,{type:'url',placeholder:'https://instagram.com/username'})}${field('telegram','Telegram',p.telegram,{type:'url',placeholder:'https://t.me/username'})}${field('whatsapp','WhatsApp',p.whatsapp,{type:'tel',placeholder:'+998 90 123 45 67'})}<h2 class="form-divider">Сертификат <span class="caption-small">необязательно</span></h2>${field('certificateTitle','Название',cert.title,{placeholder:'Название курса или сертификата'})}${field('certificateIssuer','Кем выдан',cert.issuer)}${field('certificateYear','Год',cert.year,{placeholder:'2026'})}<div class="field"><label><input type="checkbox" name="certificatePublished" ${cert.published ? 'checked' : ''}> Опубликовать сертификат в профиле</label><small>Раздел виден только при наличии опубликованного сертификата.</small></div><p class="form-error" role="alert" id="form-error"></p><div class="form-actions">${glassLink('#about','Отмена','')}<button class="glass-button primary" data-glass type="submit">${icon('check')}Сохранить</button></div><p class="form-status">* Обязательные поля. Данные сохраняются только в этом браузере.</p></form>`;
  }
  function formActions(back = 'settings') {
    return html`${glassLink('#'+back,'Отмена','')}<button class="glass-button primary" data-glass type="submit">${icon('check')}Сохранить</button>`;
  }
  function settingsScreen() {
    const p = state.profile;
    return html`${toolbar('Настройки')}<section class="screen-content settings-content"><div class="settings-identity">${imageMarkup(p.avatar,p.name)}<div><strong>${esc(p.name)}</strong><p>${esc(p.profession)}</p></div></div><h2 class="settings-group-title">Профиль</h2><div class="settings-list">${[['personal-data','Личные данные','Фото, профессия и опыт','user'],['contacts-edit','Контакты','Телефон, почта и мессенджеры','phone'],['certificates-edit','Сертификаты','Обучение и квалификация','certificate']].map(([target,title,description,symbol]) => html`<a href="#${target}" class="settings-row">${icon(symbol)}<span><strong>${esc(t(title))}</strong><small>${esc(t(description))}</small></span>${icon('chevron-right')}</a>`).join('')}</div><h2 class="settings-group-title">Приложение</h2><div class="settings-list"><a href="#language" class="settings-row">${icon('language')}<span><strong>Язык интерфейса</strong><small>${window.FolioI18n.language === 'en' ? 'English' : 'Русский'}</small></span>${icon('chevron-right')}</a></div><button class="glass-button full-button" data-glass data-action="share">${icon('share')}Поделиться профилем</button><button class="text-link reset-setting" data-action="reset">Восстановить демо-данные</button><p class="demo-label">Данные макета сохраняются в этом браузере.</p></section>`;
  }
  function personalDataForm() {
    const p = state.profile;
    return html`${toolbar('Личные данные','settings')}<form id="personal-form" class="form-section"><p class="page-intro">Представьтесь и расскажите о своём опыте.</p><div class="profile-photo-preview">${imageMarkup(p.avatar,p.name)}</div>${upload('avatar','Выбрать фото профиля')}${upload('cover','Выбрать обложку')}${field('name','Имя и фамилия',p.name,{required:true})}${field('profession','Профессия',p.profession,{required:true})}${field('city','Город',p.city,{required:true})}${field('experience','Опыт работы',p.experience,{placeholder:'Например, 8 лет'})}${field('headline','Коротко о себе',p.headline)}${field('about','О себе',p.about,{area:true})}${field('skills','Услуги и навыки',(p.skills || []).join(', '),{help:'Перечислите через запятую.'})}<p id="form-error" class="form-error" role="alert"></p><div class="form-actions">${formActions()}</div><p class="form-status">Изменения появятся в вашем профиле.</p></form>`;
  }
  function contactsForm() {
    const p = state.profile;
    return html`${toolbar('Контакты','settings')}<form id="contacts-form" class="form-section"><p class="page-intro">Выберите, как клиентам удобно связаться с вами.</p>${field('phone','Телефон',p.phone,{type:'tel',placeholder:'+998 90 123 45 67'})}${field('email','Электронная почта',p.email,{type:'email',placeholder:'name@example.com'})}${field('instagram','Instagram',p.instagram,{type:'url',placeholder:'https://instagram.com/username'})}${field('telegram','Telegram',p.telegram,{type:'url',placeholder:'https://t.me/username'})}${field('whatsapp','WhatsApp',p.whatsapp,{type:'tel',placeholder:'+998 90 123 45 67'})}<p class="form-status">Пустые контакты можно заполнить позже.</p><p id="form-error" class="form-error" role="alert"></p><div class="form-actions">${formActions()}</div></form>`;
  }
  function certificateManager() {
    return html`${toolbar('Сертификаты','settings')}<section class="screen-content"><p class="page-intro">Добавьте подтверждения вашего обучения.<br>Вы решаете, какие записи видны в профиле.</p>${glassLink('#certificate-edit/new','Добавить сертификат','plus','primary full-button')}${state.certificates.length ? html`<div class="managed-certificates">${state.certificates.map(cert => html`<a class="managed-certificate" href="#certificate-edit/${encodeURIComponent(cert.id)}">${cert.image ? imageMarkup(cert.image,cert.title,'class="certificate-thumbnail"') : icon('certificate')}<span><strong>${esc(cert.title)}</strong><small>${esc(cert.issuer)}${cert.year ? ' · '+esc(cert.year) : ''}</small><span class="certificate-visibility">${esc(t(cert.published ? 'Видно в профиле' : 'Не опубликован'))}</span></span>${icon('chevron-right')}</a>`).join('')}</div>` : '<div class="empty-state"><h2>Ваш первый сертификат</h2><p>Можно сохранить запись для себя или опубликовать её в портфолио.</p></div>'}<p class="demo-label">Раздел виден только при наличии опубликованного сертификата.</p></section>`;
  }
  function certificateForm(id) {
    const cert = id === 'new' ? {} : state.certificates.find(item => item.id === id);
    if (!cert) return html`${toolbar('Сертификат не найден','certificates-edit')}<section class="screen-content">${glassLink('#certificates-edit','Вернуться к сертификатам','arrow-left')}</section>`;
    return html`${toolbar(id === 'new' ? 'Новый сертификат' : 'Редактировать сертификат','certificates-edit')}<form id="certificate-form" class="form-section" data-certificate-id="${esc(id)}"><p class="page-intro">Укажите название и организацию, которая выдала сертификат.</p>${cert.image ? imageMarkup(cert.image,cert.title,'class="upload-preview"') : ''}${upload('certificateImage','Фото сертификата')}${field('certificateTitle','Название',cert.title,{required:true,placeholder:'Название курса или сертификата'})}${field('certificateIssuer','Кем выдан',cert.issuer,{required:true})}${field('certificateYear','Год',cert.year,{placeholder:'2026'})}<label class="publish-choice"><input type="checkbox" name="certificatePublished" ${cert.published ? 'checked' : ''}><span><strong>Опубликовать в профиле</strong><small>Неопубликованный сертификат виден только вам.</small></span></label><p id="form-error" class="form-error" role="alert"></p><div class="form-actions">${formActions('certificates-edit')}</div>${id !== 'new' ? '<button type="button" class="delete-certificate text-link" data-action="delete-certificate">Удалить сертификат</button>' : ''}</form><dialog id="certificate-delete-dialog"><h2>Удалить сертификат?</h2><p>Запись будет удалена из этого браузера и вашего портфолио.</p><div class="dialog-actions"><button type="button" class="glass-button" data-glass data-action="cancel-delete-certificate">Отмена</button><button type="button" class="glass-button" data-glass data-action="confirm-delete-certificate">Удалить</button></div></dialog>`;
  }
  function languageForm() {
    const language = window.FolioI18n.language;
    return html`${toolbar('Язык интерфейса','settings')}<form id="language-form" class="form-section"><p class="page-intro">Выберите язык кнопок, меню и подсказок.<br>Тексты вашего портфолио сохранятся без изменений.</p><fieldset class="language-choices"><legend class="sr-only">Язык интерфейса</legend><label><span><strong lang="ru">Русский</strong><small>Russian</small></span><input type="radio" name="language" value="ru" ${language === 'ru' ? 'checked' : ''}></label><label><span><strong lang="en">English</strong><small>Английский</small></span><input type="radio" name="language" value="en" ${language === 'en' ? 'checked' : ''}></label></fieldset><p id="form-error" class="form-error" role="alert"></p><div class="form-actions">${formActions()}</div></form>`;
  }
  function captureWorkDraft() {
    const form = app.querySelector('#work-form');
    if (!form || !workDraft) return;
    const data = new FormData(form);
    for (const name of ['title','category','description','result','location','year','price','currency','stock']) workDraft[name] = String(data.get(name) || '');
    workDraft.descriptionHtml = window.FolioRichText.sanitize(app.querySelector('#description-editor')?.innerHTML || '');
    workDraft.description = window.FolioRichText.plain(workDraft.descriptionHtml);
    workDraft.photos.forEach(photo=>{
      photo.caption = String(data.get('caption-'+photo.id) || '');
      if (pendingUploads['photoImage-'+photo.id]) photo.src = pendingUploads['photoImage-'+photo.id];
    });
  }
  function editPhoto(command,id) {
    if (!workDraft) return;
    if (app.querySelector('#work-form [type=submit]')?.disabled) {toast('Дождитесь загрузки фотографии.');return;}
    captureWorkDraft();
    const index = workDraft.photos.findIndex(photo=>photo.id === id);
    if (command === 'add') {
      if (workDraft.photos.length >= 8) {toast('Можно добавить до 8 фотографий.');return;}
      id = 'photo-'+(window.crypto?.randomUUID?.() || Date.now());
      workDraft.photos.push({id,src:'',caption:''});
    } else if (command === 'remove' && index >= 0) workDraft.photos.splice(index,1);
    else if (command === 'up' && index > 0) [workDraft.photos[index-1],workDraft.photos[index]] = [workDraft.photos[index],workDraft.photos[index-1]];
    else if (command === 'down' && index >= 0 && index < workDraft.photos.length-1) [workDraft.photos[index],workDraft.photos[index+1]] = [workDraft.photos[index+1],workDraft.photos[index]];
    render(false);
    if (command === 'add') document.getElementById('photoImage-'+id)?.focus();
    else if (command !== 'remove') app.querySelector(`[data-photo-id="${id}"] [data-photo-command="${command}"]`)?.focus();
    else app.querySelector('[data-photo-command="add"]')?.focus();
  }
  function photosEditor() {
    return html`<div class="photo-editor-heading"><h2>Фотографии и описания</h2><p>Первое фото станет обложкой. До 8 фото.</p></div><div class="photo-editor-list">${workDraft.photos.map((photo,index)=>html`<section class="photo-editor-item" data-photo-id="${photo.id}"><div class="photo-editor-toolbar"><h3>${esc(t('Фото'))} ${index+1}</h3><div class="photo-editor-actions"><button type="button" class="glass-button icon-button" data-glass data-photo-command="up" data-photo-id="${photo.id}" aria-label="Переместить фото выше" ${index === 0 ? 'disabled' : ''}>${icon('arrow-left')}</button><button type="button" class="glass-button icon-button" data-glass data-photo-command="down" data-photo-id="${photo.id}" aria-label="Переместить фото ниже" ${index === workDraft.photos.length-1 ? 'disabled' : ''}>${icon('arrow-right')}</button><button type="button" class="glass-button icon-button" data-glass data-photo-command="remove" data-photo-id="${photo.id}" aria-label="Удалить фото">${icon('x')}</button></div></div>${photo.src ? imageMarkup(photo.src,t('Фото')+' '+(index+1),'class="photo-editor-preview"') : ''}${upload('photoImage-'+photo.id,photo.src ? 'Заменить фото' : 'Выбрать фото')}${field('caption-'+photo.id,'Описание фотографии',photo.caption,{area:true,placeholder:'Что показано на этом фото?'})}</section>`).join('')}</div><button type="button" class="glass-button full-button" data-glass data-photo-command="add" ${workDraft.photos.length >= 8 ? 'disabled' : ''}>${icon('plus')}Добавить фотографию</button>`;
  }
  function descriptionEditor(work) {
    const content = window.FolioRichText.sanitize(work.descriptionHtml || window.FolioRichText.fromPlain(work.description));
    return html`<div class="field rich-text-field"><label id="description-label">О проекте *</label><div class="rich-editor-shell"><div class="rich-toolbar" role="toolbar" aria-label="Форматирование текста">${[['bold','Жирный','<strong>B</strong>'],['italic','Курсив','<em>I</em>'],['insertUnorderedList','Маркированный список',esc(t('Список'))],['insertOrderedList','Нумерованный список',esc(t('Нумерация'))],['link','Добавить ссылку',esc(t('Ссылка'))],['removeFormat','Убрать форматирование',esc(t('Очистить'))]].map(([command,label,markup])=>html`<button type="button" data-rich-command="${command}" aria-label="${esc(t(label))}" title="${esc(t(label))}">${markup}</button>`).join('')}</div><div id="description-editor" class="rich-editor rich-text-content" contenteditable="true" role="textbox" aria-multiline="true" aria-required="true" aria-labelledby="description-label" spellcheck="true">${content}</div><div class="rich-link-panel" hidden><label for="description-link">Адрес ссылки</label><input id="description-link" class="rich-link-url" type="text" inputmode="url" placeholder="https://example.com"><p class="rich-link-error" role="alert"></p><div><button type="button" data-rich-command="apply-link">Вставить ссылку</button><button type="button" data-rich-command="cancel-link">Отмена</button></div></div></div><input id="description" type="hidden" name="description" value="${esc(window.FolioRichText.plain(content))}"><small>Форматируйте описание проекта, добавляйте списки и ссылки.</small></div>`;
  }
  function workForm(id = '') {
    const editing = Boolean(id);
    const original = editing ? state.works.find(item => item.id === id) : {};
    if (original && (!workDraft || workDraft.id !== id || workDraft.kind !== 'work')) workDraft = {...original,id,kind:'work',photos:JSON.parse(JSON.stringify(original.photos || []))};
    const work = original && workDraft;
    if (!work) return html`${toolbar('Работа не найдена','works')}<section class="screen-content"><p class="page-intro">Этой работы больше нет в портфолио.</p>${glassLink('#works','Вернуться к работам','arrow-left')}</section>`;
    const backHash = editing ? `#work/${encodeURIComponent(id)}` : workReturnHash;
    return html`${toolbar(editing ? 'Редактировать работу' : 'Новая работа',backHash.slice(1))}<form class="form-section" id="work-form" data-work-id="${esc(id)}"><p class="page-intro">Покажите, что получилось.<br>Добавьте контекст, чтобы работу оценили.</p><h2 class="form-divider">Данные работы</h2>${field('title','Название работы',work.title,{required:true,placeholder:'Например, ремонт квартиры в Ташкенте'})}<div class="field"><label for="category">Категория</label><input id="category" name="category" value="${esc(work.category || '')}" maxlength="80" list="categories" placeholder="${esc(t('Выберите или введите свою'))}"><datalist id="categories">${state.categories.map(category => html`<option value="${esc(category.name)}"></option>`).join('')}</datalist><small>Новая категория сохранится вместе с работой. Поле можно оставить пустым.</small></div>${descriptionEditor(work)}${field('result','Результат',work.result,{area:true,placeholder:'Чего удалось добиться?'})}${field('location','Место',work.location,{placeholder:'Город или «Удалённо»'})}${field('year','Год',work.year,{placeholder:'2026'})}${photosEditor()}<p class="form-error" role="alert" id="form-error"></p><div class="form-actions">${glassLink(backHash,'Отмена','')}<button class="glass-button primary" data-glass type="submit">${icon(editing ? 'check' : 'plus')}${esc(t(editing ? 'Сохранить изменения' : 'Опубликовать'))}</button></div><p class="form-status">Без фото карточка появится с заглушкой. Публикация в макете сохраняет работу только в этом браузере.</p>${editing ? '<button type="button" class="text-link delete-work" data-action="delete-work">'+esc(t('Удалить работу'))+'</button>' : ''}</form>${editing ? html`<dialog id="work-delete-dialog"><h2>Удалить работу?</h2><p>Работа и её фотографии будут удалены из этого браузера и портфолио.</p><div class="dialog-actions"><button type="button" class="glass-button" data-glass data-action="cancel-delete-work">Отмена</button><button type="button" class="glass-button" data-glass data-action="confirm-delete-work">Удалить</button></div></dialog>` : ''}`;
  }
  function updateNavigation() {
    const certificate = visibleProfileTabs().some(tab => tab.type === 'certificates');
    const links = [['welcome','Приветствие'],['signup','Создать портфолио'],['signin','Войти'],['home','Главный'],['settings','Настройки'],['works','Мои работы'],['work/'+(state.works[0]?.id || 'missing'),'Карточка работы'],['about','О себе'],...(reviews().length ? [['reviews','Отзывы']] : []),['create-profile','Создание профиля'],['create','Добавить'],['products','Продукты'],['create-work','Создание работы'],['create-product','Новый продукт'],['edit-tabs','Вкладки профиля'],...(certificate ? [['certificates','Сертификаты']] : [])];
    document.querySelector('#preview-nav').innerHTML = links.map(([target,label],i) => html`<a class="preview-link" href="#${esc(target)}" ${route === target.split('/')[0] ? 'aria-current="page"' : ''}><span>${String(i+1).padStart(2,'0')}</span>${esc(t(label))}</a>`).join('');
    const active = ['settings','create-profile','edit-tabs','personal-data','contacts-edit','certificates-edit','certificate-edit','language'].includes(route) ? 'settings' : 'home';
    document.querySelector('#bottom-nav').innerHTML = [['home','Главная','home'],['settings','Настройки','settings']].map(([target,label,symbol]) => html`<a href="#${target}" data-glass ${active === target ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${esc(t(label))}</span></a>`).join('');
    const editing = ['welcome','signup','signin','create-work','create-product','edit-product','product-categories','create-profile','edit-tabs','personal-data','contacts-edit','certificate-edit','language','categories-edit','edit-work'].includes(route);
    document.querySelector('#bottom-dock').hidden = editing;
    document.querySelector('.device').classList.toggle('is-editing',editing);
    document.querySelector('#toggle-certificate').textContent = state.certificates.some(cert => cert.id === 'demo-certificate') ? 'Скрыть демо-сертификат' : 'Добавить демо-сертификат';
  }
  function render(focus = true) {
    cleanupGlass();
    cleanupGallery();
    cleanupRichText();
    pendingUploads = {};
    const [target, rawId] = (location.hash.slice(1) || (hasDemoSession() ? 'home' : 'welcome')).split('/');
    let id;
    try { id = decodeURIComponent(rawId || ''); } catch { id = ''; }
    // Keep old bookmarks working, while every profile tab now opens a separate screen.
    if (target === 'home' && id) {
      const legacyTab = state.profileTabs.find(tab => tab.id === id);
      location.replace(legacyTab ? tabHref(legacyTab) : '#home');
      return;
    }
    if (['create-work','create-product','create'].includes(target) && !['create-work','create-product','create'].includes(route) && lastRenderedHash) {
      workReturnHash = lastRenderedHash;
      try { sessionStorage.setItem('folio.work-return',workReturnHash); } catch {}
    }
    if (target === 'publications') { location.replace('#works'); return; }
    if (route !== target && ['categories-edit','product-categories'].includes(target)) categoriesDraft = null;
    route = target;
    if (route !== 'edit-tabs') tabsDraft = null;
    if (!['categories-edit','product-categories'].includes(route)) categoriesDraft = null;
    if (!['create-work','edit-work','create-product','edit-product'].includes(route)) workDraft = null;
    const screens = {create:createChoice,products:productsScreen,product:()=>productScreen(id),'create-product':productForm,'edit-product':()=>productForm(id || 'missing'),'product-categories':categoriesForm,welcome:welcomeScreen,signup:()=>authScreen('signup'),signin:()=>authScreen('signin'),home:homeScreen,settings:settingsScreen,'categories-edit':categoriesForm,'personal-data':personalDataForm,'contacts-edit':contactsForm,'certificates-edit':certificateManager,'certificate-edit':()=>certificateForm(id),language:languageForm,works:worksScreen,work:()=>workScreen(id),about:aboutScreen,reviews:reviewsScreen,certificates:certificatesScreen,section:()=>customSectionScreen(id),'create-profile':profileForm,'create-work':workForm,'edit-work':()=>workForm(id || 'missing'),'edit-tabs':tabsForm};
    if (!screens[route]) route = 'home';
    app.classList.toggle('auth-surface',['welcome','signup','signin'].includes(route));
    app.innerHTML = screens[route]();
    app.querySelectorAll('.review-body').forEach(details=>{
      const preview = details.querySelector('.review-preview');
      if (preview.scrollHeight <= preview.clientHeight + 1) {
        const paragraph = document.createElement('p'); paragraph.className = 'review-full'; paragraph.textContent = preview.textContent; details.replaceWith(paragraph);
      }
    });
    updateNavigation();
    window.FolioI18n.updateShell();
    cleanupGlass = window.initGlassButtons(document);
    cleanupGallery = window.initWorkGallery(app);
    cleanupRichText = window.FolioRichText.init(app);
    if (focus) { app.focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
    document.title = `${t(({create:'Добавить',products:'Продукты',product:'Продукт','create-product':'Новый продукт','edit-product':'Редактировать продукт','product-categories':'Категории продуктов',welcome:'Добро пожаловать',signup:'Создать портфолио',signin:'Войти',home:'Главная',settings:'Настройки','categories-edit':'Категории работ','personal-data':'Личные данные','contacts-edit':'Контакты','certificates-edit':'Сертификаты','certificate-edit':'Редактировать сертификат',language:'Язык интерфейса',works:tabTitle('works','Работы'),work:'Работа',about:tabTitle('about','О себе'),reviews:tabTitle('reviews','Отзывы'),certificates:tabTitle('certificates','Сертификаты'),section:state.profileTabs.find(tab=>tab.id===id)?.title || 'Раздел','create-profile':'Создание профиля','create-work':'Новая работа','edit-work':'Редактировать работу','edit-tabs':'Вкладки профиля'})[route])} · Folio`;
    lastRenderedHash = '#' + route + (id && ['work','product','section','certificate-edit','edit-work','edit-product'].includes(route) ? '/' + encodeURIComponent(id) : '');
    app.querySelectorAll('input[type=file]').forEach(input => input.addEventListener('change', () => handleUpload(input)));
  }
  function formError(message) { const element = document.querySelector('#form-error'); if (element) {element.textContent = t(message); element.scrollIntoView({block:'center'});} else toast(message); }
  async function handleUpload(input) {
    const file = input.files[0];
    delete pendingUploads[input.name];
    document.querySelector(`#${input.name}-preview`).innerHTML = '';
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { input.value = ''; formError('Выберите JPG, PNG или WebP размером до 2 МБ.'); return; }
    const submit = app.querySelector('[type=submit]');
    const form = input.closest('form');
    form.dataset.pendingUploads = Number(form.dataset.pendingUploads || 0) + 1;
    submit.disabled = true;
    try {
      const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      await new Promise((resolve,reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = data; });
      if (!input.isConnected) return;
      pendingUploads[input.name] = data;
      if (input.name.startsWith('photoImage-') && workDraft) {
        const photo = workDraft.photos.find(item=>input.name === 'photoImage-'+item.id);
        if (photo) photo.src = data;
      }
      document.querySelector(`#${input.name}-preview`).innerHTML = imageMarkup(data,t('Выбранная фотография'),'class="upload-preview"');
      document.querySelector('#form-error').textContent = '';
    } catch { input.value = ''; formError('Не удалось открыть изображение. Выберите другой файл.'); }
    finally { form.dataset.pendingUploads = Math.max(0,Number(form.dataset.pendingUploads || 0)-1); if (submit.isConnected) submit.disabled = Number(form.dataset.pendingUploads) > 0; }
  }
  function validateUrl(value) {
    if (!value) return true;
    try { return ['https:','http:'].includes(new URL(value).protocol); } catch { return false; }
  }
  function handleSubmit(event) {
    if (event.target.id === 'auth-form') {
      event.preventDefault();
      const form = event.target;
      if (!form.reportValidity()) return;
      if (authDraft.step === 'email') {
        authDraft.email = form.elements.email.value.trim(); authDraft.step = 'code'; authDraft.sentAt = Date.now();
        render(false); app.querySelector('#auth-code')?.focus();
      } else if (form.elements.code.value === '123456') completeDemoAuth();
      else { app.querySelector('#auth-error').textContent = t('Неверный код. Для макета введите 123456.'); form.elements.code.setAttribute('aria-invalid','true'); form.elements.code.focus(); }
      return;
    }
    if (!['profile-form','work-form','tabs-form','personal-form','contacts-form','certificate-form','language-form','categories-form'].includes(event.target.id)) return;
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const next = JSON.parse(JSON.stringify(state));
    if (form.id === 'categories-form') {
      captureCategoriesDraft();
      if (categoriesDraft.some(category => !category.name)) { formError('Укажите название каждой категории.'); return; }
      const names = categoriesDraft.map(category => category.name.toLocaleLowerCase());
      if (new Set(names).size !== names.length) { formError('Названия категорий не должны повторяться.'); return; }
      const products = route === 'product-categories';
      const key = products ? 'productCategories' : 'categories';
      next[key] = JSON.parse(JSON.stringify(categoriesDraft));
      (products ? next.products : next.works).forEach(work => {
        const category = next[key].find(item => item.id === work.categoryId);
        work.category = category?.name || ''; work.categoryId = category?.id || '';
      });
      if (!save(next)) { formError('Не удалось сохранить изменения в браузере'); return; }
      activeFilter = 'all'; productFilter = 'all'; location.hash = products ? 'products' : 'works'; toast('Категории сохранены'); return;
    }
    if (form.id === 'language-form') {
      if (!window.FolioI18n.setLanguage(value('language'))) { formError('Не удалось сохранить язык. Проверьте хранилище браузера.'); return; }
      location.hash = 'settings'; toast('Настройки сохранены'); return;
    }
    if (form.id === 'personal-form' || form.id === 'contacts-form') {
      if (form.id === 'personal-form') {
        if (!value('name') || !value('profession') || !value('city')) { formError('Укажите имя, профессию и город.'); return; }
        for (const name of ['name','profession','city','experience','headline','about']) next.profile[name] = value(name);
        next.profile.skills = value('skills').split(',').map(item => item.trim()).filter(Boolean);
        for (const name of ['avatar','cover']) if (pendingUploads[name]) next.profile[name] = pendingUploads[name];
      } else {
        for (const name of ['instagram','telegram']) if (!validateUrl(value(name))) { formError('Укажите полную ссылку с https:// для соцсетей.'); return; }
        for (const name of ['phone','whatsapp']) if (value(name) && !/^\+?[\d\s()\-]{5,25}$/.test(value(name))) { formError('Укажите корректный номер телефона, например +998 90 123 45 67.'); return; }
        for (const name of ['phone','email','instagram','telegram','whatsapp']) next.profile[name] = value(name);
      }
      if (!save(next)) { formError('Не удалось сохранить изменения в браузере'); return; }
      location.hash = 'settings'; toast('Настройки сохранены'); return;
    }
    if (form.id === 'certificate-form') {
      if (!value('certificateTitle') || !value('certificateIssuer')) { formError('Укажите название и организацию.'); return; }
      const existingId = form.dataset.certificateId;
      const existing = next.certificates.find(item => item.id === existingId);
      const cert = {id:existing?.id || window.crypto?.randomUUID?.() || `certificate-${Date.now()}`,title:value('certificateTitle'),issuer:value('certificateIssuer'),year:value('certificateYear'),published:data.has('certificatePublished'),image:pendingUploads.certificateImage || existing?.image || ''};
      if (existing) next.certificates[next.certificates.findIndex(item => item.id === existingId)] = cert;
      else next.certificates.push(cert);
      if (!save(next)) { formError('Не удалось сохранить изменения в браузере'); return; }
      location.hash = 'certificates-edit'; toast('Сертификат сохранён'); return;
    }
    if (form.id === 'tabs-form') {
      captureTabsDraft();
      if (tabsDraft.some(tab => !tab.title)) { formError('Укажите название каждой вкладки.'); return; }
      if (!tabsDraft.some(tab => tab.enabled && tab.type !== 'certificates')) { formError('Оставьте хотя бы одну вкладку, видимость которой не зависит от сертификатов.'); return; }
      next.profileTabs = JSON.parse(JSON.stringify(tabsDraft));
      if (!save(next)) { formError('Не удалось сохранить вкладки. Проверьте доступность хранилища браузера.'); return; }
      location.hash = 'home'; toast('Вкладки профиля сохранены'); return;
    }
    if (form.id === 'profile-form') {
      if (!value('name') || !value('profession') || !value('city')) { formError('Укажите имя, профессию и город.'); return; }
      for (const name of ['instagram','telegram']) if (!validateUrl(value(name))) { formError('Укажите полную ссылку с https:// для соцсетей.'); return; }
      for (const name of ['phone','whatsapp']) if (value(name) && !/^\+?[\d\s()\-]{5,25}$/.test(value(name))) { formError('Укажите корректный номер телефона, например +998 90 123 45 67.'); return; }
      for (const name of ['name','profession','city','headline','about','experience','phone','email','instagram','telegram','whatsapp']) next.profile[name] = value(name);
      next.profile.skills = value('skills').split(',').map(item => item.trim()).filter(Boolean);
      for (const name of ['avatar','cover']) if (pendingUploads[name]) next.profile[name] = pendingUploads[name];
      next.certificates = next.certificates.filter(cert => cert.id !== 'profile-certificate');
      if (value('certificateTitle')) next.certificates.push({...state.certificates.find(cert=>cert.id==='profile-certificate'),id:'profile-certificate',title:value('certificateTitle'),issuer:value('certificateIssuer'),year:value('certificateYear'),published:data.has('certificatePublished')});
      if (!save(next)) { formError('Не удалось сохранить профиль. Возможно, память браузера заполнена или отключена. Попробуйте фото меньшего размера.'); return; }
      location.hash = 'about'; toast('Профиль сохранён в этом браузере');
    } else if (form.dataset.product === 'true') {
      captureWorkDraft();
      if (!value('title') || !workDraft.description) {formError('Заполните название и описание продукта.');return;}
      const price=Number(value('price')), currency=value('currency');
      if (!value('price') || !Number.isFinite(price) || price<0 || price>9999999999 || !currencies.includes(currency)) {formError('Укажите корректную цену и валюту.');return;}
      const digits=new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits;
      if (price !== Number(price.toFixed(digits))) {formError('Цена содержит слишком много знаков после запятой для этой валюты.');return;}
      if (!stockLabels[value('stock')]) {formError('Выберите наличие продукта.');return;}
      const existingId=form.dataset.workId, existing=existingId ? next.products.find(item=>item.id===existingId) : null;
      if(existingId && !existing){formError('Этого продукта больше нет в каталоге.');return;}
      const photos=workDraft.photos.map(photo=>({id:photo.id,src:imageSrc(photo.src),caption:photo.caption.trim()}));
      if(photos.some(photo=>!photo.src)){formError('Выберите фото для каждой записи или удалите пустую запись.');return;}
      const name=value('category');let category=next.productCategories.find(item=>item.name.toLocaleLowerCase()===name.toLocaleLowerCase());
      if(!category && name){category={id:'category-'+(window.crypto?.randomUUID?.() || Date.now()),name};next.productCategories.push(category);}
      const product={id:existing?.id || 'product-'+(window.crypto?.randomUUID?.() || Date.now()),title:value('title'),price,currency,stock:value('stock'),categoryId:category?.id || '',category:category?.name || '',description:workDraft.description,descriptionHtml:workDraft.descriptionHtml,photos,image:photos[0]?.src || '',images:photos.map(photo=>photo.src)};
      if(existing) next.products[next.products.findIndex(item=>item.id===existingId)]={...existing,...product};else next.products.unshift(product);
      if(!save(next)){formError('Не удалось сохранить продукт. Попробуйте фото меньшего размера.');return;}
      productFilter='all';location.hash='product/'+product.id;toast(existing ? 'Изменения продукта сохранены' : 'Продукт опубликован');
    } else {
      captureWorkDraft();
      if (!value('title') || !workDraft.description) { formError('Заполните название и описание работы.'); if (!workDraft.description) app.querySelector('#description-editor')?.focus(); return; }
      const existingId = form.dataset.workId;
      const existing = existingId ? next.works.find(item => item.id === existingId) : null;
      if (existingId && !existing) { formError('Этой работы больше нет в портфолио.'); return; }
      const id = existing?.id || window.crypto?.randomUUID?.() || `work-${Date.now()}`;
      const categoryName = value('category');
      let category = next.categories.find(item => item.name.toLocaleLowerCase() === categoryName.toLocaleLowerCase());
      if (!category && categoryName) {
        category = {id:'category-' + (window.crypto?.randomUUID?.() || Date.now()),name:categoryName};
        next.categories.push(category);
      }
      captureWorkDraft();
      const photos = workDraft.photos.map(photo=>({id:photo.id,src:imageSrc(photo.src),caption:photo.caption.trim()}));
      if (photos.some(photo=>!photo.src)) {formError('Выберите фото для каждой записи или удалите пустую запись.');return;}
      const work = {id,title:value('title'),category:category?.name || '',categoryId:category?.id || '',description:workDraft.description,descriptionHtml:workDraft.descriptionHtml,result:value('result'),location:value('location'),year:value('year'),photos,image:photos[0]?.src || '',images:photos.map(photo=>photo.src)};
      if (existing) next.works[next.works.findIndex(item => item.id === existingId)] = {...existing,...work};
      else next.works.unshift(work);
      if (!save(next)) { formError('Не удалось сохранить работу. Попробуйте фото меньшего размера или разрешите хранение данных браузером.'); return; }
      activeFilter = 'all'; location.hash = `work/${id}`; toast(existing ? 'Изменения работы сохранены' : 'Работа добавлена в локальное портфолио');
    }
  }
  function toggleCertificate() {
    const next = JSON.parse(JSON.stringify(state));
    const exists = next.certificates.some(item => item.id === 'demo-certificate');
    next.certificates = next.certificates.filter(item => item.id !== 'demo-certificate');
    if (!exists) next.certificates.push({id:'demo-certificate',title:'Архитектура жилых пространств',issuer:'Демонстрационный сертификат',year:'2025',published:true});
    if (!save(next)) { toast('Не удалось сохранить изменения в браузере'); return; }
    if (route === 'certificates' && !publishedCertificates().length) location.hash = 'home';
    else render(false);
    toast(exists ? 'Демо-сертификат скрыт' : 'Раздел «Сертификаты» появился в профиле');
  }
  async function share(work = false) {
    try { await navigator.clipboard.writeText(new URL(work ? location.hash : '#home',location.href).href); toast('Ссылка на макет скопирована'); }
    catch { toast('Скопируйте ссылку на макет из адресной строки'); }
  }
  function contact(type) {
    const value = state.profile[type];
    if (!value) { toast('Это демо-контакт. Добавьте свой в настройках профиля.'); return; }
    if (type === 'phone') location.href = `tel:${value.replace(/[^+\d]/g,'')}`;
    else if (type === 'email') location.href = `mailto:${encodeURIComponent(value)}`;
    else if (type === 'whatsapp') window.open(`https://wa.me/${value.replace(/\D/g,'')}`, '_blank', 'noopener,noreferrer');
    else if (validateUrl(value)) window.open(value, '_blank', 'noopener,noreferrer');
  }
  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'menu') { const menu = document.querySelector('#profile-menu'); const open = menu.classList.toggle('open'); event.target.closest('button').setAttribute('aria-expanded', String(open)); }
    if (action === 'delete-product') app.querySelector('#product-delete-dialog').showModal();
    if (action === 'cancel-delete-product') app.querySelector('#product-delete-dialog').close();
    if (action === 'confirm-delete-product') {
      const id=app.querySelector('#work-form').dataset.workId;
      if(save({...state,products:state.products.filter(item=>item.id!==id)})){productFilter='all';location.hash='products';toast('Продукт удалён');}else toast('Не удалось сохранить изменения в браузере');
    }
    if (action === 'delete-work') document.querySelector('#work-delete-dialog').showModal();
    if (action === 'cancel-delete-work') document.querySelector('#work-delete-dialog').close();
    if (action === 'confirm-delete-work') {
      const id = app.querySelector('#work-form').dataset.workId;
      const next = {...state,works:state.works.filter(work => work.id !== id)};
      if (save(next)) { activeFilter = 'all'; location.hash = 'works'; toast('Работа удалена'); }
      else toast('Не удалось сохранить изменения в браузере');
    }
    if (action === 'delete-certificate') document.querySelector('#certificate-delete-dialog').showModal();
    if (action === 'cancel-delete-certificate') document.querySelector('#certificate-delete-dialog').close();
    if (action === 'confirm-delete-certificate') {
      const id = app.querySelector('#certificate-form').dataset.certificateId;
      const next = {...state,certificates:state.certificates.filter(cert => cert.id !== id)};
      if (save(next)) { location.hash = 'certificates-edit'; toast('Сертификат удалён'); }
      else toast('Не удалось сохранить изменения в браузере');
    }
    if (action === 'demo-google' || action === 'demo-apple') completeDemoAuth();
    if (action === 'auth-change-email') { authDraft.step = 'email'; render(false); app.querySelector('#auth-email')?.focus(); }
    if (action === 'auth-resend') {
      const seconds = Math.ceil((30000 - (Date.now()-authDraft.sentAt))/1000);
      if (seconds > 0) { toast(t('Повторная отправка через')+' '+seconds+' '+t('сек.')); }
      else { authDraft.sentAt = Date.now(); toast('Демо-код: 123456. Письмо не отправлено.'); }
    }
    if (action === 'share') share();
    if (action === 'share-work') share(true);
    const photoCommand = event.target.closest('[data-photo-command]');
    if (photoCommand) editPhoto(photoCommand.dataset.photoCommand,photoCommand.dataset.photoId);
    if (action === 'certificate-demo') toggleCertificate();
    if (action === 'reset') document.querySelector('#reset-dialog').showModal();
    const categoryCommand = event.target.closest('[data-category-command]');
    if (categoryCommand) editCategory(categoryCommand.dataset.categoryCommand,categoryCommand.dataset.categoryId);
    const tabCommand = event.target.closest('[data-tab-command]');
    if (tabCommand) editTab(tabCommand.dataset.tabCommand,tabCommand.dataset.tabId);
    const productButton = event.target.closest('[data-product-filter]');
    if (productButton) {productFilter=productButton.dataset.productFilter;render(false);app.querySelector(`[data-product-filter="${CSS.escape(productFilter)}"]`)?.focus();}
    const filter = event.target.closest('[data-filter]');
    if (filter) { activeFilter = filter.dataset.filter; render(false); app.querySelector(`[data-filter="${CSS.escape(activeFilter)}"]`)?.focus(); }
    const channel = event.target.closest('[data-contact]');
    if (channel) contact(channel.dataset.contact);
  });
  document.addEventListener('submit', handleSubmit);
  window.addEventListener('hashchange', () => render());
  document.querySelector('#toggle-certificate').addEventListener('click', toggleCertificate);
  document.querySelector('#reset-demo').addEventListener('click', () => document.querySelector('#reset-dialog').showModal());
  document.querySelector('#cancel-reset').addEventListener('click', () => document.querySelector('#reset-dialog').close());
  document.querySelector('#confirm-reset').addEventListener('click', () => {
    if (!save(seed())) { toast('Не удалось восстановить демо: хранилище недоступно'); return; }
    normalizeCategories(); state.works.forEach(normalizePhotos); state.products.forEach(normalizePhotos); document.querySelector('#reset-dialog').close(); activeFilter = 'all';
    if (location.hash === '#home') render(); else location.hash = 'home';
    toast('Демонстрационные данные восстановлены');
  });
  render(false);
  if (storageWarning) toast(storageWarning);
})();
