/*
   Copyright 2024 Chris Wheeler and Jonathan Chua

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import test from "node:test"; // https://nodejs.org/api/test.html
import assert from "node:assert/strict"; // https://nodejs.org/api/assert.html#assert
import { JSDOM } from "jsdom"; // https://www.npmjs.com/package/jsdom
import { htmlToMd } from "../src/converters/md.js";

global.location = { href: "https://example.com" };

function runTest(testName, htmlInput, mdExpected) {
    test(testName, async (t) => {
        global.document = new JSDOM(htmlInput).window.document;
        const mdActual = await htmlToMd(global.document.body);
        assert.equal(mdActual, mdExpected);
    });
}

function runTests() {
    for (let i = 0; i < tests.length; i++) {
        const { testName, htmlInput, mdExpected } = tests[i];
        runTest(testName, htmlInput, mdExpected);
    }
}

const tests = [
    {
        testName: "0x0",
        htmlInput: `<table>
            </table>`,
        mdExpected: `
`,
    },
    {
        testName: "1x1",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                </tr>
            </table>`,
        mdExpected: `| a |
| --- |
`,
    },
    {
        testName: "2x1",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
            </table>`,
        mdExpected: `| a | b |
| --- | --- |
`,
    },
    {
        testName: "1x2",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                </tr>
                <tr>
                    <td>
                        c
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a |
| --- |
| c |
`,
    },
    {
        testName: "2x2",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
                <tr>
                    <td>
                        c
                    </td>
                    <td>
                        d
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b |
| --- | --- |
| c | d |
`,
    },
    {
        testName: "2x3",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b |
| --- | --- |
| d | e |
| g | h |
`,
    },
    {
        testName: "3x2",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                    <th>
                        c
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                    <td>
                        f
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
`,
    },
    {
        testName: "3x3",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                    <th>
                        c
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                    <td>
                        f
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                    <td>
                        i
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "3x3 -1 cell in the second body row",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                    <th>
                        c
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                    <td>
                        f
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h |  |
`,
    },
    {
        testName: "3x3 -1 cell in the first body row",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                    <th>
                        c
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                    <td>
                        i
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e |  |
| g | h | i |
`,
    },
    {
        testName: "3x3 -1 cell in the header row",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                    <td>
                        f
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                    <td>
                        i
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b |  |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "3x3 -2 cells in the header row",
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                    <td>
                        f
                    </td>
                </tr>
                <tr>
                    <td>
                        g
                    </td>
                    <td>
                        h
                    </td>
                    <td>
                        i
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a |  |  |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "thead",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                        <th>
                            b
                        </th>
                        <th>
                            c
                        </th>
                    </tr>
                </thead>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
`,
    },
    {
        testName: "one thead and one tbody",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                        <th>
                            b
                        </th>
                        <th>
                            c
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            d
                        </td>
                        <td>
                            e
                        </td>
                        <td>
                            f
                        </td>
                    </tr>
                    <tr>
                        <td>
                            g
                        </td>
                        <td>
                            h
                        </td>
                        <td>
                            i
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "one thead and two tbodies",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                        <th>
                            b
                        </th>
                        <th>
                            c
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            d
                        </td>
                        <td>
                            e
                        </td>
                        <td>
                            f
                        </td>
                    </tr>
                </tbody>
                <tbody>
                    <tr>
                        <td>
                            g
                        </td>
                        <td>
                            h
                        </td>
                        <td>
                            i
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "thead, tbodies, and a th column",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                        <th>
                            b
                        </th>
                        <th>
                            c
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>
                            d
                        </th>
                        <td>
                            e
                        </td>
                        <td>
                            f
                        </td>
                    </tr>
                </tbody>
                <tbody>
                    <tr>
                        <th>
                            g
                        </th>
                        <td>
                            h
                        </td>
                        <td>
                            i
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`,
    },
    {
        testName: "one tbody, no thead",
        htmlInput: `<table>
                <tbody>
                    <tr>
                        <th>
                            a
                        </th>
                        <th>
                            b
                        </th>
                        <th>
                            c
                        </th>
                    </tr>
                    <tr>
                        <td>
                            d
                        </td>
                        <td>
                            e
                        </td>
                        <td>
                            f
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
`,
    },
    {
        testName: "two tbodies, no thead",
        htmlInput: `<table>
                <tbody>
                    <tr>
                        <td>
                            a
                        </td>
                        <td>
                            b
                        </td>
                        <td>
                            c
                        </td>
                    </tr>
                    <tr>
                        <td>
                            d
                        </td>
                        <td>
                            e
                        </td>
                        <td>
                            f
                        </td>
                    </tr>
                <tbody>
                </tbody>
                    <tr>
                        <td>
                            g
                        </td>
                        <td>
                            h
                        </td>
                        <td>
                            i
                        </td>
                    </tr>
                    <tr>
                        <td>
                            j
                        </td>
                        <td>
                            k
                        </td>
                        <td>
                            l
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
| j | k | l |
`,
    },
    {
        testName: "multiple rows in a thead",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                    </tr>
                    <tr>
                        <th>
                            b
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            c
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
| c |
`,
    },
    {
        testName: "one tbody and one tfoot, each with one row",
        htmlInput: `<table>
                <tbody>
                    <tr>
                        <td>
                            a
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td>
                            b
                        </td>
                    </tr>
                </tfoot>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
`,
    },
    {
        testName: "one tbody and one tfoot, each with two rows",
        htmlInput: `<table>
                <tbody>
                    <tr>
                        <td>
                            a
                        </td>
                    </tr>
                    <tr>
                        <td>
                            b
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td>
                            c
                        </td>
                    </tr>
                    <tr>
                        <td>
                            d
                        </td>
                    </tr>
                </tfoot>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
| c |
| d |
`,
    },
    {
        testName: "one thead with a tr, followed by one tr",
        htmlInput: `<table>
                <thead>
                    <tr>
                        <th>
                            a
                        </th>
                    </tr>
                </thead>
                <tr>
                    <td>
                        b
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
`,
    },
    {
        testName: "one tr, followed by one tfoot",
        htmlInput: `<table>
                <tr>
                    <td>
                        a
                    </td>
                </tr>
                <tfoot>
                    <tr>
                        <th>
                            b
                        </th>
                    </tr>
                </tfoot>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
`,
    },
    {
        testName: "bold and emphasis",
        htmlInput: `<table>
                <tr>
                    <td>
                        a
                    </td>
                    <td>
                        <em>b</em>
                    </td>
                </tr>
                <tr>
                    <td>
                        <b>c</b>
                    </td>
                    <td>
                        <b><em>d</em></b>
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | *b* |
| --- | --- |
| **c** | ***d*** |
`,
    },
    {
        testName: "paragraphs and breaks",
        htmlInput: `<table>
                    <tr>
                        <th>
                            <p>a</p>
                            <p>b</p>
                        </th>
                        <th>
                            <p>c</p>
                            <br>
                            <p>d</p>
                        </th>
                    </tr>
                    <tr>
                        <td>
                            <p>e</p>
                            <br>
                            <p>f</p>
                        </td>
                        <td>
                            <p>g</p>
                            <p>h</p>
                        </td>
                    </tr>
                </table>`,
        mdExpected: `| a b | c d |
| --- | --- |
| e f | g h |
`,
    },
    {
        testName: "h1 and h2 in rows",
        htmlInput: `<table>
                <tr>
                    <th>
                        <h1>a</h1>
                    </th>
                </tr>
                <tr>
                    <td>
                        <h2>b</h2>
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
`,
    },
    {
        testName: "table of tables",
        htmlInput: `<table>
                <tr>
                    <td>
                        <table>
                            <tr>
                                <td>
                                    a
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    b
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td>
                        <table>
                            <tr>
                                <td>
                                    c
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    d
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a b |
| --- |
| c d |
`,
    },
    {
        testName: "caption",
        htmlInput: `<table>
                <caption>
                    this is a caption
                </caption>
                <tbody>
                    <tr>
                        <th>
                            a
                        </th>
                    </tr>
                    <tr>
                        <td>
                            b
                        </td>
                    </tr>
                </tbody>
            </table>`,
        mdExpected: `**this is a caption**

| a |
| --- |
| b |
`,
    },
    {
        testName: "colspan",
        htmlInput: `<table>
                <tr>
                    <th colspan="2">
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
                <tr>
                    <td>
                        c
                    </td>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | a | b |
| --- | --- | --- |
| c | d | e |
`,
    },
    {
        testName: "rowspan",
        htmlInput: `<table>
                <tr>
                    <th rowspan="2">
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
                <tr>
                    <td>
                        c
                    </td>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b |
| --- | --- |
| a | c |
| d | e |
`,
    },
    {
        testName: "parallel colspans",
        htmlInput: `<table>
                <tr>
                    <td colspan="2">
                        a
                    </td>
                </tr>
                <tr>
                    <td>
                        b
                    </td>
                    <td>
                        c
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        d
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | a |
| --- | --- |
| b | c |
| d | d |
`,
    },
    {
        testName: "parallel rowspans",
        htmlInput: `<table>
                <tr>
                    <td rowspan="2">
                        a
                    </td>
                    <td>
                        b
                    </td>
                    <td rowspan="2">
                        c
                    </td>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| a | d | c |
`,
    },
    {
        testName: "colspan and rowspan in the same cell",
        htmlInput: `<table>
                <tr>
                    <td>
                        a
                    </td>
                    <td>
                        b
                    </td>
                    <td>
                        c
                    </td>
                </tr>
                <tr>
                    <td>
                        d
                    </td>
                    <td colspan="2" rowspan="2">
                        e
                    </td>
                </tr>
                <tr>
                    <td>
                        f
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a | b | c |
| --- | --- | --- |
| d | e | e |
| f | e | e |
`,
    },
    {
        testName: "colspan and rowspan in the same empty cell",
        htmlInput: `<table>
                <tr>
                    <td colspan="2" rowspan="2">
                    </td>
                    <td>
                        a
                    </td>
                </tr>
                <tr>
                    <td>
                        b
                    </td>
                </tr>
                <tr>
                    <td>
                        c
                    </td>
                    <td>
                        d
                    </td>
                    <td>
                        e
                    </td>
                </tr>
            </table>`,
        mdExpected: `|  |  | a |
| --- | --- | --- |
|  |  | b |
| c | d | e |
`,
    },
    {
        testName: "spaces around",
        htmlInput: `<table>
                <tr>
                    <th>
                        <p>  a  </p>
                    </th>
                </tr>
                <tr>
                    <td>
                        <p>  b  </p>
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a |
| --- |
| b |
`,
    },
    {
        testName: "lists",
        htmlInput: `<table>
                    <tr>
                        <th>
                            <ul>
                                <li>a</li>
                                <li>b</li>
                            </ul>
                        </th>
                        <th>
                            <ol>
                                <li>c</li>
                                <li>d</li>
                            </ol>
                        </th>
                    </tr>
                    <tr>
                        <td>
                            <ol>
                                <li>e</li>
                                <li>f</li>
                            </ol>
                        </td>
                        <td>
                            <ul>
                                <li>g</li>
                                <li>h</li>
                            </ul>
                        </td>
                    </tr>
                </table>`,
        mdExpected: `| - a - b | 1. c 2. d |
| --- | --- |
| 1. e 2. f | - g - h |
`,
    },
    {
        testName: "pipe symbols",
        htmlInput: `<table>
                <tr>
                    <th>
                        a | b
                    </th>
                </tr>
                <tr>
                    <td>
                        c | d
                    </td>
                </tr>
            </table>`,
        mdExpected: `| a \\| b |
| --- |
| c \\| d |
`,
    },
];

runTests();
