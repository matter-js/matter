/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { looksLikeListItem } from "@matter/general";
import { Words } from "../../util/words.js";
import { Str } from "./html-translators.js";
import { HtmlReference } from "./spec-types.js";

/**
 * Extraction terminates when it encounters these flags.  These are for places where we don't have an elegant way of
 * determining that content is unusable.
 */
export const EndContentFlags = [
    // OnOff cluster state diagram becomes a total mess
    /These concepts are illustrated in Explanation of the Behavior of Store/,

    // Similar issue for thermostat cluster
    /Optional temperature, humidity and occupancy sensors/,
];

/**
 * Uncommon english words that are part of known splits.
 */
export const NotWords = new Set(["cur"]);

/**
 * A light attempt at dropping text to make documentation seem slightly less scavenged.
 */
function extractUsefulDocumentation(text: string) {
    return text
        .replace(/SHALL/g, "shall")
        .replace(/MAY/g, "may")
        .replace(/RECOMMENDED/g, "recommended")
        .replace(/This data type is derived from \S+(?: and has its values listed below)?\./, "")
        .replace(/The data type \S+ is derived from \S+\./, "")
        .replace(/The data type of the(?: \w+)+ is derived from \S+\./, "")
        .replace(/The values of the(?: \w+)+ are listed below\./, "")
        .replace(/(?:The )?\S+ Data Type is derived from \S+\./, "")
        .replace(
            /(?:This\s+(?:command|event)|The\s+\w+\s+(?:command|event))\s+shall\s+have\s+the\s+following\s+data\s+fields:/i,
            "",
        )
        .replace(/The (?:data|arguments) for this command (?:shall be|is|are) as follows:/i, "")
        .replace(/This attribute has the following possible values:/, "")
        .replace(/The \w+ attribute is indicated by an enumeration:/, "")
        .replace(/The data of this event shall contain the following information:/i, "")
        .replace(/The event.s data are as follows:/, "")
        .replace(/ as described in the table below:/, "")
        .replace(/,? using(?: the)? data as follows:$/, ".")
        .replace(/Here are some examples:/, "")
        .replace(/Valid combinations using null fields are shown below:/, "")
        .replace(/,? shown below:$/, "")
        .replace(/ such that:$/, "")
        .replace(/, derived from \w+,/, "")
        .replace(/\([^)]*$/, "")
        .replace(/\s{2,}/, "  ")
        .replace(/This attribute shall (?:indicate|represent)/, "Indicates")
        .replace(/This attribute shall be null/, "Null")
        .replace(/The following tags are defined in this namespace\./, "")
        .replace(/This section contains the .* as part of the semantic tag feature\./i, "")
        .replace(
            /The table below lists the changes relative to the Mode Base Cluster for the fields of the ModeOptionStruct type\./,
            "",
        )
        .replace(/. if the AbsolutePosition/, ".\nif the AbsolutePosition")
        .replace(/Optional temperature, humidity and occupancy sensors.*/, "")
        .replace(/Maintenan ce/, "Maintenance")
        .replace(/\.Command not/, ". Command not")
        .replace(/notback-off/, "not back-off")
        .replace(/-(or|and) /, "- $1 ")
        .trim();
}

/**
 * Look for obvious split paragraphs and reassemble.
 */
function mergeSplitParagraphs(paragraphs: string[]) {
    // First merge by identifying word splits.  These we want to merge without an intervening space
    for (let i = 0; i < paragraphs.length - 1; i++) {
        const trailing = paragraphs[i].replace(/^.*\s(\w+)$/, "$1").toLowerCase();
        const leading = paragraphs[i + 1].replace(/^(\w+)\W.*$/, "$1").toLowerCase();
        if (Words.has(leading) && !NotWords.has(leading) && Words.has(trailing) && !NotWords.has(trailing)) {
            continue;
        }
        const possibleWord = `${trailing}${leading}`;
        if (Words.has(possibleWord)) {
            joinParagraphs(i, "");
        }
    }

    // Next merge by identifying sentence splits
    for (let i = 0; i < paragraphs.length - 1; i++) {
        const paragraph = paragraphs[i];
        if (
            paragraph.endsWith(".") ||
            paragraph.endsWith(":") ||
            paragraph.endsWith(".”") ||
            paragraph.endsWith('."') ||
            paragraph.startsWith("###")
        ) {
            continue;
        }

        // If anything in the "paragraph" looks like an equation, merging will likely do more harm than good
        if (looksLikeEquation(paragraph)) {
            continue;
        }

        const sentences = paragraph.split(/[.?!:]\s/);
        while (sentences.length > 1 && !sentences[sentences.length - 1].match(/^[A-Z]/)) {
            sentences[sentences.length - 2] = sentences.splice(sentences.length - 2, 2).join("");
        }
        const lastSentence = sentences[sentences.length - 1];
        if (!lastSentence.match(/^[A-Z]/)) {
            continue;
        }

        const nextParagraph = paragraphs[i + 1];

        // Do not merge list items, paragraphs, or embedded headings
        if (looksLikeListItem(nextParagraph) || nextParagraph.startsWith("###") || looksLikeEquation(nextParagraph)) {
            continue;
        }

        if (nextParagraph)
            if (
                // Starts with number or lowercase letter
                nextParagraph.match(/^[a-z0-9]/i) ||
                // Has an unmatched closing parenthesis
                nextParagraph.match(/^[^(]*\)/) ||
                // Has an unmatched double quotation
                nextParagraph.match(/^[^“]*”/)
            ) {
                if (!nextParagraph.match(/[.?!]\s/) || nextParagraph.match(/[.?!:]$/)) {
                    joinParagraphs(i, " ");
                }
            }
    }

    function joinParagraphs(index: number, separator: string) {
        paragraphs.splice(index, 2, `${paragraphs[index]}${separator}${paragraphs[index + 1]}`);
    }
}

/**
 * Make a valiant attempt to extract comprehensible documentation from the gobbledy gook produced by tired spec writers
 * -> word -> PDF -> HTML -> us pipeline.
 */
export function addDocumentation(target: { details?: string }, definition: HtmlReference) {
    const prose = definition.prose;
    if (!prose) {
        return;
    }

    let paragraphs = Array<string>();

    let collectNote = false;

    let listIndent = 0;
    let listSpacing = 0;

    prose: for (const p of prose) {
        // Anchors receive special examination
        let looksLikeHeading = false;
        const first = p.firstChild as any;
        if (first?.tagName == "A" && first.getAttribute("name")) {
            const text = first.textContent;

            // Ignore table notations
            if (text.match(/^Table \d+/)) {
                listIndent = 0;
                continue;
            }

            // This edge case happens a half dozen times or so; subsection headings would otherwise appear as unadorned
            // text.  Instead stick a markdownish prefix on them.  Heuristically ignore various junk that also appears
            // in links but isn't a heading
            if (text.match(/^[^(.:]*$/)) {
                looksLikeHeading = true;
            }
        }

        // Extract text
        let text = Str(p);

        // Ignore figure annotations
        if (text.match(/^Figure \d+/)) {
            listIndent = 0;
            continue;
        }

        // Next paragraph is a note if text is "NOTE"
        if (text === "NOTE") {
            listIndent = 0;
            collectNote = true;
            continue;
        }

        // Create note if we we saw "NOTE" previously
        if (collectNote) {
            listIndent = 0;
            paragraphs.push(`> [!NOTE]\n> ${extractUsefulDocumentation(text)}`);
            collectNote = false;
            continue;
        }

        // Terminate if flagged
        for (const flag of EndContentFlags) {
            if (text.match(flag)) {
                break prose;
            }
        }

        // Additional "heading" detection - short line that starts with capital and can't be a sentence fragment
        if (
            text.length < 50 &&
            text.match(/^[A-Z]/) &&
            !text.match(/[.?!:]$/) &&
            !looksLikeListItem(text) &&
            !looksLikeEquation(text)
        ) {
            looksLikeHeading = true;
        }

        // Add the text
        if (text) {
            if (looksLikeHeading) {
                // Special case
                listIndent = 0;
                text = `### ${text}`;
            } else if (looksLikeListItem(text)) {
                // This looks like a list entry; record metadata required to detect broken list entry "paragraphs" that
                // occur due to page split
                listIndent = getIndent(p);

                // We use this as an additional heuristic to avoid joining lists with paragraphs that have the same
                // indentation
                listSpacing = getPaddingTop(p);
            } else if (listIndent) {
                // Repair split list entries.  We do this earlier than other repairs because we leverage styling
                // information that is unavailable after conversion to text
                if (getIndent(p) >= listIndent && getPaddingTop(p) <= listSpacing) {
                    paragraphs[paragraphs.length - 1] += ` ${text}`;
                    continue;
                }

                listIndent = 0;
            }
            paragraphs.push(text);
        }
    }

    if (paragraphs.length) {
        mergeSplitParagraphs(paragraphs);
        paragraphs = paragraphs.map(extractUsefulDocumentation).filter(p => p !== "" && p !== "###");
        target.details = paragraphs.join("\n");
    }
}

function getIndent(el: HTMLElement) {
    return sumStyles(el, "padding-left", "margin-left", "text-indent");
}

function getPaddingTop(el: HTMLElement) {
    let value = sumStyles(el, "padding-top");

    // Acrobat's formatting is terrible.  Detect "<p><br/></p>" which often ends up separating paragraphs from lists
    if (el.previousElementSibling?.children[0]?.tagName === "BR") {
        value += 10;
    }

    return value;
}

function sumStyles(el: HTMLElement, ...names: string[]) {
    const styles = el.style;

    let sum = 0;

    for (const name of names) {
        const value = styles.getPropertyValue(name)?.toString();
        if (!value) {
            continue;
        }
        const number = Number.parseInt(value);
        if (!number) {
            continue;
        }

        // Do not worry about units; we're just spitballing anyway
        sum += number;
    }

    return sum;
}

/**
 * Very simple (currently) heuristics to identify equations so we don't munge them in with other stuff too terribly.
 */
function looksLikeEquation(text: string) {
    // Count mathematical operators
    const operators = text.match(/\s[=x*\-/+÷]\s/g)?.length ?? 0;

    // Count balanced groups
    const groups = Math.max(text.match(/\(/g)?.length ?? 0, text.match(/\)/g)?.length ?? 0);

    // Must have at least one operator and 2+ operators/groups
    return operators && operators + groups > 1;
}
