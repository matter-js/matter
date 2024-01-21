/**
 * @license
 * Copyright 2022-2023 Project CHIP Authors
 * SPDX-License-Identifier: Apache-2.0
 */

type TimerCallback = () => any;

// Must match matter.js Timer interface
class MockTimer {
    isRunning = false;
    private readonly callback: TimerCallback;

    constructor(
        private readonly mockTime: MockTime,
        private readonly durationMs: number,
        callback: TimerCallback,
    ) {
        if (this instanceof MockInterval) {
            this.callback = callback;
        } else {
            this.callback = () => {
                this.isRunning = false;
                callback();
            };
        }
    }

    start() {
        this.mockTime.callbackAtTime(this.mockTime.nowMs() + this.durationMs, this.callback);
        this.isRunning = true;
        return this;
    }

    stop() {
        this.mockTime.removeCallback(this.callback);
        this.isRunning = false;
        return this;
    }
}

class MockInterval extends MockTimer {
    constructor(mockTime: MockTime, durationMs: number, callback: TimerCallback) {
        const intervalCallback = async () => {
            mockTime.callbackAtTime(mockTime.nowMs() + durationMs, intervalCallback);
            await callback();
        };
        super(mockTime, durationMs, intervalCallback);
    }
}

type InterceptResult<T> =
    T extends Promise<T>
        ? { resolve: Awaited<T>; reject?: undefined } | { resolve?: undefined; reject: {} }
        : { resolve: T; reject?: undefined } | { resolve?: void; reject: {} };

function isAsync(fn: (...args: any) => any): fn is (...args: any) => Promise<any> {
    return fn.constructor.name === "AsyncFunction";
}

// Must match matter.js Time interface
export class MockTime {
    private callbacks = new Array<{ atMs: number; callback: TimerCallback }>();
    private timeMs: number;

    constructor(private startTimeMs: number) {
        this.timeMs = this.startTimeMs;
    }

    reset(time = this.startTimeMs) {
        this.callbacks = [];
        this.timeMs = time;
    }

    now(): Date {
        return new Date(this.timeMs);
    }

    nowMs(): number {
        return this.timeMs;
    }

    getTimer(durationMs: number, callback: TimerCallback): MockTimer {
        return new MockTimer(this, durationMs, callback);
    }

    getPeriodicTimer(intervalMs: number, callback: TimerCallback): MockTimer {
        return new MockInterval(this, intervalMs, callback);
    }

    /**
     * Move time forward.  Runs tasks scheduled during this interval.
     */
    async advance(ms: number) {
        const newTimeMs = this.timeMs + ms;

        while (true) {
            if (this.callbacks.length === 0) break;
            const { atMs, callback } = this.callbacks[0];
            if (atMs > newTimeMs) break;
            this.callbacks.shift();
            this.timeMs = atMs;
            await callback();
        }

        this.timeMs = newTimeMs;
    }

    /**
     * Yield to scheduled microtasks.  This means that all code paths waiting
     * on resolved promises (including await) will proceed before this method
     * returns.
     */
    async yield() {
        await Promise.resolve();
    }

    /**
     * Due to its implementation, an older version of yield() would actually
     * yield to microtasks three times.  Our tests then depended on this
     * functionality -- one yield could trigger up to three nested awaits.
     *
     * To make this clear, the version of yield() that emulates old behavior
     * is called "yield3".
     */
    async yield3() {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    }

    /**
     * Hook a method and invoke a callback just before the method completes.
     * Unhooks after completion.
     *
     * Handles both synchronous and asynchronous methods.  The interceptor
     * should match the async-ness of the intercepted method.
     *
     * The interceptor can optionally access and/or replace the resolve/reject
     * value.
     */
    interceptOnce<NameT extends string, ReturnT, ObjT extends { [N in NameT]: (...args: any) => ReturnT }>(
        obj: ObjT,
        method: NameT,
        interceptor: (
            result: InterceptResult<ReturnT>,
        ) => void | InterceptResult<ReturnT> | Promise<void> | Promise<InterceptResult<ReturnT>>,
    ) {
        const original = obj[method];
        if (!original) {
            throw new Error(`Interception method ${method} is not present`);
        }
        let result: InterceptResult<ReturnT>;
        if (isAsync(interceptor)) {
            obj[method] = async function (this: any, ...args: any): Promise<any> {
                try {
                    // eslint-disable-next-line @typescript-eslint/await-thenable
                    const resolve = await original.apply(this, args);
                    result = { resolve } as any;
                } catch (reject) {
                    result = { reject } as any;
                } finally {
                    obj[method] = original;
                }
                result = (await interceptor(result)) ?? result;
                if (result.reject) {
                    throw result.reject;
                }
                return result.resolve;
            } as any;
        } else {
            obj[method] = function (this: any, ...args: any): any {
                try {
                    const resolve = original.apply(this, args);
                    result = { resolve } as any;
                } catch (reject) {
                    result = { reject } as any;
                } finally {
                    obj[method] = original;
                }
                result = (interceptor(result) as any) ?? result;
                if (result.reject) {
                    throw result.reject;
                }
                return result.resolve;
            } as any;
        }
    }

    callbackAtTime(atMs: number, callback: TimerCallback) {
        this.callbacks.push({ atMs, callback });
        this.callbacks.sort(({ atMs: atMsA }, { atMs: atMsB }) => atMsA - atMsB);
    }

    removeCallback(callbackToRemove: TimerCallback) {
        const index = this.callbacks.findIndex(({ callback }) => callbackToRemove === callback);
        if (index === -1) return;
        this.callbacks.splice(index, 1);
    }
}

export const TheMockTime = new MockTime(0);
export function timeSetup(Time: { get: () => MockTime }) {
    Time.get = () => TheMockTime;
}
