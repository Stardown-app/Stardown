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
import { diffMd } from "./diffMd.js";
import { htmlToMd } from "../src/converters/md.js";
import * as md from "../src/generators/md.js";

global.location = { href: "https://example.com" };

test("diffMd", async () => {
    const wrongCharCount = await diffMd();
    assert.equal(
        wrongCharCount,
        0,
        `
There are differences between the actual and expected markdown.
Run \`npm run md-diff\` and open md.diff.html to see the differences.`,
    );
});

test("md.createBlockquote", async () => {
    const input = "This is a test.";
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const expected = `> This is a test.
> 
> — [Example](https://example.com)
`;

    const title = "Example";
    const url = global.location.href;

    global.document = new JSDOM(input).window.document;
    const markdown = await htmlToMd(global.document.body);
    const actual = (await md.createBlockquote(markdown, title, url)) + "\n";

    assert.equal(actual, expected);
});
