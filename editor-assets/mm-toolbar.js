/* MiniMessage field enhancement for the bundled zMenu editor. */
(function () {
  'use strict';

  const CUSTOM_TAGS_KEY = 'zmenu-mm-custom-tags';
  const PLACEHOLDERS = [
    'player_name', 'player_displayname', 'player_uuid', 'player_world',
    'player_x', 'player_y', 'player_z', 'player_level', 'player_health',
    'player_food_level', 'server_online', 'server_max_players', 'server_tps'
  ];
  const COLORS = [
    ['black', '#000000'], ['dark_blue', '#0000aa'], ['dark_green', '#00aa00'], ['dark_aqua', '#00aaaa'],
    ['dark_red', '#aa0000'], ['dark_purple', '#aa00aa'], ['gold', '#ffaa00'], ['gray', '#aaaaaa'],
    ['dark_gray', '#555555'], ['blue', '#5555ff'], ['green', '#55ff55'], ['aqua', '#55ffff'],
    ['red', '#ff5555'], ['light_purple', '#ff55ff'], ['yellow', '#ffff55'], ['white', '#ffffff']
  ];
  const SYMBOLS = ['❤', '✔', '✘', '★', '☆', '❄', '✂', 'ℹ', '⚑', '⚠', '⚔', '♪', '♫', '♠', '♯', '♡', '♢', '♣', '♥', '♦', '☯', '☮', '☠', '☑', '▲', '▼', '✉', '☁', '✎', '©', '®', 'Σ', '←', '→', '↑', '↓', '«', '»', '±', '×', '÷', '≠', 'π', '¥', '€', '●', '•', 'Ω', '☀', '◆', '◇', '○', '◎', '■', '□', '◀', '▶'];
  const SPRITE_FALLBACK = ['acacia_boat', 'apple', 'arrow', 'anvil', 'beacon', 'book', 'chest', 'diamond', 'diamond_sword', 'emerald', 'enchanted_book', 'gold_ingot', 'iron_ingot', 'nether_star', 'player_head', 'shield', 'totem_of_undying'].map(function (name) {
    return { name: name, css: 'icon-minecraft-' + name.replace(/_/g, '-') };
  });
  const TOOLBAR_CONFIG_KEY = 'mm_toolbar_config';
  const TOOLBAR_ITEMS = [
    ['decorations', 'Decorations', 'fa-bold'],
    ['colors', 'Colors', 'fa-palette'],
    ['gradient', 'Gradient', 'fa-wand-magic-sparkles'],
    ['rainbow', 'Rainbow', 'fa-rainbow'],
    ['pride', 'Pride', 'fa-flag'],
    ['hover', 'Hover', 'fa-comment-dots'],
    ['click_url', 'Click URL', 'fa-link'],
    ['bold_color', 'Bold + Color', 'fa-star'],
    ['transition', 'Transition', 'fa-sliders'],
    ['head', 'Player Head', 'fa-user'],
    ['command', 'Command', 'fa-terminal'],
    ['custom_tags', 'Custom Tags', 'fa-tags'],
    ['small_text', 'Small Text', 'fa-text-height'],
    ['icons', 'Icons', 'fa-icons'],
    ['sprites', 'Sprites', 'fa-cube']
  ];

  const $ = (selector, root) => (root || document).querySelector(selector);

  function escapeHtml(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(value) {
    let html = escapeHtml(value);
    html = html.replace(/(&lt;\/?)(#[0-9a-fA-F]{6}|[a-zA-Z_]+)(?::([^&]*?))?(&gt;)/g, function (_, open, name, args, close) {
      const kind = /^(black|dark_blue|dark_green|dark_aqua|dark_red|dark_purple|gold|gray|dark_gray|blue|green|aqua|red|light_purple|yellow|white|color)$/i.test(name) ? 'color' : /^(bold|italic|underlined|strikethrough|obfuscated)$/i.test(name) ? 'deco' : /^(hover|click)$/i.test(name) ? 'event' : 'tag';
      return '<span class="zmm-sh-bracket">' + open + '</span><span class="zmm-sh-' + kind + '">' + name + (args ? ':' + args : '') + '</span><span class="zmm-sh-bracket">' + close + '</span>';
    });
    return html + '\n';
  }

  function setNativeValue(element, value) {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
    setter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function getCustomTags() {
    return [];
  }

  function setCustomTags(tags) {
    return tags;
  }

  function getToolbarConfig() {
    const defaults = TOOLBAR_ITEMS.map(function (item) { return { id: item[0], visible: true }; });
    return defaults;
  }

  function saveToolbarConfig(config) {
    return config;
  }

  function applyToolbarConfig(toolbar) {
    const config = getToolbarConfig();
    const settings = new Map(config.map(function (item, index) {
      return [item.id, { visible: item.visible !== false, order: index }];
    }));
    toolbar.querySelectorAll('[data-toolbar-id]').forEach(function (element) {
      const setting = settings.get(element.dataset.toolbarId);
      if (!setting) return;
      element.hidden = !setting.visible;
      element.style.order = String(setting.order);
    });
  }

  function openToolbarConfig(toolbar) {
    closeOpenPanels();
    const overlay = document.createElement('div');
    overlay.className = 'zmm-modal-overlay zmm-toolbar-config-overlay';
    const modal = document.createElement('div');
    modal.className = 'zmm-modal zmm-toolbar-config';
    modal.innerHTML = '<div class="zmm-modal-title"><strong>Configure Toolbar</strong><button type="button" class="zmm-modal-close" aria-label="Close">&times;</button></div><p class="zmm-toolbar-config-help">Drag to reorder, toggle to show or hide toolbar items.</p><div class="zmm-toolbar-config-list"></div><div class="zmm-modal-actions"><button type="button" class="zmm-toolbar-config-reset">Reset</button><button type="button" class="zmm-confirm">Done</button></div>';
    const list = $('.zmm-toolbar-config-list', modal);
    let config = getToolbarConfig();
    let draggedId = null;

    function renderList() {
      list.innerHTML = '';
      config.forEach(function (item) {
        const definition = TOOLBAR_ITEMS.find(function (entry) { return entry[0] === item.id; });
        if (!definition) return;
        const row = document.createElement('div');
        row.className = 'zmm-toolbar-config-item' + (item.visible ? '' : ' is-hidden');
        row.draggable = true;
        row.dataset.toolbarId = item.id;
        const icon = document.createElement('i');
        icon.className = 'fa-solid ' + definition[2] + ' zmm-toolbar-config-icon';
        const label = document.createElement('span');
        label.className = 'zmm-toolbar-config-label';
        label.textContent = definition[1];
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'zmm-toolbar-config-toggle';
        toggle.title = item.visible ? 'Hide' : 'Show';
        toggle.setAttribute('aria-label', toggle.title + ' ' + definition[1]);
        toggle.innerHTML = '<i class="fa-solid ' + (item.visible ? 'fa-toggle-on' : 'fa-toggle-off') + '"></i>';
        toggle.addEventListener('click', function () {
          item.visible = !item.visible;
          saveToolbarConfig(config);
          applyToolbarConfig(toolbar);
          renderList();
        });
        row.addEventListener('dragstart', function () { draggedId = item.id; row.classList.add('is-dragging'); });
        row.addEventListener('dragend', function () { draggedId = null; row.classList.remove('is-dragging'); });
        row.addEventListener('dragover', function (event) { event.preventDefault(); row.classList.add('is-drag-over'); });
        row.addEventListener('dragleave', function () { row.classList.remove('is-drag-over'); });
        row.addEventListener('drop', function (event) {
          event.preventDefault();
          row.classList.remove('is-drag-over');
          if (!draggedId || draggedId === item.id) return;
          const from = config.findIndex(function (entry) { return entry.id === draggedId; });
          const to = config.findIndex(function (entry) { return entry.id === item.id; });
          if (from < 0 || to < 0) return;
          const moved = config.splice(from, 1)[0];
          config.splice(to, 0, moved);
          saveToolbarConfig(config);
          applyToolbarConfig(toolbar);
          renderList();
        });
        row.appendChild(icon);
        row.appendChild(label);
        row.appendChild(toggle);
        list.appendChild(row);
      });
    }

    const close = function () { overlay.remove(); };
    $('.zmm-modal-close', modal).addEventListener('click', close);
    $('.zmm-confirm', modal).addEventListener('click', close);
    $('.zmm-toolbar-config-reset', modal).addEventListener('click', function () {
      config = TOOLBAR_ITEMS.map(function (item) { return { id: item[0], visible: true }; });
      saveToolbarConfig(config);
      applyToolbarConfig(toolbar);
      renderList();
    });
    overlay.addEventListener('mousedown', function (event) { if (event.target === overlay) close(); });
    renderList();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  function createButton(icon, tooltip, onClick, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mm-toolbar-btn' + (className ? ' ' + className : '');
    button.dataset.tooltip = tooltip;
    button.setAttribute('aria-label', tooltip);
    button.innerHTML = icon;
    button.addEventListener('click', onClick);
    return button;
  }

  function closeOpenPanels(except) {
    document.querySelectorAll('.zmm-popover, .zmm-modal-overlay, .mm-sprites-dropdown').forEach(function (panel) {
      if (panel !== except && (!except || !panel.contains(except))) panel.remove();
    });
  }

  function insertText(editor, before, after, sample) {
    const input = editor.input;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = input.value.slice(start, end);
    const content = selected || sample || '';
    const value = input.value.slice(0, start) + before + content + after + input.value.slice(end);
    editor.update(value);
    const cursorStart = start + before.length;
    const cursorEnd = cursorStart + content.length;
    requestAnimationFrame(function () {
      input.focus();
      input.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function insertAtCursor(editor, value) {
    const input = editor.input;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    editor.update(input.value.slice(0, start) + value + input.value.slice(end));
    requestAnimationFrame(function () {
      input.focus();
      input.setSelectionRange(start + value.length, start + value.length);
    });
  }

  function replaceSelection(editor, value) {
    const input = editor.input;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    editor.update(input.value.slice(0, start) + value + input.value.slice(end));
    requestAnimationFrame(function () {
      input.focus();
      input.setSelectionRange(start, start + value.length);
    });
  }

  function openPopover(anchor, body) {
    closeOpenPanels();
    const popover = document.createElement('div');
    popover.className = 'zmm-popover';
    popover.appendChild(body);
    document.body.appendChild(popover);
    const rect = anchor.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - popover.offsetWidth - 8);
    popover.style.top = Math.min(window.innerHeight - popover.offsetHeight - 8, rect.bottom + 7) + 'px';
    popover.style.left = Math.max(8, Math.min(maxLeft, rect.left)) + 'px';
    return popover;
  }

  function openDialog(title, fields, onConfirm) {
    closeOpenPanels();
    const overlay = document.createElement('div');
    overlay.className = 'zmm-modal-overlay';
    const modal = document.createElement('form');
    modal.className = 'zmm-modal';
    modal.innerHTML = '<div class="zmm-modal-title"><strong></strong><button type="button" class="zmm-modal-close" aria-label="关闭">&times;</button></div><div class="zmm-modal-fields"></div><div class="zmm-modal-actions"><button type="button" class="zmm-cancel">取消</button><button type="submit" class="zmm-confirm">插入</button></div>';
    $('strong', modal).textContent = title;
    const fieldBox = $('.zmm-modal-fields', modal);
    const inputs = {};
    fields.forEach(function (field) {
      const label = document.createElement('label');
      label.className = 'zmm-modal-label';
      label.textContent = field.label;
      const input = document.createElement(field.multiline ? 'textarea' : 'input');
      input.className = 'zmm-modal-input';
      input.name = field.name;
      input.placeholder = field.placeholder || '';
      input.value = field.value || '';
      if (!field.multiline) input.type = field.type || 'text';
      if (field.required) input.required = true;
      label.appendChild(input);
      fieldBox.appendChild(label);
      inputs[field.name] = input;
    });
    const close = function () { overlay.remove(); };
    $('.zmm-modal-close', modal).addEventListener('click', close);
    $('.zmm-cancel', modal).addEventListener('click', close);
    overlay.addEventListener('mousedown', function (event) { if (event.target === overlay) close(); });
    modal.addEventListener('submit', function (event) {
      event.preventDefault();
      const values = {};
      Object.keys(inputs).forEach(function (name) { values[name] = inputs[name].value.trim(); });
      onConfirm(values, close);
    });
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    requestAnimationFrame(function () { (inputs[fields[0].name] || modal).focus(); });
  }

  function createColorPicker(editor, button) {
    const body = document.createElement('div');
    body.className = 'zmm-color-popover';
    body.innerHTML = '<div class="zmm-popover-label">Minecraft 颜色</div><div class="zmm-colors"></div><div class="zmm-popover-label">十六进制颜色</div><div class="zmm-hex-row"><input type="color" value="#ff5555"><input type="text" value="#ff5555" maxlength="7"><button type="button">插入</button></div>';
    const grid = $('.zmm-colors', body);
    COLORS.forEach(function (entry) {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'zmm-swatch';
      swatch.style.background = entry[1];
      swatch.title = entry[0];
      swatch.addEventListener('click', function () { insertText(editor, '<' + entry[0] + '>', '</' + entry[0] + '>', 'text'); closeOpenPanels(); });
      grid.appendChild(swatch);
    });
    const color = $('input[type="color"]', body);
    const hex = $('input[type="text"]', body);
    color.addEventListener('input', function () { hex.value = color.value; });
    hex.addEventListener('input', function () { if (/^#[0-9a-f]{6}$/i.test(hex.value)) color.value = hex.value; });
    $('button', $('.zmm-hex-row', body)).addEventListener('click', function () {
      const value = /^#[0-9a-f]{6}$/i.test(hex.value) ? hex.value.toLowerCase() : '#ffffff';
      insertText(editor, '<' + value + '>', '</color>', 'text');
      closeOpenPanels();
    });
    openPopover(button, body);
  }

  function createSymbolsPicker(editor, button) {
    const body = document.createElement('div');
    body.className = 'zmm-symbol-popover';
    body.innerHTML = '<div class="zmm-popover-label">Minecraft 符号</div><div class="zmm-symbols"></div>';
    const grid = $('.zmm-symbols', body);
    SYMBOLS.forEach(function (symbol) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.textContent = symbol;
      cell.addEventListener('click', function () { insertAtCursor(editor, symbol); closeOpenPanels(); });
      grid.appendChild(cell);
    });
    openPopover(button, body);
  }

  function normalizeSpriteItem(item) {
    if (typeof item === 'string') item = { name: item };
    if (!item || typeof item !== 'object') return null;
    const rawName = String(item.name || item.material || item.css || '').trim();
    const name = rawName.replace(/^minecraft:/i, '').replace(/^icon-minecraft-/i, '').replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase();
    if (!name) return null;
    const css = String(item.css || ('icon-minecraft-' + name.replace(/_/g, '-'))).trim();
    return {
      name: name,
      css: css.indexOf('icon-minecraft-') === 0 ? css : 'icon-minecraft-' + css.replace(/^icon-minecraft-/i, ''),
      label: name.replace(/_/g, ' ')
    };
  }

  function loadSpriteItems() {
    const loader = typeof window.ZMenuEditorItems === 'function'
      ? Promise.resolve().then(function () { return window.ZMenuEditorItems(); })
      : Promise.resolve([]);
    return loader.then(function (items) {
      const unique = new Map();
      (Array.isArray(items) ? items : []).forEach(function (item) {
        const normalized = normalizeSpriteItem(item);
        if (normalized && !unique.has(normalized.name)) unique.set(normalized.name, normalized);
      });
      const result = Array.from(unique.values()).sort(function (left, right) { return left.name.localeCompare(right.name); });
      return result.length ? result : SPRITE_FALLBACK.map(normalizeSpriteItem);
    }).catch(function () { return SPRITE_FALLBACK.map(normalizeSpriteItem); });
  }

  function createSpritesPicker(editor, button) {
    const picker = button.closest('.mm-sprites-picker');
    if (!picker) return;
    const existing = $('.mm-sprites-dropdown', picker);
    if (existing) {
      existing.remove();
      return;
    }
    closeOpenPanels();
    const dropdown = document.createElement('div');
    dropdown.className = 'mm-sprites-dropdown';
    dropdown.innerHTML = '<div class="mm-sprites-dropdown-label">Sprites <small>Click to insert</small></div><input class="mm-sprites-search" type="search" placeholder="Search blocks & items..." autocomplete="off"><div class="mm-sprites-grid"></div>';
    picker.appendChild(dropdown);
    const search = $('.mm-sprites-search', dropdown);
    const grid = $('.mm-sprites-grid', dropdown);
    let items = [];

    const render = function () {
      const query = search.value.toLowerCase().trim();
      const results = items.filter(function (item) { return !query || item.name.indexOf(query) !== -1 || item.label.indexOf(query) !== -1; }).slice(0, 50);
      grid.innerHTML = '';
      if (!results.length) {
        const empty = document.createElement('div');
        empty.className = 'mm-sprites-empty';
        empty.textContent = 'No sprites found';
        grid.appendChild(empty);
        return;
      }
      results.forEach(function (item) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'mm-sprites-cell';
        cell.title = item.label;
        cell.setAttribute('aria-label', item.label);
        const icon = document.createElement('span');
        icon.className = 'icon-minecraft-sm ' + item.css;
        cell.appendChild(icon);
        cell.addEventListener('click', function () {
          insertAtCursor(editor, '<sprite:"minecraft:items":item/' + item.name + '>');
          dropdown.remove();
        });
        grid.appendChild(cell);
      });
    };

    search.addEventListener('input', render);
    render();
    loadSpriteItems().then(function (loadedItems) {
      if (!document.body.contains(dropdown)) return;
      items = loadedItems;
      render();
    });
    requestAnimationFrame(function () { search.focus(); });
  }

  function smallText(value) {
    const map = { a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ѕ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ' };
    return Array.from(value).map(function (character) { return map[character.toLowerCase()] || character; }).join('');
  }

  function addAutocomplete(editor) {
    const input = editor.input;
    const list = document.createElement('div');
    list.className = 'zmm-autocomplete';
    list.hidden = true;
    editor.shell.appendChild(list);
    let matches = [];
    let active = 0;

    const hide = function () { list.hidden = true; matches = []; };
    const accept = function () {
      const item = matches[active];
      if (!item) return;
      const before = input.value.slice(0, input.selectionStart);
      const start = before.lastIndexOf('%');
      const value = input.value.slice(0, start) + '%' + item + '%' + input.value.slice(input.selectionEnd);
      editor.update(value);
      requestAnimationFrame(function () { input.focus(); input.setSelectionRange(start + item.length + 2, start + item.length + 2); });
      hide();
    };
    const render = function () {
      const before = input.value.slice(0, input.selectionStart);
      const match = before.match(/%([a-zA-Z0-9_:-]*)$/);
      if (!match) return hide();
      matches = PLACEHOLDERS.filter(function (name) { return name.indexOf(match[1].toLowerCase()) !== -1; }).slice(0, 6);
      if (!matches.length) return hide();
      active = 0;
      list.innerHTML = '';
      matches.forEach(function (name, index) {
        const option = document.createElement('button');
        option.type = 'button';
        option.innerHTML = '<code>%' + name + '%</code><span>PlaceholderAPI</span>';
        option.className = index === active ? 'is-active' : '';
        option.addEventListener('mousedown', function (event) { event.preventDefault(); active = index; accept(); });
        list.appendChild(option);
      });
      list.hidden = false;
    };
    input.addEventListener('input', render);
    input.addEventListener('click', render);
    input.addEventListener('blur', function () { setTimeout(hide, 120); });
    input.addEventListener('keydown', function (event) {
      if (list.hidden) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        Array.from(list.children).forEach(function (child, index) { child.classList.toggle('is-active', index === active); });
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        accept();
      } else if (event.key === 'Escape') {
        hide();
      }
    });
  }

  function buildToolbar(editor) {
    const toolbar = document.createElement('div');
    toolbar.className = 'mm-toolbar';
    const left = document.createElement('div');
    left.className = 'mm-toolbar-left';
    const add = function (icon, label, action, id, order, extra) {
      const button = createButton(icon, label, action, extra);
      button.dataset.toolbarId = id;
      button.style.order = String(order);
      left.appendChild(button);
      return button;
    };
    const wrap = function (tag, sample) { return function () { insertText(editor, '<' + tag + '>', '</' + tag + '>', sample || 'text'); }; };

    add('<i class="fa-solid fa-bold"></i>', 'Bold (Ctrl+B)', wrap('bold'), 'decorations', 0);
    add('<i class="fa-solid fa-italic"></i>', 'Italic (Ctrl+I)', wrap('italic'), 'decorations', 0);
    add('<i class="fa-solid fa-underline"></i>', 'Underline (Ctrl+U)', wrap('underlined'), 'decorations', 0);
    add('<i class="fa-solid fa-strikethrough"></i>', 'Strikethrough (Ctrl+S)', wrap('strikethrough'), 'decorations', 0);
    add('<i class="fa-solid fa-eye-slash"></i>', 'Obfuscated (Ctrl+Shift+O)', wrap('obfuscated'), 'decorations', 0);
    const colorButton = createButton('<i class="fa-solid fa-palette"></i>', 'Insert color (Ctrl+Shift+C)', function () { createColorPicker(editor, colorButton); }, 'mm-toolbar-btn--color');
    const colorPicker = document.createElement('div');
    colorPicker.className = 'mm-color-picker';
    colorPicker.dataset.toolbarId = 'colors';
    colorPicker.style.order = '1';
    colorPicker.appendChild(colorButton);
    left.appendChild(colorPicker);
    add('<i class="fa-solid fa-wand-magic-sparkles"></i>', 'Gradient (Ctrl+G)', function () { openDialog('Gradient', [{ name: 'from', label: 'Start color', value: '#288fc3', required: true }, { name: 'to', label: 'End color', value: '#10ea64', required: true }], function (values, close) { insertText(editor, '<gradient:' + values.from + ':' + values.to + '>', '</gradient>', 'text'); close(); }); }, 'gradient', 2);
    add('<i class="fa-solid fa-rainbow"></i>', 'Rainbow (Ctrl+R)', wrap('rainbow'), 'rainbow', 3);
    add('<i class="fa-solid fa-flag"></i>', 'Pride', wrap('pride:trans'), 'pride', 4);
    add('<i class="fa-solid fa-comment-dots"></i>', 'Hover (Ctrl+H)', function () { openDialog('Hover', [{ name: 'text', label: 'Text shown on hover', value: 'Tooltip here', required: true }], function (values, close) { insertText(editor, "<hover:show_text:'" + values.text.replace(/'/g, "\\'") + "'>", '</hover>', 'Hover me'); close(); }); }, 'hover', 5);
    add('<i class="fa-solid fa-link"></i>', 'Click URL (Ctrl+K)', function () { openDialog('Click URL', [{ name: 'url', label: 'URL', value: 'https://example.com', required: true }], function (values, close) { insertText(editor, "<click:open_url:'" + values.url.replace(/'/g, "\\'") + "'>", '</click>', 'Click me'); close(); }); }, 'click_url', 6);
    add('<i class="fa-solid fa-star"></i>', 'Bold + Color', function () { insertText(editor, '<bold><gold>', '</gold></bold>', 'text'); }, 'bold_color', 7);
    add('<i class="fa-solid fa-sliders"></i>', 'Transition', function () { insertAtCursor(editor, '<transition:#ff0000:#00ff00:#0000ff:0.5/>'); }, 'transition', 8);
    add('<i class="fa-solid fa-user"></i>', 'Player Head', function () { openDialog('Player Head', [{ name: 'player', label: 'Player name or UUID', placeholder: 'Notch', required: true }], function (values, close) { insertAtCursor(editor, '<head:' + values.player + '>'); close(); }); }, 'head', 9);
    add('<i class="fa-solid fa-terminal"></i>', 'Click Command', function () { openDialog('Click Command', [{ name: 'command', label: 'Command to run', value: '/', required: true }, { name: 'text', label: 'Display text', value: 'Click me', required: true }], function (values, close) { const command = values.command.charAt(0) === '/' ? values.command : '/' + values.command; insertText(editor, "<click:run_command:'" + command.replace(/'/g, "\\'") + "'>", '</click>', values.text); close(); }); }, 'command', 10);
    add('<i class="fa-solid fa-tags"></i>', 'Custom Tags', function () { openDialog('Custom Tags', [{ name: 'name', label: 'Tag name', placeholder: 'example', required: true }, { name: 'value', label: 'Replacement value', placeholder: '<gold>Example</gold>', required: true, multiline: true }], function (values, close) { if (!/^[a-z0-9_-]+$/i.test(values.name)) return; const tags = getCustomTags().filter(function (tag) { return tag.name !== values.name; }); tags.push(values); setCustomTags(tags); insertAtCursor(editor, '<' + values.name + '>'); close(); }); }, 'custom_tags', 11);
    add('<i class="fa-solid fa-text-height"></i>', 'Small Text (Ctrl+L)', function () { const input = editor.input; const selected = input.value.slice(input.selectionStart, input.selectionEnd); if (selected) replaceSelection(editor, smallText(selected)); }, 'small_text', 12);
    const symbolsButton = createButton('<span class="zmm-sword">⚔</span>', 'Minecraft icons', function () { createSymbolsPicker(editor, symbolsButton); });
    const iconsPicker = document.createElement('div');
    iconsPicker.className = 'mm-icons-picker';
    iconsPicker.dataset.toolbarId = 'icons';
    iconsPicker.style.order = '13';
    iconsPicker.appendChild(symbolsButton);
    left.appendChild(iconsPicker);
    const spritesButton = createButton('<i class="fa-solid fa-cube"></i>', 'Sprites', function () { createSpritesPicker(editor, spritesButton); });
    const spritesPicker = document.createElement('div');
    spritesPicker.className = 'mm-sprites-picker';
    spritesPicker.dataset.toolbarId = 'sprites';
    spritesPicker.style.order = '14';
    spritesPicker.appendChild(spritesButton);
    left.appendChild(spritesPicker);

    const right = document.createElement('div');
    right.className = 'mm-toolbar-right';
    const configureButton = createButton('<i class="fa-solid fa-gear"></i>', 'Configure toolbar', function () { openToolbarConfig(toolbar); });
    right.appendChild(configureButton);

    toolbar.appendChild(left);
    toolbar.appendChild(right);
    applyToolbarConfig(toolbar);
    return toolbar;
  }

  function attachField(source) {
    const fieldName = source.dataset.zmmField || source.name;
    const isLore = fieldName === 'lore';
    const group = source.closest('.mb-3') || source.parentElement;
    const existing = group && group.querySelector('.bv2-mm-field[data-zmm-for], .zmm-editor');
    if (source.dataset.zmmBound === 'true') {
      if (existing) {
        if (source.__zmmSync) source.__zmmSync();
        return;
      }
      delete source.dataset.zmmBound;
    }
    if (!group || existing) return;
    source.dataset.zmmBound = 'true';
    source.classList.add('zmm-source-field');
    source.setAttribute('aria-hidden', 'true');

    const editor = document.createElement('div');
    editor.className = 'bv2-mm-field' + (isLore ? ' bv2-mm-field--lore' : '');
    editor.dataset.zmmFor = fieldName;
    const shell = document.createElement('div');
    shell.className = 'mm-editor-area';
    const highlightLayer = document.createElement('pre');
    highlightLayer.className = 'mm-highlight';
    highlightLayer.setAttribute('aria-hidden', 'true');
    const input = document.createElement('textarea');
    input.className = 'mm-textarea';
    input.id = isLore ? 'zmm-item-lore-editor' : 'zmm-item-display-name-editor';
    input.setAttribute('aria-label', isLore ? 'Lore' : 'Display Name');
    input.rows = 2;
    input.value = source.value || '';
    input.placeholder = isLore ? 'Item description...' : '<gold>Custom name...</gold>';
    input.spellcheck = false;
    shell.appendChild(highlightLayer);
    shell.appendChild(input);
    editor.appendChild(buildToolbar({ input: input, shell: shell, update: update }));
    editor.appendChild(shell);
    group.insertBefore(editor, source);

    function render(value) { highlightLayer.innerHTML = highlight(value); }
    function syncFromSource() {
      const value = source.value || '';
      if (input.value === value) return;
      input.value = value;
      render(value);
    }
    function update(value) { input.value = value; render(value); setNativeValue(source, value); }
    source.__zmmSync = syncFromSource;
    render(input.value);
    input.addEventListener('input', function () { update(input.value); });
    input.addEventListener('scroll', function () { highlightLayer.scrollTop = input.scrollTop; highlightLayer.scrollLeft = input.scrollLeft; });
    input.addEventListener('keydown', function (event) {
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;
      const key = event.key.toLowerCase();
      const shortcut = { b: ['bold', 'text'], i: ['italic', 'text'], u: ['underlined', 'text'], s: ['strikethrough', 'text'], g: ['gradient:#288fc3:#10ea64', 'text'], r: ['rainbow', 'text'], h: ["hover:show_text:'Tooltip here'", 'Hover me'], k: ["click:open_url:'https://example.com'", 'Click me'] };
      if (key === 'l' && !event.shiftKey) {
        const selected = input.value.slice(input.selectionStart, input.selectionEnd);
        if (selected) { event.preventDefault(); replaceSelection({ input: input, update: update }, smallText(selected)); }
        return;
      }
      if (key === 'o' && event.shiftKey) { event.preventDefault(); insertText({ input: input, update: update }, '<obfuscated>', '</obfuscated>', 'text'); return; }
      if (key === 'c' && event.shiftKey) { event.preventDefault(); const first = editor.querySelector('.mm-toolbar-btn[data-tooltip^="Insert color"]'); if (first) createColorPicker({ input: input, update: update }, first); return; }
      if (shortcut[key] && !event.shiftKey) { event.preventDefault(); insertText({ input: input, update: update }, '<' + shortcut[key][0] + '>', '</' + shortcut[key][0].split(':')[0] + '>', shortcut[key][1]); }
    });
    addAutocomplete({ input: input, shell: shell, update: update });
  }

  function enhanceFields() {
    document.querySelectorAll('[data-zmm-field]').forEach(attachField);
  }

  document.addEventListener('mousedown', function (event) {
    if (!event.target.closest('.zmm-popover, .zmm-modal-overlay, .mm-sprites-dropdown, .mm-toolbar-btn')) closeOpenPanels();
  });
  const observer = new MutationObserver(function () { enhanceFields(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceFields);
  else enhanceFields();
})();
