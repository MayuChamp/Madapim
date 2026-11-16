// מפAI product logo. Artwork extracted from the pilot welcome PDF; a white/cyan
// variant is swapped in by CSS when dark mode is on (see .mapai-logo in index.css).
//   variant="full" — wordmark + "העוזר החכם למד״פ" tagline + underline (login, welcome)
//   variant="mark" — wordmark only, legible at header size
export function MapaiLogo({ variant = 'full', height = 48, alt = 'מפAI', style, className = '' }) {
  const base = variant === 'mark' ? 'mapai-mark' : 'mapai-logo';
  return (
    <span className={`mapai-logo ${className}`} style={{ height, ...style }} role="img" aria-label={alt}>
      <img className="mapai-logo-light" src={`/${base}.png`} alt="" draggable="false" />
      <img className="mapai-logo-dark" src={`/${base}-dark.png`} alt="" draggable="false" />
    </span>
  );
}
