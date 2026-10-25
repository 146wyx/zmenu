const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../editor-assets/zmenu-editor.js'), 'utf8');
const slotStart = source.indexOf('  wN=({');
const stageStart = source.indexOf('  normalizeStageColor=');
assert.ok(slotStart >= 0 && stageStart > slotStart);
const slotSource = source.slice(slotStart, source.indexOf('\n  var MT=', slotStart)).trim();
const stageSource = source.slice(stageStart, source.indexOf('\n  SR=({', stageStart)).trim().replace(/,$/, ';');
const state = [];
let stateIndex = 0;
const jsx = (type, props) => typeof type === 'function' && type.name !== 'StageColorPopup' ? type(props) : {type, props};
const context = {
  Kf: 54,
  R: {jsx, jsxs: jsx, Fragment: Symbol('Fragment')},
  U: {
    useMemo: fn => fn(),
    useRef: () => ({current: null}),
    useState(initial) {
      const index = stateIndex++;
      if (index === state.length) state.push(typeof initial === 'function' ? initial() : initial);
      return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
    }
  },
  Gk: {sanitize: value => value},
  Fk: {processMinecraftColorCodes: value => value},
  AT: () => null,
  po: {getHeadUrl: value => value},
  document: {
    createElement(type) {
      assert.equal(type, 'template');
      return {innerHTML: '', content: {children: [], querySelectorAll: () => []}};
    }
  }
};
const {VM, StageColorPopup} = vm.runInNewContext(`const ${slotSource}\nconst ${stageSource}\n({VM, StageColorPopup});`, context);
const children = node => [node.props.children].flat(Infinity).filter(value => value && typeof value === 'object');
const walk = node => [node, ...children(node).flatMap(walk)];
const diamond = {name: 'Diamond', material: 'DIAMOND', css: 'icon-minecraft-diamond'};
const slots = Array.from({length: 540}, (_, index) => ({
  content: index === 54 ? diamond : null,
  button: {slot: index % 54, page: Math.floor(index / 54) + 1, amount: index === 54 ? 3 : 1}
}));
const pages = [], clicks = [], contexts = [];
let labelToggles = 0;
const props = {
  inventory: {size: 36, name: 'VIP menu'},
  inventoryContent: {currentSlot: 54, slots},
  selectSlots: [0, 54, 55],
  page: 1,
  maxPage: 10,
  setPage: value => pages.push(value),
  handleSlotClick: (event, index) => clicks.push(index),
  handleSlotDoubleClick: (event, index, mode) => contexts.push([index, mode]),
  onToggleLabels: () => labelToggles++
};
function render(overrides = {}) {
  stateIndex = 0;
  const stage = VM({...props, ...overrides});
  const [collapse, center, backgrounds, toggle] = children(stage);
  const [inventory, hint, pagination] = children(center);
  const popup = children(stage).find(node => node.type === StageColorPopup);
  return {stage, collapse, inventory, hint, pagination, backgrounds, toggle, popup};
}

let view = render();
assert.equal(view.stage.type, 'div');
assert.equal(view.stage.props.className, 'workspace-stage-area');
assert.equal(view.stage.props.style, undefined);
assert.deepEqual(children(view.stage).map(node => [node.type, node.props.className]), [
  ['button', 'workspace-collapse-btn workspace-collapse-btn-left'],
  ['div', 'bv2-center'],
  ['div', 'bv2-stage-bg-actions'],
  ['button', 'topbar-labels-toggle']
]);
assert.deepEqual(children(view.inventory).map(node => node.props.className), [
  'bv2-inventory__header',
  'bv2-inventory__slots bv2-inventory__slots--menu',
  'bv2-inventory__separator',
  'bv2-inventory__label',
  'bv2-inventory__slots bv2-inventory__slots--player',
  'bv2-inventory__slots bv2-inventory__hotbar'
]);
const [header, menu, , , player, hotbar] = children(view.inventory);
assert.equal(header.props.dangerouslySetInnerHTML.__html, '<span class="mm-component">VIP menu</span>');
assert.equal(menu.props.role, 'grid');
assert.equal(menu.props['aria-label'], 'Inventory page 1');
assert.equal(children(menu).length, 36);
assert.equal(children(player).length, 27);
assert.equal(children(hotbar).length, 9);
assert.ok([...children(player), ...children(hotbar)].every(node => node.props.className === 'bv2-slot bv2-slot--disabled'));
assert.equal(children(view.hint).at(-1).type, 'strong');
assert.equal(walk(view.stage).some(node => node.type === 'input' || node.type === 'portal'), false);
assert.equal(view.popup, undefined);
assert.equal(children(view.pagination)[1].props['aria-live'], 'polite');
assert.equal(children(view.pagination)[1].props.children, 'Page 1 / 10');
assert.deepEqual(children(view.backgrounds).map(node => [node.type, node.props['aria-label']]), [
  ['button', 'Transparent background'], ['button', 'Custom color'], ['button', 'Minecraft background']
]);

children(view.pagination)[0].props.onClick();
assert.equal(children(view.pagination)[0].props.disabled, true);
assert.equal(pages.length, 0);
children(view.pagination)[2].props.onClick();
assert.deepEqual(pages, [2]);
view = render({page: 10});
assert.equal(children(view.pagination)[2].props.disabled, true);
children(view.pagination)[2].props.onClick();
assert.deepEqual(pages, [2]);

view = render({page: 2});
assert.equal(children(view.pagination)[1].props.children, 'Page 2 / 10');
const secondMenu = children(view.inventory)[1];
const firstSlot = children(secondMenu)[0];
assert.equal(secondMenu.props['aria-label'], 'Inventory page 2');
assert.equal(firstSlot.props['aria-label'], 'Diamond inventory slot 1, page 2');
assert.equal(firstSlot.props.className, 'bv2-slot bv2-slot--selected');
assert.equal(firstSlot.props['aria-selected'], true);
assert.equal(firstSlot.props['data-slot'], 0);
assert.equal(firstSlot.props['data-grid-group'], 'menu');
assert.equal(firstSlot.props['data-grid-index'], 0);
assert.equal(firstSlot.props.id, undefined);
assert.equal(children(firstSlot)[0].type, 'i');
assert.equal(children(firstSlot)[0].props.id, undefined);
assert.equal(children(firstSlot)[1].props.className, 'number');
assert.equal(children(firstSlot)[1].props.children, 3);
assert.equal(walk(view.stage).some(node => /(?:^|\s)item(?:\s|$)/.test(node.props.className || '')), false);
firstSlot.props.onClick({});
firstSlot.props.onContextMenu({});
assert.deepEqual(clicks, [54]);
assert.deepEqual(contexts, [[54, false]]);
let prevented = 0, focused = 0;
const event = {
  key: 'ArrowRight',
  preventDefault: () => prevented++,
  currentTarget: {closest(selector) {
    assert.equal(selector, '[role="grid"]');
    return {querySelector(target) {
      assert.equal(target, '[data-grid-index="1"]');
      return {focus: () => focused++};
    }};
  }}
};
firstSlot.props.onKeyDown(event);
assert.equal(prevented, 1);
assert.equal(focused, 1);
firstSlot.props.onKeyDown({...event, key: 'Enter'});
assert.deepEqual(clicks, [54, 54]);

children(view.backgrounds)[1].props.onClick();
view = render();
assert.equal(view.stage.props.className, 'workspace-stage-area bv2-stage--solid');
assert.equal(view.stage.props.style['--bv2-stage-bg'], '#3a3f47');
assert.equal(children(view.stage).at(-1), view.popup);
assert.equal(children(view.stage).length, 5);
assert.equal(view.popup.props.anchorRef, children(view.backgrounds)[1].props.ref);
assert.equal(view.popup.props.color, '#3a3f47');
view.popup.props.onChange('#12ab34');
view = render();
assert.equal(view.stage.props.style['--bv2-stage-bg'], '#12ab34');
assert.equal(children(children(children(view.backgrounds)[1])[0])[0].props.fill, '#12ab34');
view.popup.props.onClose();
view = render();
assert.equal(view.popup, undefined);
children(view.backgrounds)[1].props.onClick();
view = render();
assert.equal(view.popup.props.color, '#12ab34');
children(view.backgrounds)[1].props.onClick();
view = render();
assert.equal(view.popup, undefined);
children(view.backgrounds)[2].props.onClick();
view = render();
assert.equal(view.stage.props.className, 'workspace-stage-area bv2-stage--image');
assert.match(view.stage.props.style.backgroundImage, /images\/minecraft_workspace_bg-eOzaNtb6\.png/);
children(view.backgrounds)[0].props.onClick();
view = render({labelsHidden: true});
assert.equal(view.stage.props.className, 'workspace-stage-area');
assert.equal(view.stage.props.style, undefined);
assert.equal(view.toggle.props.className, 'topbar-labels-toggle active');
assert.equal(children(view.toggle)[0].props.className, 'fa-solid fa-chevron-down');
view.toggle.props.onClick();
assert.equal(labelToggles, 1);

const dropStart = source.indexOf('    Se=U.useCallback(ee=>{', source.indexOf('  hB=()=>{'));
assert.ok(dropStart > stageStart);
const dropSource = source.slice(dropStart, source.indexOf('\n    ze=()=>{', dropStart)).trim().replace(/,$/, ';');
let hitStack = [], cancelled = 0, consumed = 0;
const placed = [], merged = [];
const dropContext = {
  U: {useCallback: fn => fn},
  d: {target: {}, item: diamond}, m: 4, j: 2, Kf: 54,
  L: {slots},
  document: {elementsFromPoint: () => hitStack},
  Je: (...args) => placed.push(args),
  ve: (event, index) => merged.push(index),
  se: () => cancelled++,
  te: () => consumed++
};
const {Se, Ie, Le} = vm.runInNewContext(`const ${dropSource}\n({Se, Ie, Le});`, dropContext);
const gridTarget = {dataset: {gridIndex: '0'}, matches: () => true, closest: () => gridTarget};
const outside = {matches: () => false, closest: () => null};
const dropEvent = {clientX: 10, clientY: 20, preventDefault() {}};
hitStack = [outside, gridTarget];
assert.equal(Le(dropEvent), gridTarget);
Se(dropEvent);
assert.deepEqual(merged, [54]);
slots[54] = {...slots[54], content: null, button: {...slots[54].button, amount: 1}};
Se(dropEvent);
assert.deepEqual(placed.pop(), [54, diamond, 4]);
Ie(dropEvent);
assert.deepEqual(placed.pop(), [54, diamond, 1]);
assert.equal(consumed, 1);
slots[54] = {...slots[54], content: diamond, button: {...slots[54].button, amount: 64}};
Ie(dropEvent);
assert.equal(placed.length, 0);
hitStack = [outside];
assert.doesNotThrow(() => Se(dropEvent));
hitStack = [];
assert.doesNotThrow(() => Se(dropEvent));
assert.doesNotThrow(() => Ie(dropEvent));
assert.equal(cancelled, 3);

console.log('PASS: reference stage order, slots, pagination, grid navigation, inline color popup, and page-aware item placement');
