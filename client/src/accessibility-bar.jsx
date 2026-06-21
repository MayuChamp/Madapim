import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './i18n';

const STORAGE_KEY = 'a11y-settings';
const DEFAULTS = { font: '100', contrast: false, grayscale: false, motion: false, links: false };

const A11Y_PANEL_STYLE = `
  .a11y-btn{position:fixed;bottom:16px;left:16px;z-index:2147483645;width:40px;height:40px;
    border-radius:50%;border:none;background:rgba(255,255,255,.9);
    box-shadow:0 2px 8px rgba(0,0,0,.18),0 0 0 .5px rgba(0,0,0,.1);
    cursor:pointer;display:flex;align-items:center;justify-content:center;
    font-size:18px;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
    transition:transform .15s,box-shadow .15s}
  .a11y-btn:hover{transform:scale(1.08);box-shadow:0 4px 16px rgba(0,0,0,.22)}
  .a11y-btn:focus-visible{outline:2px solid #1e3a5f;outline-offset:2px}
  .a11y-panel{position:fixed;bottom:64px;left:16px;z-index:2147483645;width:256px;
    background:rgba(250,249,247,.95);
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.7);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:12px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;color:#29261b;overflow:hidden}
  .a11y-panel-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 14px;border-bottom:.5px solid rgba(0,0,0,.08)}
  .a11y-panel-hd b{font-size:12px;font-weight:600}
  .a11y-panel-close{appearance:none;border:0;background:transparent;width:22px;height:22px;
    border-radius:6px;cursor:pointer;font-size:13px;color:rgba(41,38,27,.55);
    display:flex;align-items:center;justify-content:center}
  .a11y-panel-close:hover{background:rgba(0,0,0,.06);color:#29261b}
  .a11y-body{padding:10px 14px 14px;display:flex;flex-direction:column;gap:10px}
  .a11y-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .a11y-lbl{font-weight:500;font-size:12px;color:rgba(41,38,27,.72)}
  .a11y-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:pointer;padding:0;flex-shrink:0}
  .a11y-toggle[data-on="1"]{background:#34c759}
  .a11y-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s;pointer-events:none}
  .a11y-toggle[data-on="1"] i{transform:translateX(14px)}
  .a11y-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .a11y-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .a11y-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;
    min-height:22px;border-radius:6px;cursor:pointer;padding:2px 6px;line-height:1.2}
  .a11y-reset{appearance:none;width:100%;border:.5px solid rgba(0,0,0,.12);
    border-radius:8px;background:rgba(255,255,255,.5);color:rgba(41,38,27,.65);
    font:inherit;font-size:11.5px;padding:6px;cursor:pointer;transition:background .12s}
  .a11y-reset:hover{background:rgba(255,255,255,.85);color:#29261b}
  .a11y-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45)}
`;

const A11Y_GLOBAL_ID = 'a11y-global-style';
const A11Y_GLOBAL = `
  [data-a11y-font="125"] body{zoom:1.125}
  [data-a11y-font="150"] body{zoom:1.25}
  [data-a11y-contrast="1"]{filter:contrast(175%)}
  [data-a11y-grayscale="1"]{filter:grayscale(100%)}
  [data-a11y-contrast="1"][data-a11y-grayscale="1"]{filter:grayscale(100%) contrast(175%)}
  [data-a11y-motion="1"] *,
  [data-a11y-motion="1"] *::before,
  [data-a11y-motion="1"] *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
  [data-a11y-links="1"] a{text-decoration:underline!important}
`;

function applySettings(s) {
  const html = document.documentElement;
  html.setAttribute('data-a11y-font', s.font);
  html.setAttribute('data-a11y-contrast', s.contrast ? '1' : '0');
  html.setAttribute('data-a11y-grayscale', s.grayscale ? '1' : '0');
  html.setAttribute('data-a11y-motion', s.motion ? '1' : '0');
  html.setAttribute('data-a11y-links', s.links ? '1' : '0');
}

export function AccessibilityBar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  });

  useEffect(() => {
    if (!document.getElementById(A11Y_GLOBAL_ID)) {
      const el = document.createElement('style');
      el.id = A11Y_GLOBAL_ID;
      el.textContent = A11Y_GLOBAL;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    applySettings(settings);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
  }, [settings]);

  const set = useCallback((key, val) => setSettings(s => ({ ...s, [key]: val })), []);
  const reset = () => setSettings({ ...DEFAULTS });

  const FONT_OPTIONS = [
    { value: '100', label: t('a11y_font_normal') },
    { value: '125', label: t('a11y_font_large') },
    { value: '150', label: t('a11y_font_xlarge') },
  ];
  const fontIdx = FONT_OPTIONS.findIndex(o => o.value === settings.font);

  const TOGGLES = [
    { key: 'contrast', label: t('a11y_contrast') },
    { key: 'grayscale', label: t('a11y_grayscale') },
    { key: 'motion', label: t('a11y_reduce_motion') },
    { key: 'links', label: t('a11y_underline_links') },
  ];

  return (
    <>
      <style>{A11Y_PANEL_STYLE}</style>
      <button
        className="a11y-btn"
        onClick={() => setOpen(v => !v)}
        aria-label={t('a11y_title')}
        aria-expanded={open}
        title={t('a11y_title')}
      >
        ♿
      </button>
      {open && (
        <div className="a11y-panel" role="dialog" aria-label={t('a11y_title')}>
          <div className="a11y-panel-hd">
            <b>{t('a11y_title')}</b>
            <button className="a11y-panel-close" onClick={() => setOpen(false)} aria-label="סגור">✕</button>
          </div>
          <div className="a11y-body">
            <div className="a11y-sect">{t('a11y_font_size')}</div>
            <div className="a11y-seg" role="group" aria-label={t('a11y_font_size')}>
              <div
                className="a11y-seg-thumb"
                style={{
                  left: `calc(${fontIdx} / 3 * (100% - 4px) + 2px)`,
                  width: `calc((100% - 4px) / 3)`,
                }}
              />
              {FONT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => set('font', o.value)}
                  aria-pressed={settings.font === o.value}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <div className="a11y-sect">{t('a11y_display')}</div>
            {TOGGLES.map(({ key, label }) => (
              <div className="a11y-row" key={key}>
                <span className="a11y-lbl">{label}</span>
                <button
                  className="a11y-toggle"
                  data-on={settings[key] ? '1' : '0'}
                  onClick={() => set(key, !settings[key])}
                  aria-pressed={settings[key]}
                  aria-label={label}
                >
                  <i />
                </button>
              </div>
            ))}

            <button className="a11y-reset" onClick={reset}>{t('a11y_reset')}</button>
          </div>
        </div>
      )}
    </>
  );
}
