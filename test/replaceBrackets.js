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
import { replaceNonImageBrackets } from '../src/newTurndownService.js';

function testReplaceNonImageBrackets() {
    const tests = [{
        testName: 'no brackets',
        subBrackets: 'underlined',
        input: 'abc',
        expected: 'abc',
    }, {
        testName: 'empty',
        subBrackets: 'underlined',
        input: '',
        expected: '',
    }, {
        testName: 'url',
        subBrackets: 'underlined',
        input: 'https://www.google.com',
        expected: 'https://www.google.com',
    }, {
        testName: 'opening bracket',
        subBrackets: 'underlined',
        input: '[',
        expected: '⦋',
    }, {
        testName: 'closing bracket',
        subBrackets: 'underlined',
        input: ']',
        expected: '⦌',
    }, {
        testName: 'opening and closing brackets',
        subBrackets: 'underlined',
        input: '[]',
        expected: '⦋⦌',
    }, {
        testName: 'opening and closing brackets escaped',
        subBrackets: 'escaped',
        input: '[]',
        expected: '\\[\\]',
    }, {
        testName: 'opening and closing brackets unchanged',
        subBrackets: 'original',
        input: '[]',
        expected: '[]',
    }, {
        testName: 'spaces around',
        subBrackets: 'underlined',
        input: ' [  ] ',
        expected: ' ⦋  ⦌ ',
    }, {
        testName: 'letters around',
        subBrackets: 'underlined',
        input: 'a[b]c',
        expected: 'a⦋b⦌c',
    }, {
        testName: 'three opening brackets',
        subBrackets: 'underlined',
        input: '[[[',
        expected: '⦋⦋⦋',
    }, {
        testName: 'markdown image without alt text',
        subBrackets: 'underlined',
        input: '![](image-name.png)',
        expected: '![](image-name.png)',
    }, {
        testName: 'markdown image with alt text',
        subBrackets: 'underlined',
        input: '![alt text](image-name.png)',
        expected: '![alt text](image-name.png)',
    }, {
        testName: 'multiple markdown images',
        subBrackets: 'underlined',
        input: '![alt text](image-name.png) ![](image2.png)',
        expected: '![alt text](image-name.png) ![](image2.png)',
    }, {
        testName: 'image with spaces around',
        subBrackets: 'underlined',
        input: '  ![alt text](image-name.png)  ',
        expected: '  ![alt text](image-name.png)  ',
    }, {
        testName: 'image with letters around',
        subBrackets: 'underlined',
        input: 'abc![](name.png)xyz',
        expected: 'abc![](name.png)xyz',
    }, {
        testName: 'bracket then image',
        subBrackets: 'underlined',
        input: '[![](name.png)',
        expected: '⦋![](name.png)',
    }, {
        testName: 'image then bracket',
        subBrackets: 'underlined',
        input: '![](name.png)[',
        expected: '![](name.png)⦋',
    }, {
        testName: 'text with brackets then image',
        subBrackets: 'underlined',
        input: 'a[b]c ![](name.png)',
        expected: 'a⦋b⦌c ![](name.png)',
    }, {
        testName: 'image then text with brackets',
        subBrackets: 'underlined',
        input: '![](name.png) a[b]c',
        expected: '![](name.png) a⦋b⦌c',
    },]

    for (let i = 0; i < tests.length; i++) {
        test(tests[i].testName, t => {
            const actual = replaceNonImageBrackets(tests[i].input, tests[i].subBrackets);
            assert.equal(actual, tests[i].expected);
        });
    }
}

testReplaceNonImageBrackets();
