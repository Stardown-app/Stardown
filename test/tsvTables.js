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
import { htmlTableToCsv } from '../src/converters/csv.js';

global.location = { href: 'https://example.com' };

function runTest(testName, htmlInput, csvExpected) {
    test(testName, async t => {
        global.document = new JSDOM(htmlInput).window.document;
        const csvActual = await htmlTableToCsv(global.document.body, '\t');
        assert.equal(csvActual, csvExpected);
    });
}

function runTests() {
    for (let i = 0; i < tests.length; i++) {
        const { testName, htmlInput, csvExpected } = tests[i];
        runTest(testName, htmlInput, csvExpected);
    }
}

const tests = [
    {
        testName: '0x0',
        htmlInput: `<table>
            </table>`,
        csvExpected: ``,
    },
    {
        testName: '1x1',
        htmlInput: `<table>
                <tr>
                    <th>
                        a
                    </th>
                </tr>
            </table>`,
        csvExpected: `a
`,
    },
    {
        testName: '2x1',
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
        csvExpected: `a\tb
`
    },
    {
        testName: '1x2',
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
        csvExpected: `a
c
`
    },
    {
        testName: '2x2',
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
        csvExpected: `a\tb
c\td
`
    },
    {
        testName: 'caption',
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
        csvExpected: `a
b
`
    },
    {
        testName: 'colspan',
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
        csvExpected: `a\ta\tb
c\td\te
`
    },
    {
        testName: 'rowspan',
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
        csvExpected: `a\tb
a\tc
d\te
`
    },
    {
        testName: 'parallel colspans',
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
        csvExpected: `a\ta
b\tc
d\td
`
    },
    {
        testName: 'parallel rowspans',
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
        csvExpected: `a\tb\tc
a\td\tc
`
    },
    {
        testName: 'colspan and rowspan in the same cell',
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
        csvExpected: `a\tb\tc
d\te\te
f\te\te
`
    },
    {
        testName: 'colspan and rowspan in the same leading empty cell',
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
        csvExpected: `\t\ta
\t\tb
c\td\te
`
    },
    {
        testName: 'colspan and rowspan in the same middle empty cell',
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
                    </td>
                </tr>
                <tr>
                    <td>
                        e
                    </td>
                </tr>
            </table>`,
        csvExpected: `a\tb\tc
d\t\t
e\t\t
`
    },
];

runTests();