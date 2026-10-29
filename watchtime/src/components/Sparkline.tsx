/** Histórico de preço em SVG puro. */
export function Sparkline({ points }: { points: { price: number; seenAt: Date }[] }) {
  if (points.length < 2) return <p className="text-xs text-muted">Histórico aparece após a próxima varredura.</p>;
  const w = 320;
  const h = 72;
  const pad = 4;
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const step = (w - pad * 2) / (points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(pad + i * step).toFixed(1)},${(h - pad - ((p.price - min) / span) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-18" role="img" aria-label="Histórico de preço">
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
