const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'new', 'inventory-WNBjVcRD.js');
console.log('Reading:', filePath);
console.log('Exists:', fs.existsSync(filePath));

const content = fs.readFileSync(filePath, 'utf8');
console.log('File size:', content.length, 'chars');

// Search for actionTypes
const actionTypesPatterns = [
  /actionTypes\s*:\s*(\[.*?\])\s*,\s*buttonTypes/s,
  /actionTypes\s*=\s*(\[.*?\])\s*[,;]/s,
  /"actionTypes"\s*:\s*(\[.*?\])\s*,\s*"buttonTypes"/s,
  /actionTypes\s*:\s*(\[\{.*?\}\])/s,
];

let found = false;
for (const pat of actionTypesPatterns) {
  const m = content.match(pat);
  if (m) {
    console.log('\n=== Found actionTypes with pattern:', pat);
    console.log('Length:', m[1].length);
    console.log('Preview:', m[1].substring(0, 300));
    found = true;
    break;
  }
}

if (!found) {
  // Try searching for actionTypes keyword
  const idx = content.indexOf('actionTypes');
  if (idx >= 0) {
    console.log('\n=== Found "actionTypes" at index', idx);
    console.log('Context:', content.substring(Math.max(0, idx - 50), idx + 500));
  } else {
    console.log('\n=== actionTypes not found directly, searching for related keywords...');
    const keywords = ['player command', 'console command', 'broadcast', 'PLAYER_COMMAND', 'CONSOLE_COMMAND'];
    for (const kw of keywords) {
      const i = content.indexOf(kw);
      if (i >= 0) {
        console.log(`Found "${kw}" at ${i}:`, content.substring(i-100, i+200));
      }
    }
  }
}

// Also search for buttonTypes
const idx2 = content.indexOf('buttonTypes');
if (idx2 >= 0) {
  console.log('\n=== Found "buttonTypes" at index', idx2);
  console.log('Context:', content.substring(Math.max(0, idx2 - 50), idx2 + 500));
} else {
  console.log('\n=== buttonTypes keyword not found');
  const btns = ['NONE', 'INVENTORY', 'BACK', 'HOME', 'NEXT', 'PREVIOUS', 'MAINMENU', 'JUMP', 'COMMAND', 'CONSOLE_COMMAND'];
  for (const kw of btns) {
    const i = content.indexOf(`"${kw}"`);
    if (i >= 0) {
      console.log(`Found "${kw}" at ${i}:`, content.substring(i-100, i+200));
    }
  }
}
