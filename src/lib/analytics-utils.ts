import "server-only";

type DecimalLike = { toNumber: () => number };

export function toNum(d: DecimalLike | number | null | undefined): number {
  if (d === null || d === undefined) return 0;
  return typeof d === "number" ? d : d.toNumber();
}

export function monthKey(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

/** Builds an ordered [{month, value}] series for the last `count` months, zero-filled. */
export function bucketByMonth<T>(
  rows: T[],
  getDate: (r: T) => Date,
  getValue: (r: T) => number,
  months: number,
  now: Date
): { month: string; value: number }[] {
  const buckets = new Map<string, number>();
  const order: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    buckets.set(key, 0);
    order.push(key);
  }
  for (const row of rows) {
    const key = monthKey(getDate(row));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + getValue(row));
  }
  return order.map((month) => ({ month, value: Math.round((buckets.get(month) ?? 0)) }));
}

/** Groups rows by a string key and sums a numeric value, sorted descending, optionally capped to top N (+ "Other"). */
export function groupAndSum<T>(
  rows: T[],
  getKey: (r: T) => string,
  getValue: (r: T) => number,
  topN?: number
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = getKey(row);
    map.set(key, (map.get(key) ?? 0) + getValue(row));
  }
  const sorted = Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  if (!topN || sorted.length <= topN) return sorted;
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN).reduce((s, r) => s + r.value, 0);
  if (rest > 0) top.push({ name: "Other", value: rest });
  return top;
}
