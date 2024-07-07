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
];

runTests();
