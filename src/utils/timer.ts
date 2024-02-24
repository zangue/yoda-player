import {ITimer} from './types';

export class Timer implements ITimer {
  private timerId_: number | null;
  private clearMethod_: Function | null;
  private onTick_: Function;

  constructor(handler: Function) {
    this.timerId_ = null;
    this.clearMethod_ = null;
    this.onTick_ = handler;
  }

  tickAfter(seconds: number): ITimer {
    return this.setTimer_(seconds, false);
  }

  tickEvery(seconds: number): ITimer {
    return this.setTimer_(seconds, true);
  }

  clear(): void {
    if (this.timerId_ && this.clearMethod_) {
      this.clearMethod_(this.timerId_);
      this.timerId_ = null;
      this.clearMethod_ = null;
    }
  }

  private setTimer_(seconds: number, isPeriodic: boolean): ITimer {
    this.clear();

    const cb = () => {
      if (this.timerId_) {
        this.onTick_();
      }
    };

    if (isPeriodic) {
      this.timerId_ = window.setInterval(cb, seconds * 1000);
      this.clearMethod_ = clearInterval.bind(window);
    } else {
      this.timerId_ = window.setTimeout(cb, seconds * 1000);
      this.clearMethod_ = clearTimeout.bind(window);
    }

    return this;
  }
}
