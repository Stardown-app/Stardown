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

import { getSetting } from '../getSetting.js';
import * as tables from './utils/tables.js';

// [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)

/**
 * htmlTableToJson converts an HTML table to JSON.
 * @param {DocumentFragment} frag
 * @param {string|undefined} jsonEmptyCell - the JSON representation of an empty cell.
 * @returns {Promise<string>}
 */
export async function htmlTableToJson(frag, jsonEmptyCell) {
    const table = frag.firstChild;

    const ctx = {
        document: document,
        jsonEmptyCell: jsonEmptyCell || await getSetting('jsonEmptyCell') || 'null',
    };

    return convertTable(ctx, table);
}

/**
 * convertTable converts an HTML table to JSON.
 * @param {object} ctx
 * @param {Element} table
 * @returns {string}
 */
function convertTable(ctx, table) {
    /** @type {Element[][]} */
    let table2d = tables.to2dArray(table, ctx.document);
    table2d = tables.removeEmptyRows(table2d);

    /** @type {string[]} */
    const json = ['['];

    // for each row
    for (let y = 0; y < table2d.length; y++) {
        /** @type {Element[]} */
        const row = table2d[y];

        json.push('{');

        // for each cell
        for (let x = 0; x < row.length; x++) {
            /**
             * cell is a `<th>` or `<td>` element.
             * @type {Element}
             */
            const cell = row[x];

            /** @type {string} */
            let cellStr = (cell.textContent || '').trim().replaceAll('\\', '\\\\');

            if (x === 0) { // if this is the first column
                if (cellStr.length === 0) { // if the cell is empty
                    if ( // if the empty cell JSON is already wrapped with quotes
                        ctx.jsonEmptyCell.length > 0 &&
                        ctx.jsonEmptyCell[0] === '"' &&
                        ctx.jsonEmptyCell[ctx.jsonEmptyCell.length - 1] === '"'
                    ) {
                        json.push(ctx.jsonEmptyCell + ': [');
                    } else { // if the empty cell JSON is not already wrapped with quotes
                        cellStr = ctx.jsonEmptyCell.replaceAll('"', '\\"');
                        json.push('"' + cellStr + '": [');
                    }
                } else { // if the cell is not empty
                    cellStr = cellStr.replaceAll('"', '\\"').replaceAll(/\s+/g, ' ');
                    json.push('"' + cellStr + '": [');
                }
            } else if (cellStr.length === 0) {
                json.push(ctx.jsonEmptyCell);
            } else if (['true', 'false', 'null'].includes(cellStr)) {
                json.push(cellStr);
            } else if (canBeJsonNumber(cellStr)) {
                json.push(toJsonNumber(cellStr));
            } else {
                cellStr = cellStr.replaceAll('"', '\\"').replaceAll(/\s+/g, ' ');
                json.push('"' + cellStr + '"');
            }

            if (x > 0 && x < row.length - 1) {
                json.push(', ');
            }
        }

        json.push(']}');
        if (y < table2d.length - 1) {
            json.push(', ');
        }
    }

    json.push(']');

    return json.join('');
}

/**
 * canBeJsonNumber reports whether a string's contents can be converted to a valid JSON
 * number. If the string is already a valid JSON number, this function returns true.
 * @param {string} str
 * @returns {boolean}
 */
export function canBeJsonNumber(str) {
    if (!Boolean(str.match(/[0-9]/))) {
        return false;
    }
    return Boolean(str.match(/^[+-]?[0-9,]*\.?[0-9]*(?:[eE][+-]?[0-9]+)?$/));
}

/**
 * toJsonNumber converts a string of a number to a valid JSON number. If the number is
 * already a valid JSON number, this function has no effect.
 * @param {string} numStr
 * @returns {string}
 */
export function toJsonNumber(numStr) {
    if (numStr[0] === '+') {
        numStr = numStr.slice(1);
    }
    numStr = fixLeadingZeros(numStr.replaceAll(',', ''));
    if (numStr[numStr.length - 1] === '.') {
        numStr = numStr.slice(0, numStr.length - 1);
    }
    return numStr;
}

/**
 * fixLeadingZeros removes excess leading zeros and may add a zero before a decimal
 * point or exponent to make a number a valid JSON number.
 * @param {string} numStr
 * @returns {string}
 */
export function fixLeadingZeros(numStr) {
    for (let i = 0; i < numStr.length; i++) {
        if (numStr[i] === '0') {
            continue;
        } else if (numStr[i] === '.' || numStr[i] === 'e' || numStr[i] === 'E') {
            return '0' + numStr.slice(i);
        }
        return numStr.slice(i);
    }
}
