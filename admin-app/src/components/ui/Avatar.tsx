type Props = { name: string; src?: string | null; size?: number; className?: string };

function initialsOf(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || '?';
}

/** Avatar único do produto: gradiente de marca com iniciais, ou foto quando disponível. */
export function Avatar({ name, src, size = 32, className = '' }: Props) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };
  return <span className={`avatar ${className}`.trim()} style={style} aria-hidden="true">
    {src ? <img src={src} alt="" /> : initialsOf(name)}
  </span>;
}
