/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ImplementationError } from "../MatterError.js";
import { Diagnostic } from "../log/Diagnostic.js";
import { DiagnosticSource } from "../log/DiagnosticSource.js";

const registry = new Set<Timer>();

/**
 * Timer and date/time management interface.
 *
 * You may replace this platform abstraction but we provide an implementation compatible with any standard JS
 * environment.
 */
export class Time {
    static get = () => time;

    now() {
        return new Date();
    }
    static readonly now = (): Date => Time.get().now();

    nowMs() {
        return this.now().getTime();
    }
    static readonly nowMs = (): number => Time.get().nowMs();

    /** Returns a timer that will call callback after durationMs has passed. */
    getTimer(name: string, durationMs: number, callback: Timer.Callback): Timer {
        return new StandardTimer(name, durationMs, callback, false);
    }
    static readonly getTimer = (name: string, durationMs: number, callback: Timer.Callback): Timer =>
        Time.get().getTimer(name, durationMs, callback);

    /** Returns a timer that will periodically call callback at intervalMs intervals. */
    getPeriodicTimer(name: string, intervalMs: number, callback: Timer.Callback): Timer {
        return new StandardTimer(name, intervalMs, callback, true);
    }
    static readonly getPeriodicTimer = (name: string, intervalMs: number, callback: Timer.Callback): Timer =>
        Time.get().getPeriodicTimer(name, intervalMs, callback);

    static readonly sleep = async (name: string, durationMs: number): Promise<void> =>
        new Promise(resolve => Time.get().getTimer(name, durationMs, resolve).start());

    static register(timer: Timer) {
        timer.elapsed = Diagnostic.elapsed();
        registry.add(timer);
    }

    static unregister(timer: Timer) {
        registry.delete(timer);
    }
}

const time = new Time();

export interface Timer {
    /** Name (diagnostics) */
    name: string;

    /** Set to true to indicate the timer should not prevent program exit */
    utility: boolean;

    /** System ID (diagnostics) */
    systemId: unknown;

    /** Interval (diagnostics) */
    intervalMs: number;

    /** Is the timer periodic? (diagnostics) */
    isPeriodic: boolean;

    /** Amount of time interval has been active (diagnostics) */
    elapsed?: Diagnostic.Elapsed;

    /** Is true if this timer is running. */
    isRunning: boolean;

    /** Starts this timer, chainable. */
    start(): Timer;

    /** Stops this timer, chainable. */
    stop(): Timer;
}

export namespace Timer {
    export type Callback = () => any;
}

export class StandardTimer implements Timer {
    #timerId: unknown;
    #utility = false;
    isRunning = false;

    get systemId() {
        return Number(this.#timerId);
    }

    constructor(
        readonly name: string,
        readonly intervalMs: number,
        private readonly callback: Timer.Callback,
        readonly isPeriodic: boolean,
    ) {
        if (intervalMs < 0 || intervalMs > 2147483647) {
            throw new ImplementationError(
                `Invalid intervalMs: ${intervalMs}. The value must be between 0 and 32-bit maximum value (2147483647)`,
            );
        }
    }

    get utility() {
        return this.#utility;
    }

    set utility(utility: boolean) {
        if (utility === this.#utility) {
            return;
        }

        // Support node.js-style environments to control whether the timer blocks process exit
        if (this.#timerId != undefined) {
            const timerId = this.#timerId as { ref?: () => void; unref?: () => void };
            if (utility) {
                timerId.unref?.();
            } else {
                timerId.ref?.();
            }
        }

        this.#utility = utility;
    }

    start() {
        if (this.isRunning) this.stop();
        Time.register(this);
        this.isRunning = true;
        this.#timerId = (this.isPeriodic ? setInterval : setTimeout)(() => {
            if (!this.isPeriodic) {
                Time.unregister(this);
                this.isRunning = false;
            }
            this.callback();
        }, this.intervalMs);
        return this;
    }

    stop() {
        (this.isPeriodic ? clearInterval : clearTimeout)(this.#timerId as ReturnType<typeof setTimeout>);
        Time.unregister(this);
        this.isRunning = false;
        return this;
    }
}

// Hook for testing frameworks
if (typeof MatterHooks !== "undefined") {
    MatterHooks.timeSetup?.(Time);
}

DiagnosticSource.add({
    get [Diagnostic.value]() {
        return Diagnostic.node("⏱", "Timers", {
            children: [...registry].map(timer => [
                timer.name,
                Diagnostic.dict({
                    periodic: timer.isPeriodic,
                    interval: Diagnostic.interval(timer.intervalMs),
                    system: timer.systemId,
                    elapsed: timer.elapsed,
                }),
            ]),
        });
    },
});
