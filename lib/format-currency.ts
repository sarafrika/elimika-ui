export function formatCurrency(amount?: number | null, currency = 'KES') {
  if (typeof amount !== 'number') return `${currency} 0`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}
