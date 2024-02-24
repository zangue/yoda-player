
export class AsyncTask<T> {
  public promise: Promise<T>;
  public done: (value: T | PromiseLike<T>) => void = () => {};
  public fail: (error?: any) => void = () => {};

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.done = (value) => resolve(value);
      this.fail = (error) => reject(error);
    })
  }

  timeOut() {
    return this;
  }
}
