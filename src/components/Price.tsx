import { formatMoney } from '../lib/format';

export function Price({ cents, compareAt, currency = 'USD', className = '' }: { cents: number; compareAt?: number | null; currency?: string; className?: string }) {
  const onSale = compareAt != null && compareAt > cents;
  return (
    <span className={`price ${className}`}>
      <span className={onSale ? 'text-danger fw-bold' : 'fw-bold'}>{formatMoney(cents, currency)}</span>
      {onSale && (
        <>
          {' '}
          <s className="text-muted small">{formatMoney(compareAt!, currency)}</s>
        </>
      )}
    </span>
  );
}
