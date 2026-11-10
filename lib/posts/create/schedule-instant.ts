const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;

function wallClockMs(instantMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instantMs));
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
}

/**
 * n8n's date picker gives a wall-clock time without offset ("2026-11-05T10:00:00"), meant in the
 * workflow's time zone; Sofia needs an instant. A value that already carries its offset is kept.
 */
export function scheduleInstant(value: string, timeZone: string): string {
  if (HAS_OFFSET.test(value)) {
    return new Date(value).toISOString();
  }
  const asIfUtc = Date.parse(`${value}Z`);
  if (Number.isNaN(asIfUtc)) {
    return value;
  }
  const firstGuess = asIfUtc - (wallClockMs(asIfUtc, timeZone) - asIfUtc);
  // A second pass settles a time picked on the other side of a daylight-saving change.
  const instant = asIfUtc - (wallClockMs(firstGuess, timeZone) - firstGuess);
  return new Date(instant).toISOString();
}
