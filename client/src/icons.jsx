import React, { useState, useEffect, useCallback, useRef } from 'react';

const Icon = ({ d, size = 16, fill = 'none', stroke = 'currentColor', strokeWidth = 1.6, viewBox = '0 0 24 24', children, style }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', flexShrink: 0, ...style }}>
    {d ? <path d={d} /> : children}
  </svg>
);
const IconHome = (p) => <Icon {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/></Icon>;
const IconUsers = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M3 19c0-3 2.5-5 6-5s6 2 6 5"/><path d="M16 11a3 3 0 0 0 0-6"/><path d="M21 18c0-2.4-1.7-4-4-4"/></Icon>;
const IconArchive = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/></Icon>;
const IconSettings = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>;
const IconFolder = (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></Icon>;
const IconFile = (p) => <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></Icon>;
const IconUpload = (p) => <Icon {...p}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></Icon>;
const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IconArrowLeft = (p) => <Icon {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>;
const IconChevron = (p) => <Icon {...p}><path d="M9 6l-6 6 6 6"/></Icon>;
const IconPencil = (p) => <Icon {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/></Icon>;
const IconMagic = (p) => <Icon {...p}><path d="M15 4l1.5 3 3 1.5-3 1.5L15 13l-1.5-3-3-1.5 3-1.5z"/><path d="M5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/><path d="m10 14-4 4"/></Icon>;
const IconMic = (p) => <Icon {...p}><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconClose = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="m5 12 5 5 9-12"/></Icon>;
const IconDownload = (p) => <Icon {...p}><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></Icon>;
const IconSave = (p) => <Icon {...p}><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><path d="M8 14h8v6H8z"/></Icon>;
const IconSend = (p) => <Icon {...p}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></Icon>;
const IconSparkle = (p) => <Icon {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></Icon>;
const IconBookmark = (p) => <Icon {...p}><path d="M6 3h12v18l-6-4-6 4z"/></Icon>;
const IconDoc = (p) => <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M8 13h8M8 17h5"/></Icon>;
const IconWave = (p) => <Icon {...p}><path d="M2 12h2M22 12h-2M6 8v8M10 5v14M14 5v14M18 8v8"/></Icon>;
const IconGrid = (p) => <Icon {...p}><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></Icon>;
const IconList = (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18"/></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IconArchiveBox = (p) => <Icon {...p}><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3"/><rect x="4" y="9" width="16" height="12" rx="1"/><path d="M10 13h4"/></Icon>;
const IconAlert = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></Icon>;
const IconGraduationCap = (p) => <Icon {...p}><path d="M2 9 12 4l10 5-10 5z"/><path d="M6 11v5a6 6 0 0 0 12 0v-5"/></Icon>;
const IconEye = (p) => <Icon {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Icon>;
const IconMenu = (p) => <Icon {...p}><path d="M3 12h18M3 6h18M3 18h18"/></Icon>;
export {  Icon, IconHome, IconUsers, IconArchive, IconSettings, IconFolder, IconFile, IconUpload, IconPlus, IconArrowLeft, IconArrowRight, IconChevron, IconPencil, IconMagic, IconMic, IconSearch, IconClose, IconCheck, IconDownload, IconSave, IconSend, IconSparkle, IconBookmark, IconDoc, IconWave, IconGrid, IconList, IconClock, IconArchiveBox, IconAlert, IconGraduationCap, IconEye, IconMenu  };