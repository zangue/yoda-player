export type BufferedRange = {
  start: number;
  end: number;
};

export class TimeRangesUtils {
  static getBufferedInfo(b: TimeRanges): BufferedRange[] {
    if (!b) {
      return [];
    }
    const ret = [];
    for (let i = 0; i < b.length; i++) {
      ret.push({start: b.start(i), end: b.end(i)});
    }
    return ret;
  }

  static bufferedAheadOf(b: TimeRanges, time: number): number {
    if (!b || !b.length) {
      return 0;
    }
    // Workaround Safari bug: https://bit.ly/2trx6O8
    if (b.length === 1 && b.end(0) - b.start(0) < 1e-6) {
      return 0;
    }

    // We calculate the buffered amount by ONLY accounting for the content
    // buffered (i.e. we ignore the times of the gaps).  We also buffer through
    // all gaps.
    // Therefore, we start at the end and add up all buffers until |time|.
    let result = 0;
    for (const {start, end} of TimeRangesUtils.getBufferedInfo(b)) {
      if (end > time) {
        result += end - Math.max(start, time);
      }
    }

    return result;
  }
}
