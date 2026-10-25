const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const components = fs.readFileSync(path.join(__dirname, '../editor-assets/items-panel.css'), 'utf8');
const themes = fs.readFileSync(path.join(__dirname, '../editor-assets/workspace-features.css'), 'utf8');
const stage = '#inventory-editor .workspace-stage-area';

function rule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(escaped + '\\s*\\{([^}]*)\\}'));
  assert.ok(match, `Missing CSS rule: ${selector}`);
  return match[1];
}

assert.match(rule(components, stage), /background-image:[^;]*linear-gradient/s);
assert.match(rule(components, stage + '.bv2-stage--solid'), /background-color:\s*var\(--bv2-stage-bg[^;]*;/);
assert.match(rule(components, stage + '.bv2-stage--solid'), /background-image:\s*none;/);
const image = rule(components, stage + '.bv2-stage--image');
assert.match(image, /background-size:\s*cover;/);
assert.match(image, /background-position:\s*center bottom;/);
assert.match(image, /background-repeat:\s*no-repeat;/);
assert.doesNotMatch(image, /linear-gradient/);

for (const [theme, color] of [['light', 'oklch(.96989 .00655 247.896)'], ['dark', '#35445b']]) {
  const prefix = `html[data-theme=${theme}] ${stage}`;
  const transparent = rule(themes, prefix + ':not(.bv2-stage--solid):not(.bv2-stage--image)');
  assert.ok(transparent.includes(`background-color:${color};`));
  const selected = rule(themes, prefix + ' .bv2-inventory__slots--menu .bv2-slot--selected');
  assert.match(selected, /background:oklch\(\.6368 0 0\) !important;/);
  assert.match(selected, /box-shadow:inset/);
}

assert.doesNotMatch(themes, /html\[data-theme=(?:light|dark)\] #inventory-editor \.workspace-stage-area\s*\{[^}]*background\s*:/);
assert.doesNotMatch(components + themes, /workspace-stage-area--|data-stage-background|\.slot\b|slot-select/);
assert.doesNotMatch(components, /\b(?:width|min-width|flex):[^;}]*\b(?:730|920)px\b/);
assert.match(rule(components, stage + ' .bv2-slot > .number'), /position:\s*absolute;/);
assert.match(rule(components, stage + ' .bv2-stage-bg-btn > svg'), /width:\s*20px;/);

console.log('PASS: checkerboard, solid and image backgrounds; theme isolation; selected slots; flexible item pane');
