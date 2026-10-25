(function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function useHistory(React, inventory, slots, restore) {
    const history = React.useRef({ past: [], future: [], current: null, restoring: null });
    const [, refresh] = React.useState(0);
    const serialized = JSON.stringify({ inventory, slots });
    React.useEffect(() => {
      const h = history.current;
      if (serialized === h.current) return;
      if (h.restoring === serialized) {
        h.restoring = null;
      } else if (h.current !== null) {
        h.past.push(h.current);
        if (h.past.length > 100) h.past.shift();
        h.future = [];
      }
      h.current = serialized;
      refresh(n => n + 1);
    }, [serialized]);
    const move = direction => {
      const h = history.current;
      if (h.restoring) return;
      const source = direction === 'undo' ? h.past : h.future;
      const destination = direction === 'undo' ? h.future : h.past;
      if (!source.length) return;
      destination.push(h.current);
      h.restoring = source.pop();
      restore(JSON.parse(h.restoring));
    };
    return { undo: () => move('undo'), redo: () => move('redo'),
      canUndo: !!history.current.past.length, canRedo: !!history.current.future.length };
  }
  function usePatterns(React, snapshot, apply) {
    const [patterns, setPatterns] = React.useState(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('zmenu-patterns') || '[]');
        return Array.isArray(saved) ? saved.filter(p => p && typeof p.id === 'string' && p.slot && p.variables && typeof p.variables === 'object') : [];
      } catch { return []; }
    });
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState('');
    const [draft, setDraft] = React.useState(null);
    const [error, setError] = React.useState('');
    const [tab, setTab] = React.useState('Main');
    const [source, setSource] = React.useState('');
    const [values, setValues] = React.useState({});
    const [status, setStatus] = React.useState('');
    React.useEffect(() => {
      if (!open) return;
      const previous = document.activeElement;
      const dialog = document.querySelector('.workspace-pattern-studio');
      dialog?.querySelector('button')?.focus();
      const onKey = event => {
        if (event.key === 'Escape') {setOpen(false); return;}
        if (event.key !== 'Tab' || !dialog) return;
        const focusable = [...dialog.querySelectorAll('button:not(:disabled),input,textarea,select')].filter(el => el.getClientRects().length);
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
        else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
      };
      document.addEventListener('keydown', onKey);
      return () => {document.removeEventListener('keydown', onKey); previous?.focus();};
    }, [open]);
    const choose = pattern => {
      setSelected(pattern.id); setDraft(clone(pattern)); setValues(clone(pattern.variables));
      setSource(JSON.stringify(pattern.slot, null, 2)); setError(''); setStatus('');
    };
    const save = () => {
      if (!draft || !/^[a-zA-Z0-9_-]+$/.test(draft.fileName)) {
        setError('File name must contain only letters, numbers, underscores or hyphens.'); return;
      }
      try {
        const slot = JSON.parse(source);
        if (!slot || !slot.content || !slot.button || Array.isArray(slot)) throw Error('An item and button are required.');
        const next = { ...draft, slot };
        const list = [...patterns.filter(p => p.id !== next.id), next];
        localStorage.setItem('zmenu-patterns', JSON.stringify(list));
        setPatterns(list); setDraft(next); setError(''); setStatus('All changes saved');
      } catch (e) { setError(e.message); }
    };
    const create = () => {
      const slot = snapshot();
      if (!slot || !slot.content) { setError('Select a populated inventory slot first.'); return; }
      choose({ id: crypto.randomUUID(), name: 'New button pattern', fileName: 'my_button_pattern', variables: {}, slot: clone(slot) });
    };
    const remove = () => {
      try {
        const list = patterns.filter(p => p.id !== selected);
        localStorage.setItem('zmenu-patterns', JSON.stringify(list));
        setPatterns(list); setDraft(null); setSelected(''); setStatus('Pattern deleted');
      } catch (e) { setError(e.message); }
    };
    const applyPattern = (id, overrides) => {
      const pattern = patterns.find(p => p.id === id);
      if (!pattern) return;
      const replacements = { ...pattern.variables, ...overrides };
      const resolve = value => {
        if (typeof value === 'string') return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => Object.hasOwn(replacements, key) ? String(replacements[key]) : match);
        if (Array.isArray(value)) return value.map(resolve);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, resolve(val)]));
        return value;
      };
      apply(resolve(clone(pattern.slot)));
      setOpen(false);
    };
    const download = () => {
      try {
        if (!draft) return;
        const slot = JSON.parse(source);
        if (!slot.content || !slot.button) throw Error('An item and button are required.');
        const inventoryYaml = window.ZMenuEditorGenerateYaml({inventory: {name: draft.name, size: 9}, slots: [{...slot, button: {...slot.button, name: draft.fileName, slot: 0, page: 1}}]});
        const start = inventoryYaml.indexOf('\nitems:');
        if (start < 0) throw Error('Pattern YAML could not be generated.');
        const lines = inventoryYaml.slice(start + 1).split('\n');
        const body = lines.slice(2).map(line => line.startsWith('    ') ? line.slice(4) : line).filter(line => !/^slot:/.test(line));
        const yaml = body.join('\n') + '\n';
        const url = URL.createObjectURL(new Blob([yaml], {type: 'text/yaml'}));
        const link = document.createElement('a'); link.href = url; link.download = draft.fileName + '.yml'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); setError('');
      } catch (e) { setError(e.message); }
    };
    const e = React.createElement;
    const editSection = () => {
      let slot;
      try { slot = JSON.parse(source); } catch { return null; }
      const update = (section, key, value) => {
        const next = clone(slot);
        next[section][key] = value;
        setSource(JSON.stringify(next, null, 2));
      };
      if (tab === 'Item') return e('div', null,
        field('Material', slot.content.material || '', value => {
          const next = clone(slot), material = value.trim().toUpperCase();
          next.content.material = material;
          next.content.name = material.toLowerCase();
          next.content.css = 'icon-minecraft-' + material.toLowerCase().replaceAll('_', '-');
          setSource(JSON.stringify(next, null, 2));
        }),
        field('Display name', slot.button.display_name || '', value => update('button', 'display_name', value)),
        field('Lore', slot.button.lore || '', value => update('button', 'lore', value), true),
        field('Amount', String(slot.button.amount || 1), value => {const amount = Number(value); if (Number.isInteger(amount) && amount >= 1 && amount <= 64) update('button', 'amount', amount);}),
        field('Model ID', String(slot.button.model_id || 0), value => {const id = Number(value); if (Number.isInteger(id) && id >= 0) update('button', 'model_id', id);}));
      if (tab === 'Button') return e('div', null,
        field('Button name', slot.button.name || '', value => update('button', 'name', value)),
        field('Note', slot.button.comment || '', value => update('button', 'comment', value)),
        ...['is_permanent', 'close_inventory', 'refresh_on_click', 'update_on_click', 'update'].map(key => e('label', {className:'workspace-field',key}, key.replaceAll('_', ' '), e('input', {type:'checkbox',checked:!!slot.button[key],onChange:event=>update('button',key,event.target.checked)}))));
      return null;
    };
    const actionsEditor = () => {
      let slot;
      try { slot = JSON.parse(source); } catch { return null; }
      const actions = Array.isArray(slot.button.actions) ? slot.button.actions : [];
      const updateActions = next => { slot.button.actions = next; setSource(JSON.stringify(slot, null, 2)); };
      const actionField = (index, key, value) => e('input', {value: value == null ? '' : value, placeholder: key, onChange: event => updateActions(actions.map((item, i) => i === index ? {...item, [key]: event.target.value} : item))});
      return e('div', {className:'workspace-actions-editor'},
        ...actions.map((action, index) => e('article', {className:'workspace-action-row', key:index},
          e('div', {className:'workspace-action-row__head'}, e('strong', null, action.type || 'action ' + (index + 1)),
            button('Remove', () => updateActions(actions.filter((_, i) => i !== index))),
            button('Up', () => {if(index) {const next=[...actions]; [next[index-1],next[index]]=[next[index],next[index-1]]; updateActions(next);}}, index === 0),
            button('Down', () => {if(index < actions.length - 1) {const next=[...actions]; [next[index],next[index+1]]=[next[index+1],next[index]]; updateActions(next);}}, index === actions.length - 1)),
          e('div', {className:'workspace-action-row__fields'}, actionField(index, 'type', action.type), actionField(index, 'commands', Array.isArray(action.commands) ? action.commands.join('\n') : action.commands), actionField(index, 'message', action.message), actionField(index, 'sound', action.sound)) )),
        button('Add action', () => updateActions([...actions, {type:'player_command', commands:[]}])));
    };
    const advancedEditor = () => {
      let slot;
      try { slot = JSON.parse(source); } catch { return null; }
      const buttonData = slot.button || {};
      const update = (key, value) => { const next = clone(slot); next.button[key] = value; setSource(JSON.stringify(next, null, 2)); };
      return e('div', {className:'workspace-advanced-editor'},
        field('Button data JSON', JSON.stringify(buttonData, null, 2), text => {try {const value=JSON.parse(text); if(!value||Array.isArray(value)) throw Error('Button data must be an object'); const next=clone(slot); next.button=value; setSource(JSON.stringify(next,null,2)); setError('');} catch(err){setError(err.message);}}, true),
        field('Raw components JSON', buttonData.item_data || '', value => update('item_data', value), true),
        field('Comment', buttonData.comment || '', value => update('comment', value)),
        field('Sound', buttonData.sound || '', value => update('sound', value)),
        field('Pitch', String(buttonData.pitch == null ? 1 : buttonData.pitch), value => {const number=Number(value); if(Number.isFinite(number)) update('pitch', number);}),
        field('Volume', String(buttonData.volume == null ? 1 : buttonData.volume), value => {const number=Number(value); if(Number.isFinite(number)) update('volume', number);}),
        button('Download pattern YAML', download));
    };
    const field = (label, value, onChange, multiline) => e('label', {className: 'workspace-field'}, label,
      e(multiline ? 'textarea' : 'input', multiline ? {defaultValue: value, key: selected + ':' + tab, rows:14, onBlur:event=>onChange(event.target.value)} : {value, onChange: event => onChange(event.target.value)}));
    const button = (text, action, disabled) => e('button', {type: 'button', onClick: action, disabled: !!disabled}, text);
    const modal = open && e('div', {className: 'workspace-modal-mask', onClick: event => {if (event.target === event.currentTarget) setOpen(false);}},
      e('section', {className: 'workspace-pattern-studio', role: 'dialog', 'aria-modal': true, 'aria-label': 'Button Pattern Studio', onKeyDown: event => {if (event.key === 'Escape') setOpen(false);}},
        e('header', null, e('h2', null, 'Button Pattern Studio'), button('Close', () => setOpen(false))),
        e('div', {className: 'workspace-pattern-layout'}, e('aside', null, button('New pattern', create),
          ...patterns.map(p => e('button', {type: 'button', key: p.id, onClick: () => choose(p), 'aria-pressed': selected === p.id}, p.name + ' · ' + p.fileName))),
          e('main', null, e('nav', {'aria-label': 'Pattern configuration'}, ...['Main', 'Item', 'Button', 'Actions', 'Variables', 'Advanced YAML'].map(name => e('button', {type: 'button', key: name, onClick: () => setTab(name), 'aria-pressed': tab === name}, name))),
            draft ? e('div', null,
              tab === 'Main' && e('div', null, field('Display name', draft.name, name => setDraft({...draft, name})), field('File path', draft.fileName, fileName => setDraft({...draft, fileName}))),
              ['Item', 'Button'].includes(tab) && editSection(),
              tab === 'Actions' && actionsEditor(),
              tab === 'Advanced YAML' && advancedEditor(),
              tab === 'Variables' && e('div', null,
                ...Object.entries(draft.variables).map(([key, value]) => e('div', {key}, field(key, value, val => {setDraft({...draft, variables: {...draft.variables, [key]: val}}); setValues({...values, [key]: val});}), button('Remove ' + key, () => {const next = {...draft.variables}; delete next[key]; setDraft({...draft, variables: next});}))),
                button('Add variable', () => {const name = window.prompt('Variable name (use {name} in item/button fields)'); if (name && /^[a-zA-Z0-9_]+$/.test(name)) setDraft({...draft, variables: {...draft.variables, [name]: ''}});}))) : e('p', null, 'Select a pattern'))),
        error && e('p', {role: 'alert'}, error), status && e('p', {role: 'status'}, status),
        e('footer', null, button('Delete', remove, !draft), button('Use pattern', () => applyPattern(selected, values), !patterns.some(p => p.id === selected)), button('Save pattern', save, !draft))));
    return { patterns, open: () => {setOpen(true); setError('');}, apply: applyPattern, modal };
  }
  window.ZMenuWorkspace = { useHistory, usePatterns };
})();
