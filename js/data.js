// All people, projects and certificates in the seed are illustrative demo data.
window.FOLIO_SEED = {
  profileTabs: [
    {id:'works', type:'works', title:'Работы', enabled:true},
    {id:'products', type:'products', title:'Продукты', enabled:true},
    {id:'about', type:'about', title:'О себе', enabled:true},
    {id:'reviews', type:'reviews', title:'Отзывы', enabled:true},
    {id:'certificates', type:'certificates', title:'Сертификаты', enabled:true}
  ],
  profile: {
    name: 'Александр Иванов', profession: 'Архитектор', city: 'Ташкент, Узбекистан',
    headline: 'Создаю пространства, в которых хочется жить.',
    about: 'Проектирую частные дома и интерьеры. Помогаю пройти весь путь: от первой идеи и планировки до продуманных деталей готового пространства. В работе ценю ясность, качество и внимание к вашему образу жизни.',
    experience: '8 лет', skills: ['Архитектура', 'Дизайн интерьера', 'Авторский надзор'],
    avatar: 'assets/images/avatar.jpg', cover: 'assets/images/house.jpg',
    phone: '', email: '', instagram: '', telegram: '', whatsapp: ''
  },
  works: [
    {id:'house', title:'Дом в Чарваке', category:'Архитектура', location:'Чарвак', year:'2025', image:'assets/images/house.jpg', images:['assets/images/house.jpg','assets/images/cover.jpg'], description:'Частный дом с открытой планировкой и большими окнами. Главная задача: связать внутреннее пространство с садом и сохранить ощущение уединения.', role:'Концепция, проектирование и авторский надзор', result:'Светлое пространство для жизни с семьёй, природные материалы и выход на террасу из общей зоны.'},
    {id:'interior', title:'Тёплый минимализм', category:'Интерьер', location:'Ташкент', year:'2025', image:'assets/images/interior.jpg', images:['assets/images/interior.jpg','assets/images/cover.jpg'], description:'Интерьер квартиры для молодой семьи. Спокойные оттенки, натуральное дерево и удобное хранение в каждой комнате.', role:'Планировка и дизайн интерьера', result:'Объединили кухню и гостиную, организовали отдельную рабочую зону и скрытые системы хранения.'},
    {id:'space', title:'Пространство для жизни', category:'Интерьер', location:'Ташкент', year:'2024', image:'assets/images/cover.jpg', images:['assets/images/cover.jpg'], description:'Переосмысление жилого пространства с акцентом на естественное освещение и удобные повседневные сценарии.', role:'Дизайн и подбор материалов', result:'Сохранили простор, добавили функциональные зоны и тактильные фактуры.'}
  ],
  products: [],
  productCategories: [],
  reviews: [
    {id:'review-house', name:'Дмитрий К.', rating:5, date:'2026-09-18', workId:'house', text:'Обратились с идеей дома для семьи. Александр помог продумать планировку, объяснил решения по материалам и освещению. На каждом этапе было понятно, что происходит и какие вопросы нужно решить. Особенно понравилось, как удалось связать гостиную с террасой и садом. Получилось именно то пространство, которое мы представляли.'},
    {id:'review-interior', name:'Марина С.', rating:5, date:'2026-08-04', workId:'interior', text:'Очень внимательный подход к нашим привычкам и пожеланиям. В квартире стало больше света и удобного хранения. Все решения обсуждали заранее, результатом довольны.'},
    {id:'review-consultation', name:'Тимур А.', rating:4, date:'2026-06-12', text:'Заказывал консультацию по перепланировке. Получил понятные рекомендации и несколько вариантов. На подготовку понадобилось немного больше времени, чем ожидал, но итог помог принять решение.'}
  ],
  certificates: []
};

// Per-photo descriptions for the illustrative portfolio. Existing browser portfolios migrate separately.
window.FOLIO_SEED.works.forEach(work => {
  work.photos = work.images.map((src,index)=>({id:'photo-'+(index+1),src,caption:index === 0 ? work.description : 'Внутреннее пространство: естественный свет и открытая планировка.'}));
});
