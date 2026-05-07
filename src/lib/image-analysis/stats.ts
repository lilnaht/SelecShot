export type Uint8Histogram = {
  histogram: Uint32Array;
  total: number;
};

export function mean(values: ArrayLike<number>): number {
  if (!values.length) {
    return 0;
  }

  let total = 0;
  let count = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (Number.isFinite(value)) {
      total += value;
      count += 1;
    }
  }

  return count ? total / count : 0;
}

export function median(values: ArrayLike<number>): number {
  return percentile(values, 50);
}

export function percentile(values: ArrayLike<number>, targetPercentile: number): number {
  const sorted = Array.from(values).filter(Number.isFinite).sort((a, b) => a - b);

  if (!sorted.length) {
    return 0;
  }

  if (sorted.length === 1) {
    return sorted[0] ?? 0;
  }

  const clampedPercentile = clamp(targetPercentile, 0, 100);
  const rank = (sorted.length - 1) * (clampedPercentile / 100);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const lowerValue = sorted[lowerIndex] ?? 0;
  const upperValue = sorted[upperIndex] ?? lowerValue;

  return lowerValue + (upperValue - lowerValue) * (rank - lowerIndex);
}

export function ratioBelow(values: ArrayLike<number>, threshold: number): number {
  if (!values.length) {
    return 0;
  }

  let count = 0;

  for (let index = 0; index < values.length; index += 1) {
    if ((values[index] ?? 0) < threshold) {
      count += 1;
    }
  }

  return count / values.length;
}

export function ratioAbove(values: ArrayLike<number>, threshold: number): number {
  if (!values.length) {
    return 0;
  }

  let count = 0;

  for (let index = 0; index < values.length; index += 1) {
    if ((values[index] ?? 0) > threshold) {
      count += 1;
    }
  }

  return count / values.length;
}

export function variance(values: ArrayLike<number>): number {
  if (!values.length) {
    return 0;
  }

  const average = mean(values);
  let total = 0;
  let count = 0;

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (Number.isFinite(value)) {
      total += (value - average) ** 2;
      count += 1;
    }
  }

  return count ? total / count : 0;
}

export function buildUint8Histogram(values: Uint8Array): Uint8Histogram {
  const histogram = new Uint32Array(256);

  for (let index = 0; index < values.length; index += 1) {
    histogram[values[index] ?? 0] += 1;
  }

  return { histogram, total: values.length };
}

export function meanFromHistogram({ histogram, total }: Uint8Histogram): number {
  if (!total) {
    return 0;
  }

  let sum = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    sum += value * (histogram[value] ?? 0);
  }

  return sum / total;
}

export function percentileFromHistogram(
  histogramData: Uint8Histogram,
  targetPercentile: number
): number {
  const { total } = histogramData;

  if (!total) {
    return 0;
  }

  if (total === 1) {
    return valueAtSortedIndex(histogramData, 0);
  }

  const clampedPercentile = clamp(targetPercentile, 0, 100);
  const rank = (total - 1) * (clampedPercentile / 100);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const lowerValue = valueAtSortedIndex(histogramData, lowerIndex);
  const upperValue = valueAtSortedIndex(histogramData, upperIndex);

  return lowerValue + (upperValue - lowerValue) * (rank - lowerIndex);
}

export function medianFromHistogram(histogramData: Uint8Histogram): number {
  return percentileFromHistogram(histogramData, 50);
}

export function ratioBelowFromHistogram(
  histogramData: Uint8Histogram,
  threshold: number
): number {
  return ratioFromHistogram(histogramData, (value) => value < threshold);
}

export function ratioAboveFromHistogram(
  histogramData: Uint8Histogram,
  threshold: number
): number {
  return ratioFromHistogram(histogramData, (value) => value > threshold);
}

export function roundTo(value: number, digits: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function ratioFromHistogram(
  { histogram, total }: Uint8Histogram,
  predicate: (value: number) => boolean
): number {
  if (!total) {
    return 0;
  }

  let count = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    if (predicate(value)) {
      count += histogram[value] ?? 0;
    }
  }

  return count / total;
}

function valueAtSortedIndex({ histogram, total }: Uint8Histogram, targetIndex: number): number {
  const clampedIndex = Math.trunc(clamp(targetIndex, 0, Math.max(total - 1, 0)));
  let seen = 0;

  for (let value = 0; value < histogram.length; value += 1) {
    seen += histogram[value] ?? 0;

    if (seen > clampedIndex) {
      return value;
    }
  }

  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
