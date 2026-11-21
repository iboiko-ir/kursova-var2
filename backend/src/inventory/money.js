const SCALE = 4;
const FACTOR = 10n ** BigInt(SCALE);

export function toUnits(text) {
  const [whole, fraction = ''] = String(text).split('.');
  return BigInt(whole) * FACTOR + BigInt(fraction.padEnd(SCALE, '0').slice(0, SCALE));
}

export function fromUnits(units) {
  const sign = units < 0n ? '-' : '';
  const absolute = units < 0n ? -units : units;
  const whole = absolute / FACTOR;
  const fraction = (absolute % FACTOR).toString().padStart(SCALE, '0');
  return `${sign}${whole}.${fraction}`;
}

export function mulDivRound(amount, multiplier, divisor) {
  return (amount * multiplier * 2n + divisor) / (divisor * 2n);
}
