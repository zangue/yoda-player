import {ISegment, ISegmentIndex} from './types';

/**
 * Creates a segment index.
 */
export class SegmentIndex implements ISegmentIndex {
  private segments_: ISegment[];

  constructor(segments: ISegment[]) {
    this.segments_ = segments;
  }

  /**
   * Get All segments in this index.
   * @returns All segments in the index.
   */
  getSegments(): ISegment[] {
    return this.segments_;
  }

  /**
   * Add new segment to the index.
   * @param newSegments
   */
  merge(newSegments: ISegment[]): void {
    if (newSegments.length < 1) {
      return;
    }

    const currentEndTime = this.getEndTime(true);

    // console.log('Current timeline end:', currentEndTime);

    // Extend current index with new segments
    for (let i = 0; i < newSegments.length; i++) {
      const newSegment = newSegments[i];
      if (newSegment.unscaledStart >= currentEndTime) {
        this.segments_.push(newSegment);
        // console.log(
        //   'Added new segment to index. Start:', newSegment.unscaledStart,
        //   'End:', (newSegment.unscaledStart + newSegment.unscaledDuration));
      }
    }

    if (!this.isContiguous(this.segments_)) {
      console.warn(
        'The segment timeline is not contiguous. ' +
          'This might lead to playback issues'
      );
    }
  }

  /**
   * Search the index for a segment that contains the providedn |time|.
   *
   * @param time
   * @returns The segment that contains |time| or null.
   */
  find(time: number): ISegment | null {
    for (const segment of this.segments_) {
      if (segment.start <= time && time < segment.end) {
        return segment;
      }
    }

    console.warn(
      'Could not find segment for time:' + time + '.',
      'Segment count: ' + (this.segments_.length - 1),
      'Last end: ' + this.getEndTime()
    );

    return null;
  }

  /**
   * Get the index start time.
   *
   * @param unscaled Whether or not the return the unscaled time
   * @returns Start time.
   */
  getStartTime(unscaled?: boolean): number {
    if (this.segments_.length > 0) {
      const first = this.segments_[this.segments_.length - 1];
      return unscaled ? first.start : first.unscaledStart;
    }
    return 0;
  }

  /**
   * Get the index end time.
   *
   * @param unscaled Whether or not the return the unscaled time
   * @returns End time.
   */
  getEndTime(unscaled?: boolean): number {
    if (this.segments_.length > 0) {
      const last = this.segments_[this.segments_.length - 1];
      return unscaled ? last.unscaledEnd : last.end;
    }
    return 0;
  }

  /**
   * Evicts segment from the index, that have fallen out of the provided
   * window length.
   *
   * @param dvrWindowLength DVR window length
   */
  adjustDvrWindow(dvrWindowLength: number): void {
    const windowStart = this.getEndTime() - dvrWindowLength;

    const oldSize = this.segments_.length;

    this.segments_ = this.segments_.filter(
      segment => segment.end > windowStart
    );

    const newSize = this.segments_.length;

    console.log('Evicted ' + (oldSize - newSize) + ' segments.');
  }

  /**
   * Checks if the provided media segments constitute a contiguous timeline.
   *
   * @param segments Array of media segments
   * @returns True if timeline is contiguous, false otherwise.
   */
  isContiguous(segments: ISegment[]): boolean {
    if (segments.length < 2) {
      return true;
    }

    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];
      const prevEnd = prev.unscaledStart + prev.unscaledDuration;

      if (curr.unscaledStart - prevEnd !== 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if the timeline formed by the segments currently in the index
   * includes the provided |time|.
   * @param time Time to check
   * @returns True if |time| in segment timeline.
   */
  hasTime(time: number): boolean {
    const firstSegment = this.segments_[0];
    const lastSegment = this.segments_[this.segments_.length - 1];
    const firstSegmentStart = firstSegment.start;
    const lastSegmentEnd = lastSegment.end;

    return firstSegmentStart <= time && time <= lastSegmentEnd;
  }
}
