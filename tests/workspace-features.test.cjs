const assert = require('node:assert/strict');
global.window = {};
require('../editor-assets/workspace-features.js');
let ref;
const React = {
  useRef: initial => ref || (ref = {current:initial}),
  useState: () => [0, () => {}],
  useEffect: effect => effect()
};
let state = {inventory:{size:54}, slots:[{content:null,button:{amount:1}}]};
const restore = value => {state = value;};
const render = () => window.ZMenuWorkspace.useHistory(React,state.inventory,state.slots,restore);
assert.equal(render().canUndo,false);
state = {...state,inventory:{size:27}};
render().undo();
assert.equal(state.inventory.size,54);
render().redo();
assert.equal(state.inventory.size,27);
render().undo();
render();
state = {...state,inventory:{size:9}};
assert.equal(render().canRedo,false);
assert.equal(ref.current.past.length,1);
state = {...state,slots:[{content:{material:'STONE'},button:{amount:2}}]};
render().undo();
assert.equal(state.slots[0].content,null);
render().redo();
assert.equal(state.slots[0].content.material,'STONE');
assert.equal(state.slots[0].button.amount,2);
console.log('PASS: inventory/slot undo, redo, branch invalidation');
