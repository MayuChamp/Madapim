const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Extract CSS
const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
if (styleMatch) {
  fs.writeFileSync(path.join(__dirname, 'index.css'), styleMatch[1].trim() + '\n');
}

// Extract Scripts
const scriptRegex = /<script type="text\/babel">\s*\/\/\s*──\s*([^─]+)─+\s*([\s\S]*?)<\/script>/g;
let match;

while ((match = scriptRegex.exec(content)) !== null) {
  let name = match[1].trim();
  let code = match[2];
  
  // Clean up Object.assign(window, {...}) calls at the end
  code = code.replace(/Object\.assign\(window,\s*\{([^}]+)\}\);?/g, (fullMatch, exports) => {
    return 'export { ' + exports.trim() + ' };';
  });

  // Add imports where necessary (heuristics)
  let prefix = `import React, { useState, useEffect, useCallback, useRef } from 'react';\n`;
  if (name.includes('screens-') || name === 'app') {
    prefix += `import { IconSearch, IconDoc, IconDownload, IconArrowRight, IconSave, IconArrowLeft, IconSparkle, IconCheck, IconClose, IconPlus, IconChevron, IconPencil, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload } from './icons';\n`;
    prefix += `import { STUDENTS, EVAL_CATEGORIES, EVIDENCES, RUBRIC_DETAILS, ARCHIVED, SMART_QUESTIONS } from './data';\n`;
  }
  if (name === 'app') {
    prefix += `import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect, useTweaks } from './tweaks-panel';\n`;
    prefix += `import { Dashboard } from './screens-1-dashboard';\n`;
    prefix += `import { Workspace, Sidebar } from './screens-2-workspace';\n`;
    // Add logic to import from editor / others
  }

  // Remove ReactDOM.createRoot... if present in app.jsx
  code = code.replace(/ReactDOM\.createRoot\([^)]+\)\.render\(<App\/>\);?/, 'export default App;');

  const filename = name.replace(/ /g, '-').replace(/\.jsx?$/, '') + '.jsx';
  fs.writeFileSync(path.join(__dirname, filename), prefix + '\n' + code.trim() + '\n');
}
console.log('Extraction complete');
