const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../editor-assets/zmenu-editor.js'), 'utf8');
const start = source.indexOf('  normalizeStageColor=');
const end = source.indexOf('\n  VM=({', start);
assert.ok(start >= 0 && end > start);
const colorSource = source.slice(start, end).trim().replace(/,$/, ';');
const Fragment = Symbol('Fragment');
const jsx = (type, props) => type === Fragment ? props.children : {type, props};
const children = node => [node.props.children].flat(Infinity).filter(value => value && typeof value === 'object');
const walk = node => [node, ...children(node).flatMap(walk)];
const find = (node, className) => walk(node).find(value => (value.props.className || '').split(' ').includes(className));

function mountPopup(initialColor) {
  const states = [], refs = [], effects = [], pending = [], listeners = new Map(), changes = [];
  let stateIndex, refIndex, effectIndex, color = initialColor, closed = 0;
  const inside = {}, anchor = {};
  const anchorRef = {current: {contains: target => target === anchor}};
  const document = {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener: (type, listener) => listeners.get(type).delete(listener)
  };
  const U = {
    useState(initial) {
      const index = stateIndex++;
      if (index === states.length) states.push(typeof initial === 'function' ? initial() : initial);
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(initial) {
      const index = refIndex++;
      return refs[index] || (refs[index] = {current: initial});
    },
    useEffect(effect, dependencies) {
      const index = effectIndex++, previous = effects[index];
      if (!previous || dependencies.some((value, i) => value !== previous.dependencies[i])) {
        pending.push(() => {
          if (previous) previous.cleanup();
          effects[index] = {dependencies, cleanup: effect()};
        });
      }
    }
  };
  const api = vm.runInNewContext(`const ${colorSource}\n({normalizeStageColor, stageHexToHsv, stageHsvToHex, StageColorPopup});`,
    {U, R: {jsx, jsxs: jsx, Fragment}, document});
  const props = {
    anchorRef,
    onChange(value) { color = value; changes.push(value); },
    onClose() { closed++; }
  };
  return {
    ...api, changes, inside, anchor,
    get color() { return color; },
    get closed() { return closed; },
    get listenerCount() { return [...listeners.values()].reduce((count, set) => count + set.size, 0); },
    render() {
      stateIndex = refIndex = effectIndex = 0;
      const output = api.StageColorPopup({...props, color});
      output.props.ref.current = {contains: target => target === inside};
      pending.splice(0).forEach(effect => effect());
      return output;
    },
    dispatch(type, event) { [...(listeners.get(type) || [])].forEach(listener => listener(event)); },
    unmount() { effects.forEach(effect => effect.cleanup()); }
  };
}

const popup = mountPopup('#3a3f47');
for (const value of ['#AbCdEf', ' ABCDEF ', ' #abcdef ']) {
  assert.equal(popup.normalizeStageColor(value), '#abcdef');
}
for (const value of ['#abc', '#gggggg', '##ffffff', '12345', '#12345678', '']) {
  assert.equal(popup.normalizeStageColor(value), null);
}
for (const [hex, h, s, v] of [
  ['#000000', 0, 0, 0], ['#ffffff', 0, 0, 1],
  ['#ff0000', 0, 1, 1], ['#ffff00', 60, 1, 1], ['#00ff00', 120, 1, 1],
  ['#00ffff', 180, 1, 1], ['#0000ff', 240, 1, 1], ['#ff00ff', 300, 1, 1]
]) {
  assert.deepEqual({...popup.stageHexToHsv(hex)}, {h, s, v});
  assert.equal(popup.stageHsvToHex({h, s, v}), hex);
}
assert.equal(popup.stageHsvToHex({h: -60, s: 1, v: 1}), '#ff00ff');
assert.equal(popup.stageHsvToHex({h: 360, s: 1, v: 1}), '#ff0000');
assert.equal(popup.stageHsvToHex({h: 720, s: 0, v: 0.5}), '#808080');
for (const hex of ['#3a3f47', '#586a83', '#12ab34', '#abcdef']) {
  const roundTrip = popup.stageHsvToHex(popup.stageHexToHsv(hex));
  for (const index of [1, 3, 5]) {
    assert.ok(Math.abs(parseInt(hex.slice(index, index + 2), 16) - parseInt(roundTrip.slice(index, index + 2), 16)) <= 2);
  }
}

let panel = popup.render();
assert.equal(panel.props.className, 'bv2-stage-color-popup');
assert.equal(popup.listenerCount, 2);
assert.deepEqual(children(panel).map(node => node.props.className), ['bv2-stage-color-head', 'bv2-stage-color-swatches']);
const swatches = children(find(panel, 'bv2-stage-color-swatches'));
assert.deepEqual(swatches.slice(0, 8).map(node => node.props.style.backgroundColor), [
  '#3a3f47', '#2b2f36', '#1f2530', '#4c5564', '#586a83', '#1d3b52', '#3f5f3a', '#6d4b3f'
]);
assert.equal(swatches.length, 9);
assert.equal(swatches[0].props.className, 'bv2-stage-color-swatch active');
assert.equal(swatches[8].props.children, '+');
swatches[4].props.onClick();
panel = popup.render();
assert.equal(popup.color, '#586a83');
assert.equal(children(find(panel, 'bv2-stage-color-swatches'))[4].props.className, 'bv2-stage-color-swatch active');
children(find(panel, 'bv2-stage-color-swatches'))[8].props.onClick();
panel = popup.render();
assert.equal(panel.props.className, 'bv2-stage-color-popup is-picker-open');
assert.deepEqual(children(panel).map(node => node.props.className), [
  'bv2-stage-color-head', 'bv2-color-current-row', 'bv2-color-picker-grid'
]);
assert.deepEqual(children(find(panel, 'bv2-stage-color-head')).map(node => node.type), ['button', 'p', 'button']);
assert.equal(find(panel, 'bv2-stage-color-title').props.children, 'Pick a color');
assert.equal(find(panel, 'bv2-color-hex-input').props.value, '#586a83');
assert.equal(popup.listenerCount, 2);

find(panel, 'bv2-color-hex-input').props.onChange({target: {value: ' aBcD12 '}});
panel = popup.render();
assert.equal(popup.color, '#abcd12');
assert.equal(find(panel, 'bv2-color-hex-input').props.value, ' aBcD12 ');
assert.equal(find(panel, 'bv2-color-current-swatch').props.style.backgroundColor, '#abcd12');
find(panel, 'bv2-color-hex-input').props.onBlur();
panel = popup.render();
assert.equal(find(panel, 'bv2-color-hex-input').props.value, '#abcd12');
const changesBeforeInvalid = popup.changes.length;
find(panel, 'bv2-color-hex-input').props.onChange({target: {value: '#12'}});
panel = popup.render();
assert.equal(find(panel, 'bv2-color-hex-input').props.value, '#12');
assert.equal(popup.changes.length, changesBeforeInvalid);
find(panel, 'bv2-color-hex-input').props.onBlur();
panel = popup.render();
assert.equal(find(panel, 'bv2-color-hex-input').props.value, '#abcd12');
assert.equal(popup.changes.length, changesBeforeInvalid);

find(panel, 'bv2-color-hex-input').props.onChange({target: {value: '#ff0000'}});
panel = popup.render();
const captured = new Set();
const target = {
  getBoundingClientRect: () => ({left: 10, top: 20, width: 100, height: 150}),
  setPointerCapture: id => captured.add(id),
  hasPointerCapture: id => captured.has(id)
};
let prevented = 0;
const pointer = {pointerId: 7, clientX: 110, clientY: 20, currentTarget: target, preventDefault: () => prevented++};
find(panel, 'bv2-color-square').props.onPointerDown(pointer);
assert.equal(captured.has(7), true);
assert.equal(prevented, 1);
panel = popup.render();
assert.equal(popup.color, '#ff0000');
assert.deepEqual({...find(panel, 'bv2-color-square-cursor').props.style}, {left: '100%', top: '0%'});
find(panel, 'bv2-color-square').props.onPointerMove({...pointer, clientX: -100, clientY: 400});
panel = popup.render();
assert.equal(popup.color, '#000000');
assert.deepEqual({...find(panel, 'bv2-color-square-cursor').props.style}, {left: '0%', top: '100%'});
const beforeUncaptured = popup.changes.length;
find(panel, 'bv2-color-square').props.onPointerMove({...pointer, pointerId: 8});
assert.equal(popup.changes.length, beforeUncaptured);

find(panel, 'bv2-color-hex-input').props.onChange({target: {value: '#ff0000'}});
panel = popup.render();
find(panel, 'bv2-color-hue-rail').props.onPointerDown({...pointer, pointerId: 9, clientY: 95});
panel = popup.render();
assert.equal(popup.color, '#00ffff');
assert.equal(find(panel, 'bv2-color-hue-cursor').props.style.top, '50%');
assert.equal(find(panel, 'bv2-color-square').props.style['--picker-hue'], 'hsl(180, 100%, 50%)');
find(panel, 'bv2-color-hue-rail').props.onPointerMove({...pointer, pointerId: 9, clientY: 400});
panel = popup.render();
assert.equal(popup.color, '#ff0000');
assert.equal(find(panel, 'bv2-color-hue-cursor').props.style.top, '100%');
find(panel, 'bv2-color-hue-rail').props.onPointerMove({...pointer, pointerId: 9, clientY: -100});
panel = popup.render();
assert.equal(find(panel, 'bv2-color-hue-cursor').props.style.top, '0%');

children(find(panel, 'bv2-stage-color-head'))[0].props.onClick();
panel = popup.render();
assert.equal(panel.props.className, 'bv2-stage-color-popup');
assert.equal(find(panel, 'bv2-stage-color-title').props.children, 'Custom color');
children(find(panel, 'bv2-stage-color-swatches'))[8].props.onClick();
panel = popup.render();
assert.equal(find(panel, 'bv2-color-hex-input').props.value, '#ff0000');
popup.dispatch('mousedown', {target: popup.inside});
popup.dispatch('mousedown', {target: popup.anchor});
popup.dispatch('keydown', {key: 'a'});
assert.equal(popup.closed, 0);
popup.dispatch('keydown', {key: 'Escape'});
assert.equal(popup.closed, 1);
popup.unmount();
assert.equal(popup.listenerCount, 0);
popup.dispatch('mousedown', {target: {}});
assert.equal(popup.closed, 1);

const reopened = mountPopup(popup.color);
panel = reopened.render();
assert.equal(panel.props.className, 'bv2-stage-color-popup');
assert.equal(reopened.color, '#ff0000');
children(find(panel, 'bv2-stage-color-head')).at(-1).props.onClick();
assert.equal(reopened.closed, 1);
reopened.dispatch('mousedown', {target: {}});
assert.equal(reopened.closed, 2);
reopened.unmount();
assert.equal(reopened.listenerCount, 0);

console.log('PASS: color normalization/HSV boundaries, swatches, hex drafts, pointer capture, popup lifecycle, and listener cleanup');
