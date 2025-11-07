/**
 * Result pattern for handling success and error cases
 * Helps avoid throwing exceptions for expected error conditions
 */
export class Result<T> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value?: T,
    public readonly error?: string,
  ) {}

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  static fail<U>(error: string): Result<U> {
    return new Result<U>(false, undefined, error);
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this.value as T;
  }

  getError(): string {
    if (this.isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this.error as string;
  }
}
