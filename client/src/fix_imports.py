import glob
import re

files = glob.glob('*.jsx')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove const { useState... } = React;
    content = re.sub(r'const\s*{\s*(.*?)\s*}\s*=\s*React;', '', content)
    
    # Replace Object.assign(window, { ... }) with export { ... }
    content = re.sub(r'Object\.assign\(window,\s*\{(.*?)\}\);?', r'export { \1 };', content)
    
    # Prepend imports
    imports = "import React, { useState, useEffect, useCallback, useRef } from 'react';\n"
    if f == 'app-—-API-connected.jsx':
        imports += "import { TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakColor, TweakSelect, useTweaks } from './tweaks-panel';\n"
        imports += "import { Sidebar, Dashboard, Workspace } from './screens-1-2';\n"
        imports += "import { HumanNodeModal, SplitEditor } from './screens-3-4';\n"
        imports += "import { ArchiveScreen, RubricsScreen } from './screens-archive-rubrics';\n"
        imports += "import { ExportScreen, AnalyzingScreen, Toast } from './screens-5-app';\n"
        imports += "import { STUDENTS, EVAL_CATEGORIES, EVIDENCES, RUBRIC_DETAILS, ARCHIVED, SMART_QUESTIONS } from './data';\n"
        content = content.replace("ReactDOM.createRoot(document.getElementById('app')).render(<App/>);", "export default App;")
    
    # If the file uses icons, import them all just in case
    if 'Icon' in content and f != 'icons.jsx':
        imports += "import * as Icons from './icons';\n"
        # We need to replace <IconHome... with <Icons.IconHome...
        # Wait, that's complex. Better to just import all icons explicitly or destructure.
        imports += "import { Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap } from './icons';\n"
    
    if f != 'data.jsx' and 'STUDENTS' in content and f != 'app-—-API-connected.jsx':
        imports += "import { STUDENTS, EVAL_CATEGORIES, EVIDENCES, RUBRIC_DETAILS, ARCHIVED, SMART_QUESTIONS, STAGE_LABELS, CYCLE_STATUS } from './data';\n"
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(imports + '\n' + content)
