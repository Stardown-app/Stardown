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

test('simple 2x2 table', t => {
    const html = `
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
    `;

    global.document = new JSDOM(html).window.document;

    const got = turndownService.turndown(html);
    const want = `
| a | b |
| --- | --- |
| c | d |
`.trim();

    assert.equal(want, got);
});
