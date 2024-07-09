/*
   Copyright 2024 Chris Wheeler

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

import test from 'node:test'; // https://nodejs.org/api/test.html
import assert from 'node:assert/strict'; // https://nodejs.org/api/assert.html#assert
import { JSDOM } from 'jsdom'; // https://www.npmjs.com/package/jsdom
import { newTurndownService } from '../src/newTurndownService.js';
import { escape } from '../src/md.js';

const turndownService = newTurndownService(
    '-', 'underlined', 'source with link', true, true, escape,
);

function runTest(testName, htmlInput, mdExpected) {
    test(testName, t => {
        global.document = new JSDOM(htmlInput).window.document;
        const mdActual = turndownService.turndown(htmlInput);
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
        testName: '0x0',
        htmlInput: `
            <table>
            </table>
        `,
        mdExpected: ``,
    },
    {
        testName: '1x1',
        htmlInput: `
            <table>
                <tr>
                    <th>
                        a
                    </th>
                </tr>
            </table>
        `,
        mdExpected: `
| a |
| --- |
`.trim(),
    },
    {
        testName: '2x1',
        htmlInput: `
            <table>
                <tr>
                    <th>
                        a
                    </th>
                    <th>
                        b
                    </th>
                </tr>
            </table>
            `,
        mdExpected: `
| a | b |
| --- | --- |
`.trim()
    },
    {
        testName: '1x2',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| c |
`.trim()
    },
    {
        testName: '2x2',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b |
| --- | --- |
| c | d |
`.trim()
    },
    {
        testName: '2x3',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b |
| --- | --- |
| d | e |
| g | h |
`.trim()
    },
    {
        testName: '3x2',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
`.trim()
    },
    {
        testName: '3x3',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: '3x3 -1 cell in the second body row',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h |
`.trim()
    },
    {
        testName: '3x3 -1 cell in the first body row',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e |
| g | h | i |
`.trim()
    },
    {
        testName: '3x3 -1 cell in the header row',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: '3x3 -2 cells in the header row',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | | |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: 'thead',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
`.trim()
    },
    {
        testName: 'one thead and one tbody',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: 'one thead and two tbodies',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: 'thead, tbodies, and a th column',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
`.trim()
    },
    {
        testName: 'one tbody, no thead',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
`.trim()
    },
    {
        testName: 'two tbodies, no thead',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | b | c |
| --- | --- | --- |
| d | e | f |
| g | h | i |
| j | k | l |
`.trim()
    },
    {
        testName: 'multiple rows in a thead',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
| c |
`.trim()
    },
    {
        testName: 'one tbody and one tfoot, each with one row',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
`.trim()
    },
    {
        testName: 'one tbody and one tfoot, each with two rows',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
| c |
| d |
`.trim()
    },
    {
        testName: 'one thead with a tr, followed by one tr',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
`.trim()
    },
    {
        testName: 'one tr, followed by one tfoot',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
`.trim()
    },
    {
        testName: 'pipe symbols',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a \\| b |
| --- |
| c \\| d |
`.trim()
    },
    {
        testName: 'spaces around',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a |
| --- |
| b |
`.trim()
    },
    {
        testName: 'paragraphs and breaks',
        htmlInput: `
                <table>
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
                </table>
                `,
        mdExpected: `
| a b | c d |
| --- | --- |
| e f | g h |
`.trim()
    },
    {
        testName: 'lists',
        htmlInput: `
                <table>
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
                </table>
                `,
        mdExpected: `
| - a - b | 1. c 2. d |
| --- | --- |
| 1. e 2. f | - g - h |
`.trim()
    },
    {
        testName: 'table of tables',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| ab |
| --- |
| cd |
`.trim()
    },
    {
        testName: 'caption',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
**this is a caption**

| a |
| --- |
| b |
`.trim()
    },
    {
        testName: 'colspan',
        htmlInput: `
            <table>
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
            </table>
            `,
        mdExpected: `
| a | | b |
| --- | --- | --- |
| c | d | e |
`.trim()
    },
];

runTests();
