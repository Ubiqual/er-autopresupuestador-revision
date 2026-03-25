export function formatPrice(price: number): string {
  const formattedNumber = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(price);

  return `${formattedNumber}`;
}
