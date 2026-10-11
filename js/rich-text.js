window.FolioRichText = (() => {
  const escape = text => String(text || '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const allowed = new Set(['P','BR','STRONG','B','EM','I','UL','OL','LI','A','H2','H3','BLOCKQUOTE']);
  const forbidden = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','IMG','INPUT','FORM','TEXTAREA','BUTTON','VIDEO','AUDIO']);
  function validLink(value) {
    try { return ['https:','http:','mailto:'].includes(new URL(value).protocol); } catch { return false; }
  }
  function sanitize(value) {
    const doc = new DOMParser().parseFromString(String(value || ''),'text/html');
    function clean(node) {
      if (node.nodeType === Node.TEXT_NODE) return escape(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE || forbidden.has(node.tagName)) return '';
      const children = [...node.childNodes].map(clean).join('');
      if (!allowed.has(node.tagName)) return node.tagName === 'DIV' ? `<p>${children}</p>` : children;
      const tag = ({B:'strong',I:'em'})[node.tagName] || node.tagName.toLowerCase();
      if (tag === 'br') return '<br>';
      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        return validLink(href) ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${children}</a>` : children;
      }
      return `<${tag}>${children}</${tag}>`;
    }
    return [...doc.body.childNodes].map(clean).join('');
  }
  function plain(value) {
    const doc = new DOMParser().parseFromString(sanitize(value),'text/html');
    doc.querySelectorAll('br').forEach(node=>node.replaceWith('\n'));
    doc.querySelectorAll('p,h2,h3,li,blockquote').forEach(node=>node.append('\n'));
    return doc.body.textContent.replace(/\n{3,}/g,'\n\n').trim();
  }
  const fromPlain = value => '<p>'+escape(value).replace(/\r?\n/g,'<br>')+'</p>';
  function init(root) {
    const editor = root.querySelector('#description-editor');
    if (!editor) return () => {};
    const wrapper = editor.closest('.rich-text-field');
    const hidden = wrapper.querySelector('[name=description]');
    const panel = wrapper.querySelector('.rich-link-panel');
    const input = wrapper.querySelector('.rich-link-url');
    const error = wrapper.querySelector('.rich-link-error');
    const controller = new AbortController();
    let range = null;
    const sync = () => {
      hidden.value = plain(editor.innerHTML);
      for (const button of wrapper.querySelectorAll('[data-rich-command]')) {
        if (['bold','italic','insertUnorderedList','insertOrderedList'].includes(button.dataset.richCommand)) button.setAttribute('aria-pressed',String(document.queryCommandState(button.dataset.richCommand)));
      }
    };
    const remember = () => {
      const selection = window.getSelection();
      if (selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) {range = selection.getRangeAt(0).cloneRange();sync();}
    };
    const restore = () => {
      editor.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      if (range && editor.contains(range.commonAncestorContainer)) selection.addRange(range);
      else {const end = document.createRange();end.selectNodeContents(editor);end.collapse(false);selection.addRange(end);}
    };
    editor.addEventListener('input',sync,{signal:controller.signal});
    document.addEventListener('selectionchange',remember,{signal:controller.signal});
    // Pasted documents never bring their scripts, styles or arbitrary attributes into the editor.
    editor.addEventListener('paste',event=>{
      event.preventDefault();
      const data = event.clipboardData;
      const value = data.getData('text/html');
      document.execCommand('insertHTML',false,value ? sanitize(value) : fromPlain(data.getData('text/plain')));sync();
    },{signal:controller.signal});
    editor.addEventListener('drop',event=>event.preventDefault(),{signal:controller.signal});
    wrapper.addEventListener('mousedown',event=>{if(event.target.closest('[data-rich-command]'))event.preventDefault();},{signal:controller.signal});
    wrapper.addEventListener('click',event=>{
      const button = event.target.closest('[data-rich-command]');
      if (!button) return;
      const command = button.dataset.richCommand;
      if (command === 'link') {
        remember();panel.hidden = false;error.textContent = '';input.value = '';input.focus();return;
      }
      if (command === 'cancel-link') {panel.hidden = true;restore();return;}
      if (command === 'apply-link') {
        const url = input.value.trim();
        if (!validLink(url)) {error.textContent = window.FolioI18n.text('Введите ссылку с https://, http:// или mailto:.');return;}
        restore();
        const collapsed = window.getSelection().isCollapsed;
        if (collapsed) document.execCommand('insertText',false,url);
        // Select an inserted URL when there was no selected text.
        if (collapsed) {
          const selection = window.getSelection();
          if (selection.focusNode?.nodeType === Node.TEXT_NODE) {
            const linkRange = document.createRange();
            linkRange.setStart(selection.focusNode,Math.max(0,selection.focusOffset-url.length));linkRange.setEnd(selection.focusNode,selection.focusOffset);selection.removeAllRanges();selection.addRange(linkRange);
          }
        }
        document.execCommand('createLink',false,url);panel.hidden = true;
      } else {restore();document.execCommand(command,false,null);}
      remember();sync();
    },{signal:controller.signal});
    panel.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();panel.querySelector('[data-rich-command=apply-link]').click();}if(event.key==='Escape'){event.preventDefault();panel.hidden=true;restore();}},{signal:controller.signal});
    sync();
    return () => controller.abort();
  }
  return {sanitize,plain,fromPlain,validLink,init};
})();
