const DECIMAL_PLACES = 4;
const UNITS_PER_WHOLE = 10n ** BigInt(DECIMAL_PLACES);

export function moneyToUnits(text) {
  const [wholePart, fractionPart = ''] = String(text).split('.');
  const fractionUnits = BigInt(fractionPart.padEnd(DECIMAL_PLACES, '0').slice(0, DECIMAL_PLACES));
  return BigInt(wholePart) * UNITS_PER_WHOLE + fractionUnits;
}

export function unitsToMoney(units) {
  const sign = units < 0n ? '-' : '';
  const absoluteUnits = units < 0n ? -units : units;
  const wholePart = absoluteUnits / UNITS_PER_WHOLE;
  const fractionPart = (absoluteUnits % UNITS_PER_WHOLE).toString().padStart(DECIMAL_PLACES, '0');
  return `${sign}${wholePart}.${fractionPart}`;
}

export function multiplyThenDivide(amount, multiplier, divisor) {
  return (amount * multiplier * 2n + divisor) / (divisor * 2n);
}
