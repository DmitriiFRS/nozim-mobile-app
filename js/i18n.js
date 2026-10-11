(() => {
  'use strict';
  const STORAGE_KEY = 'folio.language.v1';
  const en = {
    'Карточка продукта':'Product detail','Демонстрационная карточка. Продукт не добавлен в ваш каталог.':'Demo product detail. This product is not in your catalog.',
    'Форматируйте описание продукта, добавляйте списки и ссылки.':'Format the product description, add lists and links.',
    'Продукты':'Products',
    'Продукт':'Product',
    'Добавить публикацию':'Add work or product',
    'Добавить работу или продукт':'Add work or product',
    'Что хотите добавить?':'What would you like to add?',
    'Покажите выполненный проект или предложите свой продукт.':'Show a completed project or offer your product.',
    'Работу':'A project',
    'Проекты, опыт и результаты':'Projects, experience and results',
    'Фото, цена за штуку и наличие':'Photos, unit price and availability',
    'Добавить':'Add',
    'Категории продуктов':'Product categories',
    'Новый продукт':'New product',
    'Добавить продукт':'Add product',
    'Добавьте первый продукт':'Add your first product',
    'В этой категории пока нет продуктов.':'No products in this category yet.',
    'Укажите цену, наличие и покажите фотографии.':'Add a price, availability and photos.',
    'В наличии':'In stock',
    'Под заказ':'Made to order',
    'Нет в наличии':'Out of stock',
    'Продукт не найден':'Product not found',
    'Этого продукта больше нет в каталоге.':'This product is no longer in the catalog.',
    'Вернуться к продуктам':'Back to products',
    'Редактировать продукт':'Edit product',
    'О продукте':'About the product',
    'Уточните у владельца, когда продукт снова появится.':'Ask the owner when the product will be available again.',
    'Уточните условия заказа напрямую у владельца.':'Contact the owner to discuss ordering.',
    'Связаться по поводу продукта':'Ask about this product',
    'Название продукта':'Product name',
    'Например, деревянный стол':'For example, a wooden table',
    'Новая категория сохранится вместе с продуктом.':'The new category is saved with the product.',
    'Цена за штуку':'Unit price',
    'Валюта':'Currency',
    'Наличие':'Availability',
    'Цена фиксированная, за одну штуку. Данные сохраняются в этом браузере.':'Fixed price per item. Data is saved in this browser.',
    'Удалить продукт':'Delete product',
    'Удалить продукт?':'Delete product?',
    'Продукт и его фотографии будут удалены из каталога.':'The product and its photos will be removed from the catalog.',
    'Первое фото станет обложкой. До 8 фото.':'The first photo becomes the cover. Up to 8 photos.',
    'Создайте категории для своих продуктов. Переименование обновит связанные продукты.':'Create your own product categories. Renaming updates linked products.',
    'Создайте категории под вашу профессию. Переименование обновит категорию у всех связанных работ.':'Create categories for your profession. Renaming updates linked projects.',
    'Например, мебель':'For example, furniture',
    'Создайте первую категорию или оставьте продукты без категории.':'Create your first category or leave products uncategorized.',
    'Удаление категории не удаляет продукты. Изменения применятся после сохранения.':'Deleting a category preserves products. Changes apply after saving.',
    'Заполните название и описание продукта.':'Enter a product name and description.',
    'Укажите корректную цену и валюту.':'Enter a valid price and currency.',
    'Цена содержит слишком много знаков после запятой для этой валюты.':'Too many decimal places for this currency.',
    'Выберите наличие продукта.':'Choose product availability.',
    'Не удалось сохранить продукт. Попробуйте фото меньшего размера.':'Could not save the product. Try smaller photos.',
    'Изменения продукта сохранены':'Product changes saved',
    'Продукт опубликован':'Product published',
    'Продукт удалён':'Product deleted',
    ' / шт.':' / item',

    'Ссылка на макет скопирована':'Prototype link copied',
    'Приветствие':'Welcome',
    'Добро пожаловать':'Welcome',
    'Покажите,':'Show',
    'что вы умеете':'what you can do',
    'Соберите работы, расскажите о своём опыте и делитесь портфолио с клиентами одной ссылкой.':'Collect your work, share your experience and send clients a single portfolio link.',
    'Пример портфолио':'Portfolio example',
    'Пример работы':'Example project',
    'Пример вашего будущего портфолио':'An example of your future portfolio',
    'Создать портфолио':'Create portfolio',
    'Уже есть аккаунт?':'Already have an account?',
    'Войти':'Sign in',
    'Создайте своё портфолио':'Create your portfolio',
    'С возвращением':'Welcome back',
    'Сохраните свой опыт и работы в одном месте. Выберите удобный способ начать.':'Keep your experience and work in one place. Choose how to get started.',
    'Войдите, чтобы продолжить работу над своим портфолио.':'Sign in to continue working on your portfolio.',
    'Продолжить с Google':'Continue with Google',
    'Продолжить с Apple':'Continue with Apple',
    'или через почту':'or with email',
    'Проверьте почту':'Check your email',
    'Код для входа на адрес':'Sign-in code for',
    'Код подтверждения':'Verification code',
    'Подтвердить и продолжить':'Verify and continue',
    'Получить код':'Get a code',
    'Изменить почту':'Change email',
    'Отправить повторно':'Resend code',
    'Без пароля. Вход по коду из письма.':'No password. Sign in with a code from your email.',
    'В макете письма не отправляются. Используйте код 123456.':'This prototype does not send emails. Use code 123456.',
    'Демонстрационный режим: Google и Apple откроют следующий экран без настоящей авторизации. Письма не отправляются.':'Demo mode: Google and Apple open the next screen without real authentication. No emails are sent.',
    'Нет аккаунта? Создать портфолио':'No account? Create portfolio',
    'Демонстрационный вход выполнен':'Demo sign-in complete',
    'Неверный код. Для макета введите 123456.':'Incorrect code. Enter 123456 for this prototype.',
    'Повторная отправка через':'Resend available in',
    'сек.':'sec.',
    'Демо-код: 123456. Письмо не отправлено.':'Demo code: 123456. No email was sent.',

    'Отзывы':'Reviews','Открыть отзывы':'Open reviews','из 5':'out of 5','Заказчик':'Client','Читать полностью':'Read more','Свернуть':'Show less','Отзывов пока нет':'No reviews yet','Здесь появятся впечатления заказчиков о работе со специалистом.':'Clients’ experiences working with this professional will appear here.','Демонстрационные отзывы для макета.':'Illustrative reviews for this prototype.',
    'Переместить вкладку ':'Move section ', ' выше':' up', ' ниже':' down','Удалить вкладку ':'Delete section ', 'Новая вкладка':'New section','Управлять категориями':'Manage categories','Категории работ':'Work categories','Создайте категории под вашу профессию.':'Create categories for your profession.','Переименование обновит категорию у всех связанных работ.':'Renaming updates all work in this category.','Название категории':'Category name','Например, ремонт квартир':'For example, apartment renovations','Удалить категорию':'Delete category','Создайте первую категорию или оставьте работы без категории.':'Create your first category or leave work uncategorized.','Добавить категорию':'Add category','Удаление категории не удаляет работы. Изменения применятся после сохранения.':'Deleting a category keeps your work. Changes apply when you save.','Новая категория сохранится вместе с работой. Поле можно оставить пустым.':'A new category is saved with your work. You can leave this field empty.','Категория':'Category','В этой категории пока нет работ.':'There is no work in this category yet.','Укажите название каждой категории.':'Enter a name for every category.','Названия категорий не должны повторяться.':'Category names must be unique.','Категории сохранены':'Categories saved','Заполните название и описание работы.':'Enter a title and description.','Редактировать работу':'Edit work','Заменить фото работы':'Replace project photo','Сохранить изменения':'Save changes','Удалить работу?':'Delete work?','Удалить работу':'Delete work','Работа и её фотографии будут удалены из этого браузера и портфолио.':'The work and its photos will be removed from this browser and portfolio.','Изменения работы сохранены':'Work changes saved','Работа удалена':'Work deleted','Галерея':'Gallery','Фото':'Photo','Фотографии работы':'Work photos','Предыдущее фото':'Previous photo','Следующее фото':'Next photo','Выбрать фотографию':'Choose photo','Описание фотографии пока не добавлено.':'No description has been added for this photo.','В этой работе пока нет фотографий.':'This work has no photos yet.','Добавить фотографии':'Add photos','Фотографии и описания':'Photos and descriptions','Первое фото станет обложкой работы. До 8 фото.':'The first photo becomes the cover. Up to 8 photos.','Переместить фото выше':'Move photo up','Переместить фото ниже':'Move photo down','Удалить фото':'Remove photo','Заменить фото':'Replace photo','Выбрать фото':'Choose photo','Описание фотографии':'Photo description','Что показано на этом фото?':'What does this photo show?','Добавить фотографию':'Add photo','Данные работы':'Work details','Можно добавить до 8 фотографий.':'You can add up to 8 photos.','Выберите фото для каждой записи или удалите пустую запись.':'Choose a photo for each entry or remove empty entries.','Дождитесь загрузки фотографии.':'Wait for the photo to finish loading.','Форматирование текста':'Text formatting','Жирный':'Bold','Курсив':'Italic','Маркированный список':'Bulleted list','Нумерованный список':'Numbered list','Добавить ссылку':'Add link','Убрать форматирование':'Remove formatting','Список':'List','Нумерация':'Numbering','Ссылка':'Link','Очистить':'Clear','Адрес ссылки':'Link address','Вставить ссылку':'Insert link','Форматируйте описание проекта, добавляйте списки и ссылки.':'Format the project description, add lists and links.','Введите ссылку с https://, http:// или mailto:.':'Enter an https://, http:// or mailto: link.','Настройки':'Settings','Личные данные':'Personal details','Контакты':'Contacts','Сертификаты':'Certificates','Профиль':'Profile','Приложение':'App','Язык интерфейса':'Interface language',
    'Фото, профессия и опыт':'Photo, profession and experience','Телефон, почта и мессенджеры':'Phone, email and messengers','Обучение и квалификация':'Training and qualifications',
    'Поделиться профилем':'Share profile','Восстановить демо-данные':'Restore demo data','Данные макета сохраняются в этом браузере.':'Prototype data is saved in this browser.',
    'Представьтесь и расскажите о своём опыте.':'Introduce yourself and describe your experience.','Выберите, как клиентам удобно связаться с вами.':'Choose how clients can reach you.',
    'Выбрать фото профиля':'Choose profile photo','Выбрать обложку':'Choose cover image','Имя и фамилия':'Full name','Профессия':'Profession','Город':'City','Опыт работы:':'Experience:','Опыт работы':'Experience',
    'Коротко о себе':'Short introduction','О себе':'About me','Услуги и навыки':'Services and skills','Перечислите через запятую.':'Separate items with commas.','Например, 8 лет':'For example, 8 years',
    'Изменения появятся в вашем профиле.':'Changes will appear in your profile.','Телефон':'Phone','Электронная почта':'Email','Пустые контакты можно заполнить позже.':'You can fill in empty contacts later.',
    'Отмена':'Cancel','Сохранить':'Save','Назад к работам':'Back to work','Назад':'Back','Главная':'Home','Главный':'Home','Работы':'Work','Мои работы':'My work','Карточка работы':'Work details',
    'Добавить сертификат':'Add certificate','Добавьте подтверждения вашего обучения.':'Add evidence of your training.','Вы решаете, какие записи видны в профиле.':'You choose which records appear on your profile.',
    'Видно в профиле':'Visible on profile','Не опубликован':'Unpublished','Ваш первый сертификат':'Your first certificate','Можно сохранить запись для себя или опубликовать её в портфолио.':'Keep a record private or publish it in your portfolio.',
    'Раздел виден только при наличии опубликованного сертификата.':'This section appears only when a certificate is published.',
    'Сертификат не найден':'Certificate not found','Вернуться к сертификатам':'Back to certificates','Новый сертификат':'New certificate','Редактировать сертификат':'Edit certificate',
    'Укажите название и организацию, которая выдала сертификат.':'Enter the title and the issuing organization.','Фото сертификата':'Certificate photo','Название курса или сертификата':'Course or certificate title','Название':'Title','Кем выдан':'Issued by','Год':'Year',
    'Опубликовать в профиле':'Publish on profile','Неопубликованный сертификат виден только вам.':'Only you can see an unpublished certificate.',
    'Удалить сертификат?':'Delete certificate?','Удалить сертификат':'Delete certificate','Запись будет удалена из этого браузера и вашего портфолио.':'The record will be removed from this browser and your portfolio.','Удалить':'Delete',
    'Выберите язык кнопок, меню и подсказок.':'Choose the language for buttons, menus and hints.','Тексты вашего портфолио сохранятся без изменений.':'Your portfolio content will stay unchanged.','Английский':'English',
    'Настройки сохранены':'Settings saved','Сертификат сохранён':'Certificate saved','Сертификат удалён':'Certificate deleted','Не удалось сохранить язык. Проверьте хранилище браузера.':'Could not save the language. Check browser storage.',
    'Укажите имя, профессию и город.':'Enter your name, profession and city.','Укажите полную ссылку с https:// для соцсетей.':'Enter a full https:// link for social networks.',
    'Укажите корректный номер телефона, например +998 90 123 45 67.':'Enter a valid phone number, such as +998 90 123 45 67.','Укажите название и организацию.':'Enter a title and issuing organization.',
    'Не удалось сохранить изменения в браузере':'Could not save changes in this browser','JPG, PNG или WebP, до 2 МБ':'JPG, PNG or WebP, up to 2 MB',
    'Выберите JPG, PNG или WebP размером до 2 МБ.':'Choose a JPG, PNG or WebP file up to 2 MB.','Не удалось открыть изображение. Выберите другой файл.':'Could not open the image. Choose another file.','Выбранная фотография':'Selected photo',
    'Обложка портфолио':'Portfolio cover','Folio, главная':'Folio, home','Управление профилем':'Manage profile','Открыт к предложениям':'Open to opportunities','Контакты специалиста':'Professional contacts','Выберите удобный способ связаться':'Choose how to get in touch',
    'Изменить профиль':'Edit profile','Настроить вкладки':'Configure sections','Добавить работу':'Add work','Показать / скрыть демо-сертификат':'Show / hide demo certificate','Восстановить демо':'Restore demo','Разделы портфолио':'Portfolio sections',
    'Первая работа ждёт вас':'Add your first project','Добавьте фотографии и расскажите о результате.':'Add photos and describe the result.','Категории работ':'Work categories','Все':'All',
    'Каждая работа рассказывает о вашем опыте.':'Each project tells a story about your experience.','Соберите лучшие в одном месте.':'Bring your best work together.',
    'Работа не найдена':'Work not found','Этой работы больше нет в портфолио.':'This project is no longer in the portfolio.','Вернуться к работам':'Back to work','Поделиться работой':'Share work',
    'О проекте':'About the project','Моя роль':'My role','Результат':'Result','Фотографии проекта':'Project photos','Обсудить похожий проект':'Discuss a similar project','Не указан':'Not specified','Чем могу помочь':'How I can help',
    'Посмотреть сертификаты':'View certificates','Это пример профиля. Имя, опыт и проекты можно изменить.':'This is a sample profile. You can edit the name, experience and projects.',
    'Обучение и профессиональное развитие.':'Training and professional development.','Опубликован в портфолио':'Published in portfolio','Управлять сертификатами':'Manage certificates',
    'Публикация сертификата не означает проверку его подлинности.':'Publishing a certificate does not verify its authenticity.','Раздел пока скрыт':'Section currently hidden','Сертификаты появятся после публикации первой записи.':'Certificates will appear after the first record is published.',
    'Раздел недоступен':'Section unavailable','Эта вкладка скрыта или удалена.':'This section is hidden or has been deleted.','Добавьте описание в настройках этой вкладки.':'Add a description in this section’s settings.','Добавить описание':'Add description',
    'Вкладки профиля':'Profile sections','Переименуйте разделы, измените порядок или добавьте свою вкладку, например «Услуги».':'Rename sections, reorder them or add a custom section, such as Services.',
    'Показывать':'Show','Название вкладки':'Section title','Содержание':'Content','Расскажите об услугах, подходе или условиях работы':'Describe your services, approach or working conditions',
    'Показывает опубликованные работы.':'Displays published work.','Показывает информацию из вашего профиля.':'Displays your profile information.','Появится только при наличии опубликованного сертификата.':'Appears only when a certificate is published.',
    'Добавить вкладку':'Add section','Настройки сохраняются в этом браузере. Оставьте хотя бы одну вкладку видимой.':'Settings are saved in this browser. Keep at least one section visible.',
    'Создание профиля':'Create profile','Расскажите, кто вы и что умеете.':'Tell people who you are and what you do.','Демо-данные можно заменить своими.':'Replace the demo data with your own.',
    'Любая профессия: строитель, дизайнер, фотограф и другие.':'Any profession: builder, designer, photographer and more.','Что вы делаете лучше всего?':'What do you do best?',
    'Сертификат':'Certificate','необязательно':'optional','Опубликовать сертификат в профиле':'Publish certificate on profile','* Обязательные поля. Данные сохраняются только в этом браузере.':'* Required fields. Data is saved only in this browser.',
    'Новая работа':'New work','Покажите, что получилось.':'Show what you created.','Добавьте контекст, чтобы работу оценили.':'Add context to help people understand the work.','Добавить фото работы':'Add project photo',
    'Название работы':'Project title','Например, ремонт квартиры в Ташкенте':'For example, an apartment renovation in Tashkent','Категория *':'Category *','Выберите или введите свою':'Choose a category or enter your own','Категории подходят для любой профессии.':'Categories work for any profession.',
    'Архитектура':'Architecture','Строительство':'Construction','Ремонт':'Renovation','Интерьер':'Interior','Дизайн':'Design','Фотография':'Photography','Другая работа':'Other work',
    'О работе':'About the work','Какая была задача и как вы её решили?':'What was the task and how did you solve it?','Ваша роль':'Your role','Что именно сделали вы?':'What did you contribute?','Чего удалось добиться?':'What did you achieve?','Место':'Location','Город или «Удалённо»':'City or Remote',
    'Опубликовать':'Publish','Без фото карточка появится с заглушкой. Публикация в макете сохраняет работу только в этом браузере.':'Without a photo, the card uses a placeholder. Publishing in this prototype saves the work only in this browser.',
    'Создание работы':'Create work','Работа':'Work','Раздел':'Section','Укажите название каждой вкладки.':'Enter a title for every section.','Оставьте хотя бы одну вкладку, видимость которой не зависит от сертификатов.':'Keep at least one section whose visibility does not depend on certificates.',
    'Не удалось сохранить вкладки. Проверьте доступность хранилища браузера.':'Could not save sections. Check browser storage.','Вкладки профиля сохранены':'Profile sections saved',
    'Не удалось сохранить профиль. Возможно, память браузера заполнена или отключена. Попробуйте фото меньшего размера.':'Could not save the profile. Browser storage may be full or disabled. Try a smaller photo.','Профиль сохранён в этом браузере':'Profile saved in this browser',
    'Заполните название, категорию и описание работы.':'Enter a title, category and description.','Не удалось сохранить работу. Попробуйте фото меньшего размера или разрешите хранение данных браузером.':'Could not save the work. Try a smaller photo or enable browser storage.','Работа добавлена в локальное портфолио':'Work added to the local portfolio',
    'Демо-сертификат скрыт':'Demo certificate hidden','Раздел «Сертификаты» появился в профиле':'The Certificates section now appears on your profile','Ссылка на локальный макет скопирована':'Local prototype link copied','Скопируйте ссылку на макет из адресной строки':'Copy the prototype link from the address bar',
    'Это демо-контакт. Добавьте свой в настройках профиля.':'This is a demo contact. Add yours in profile settings.','Не удалось восстановить демо: хранилище недоступно':'Could not restore the demo: storage unavailable','Демонстрационные данные восстановлены':'Demo data restored',
    'Сохранённые данные недоступны. Загружен демонстрационный профиль.':'Saved data is unavailable. A demo profile has been loaded.',
    'Навигация по макету':'Prototype navigation','Ваш опыт.':'Your experience.','Ваша работа.':'Your work.','Ваше портфолио.':'Your portfolio.','Экраны приложения':'App screens','Добавить демо-сертификат':'Add demo certificate','Скрыть демо-сертификат':'Hide demo certificate','Дизайн-референс ↗':'Design reference ↗',
    'Интерактивный макет':'Interactive prototype','Данные сохраняются в этом браузере':'Data is saved in this browser','Портфолио специалиста':'Professional portfolio','Основная навигация':'Main navigation','Информация о макете':'About this prototype','МОБИЛЬНОЕ ПОРТФОЛИО':'MOBILE PORTFOLIO',
    'Пусть ваши':'Let your','работы говорят':'work speak','за вас.':'for you.','Один профиль для опыта,':'One profile for experience,','проектов и новых возможностей.':'projects and new opportunities.',
    'Восстановить демо?':'Restore demo?','Профиль и добавленные вами работы будут заменены демонстрационными данными.':'Your profile and added work will be replaced with demo data.','Восстановить':'Restore'
  };
  let language = 'ru';
  try { if (localStorage.getItem(STORAGE_KEY) === 'en') language = 'en'; } catch {}
  const keys = Object.keys(en).sort((a,b)=>b.length-a.length);
  const pattern = new RegExp(keys.map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  const originals = new WeakMap();
  function text(value) { return language === 'en' ? (en[value] || value) : value; }
  function literal(value) { return language === 'en' ? value.replace(pattern,match=>en[match]) : value; }
  function translateShell(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('#app,#preview-nav,#bottom-nav,#toast,#toggle-certificate,script,style')) continue;
      if (!originals.has(node)) originals.set(node,node.textContent);
      node.textContent = literal(originals.get(node));
    }
    root.querySelectorAll('[aria-label]').forEach(element=>{
      if (element.closest('#app,#preview-nav,#bottom-nav')) return;
      if (!originals.has(element)) originals.set(element,element.getAttribute('aria-label'));
      element.setAttribute('aria-label',text(originals.get(element)));
    });
  }
  window.FolioI18n = {
    get language() { return language; }, text,literal,
    setLanguage(value) {
      if (!['ru','en'].includes(value)) return false;
      try { localStorage.setItem(STORAGE_KEY,value); language = value; return true; } catch { return false; }
    },
    updateShell() {
      document.documentElement.lang = language;
      translateShell(document.body);
      document.querySelector('#toggle-certificate').textContent = text(document.querySelector('#toggle-certificate').textContent);
    }
  };
})();
