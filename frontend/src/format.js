export function formatMoney(text) {
  if (text === null || text === undefined) {
    return '-';
  }
  const negative = String(text).startsWith('-');
  const [whole, fraction = ''] = String(text).replace('-', '').split('.');
  const units = (BigInt(whole || '0') * 10000n + BigInt(`${fraction}0000`.slice(0, 4)) + 50n) / 100n;
  const digits = units.toString().padStart(3, '0');
  const sign = negative && units !== 0n ? '-' : '';
  return `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function formatUtcDateTime(value) {
  return `${new Date(value).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export const MOVEMENT_LABELS = {
  receipt: 'Receipt',
  shipment: 'Shipment',
  write_off: 'Write-off',
};

export const DOCUMENT_TITLES = {
  receipt: 'Goods receipt note',
  shipment: 'Shipment note',
  write_off: 'Write-off act',
};
