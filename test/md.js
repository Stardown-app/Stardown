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

import fs from 'node:fs/promises';
import { JSDOM } from 'jsdom'; // https://www.npmjs.com/package/jsdom
import { diffChars } from 'diff'; // https://www.npmjs.com/package/diff
import { htmlToMd } from '../src/converters/md.js';

global.location = { href: 'https://example.com' };

async function runTest() {
    const htmlInput = await fs.readFile('./test/input.html', { encoding: 'utf8' });
    const mdExpected = await fs.readFile('./test/expected.md', { encoding: 'utf8' });

    global.document = new JSDOM(htmlInput).window.document;
    const mdActual = await htmlToMd(global.document.body);

    const diff = diffChars(mdActual, mdExpected);

    const result = [];
    result.push(`
        <style>
            span {
                font-size: 18px;
            }
            .actual {
                background-color: red;
                opacity: 0.5;
            }
            .expected {
                background-color: #00ff00;
                opacity: 0.5;
            }
        </style>
    `);
    result.push('<body><pre>');
    diff.forEach(part => {
        if (!part || !part.value) {
            return;
        }

        if (part.added) {
            const value = part.value.replaceAll('\n', '⤵\n');
            result.push('<span class="expected">' + value + '</span>');
        } else if (part.removed) {
            const value = part.value.replaceAll('\n', '⤵\n');
            result.push('<span class="actual">' + value + '</span>');
        } else {
            result.push('<span>' + part.value + '</span>');
        }
    });
    result.push('</pre></body>');

    await fs.writeFile('./test/md.diff.html', result.join(''));
}

runTest();
