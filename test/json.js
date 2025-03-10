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
import {
    canBeJsonNumber,
    toJsonNumber,
    fixLeadingZeros,
} from "../src/converters/json.js";

const jsonNumbers = [
    "0.0",
    "3",
    "2.1",
    "4.35",
    "6.2000",
    "0.8",
    "0.79",
    "3.33333333333333",
    "-5",
    "-6.3",
    "-0.23",
    "-3.01",
    "0e12",
    "3e+8",
    "7e-7",
    "2E4",
    "1E+9",
    "6E-5",
    "-2e3",
    "-4.7E2",
    "-0.222e+11",
    "123.123e-5",
    "8.70E2",
];

const notJsonNumbers = [".", "1.2.3", "hi", "Infinity", "NaN"];

const convertibleToJsonNumbersTests = [
    { input: "1,000", expected: "1000" },
    { input: "01", expected: "1" },
    { input: "01.1", expected: "1.1" },
    { input: "+4", expected: "4" },
    { input: "2.", expected: "2" },
];

const leadingZeroTests = [
    { input: "01", expected: "1" },
    { input: "001", expected: "1" },
    { input: "01.1", expected: "1.1" },
    { input: "0.2", expected: "0.2" },
    { input: "00.2", expected: "0.2" },
    { input: "-0.3", expected: "-0.3" },
    { input: ".4", expected: "0.4" },
];

function testCanBeJsonNumber() {
    for (let i = 0; i < jsonNumbers.length; i++) {
        const input = jsonNumbers[i];
        test(`canBeJsonNumber(${input})`, (t) => {
            assert.equal(canBeJsonNumber(input), true);
        });
    }
    for (let i = 0; i < notJsonNumbers.length; i++) {
        const input = notJsonNumbers[i];
        test(`canBeJsonNumber(${input})`, (t) => {
            assert.equal(canBeJsonNumber(input), false);
        });
    }
    for (let i = 0; i < convertibleToJsonNumbersTests.length; i++) {
        const { input } = convertibleToJsonNumbersTests[i];
        test(`canBeJsonNumber(${input})`, (t) => {
            assert.equal(canBeJsonNumber(input), true);
        });
    }
    for (let i = 0; i < leadingZeroTests.length; i++) {
        const { input } = leadingZeroTests[i];
        test(`canBeJsonNumber(${input})`, (t) => {
            assert.equal(canBeJsonNumber(input), true);
        });
    }
}
testCanBeJsonNumber();

function testToJsonNumber() {
    for (let i = 0; i < jsonNumbers.length; i++) {
        const input = jsonNumbers[i];
        test(`toJsonNumber(${input})`, (t) => {
            assert.equal(toJsonNumber(input), input);
        });
    }
    for (let i = 0; i < convertibleToJsonNumbersTests.length; i++) {
        const { input, expected } = convertibleToJsonNumbersTests[i];
        test(`toJsonNumber(${input})`, (t) => {
            assert.equal(toJsonNumber(input), expected);
        });
    }
    for (let i = 0; i < leadingZeroTests.length; i++) {
        const { input, expected } = leadingZeroTests[i];
        test(`toJsonNumber(${input})`, (t) => {
            assert.equal(toJsonNumber(input), expected);
        });
    }
}
testToJsonNumber();

function testFixLeadingZeros() {
    for (let i = 0; i < leadingZeroTests.length; i++) {
        const { input, expected } = leadingZeroTests[i];
        test(`fixLeadingZeros(${input})`, (t) => {
            assert.equal(fixLeadingZeros(input), expected);
        });
    }
}
testFixLeadingZeros();
