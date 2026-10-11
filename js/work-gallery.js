// Native horizontal scrolling supplies touch gestures; controls and captions stay synchronized.
window.initWorkGallery = function(root) {
  const track = root.querySelector('.work-gallery-track');
  if (!track) return () => {};
  const slides = [...track.children];
  const buttons = [...root.querySelectorAll('[data-gallery-index]')];
  const caption = root.querySelector('.photo-caption-text');
  const label = root.querySelector('.photo-caption-label');
  const counter = root.querySelector('.gallery-counter');
  const previous = root.querySelector('[data-gallery-step="-1"]');
  const next = root.querySelector('[data-gallery-step="1"]');
  const status = root.querySelector('.gallery-status');
  let index = -1, frame = 0;
  const controller = new AbortController();
  const update = value => {
    value = Math.max(0,Math.min(slides.length-1,value));
    if (value === index) return;
    index = value;
    caption.textContent = slides[index].dataset.caption || window.FolioI18n.text('Описание фотографии пока не добавлено.');
    label.textContent = `${window.FolioI18n.text('Фото')} ${index+1}`;
    counter.textContent = `${index+1} / ${slides.length}`;
    status.textContent = `${window.FolioI18n.text('Фото')} ${index+1} / ${slides.length}. ${caption.textContent}`;
    previous.disabled = index === 0; next.disabled = index === slides.length-1;
    slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i !== index)));
    buttons.forEach((button,i)=>{
      if (i === index) button.setAttribute('aria-current','true');
      else button.removeAttribute('aria-current');
    });
    const selected = buttons[index];
    if (selected) {
      const rail = selected.parentElement;
      if (selected.offsetLeft < rail.scrollLeft || selected.offsetLeft+selected.offsetWidth > rail.scrollLeft+rail.clientWidth)
        rail.scrollTo({left:selected.offsetLeft-rail.clientWidth/2+selected.offsetWidth/2,behavior:'instant'});
    }
  };
  const go = value => {
    const target = Math.max(0,Math.min(slides.length-1,value));
    track.scrollTo({left:track.clientWidth*target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  root.addEventListener('click',event=>{
    const step = event.target.closest('[data-gallery-step]');
    const thumbnail = event.target.closest('[data-gallery-index]');
    if (step) go(index+Number(step.dataset.galleryStep));
    if (thumbnail) go(Number(thumbnail.dataset.galleryIndex));
  },{signal:controller.signal});
  root.addEventListener('keydown',event=>{
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();go(index+(event.key === 'ArrowRight' ? 1 : -1));}
    if (event.key === 'Home' || event.key === 'End') {event.preventDefault();go(event.key === 'Home' ? 0 : slides.length-1);}
  },{signal:controller.signal});
  track.addEventListener('scroll',()=>{
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(()=>update(Math.round(track.scrollLeft/track.clientWidth)));
  },{passive:true,signal:controller.signal});
  const resize = new ResizeObserver(()=>{track.scrollTo({left:Math.max(index,0)*track.clientWidth,behavior:'instant'});});
  resize.observe(track); update(0);
  return () => {controller.abort();resize.disconnect();cancelAnimationFrame(frame);};
};
