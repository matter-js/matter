/**
 * @license
 * Copyright 2022-2024 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Diagnostic } from "../../src/log/Diagnostic.js";
import { LogFormat } from "../../src/log/LogFormat.js";
import { LogLevel } from "../../src/log/LogLevel.js";
import { Logger, consoleLogger } from "../../src/log/Logger.js";
import { Bytes } from "../../src/util/Bytes.js";

const LOGGER_NAME = "UnitTest";

type LogOptions = {
    format?: LogFormat.Type;
    levels?: typeof Logger.logLevels;
    method?: "notice" | "info" | "debug" | "warn" | "error" | "fatal";
    fromLogger?: string;
};

function captureOne(fn: () => void, fromLogger?: string) {
    return Logger.capture(fn, fromLogger)[0];
}

describe("Logger", () => {
    const logger = Logger.get(LOGGER_NAME);

    function capture(fn: () => void, { format, levels, fromLogger = "default" }: LogOptions) {
        return captureOne(() => {
            Logger.setFormatForLogger(fromLogger, format ?? LogFormat.PLAIN);
            if (levels) {
                Logger.setLogLevelsForLogger(fromLogger, levels);
            }
            fn();
        }, fromLogger);
    }

    function logTestLine(options: LogOptions = {}) {
        return capture(() => logger[options.method ?? "debug"]("test"), options);
    }

    function logTestDict(options: LogOptions = {}) {
        return capture(
            () =>
                logger[options.method ?? "debug"](
                    "dict test",
                    Diagnostic.dict({
                        foo: "bar",
                        biz: 1,
                    }),
                ),
            options,
        );
    }

    describe("debug", () => {
        it("logs a message if level is debug", () => {
            const result = logTestLine();
            expect(result?.level).equal(LogLevel.DEBUG);
        });

        it("doesn't log a message if level is above debug", () => {
            const result = Logger.capture(() => {
                logTestLine({ levels: { [LOGGER_NAME]: LogLevel.INFO } });
            });

            expect(result.length).equal(0);
        });
    });

    describe("info", () => {
        it("logs a message if level is info", () => {
            const result = logTestLine({
                method: "info",
            });

            expect(result?.level).equal(LogLevel.INFO);
        });

        it("doesn't log a message if level is above info", () => {
            const result = logTestLine({
                method: "info",
                levels: { [LOGGER_NAME]: LogLevel.ERROR },
            });

            expect(result).equal(undefined);
        });
    });

    describe("warn", () => {
        it("logs a message if level is warn", () => {
            const result = logTestLine({
                method: "warn",
            });

            expect(result?.level).equal(LogLevel.WARN);
        });

        it("doesn't log a message if level is above warn", () => {
            const result = logTestLine({
                method: "warn",
                levels: { [LOGGER_NAME]: LogLevel.ERROR },
            });

            expect(result).equal(undefined);
        });
    });

    describe("error", () => {
        it("logs a message if level is error", () => {
            const result = logTestLine({
                method: "error",
            });

            expect(result?.level).equal(LogLevel.ERROR);
        });

        it("doesn't log a message if level is above error", () => {
            const result = logTestLine({
                method: "error",
                levels: { [LOGGER_NAME]: LogLevel.FATAL },
            });

            expect(result).equal(undefined);
        });
    });

    describe("fatal", () => {
        it("logs a message", () => {
            const result = logTestLine({
                method: "fatal",
            });

            expect(result?.level).equal(LogLevel.FATAL);
        });
    });

    describe("second logger with info/debug mix", () => {
        before(() => {
            Logger.addLogger("second", () => {}, { defaultLogLevel: LogLevel.INFO });
        });

        it("logs a message if level is info", () => {
            const result = logTestLine({
                method: "info",
                fromLogger: "second",
            });

            expect(result?.level).equal(LogLevel.INFO);
        });

        it("doesn't log a message if level is above info", () => {
            const result = logTestLine({
                method: "info",
                levels: { [LOGGER_NAME]: LogLevel.ERROR },
                fromLogger: "second",
            });

            expect(result).equal(undefined);
        });

        after(() => {
            Logger.removeLogger("second");
        });
    });

    describe("nesting", () => {
        it("nests once", () => {
            Logger.nest(() => {
                const line = logTestLine();
                expect(line).ok;
                expect(line?.message).match(/⎸ test/);
            });
        });

        it("nests twice", () => {
            Logger.nest(() => {
                Logger.nest(() => {
                    const line = logTestLine();
                    expect(line).ok;
                    expect(line?.message).match(/⎸ {3}test/);
                });
            });
        });

        it("unnests", () => {
            // "true" is for eslint
            Logger.nest(() => {
                true;
            });
            const line = logTestLine();
            expect(line).ok;
            expect(line?.message.indexOf("⎸")).equal(-1);
        });
    });

    describe("plainFormat", () => {
        it("formats lines correctly", () => {
            const result = logTestLine();

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx DEBUG UnitTest test");
        });

        it("formats keys correctly", () => {
            const result = logTestDict();

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx DEBUG UnitTest dict test foo: bar biz: 1");
        });

        it("accepts multiple values", () => {
            const result = captureOne(() => {
                logger.debug("value1", "value2");
            });

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx DEBUG UnitTest value1 value2");
        });

        it("converts ByteArray to hex strings", () => {
            const result = captureOne(() => {
                logger.debug(Bytes.fromHex("00deadbeef"));
            });

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx DEBUG UnitTest 00deadbeef");
        });

        it("handles undefined and null correctly", () => {
            const result = captureOne(() => {
                logger.debug(undefined, null);
            });

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx DEBUG UnitTest undefined null");
        });

        it("accepts custom formatters", () => {
            const result = captureOne(() => {
                Logger.setLogFormatterForLogger(
                    "default",
                    (_now, _level, _facility, _nestingPrefix, values) => `${values[0]}`,
                );
                logger.debug("test");
            });

            expect(result?.message).equal("test");
        });

        it("logs error stack traces", () => {
            const result = captureOne(() => {
                logger.error("Uh", new Error("oh"));
            });

            const lines = `${result?.message}`.split("\n");
            expect(lines.length > 1).ok;
            expect(lines[0]).equal("xxxx-xx-xx xx:xx:xx.xxx ERROR UnitTest Uh oh");
        });

        it("handles missing stack traces", () => {
            const error = new Error("oh");
            delete error.stack;
            const result = captureOne(() => {
                logger.error("Uh", error);
            });

            expect(result?.message).equal("xxxx-xx-xx xx:xx:xx.xxx ERROR UnitTest Uh oh");
        });

        it("emphasizes", () => {
            const result = captureOne(() => {
                logger.error("THIS IS", Diagnostic.strong("VERY"), "IMPORTANT");
            });
            expect(result?.message).equals("xxxx-xx-xx xx:xx:xx.xxx ERROR UnitTest THIS IS *VERY* IMPORTANT");
        });
    });

    describe("ansiFormat", () => {
        it("format lines correctly", () => {
            const result = logTestLine({ format: LogFormat.ANSI });

            expect(result?.message).equal(
                "\u001b[2mxxxx-xx-xx xx:xx:xx.xxx DEBUG  \u001b[0;1;90mUnitTest             \u001b[0;90mtest\u001b[0m",
            );
        });

        it("formats keys correctly", () => {
            const result = logTestDict({ method: "notice", format: LogFormat.ANSI });

            expect(result?.message).equal(
                "\u001b[2mxxxx-xx-xx xx:xx:xx.xxx NOTICE \u001b[0;1;90mUnitTest             \u001b[0;32mdict test \u001b[34mfoo: \u001b[2;39mbar \u001b[0;34mbiz: \u001b[2;39m1\u001b[0m",
            );
        });

        it("truncates facility", () => {
            const result = captureOne(() => {
                Logger.format = LogFormat.ANSI;
                const logger = Logger.get("ThisIsAFacilityWithAReallyLongName");
                logger.debug("test");
            });

            expect(result?.message).equal(
                "\u001b[2mxxxx-xx-xx xx:xx:xx.xxx DEBUG  \u001b[0;1;90mThisIsAFac~yLongName \u001b[0;90mtest\u001b[0m",
            );
        });

        it("emphasizes", () => {
            const result = captureOne(() => {
                Logger.format = LogFormat.ANSI;
                logger.notice("THIS IS", Diagnostic.strong("VERY"), "IMPORTANT");
            });

            expect(result?.message).equals(
                "\u001b[2mxxxx-xx-xx xx:xx:xx.xxx NOTICE \u001b[0;1;90mUnitTest             \u001b[0;32mTHIS IS \u001b[1mVERY \u001b[0;32mIMPORTANT\u001b[0m",
            );
        });

        it("indents properly", () => {
            const result = captureOne(() => {
                Logger.format = LogFormat.ANSI;
                logger.info(
                    "start",
                    "same line\nnext line\nand more",
                    "and more",
                    Diagnostic.list([
                        "indented\nnext line",
                        Diagnostic.list(["indented deeper\nand more"]),
                        "up again",
                        Diagnostic.list(["and down"]),
                    ]),
                    "and all the way up",
                );
            });

            expect(result?.message).equals(
                "\u001b[2mxxxx-xx-xx xx:xx:xx.xxx INFO   \u001b[0;1;90mUnitTest             \u001b[0mstart same line\n  next line\n  and more \n  and more\n    indented\n    next line\n      indented deeper\n      and more\n    up again\n      and down\n  and all the way up\u001b[0m",
            );
        });
    });

    describe("htmlFormat", () => {
        it("formats lines correctly", () => {
            const result = logTestLine({ format: LogFormat.HTML });

            expect(result?.message).equal(
                '<span class="matter-log-line debug"><span class="matter-log-time">xxxx-xx-xx xx:xx:xx.xxx</span> <span class="matter-log-level">DEBUG</span> <span class="matter-log-facility">UnitTest</span> test</span>',
            );
        });

        it("formats keys correctly", () => {
            const result = logTestDict({ format: LogFormat.HTML });

            expect(result?.message).equal(
                '<span class="matter-log-line debug"><span class="matter-log-time">xxxx-xx-xx xx:xx:xx.xxx</span> <span class="matter-log-level">DEBUG</span> <span class="matter-log-facility">UnitTest</span> dict test <span class="matter-log-key">foo:</span> <span class="matter-log-value">bar</span> <span class="matter-log-key">biz:</span> <span class="matter-log-value">1</span></span>',
            );
        });

        it("emphasizes", () => {
            const result = captureOne(() => {
                Logger.format = LogFormat.HTML;
                logger.fatal("THIS IS", Diagnostic.strong("VERY"), "IMPORTANT");
            });
            expect(result?.message).equals(
                '<span class="matter-log-line fatal"><span class="matter-log-time">xxxx-xx-xx xx:xx:xx.xxx</span> <span class="matter-log-level">FATAL</span> <span class="matter-log-facility">UnitTest</span> THIS IS <em>VERY</em> IMPORTANT</span>',
            );
        });
    });

    describe("setFormat", () => {
        it("throws if format is unknown", () => {
            let message;
            try {
                captureOne(() => {
                    Logger.format = "foo";
                });
            } catch (e: unknown) {
                message = (<any>e).message;
            }
            expect(message).equal('Unsupported log format "foo"');
        });
    });

    describe("toJSON", () => {
        it("works", () => {
            expect(Logger.toJSON("foo")).equal('"foo"');
        });

        it("handles BigInt", () => {
            expect(Logger.toJSON(BigInt(4))).equal('"4"');
        });
    });

    function itUsesCorrectConsoleMethod(sourceName: string, sinkName: string = sourceName) {
        it(`maps logger.${sourceName} to console.${sinkName}`, () => {
            const actualLogger = Logger.log;
            const actualConsole = consoleLogger.console;

            let result: string | undefined = undefined;
            let calls = 0;
            const mock = (message: string) => {
                calls++;
                result = message;
            };

            try {
                Logger.log = consoleLogger;
                consoleLogger.console = {
                    [sinkName]: mock,
                } as any;
                (<any>logger)[sourceName].call(logger, "test");
            } finally {
                Logger.log = actualLogger;
                consoleLogger.console = actualConsole;
            }

            expect(calls).equal(1);
            expect(result).exist;
            expect(result).match(
                new RegExp(
                    `\\d{4}-\\d\\d-\\d\\d \\d\\d:\\d\\d:\\d\\d.\\d\\d\\d.*${sourceName.toUpperCase()}.*UnitTest.*test`,
                ),
            );
        });
    }

    describe("console logging", () => {
        itUsesCorrectConsoleMethod("debug");
        itUsesCorrectConsoleMethod("info");
        itUsesCorrectConsoleMethod("warn");
        itUsesCorrectConsoleMethod("error");
        itUsesCorrectConsoleMethod("fatal", "error");
    });
});
