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
import { tableConfig } from '../src/tables.js';

tableConfig.format = 'json';
tableConfig.emptyCellJson = 'null';

const turndownService = newTurndownService(
    '-', 'underlined', 'source with link', true, true, escape,
);

function runTest(testName, htmlInput, jsonExpected) {
    test(testName, t => {
        global.document = new JSDOM(htmlInput).window.document;
        const jsonActual = turndownService.turndown(htmlInput);
        assert.equal(jsonActual, jsonExpected);
    });
}

function runTests() {
    for (let i = 0; i < tests.length; i++) {
        const { testName, htmlInput, jsonExpected } = tests[i];
        runTest(testName, htmlInput, jsonExpected);
    }

    test('empty cells are set to "N/A"', t => {
        const htmlInput = `
            <table>
                <tr>
                    <td>
                    </td>
                    <td>
                        a
                    </td>
                </tr>
                <tr>
                    <td>
                        b
                    </td>
                    <td>
                    </td>
                </tr>
            </table>
        `;
        const jsonExpected = `
[{"N/A": ["a"]}, {"b": ["N/A"]}]
`.trim();

        global.document = new JSDOM(htmlInput).window.document;
        tableConfig.emptyCellJson = '"N/A"';
        const jsonActual = turndownService.turndown(htmlInput);
        tableConfig.emptyCellJson = 'null';
        assert.equal(jsonActual, jsonExpected);
    });
}

const tests = [
    {
        testName: '0x0',
        htmlInput: `
            <table>
            </table>
        `,
        jsonExpected: `[]`,
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
        jsonExpected: `
[{"a": []}]
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
        jsonExpected: `
[{"a": ["b"]}]
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
        jsonExpected: `
[{"a": []}, {"c": []}]
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
        jsonExpected: `
[{"a": ["b"]}, {"c": ["d"]}]
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
        jsonExpected: `
[{"a": ["b"]}, {"d": ["e"]}, {"g": ["h"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": []}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}]
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
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "f"]}, {"g": ["h", "i"]}, {"j": ["k", "l"]}]
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
        jsonExpected: `
[{"a": []}, {"b": []}, {"c": []}]
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
        jsonExpected: `
[{"a": []}, {"b": []}]
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
        jsonExpected: `
[{"a": []}, {"b": []}, {"c": []}, {"d": []}]
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
        jsonExpected: `
[{"a": []}, {"b": []}]
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
        jsonExpected: `
[{"a": []}, {"b": []}]
`.trim()
    },
    {
        testName: 'bold and emphasis',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": ["*b*"]}, {"**c**": ["***d***"]}]
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
        jsonExpected: `
[{"a\n\nb": ["c\n\n  \n\nd"]}, {"e\n\n  \n\nf": ["g\n\nh"]}]
`.trim()
    },
    {
        testName: 'h1 and h2 in rows',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": []}, {"b": []}]
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
        jsonExpected: `
[{"ab": []}, {"cd": []}]
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
        jsonExpected: `
[{"a": []}, {"b": []}]
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
        jsonExpected: `
[{"a": ["a", "b"]}, {"c": ["d", "e"]}]
`.trim()
    },
    {
        testName: 'rowspan',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": ["b"]}, {"a": ["c"]}, {"d": ["e"]}]
`.trim()
    },
    {
        testName: 'parallel colspans',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": ["a"]}, {"b": ["c"]}, {"d": ["d"]}]
`.trim()
    },
    {
        testName: 'parallel rowspans',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": ["b", "c"]}, {"a": ["d", "c"]}]
`.trim()
    },
    {
        testName: 'colspan and rowspan in the same cell',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"a": ["b", "c"]}, {"d": ["e", "e"]}, {"f": ["e", "e"]}]
`.trim()
    },
    {
        testName: 'colspan and rowspan in the same empty cell',
        htmlInput: `
            <table>
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
            </table>
            `,
        jsonExpected: `
[{"null": [null, "a"]}, {"null": [null, "b"]}, {"c": ["d", "e"]}]
`.trim()
    },
    {
        testName: 'backslashes',
        htmlInput: `
            <table>
                <tr>
                    <th>
                        a\\b
                    </th>
                </tr>
                <tr>
                    <td>
                        c\\d
                    </td>
                </tr>
            </table>
            `,
        jsonExpected: `
[{"a\\\\b": []}, {"c\\\\d": []}]
`.trim()
    },
    {
        testName: 'encapsulated double quotes',
        htmlInput: `
            <table>
                <tr>
                    <th>
                        "a"
                    </th>
                </tr>
                <tr>
                    <td>
                        They said "wow" twice.
                    </td>
                </tr>
            </table>
            `,
        jsonExpected: `
[{"\\"a\\"": []}, {"They said \\"wow\\" twice.": []}]
`.trim()
    },
    {
        testName: 'several JSON types',
        htmlInput: `
            <table>
                <tr>
                    <td>
                        true
                    </td>
                    <td>
                        false
                    </td>
                    <td>
                        null
                    </td>
                    <td>
                    </td>
                </tr>
                <tr>
                    <td>
                        hello
                    </td>
                    <td>
                        True
                    </td>
                    <td>
                        .
                    </td>
                </tr>
                <tr>
                    <td>
                        5
                    </td>
                    <td>
                        -0.222e+11
                    </td>
                    <td>
                        0.0
                    </td>
                    <td>
                        +08,000.
                    </td>
                    <td>
                        4e-3
                    </td>
                </tr>
            </table>
            `,
        jsonExpected: `
[{"true": [false, null, null]}, {"hello": ["True", "."]}, {"5": [-0.222e+11, 0.0, 8000, 4e-3]}]
`.trim()
    },
];

runTests();
