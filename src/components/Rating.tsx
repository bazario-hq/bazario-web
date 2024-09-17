import { Icon } from './Icon';

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const name = value >= i ? 'star' : value >= i - 0.5 ? 'starHalf' : 'starOutline';
    stars.push(<Icon key={i} name={name} size={size} />);
  }
  return (
    <span className="stars text-warning" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {stars}
    </span>
  );
}

export function Rating({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <span className="text-muted small">No reviews yet</span>;
  return (
    <span className="small">
      <Stars value={avg} /> <span className="text-muted">({count})</span>
    </span>
  );
}
