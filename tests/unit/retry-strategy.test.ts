import { RetryStrategy } from "@/lib/retry-strategy";

describe("RetryStrategy", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("succeeds immediately if operation succeeds", async () => {
    const strategy = new RetryStrategy();
    const operation = jest.fn().mockResolvedValue("success");

    const result = await strategy.execute(operation);

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable status codes", async () => {
    const strategy = new RetryStrategy({
      maxRetries: 2,
      initialDelay: 100,
    });

    const error = { status: 503 };
    const operation = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce("success");

    const resultPromise = strategy.execute(operation);
    jest.runAllTimers();
    const result = await resultPromise;

    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("applies exponential backoff", async () => {
    const strategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 100,
      backoffFactor: 2,
    });

    const error = { status: 503 };
    const operation = jest.fn().mockRejectedValue(error);

    const promise = strategy.execute(operation);

    // First retry after 100ms
    jest.advanceTimersByTime(100);
    // Second retry after 200ms
    jest.advanceTimersByTime(200);
    // Third retry after 400ms
    jest.advanceTimersByTime(400);

    await expect(promise).rejects.toThrow("Operation failed after 3 retries");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("respects maxDelay limit", async () => {
    const strategy = new RetryStrategy({
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 150,
      backoffFactor: 2,
    });

    const error = { status: 503 };
    const operation = jest.fn().mockRejectedValue(error);

    const promise = strategy.execute(operation);

    // First retry after 100ms
    jest.advanceTimersByTime(100);
    // Second retry after 150ms (not 200ms due to maxDelay)
    jest.advanceTimersByTime(150);
    // Third retry after 150ms
    jest.advanceTimersByTime(150);

    await expect(promise).rejects.toThrow("Operation failed after 3 retries");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("does not retry on non-retryable status codes", async () => {
    const strategy = new RetryStrategy();
    const error = { status: 400 };
    const operation = jest.fn().mockRejectedValue(error);

    await expect(strategy.execute(operation)).rejects.toEqual(error);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
