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
import { canBeJsonNumber, toJsonNumber, fixLeadingZeros } from '../src/tableConverter.js';

const jsonNumberTests = [
    { input: "0.0", expected: "0.0" },
    { input: "3", expected: "3" },
    { input: "2.1", expected: "2.1" },
    { input: "4.35", expected: "4.35" },
    { input: "6.2000", expected: "6.2000" },
    { input: "0.8", expected: "0.8" },
    { input: "0.79", expected: "0.79" },
    { input: "3.33333333333333", expected: "3.33333333333333" },
    { input: "-5", expected: "-5" },
    { input: "-6.3", expected: "-6.3" },
    { input: "-0.23", expected: "-0.23" },
    { input: "-3.01", expected: "-3.01" },
    { input: "0e12", expected: "0e12" },
    { input: "3e+8", expected: "3e+8" },
    { input: "7e-7", expected: "7e-7" },
    { input: "2E4", expected: "2E4" },
    { input: "1E+9", expected: "1E+9" },
    { input: "6E-5", expected: "6E-5" },
    { input: "-2e3", expected: "-2e3" },
    { input: "-4.7E2", expected: "-4.7E2" },
    { input: "-0.222e+11", expected: "-0.222e+11" },
    { input: "123.123e-5", expected: "123.123e-5" },
    { input: "8.70E2", expected: "8.70E2" },
];

const convertibleToJsonNumbersTests = [
    { input: "1,000", expected: "1000" },
    { input: "01", expected: "1" },
    { input: "01.1", expected: "1.1" },
    { input: "+4", expected: "4" },
    { input: "2.", expected: "2" },
];

const unconvertibleToJsonNumbers = [
    ".",
    "1.2.3",
    "hi",
    "Infinity",
    "NaN",
];

const leadingZeroTests = [
    { input: "01", expected: "1" },
    { input: "01.1", expected: "1.1" },
    { input: "001", expected: "1" },
    { input: "0.2", expected: "0.2" },
    { input: "00.2", expected: "0.2" },
    { input: "-0.3", expected: "-0.3" },
    { input: ".4", expected: "0.4" },
];

function testCanBeJsonNumber() {
    for (let i = 0; i < jsonNumberTests.length; i++) {
        const { input, expected } = jsonNumberTests[i];
        test(`canBeJsonNumber(${input})`, t => {
            assert.equal(canBeJsonNumber(input), true);
        });
    }
    for (let i = 0; i < convertibleToJsonNumbersTests.length; i++) {
        const { input, expected } = convertibleToJsonNumbersTests[i];
        test(`canBeJsonNumber(${input})`, t => {
            assert.equal(canBeJsonNumber(input), true);
        });
    }
    for (let i = 0; i < unconvertibleToJsonNumbers.length; i++) {
        const input = unconvertibleToJsonNumbers[i];
        test(`canBeJsonNumber(${input})`, t => {
            assert.equal(canBeJsonNumber(input), false);
        });
    }
}
testCanBeJsonNumber();

function testToJsonNumber() {
    for (let i = 0; i < jsonNumberTests.length; i++) {
        const { input, expected } = jsonNumberTests[i];
        test(`toJsonNumber(${input})`, t => {
            assert.equal(toJsonNumber(input), expected);
        });
    }
    for (let i = 0; i < convertibleToJsonNumbersTests.length; i++) {
        const { input, expected } = convertibleToJsonNumbersTests[i];
        test(`toJsonNumber(${input})`, t => {
            assert.equal(toJsonNumber(input), expected);
        });
    }
}
testToJsonNumber();

function testFixLeadingZeros() {
    for (let i = 0; i < leadingZeroTests.length; i++) {
        const { input, expected } = leadingZeroTests[i];
        test(`fixLeadingZeros(${input})`, t => {
            assert.equal(fixLeadingZeros(input), expected);
        });
    }
}
testFixLeadingZeros();
