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

/**
 * diffMd creates a file with the differences between the actual and expected markdown
 * and returns the sum of the number of characters that are unexpected and missing.
 * @returns {Promise<number>}
 */
export async function diffMd() {
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

    // add in the top right the numbers of characters that are unexpected and missing
    result.push(`<div style="position: fixed; top: 0; right: 0; width: 25%; background-color: #f0f0f0; display: inline; font-size: 20px"><div style="color: red; display: inline"><div id="unexpectedCount" style="display: inline"></div> unexpected</div>   <div style="color: green; display: inline"><div id="missingCount" style="display: inline"></div> missing</div></div>`);

    let unexpectedCount = 0;
    let missingCount = 0;

    diff.forEach(part => {
        if (!part || !part.value) {
            return;
        }

        if (part.added) {
            missingCount += part.value.length;
            const value = part.value.replaceAll('\n', '⤵\n');
            result.push('<span class="expected">' + value + '</span>');
        } else if (part.removed) {
            unexpectedCount += part.value.length;
            const value = part.value.replaceAll('\n', '⤵\n');
            result.push('<span class="actual">' + value + '</span>');
        } else {
            result.push('<span>' + part.value + '</span>');
        }
    });
    result.push('</pre></body>');

    result.push(`
        <script>
            document.getElementById('unexpectedCount').innerText = ${unexpectedCount};
            document.getElementById('missingCount').innerText = ${missingCount};
        </script>
    `);

    await fs.writeFile('./test/md.diff.html', result.join(''));

    return unexpectedCount + missingCount;
}

diffMd();
