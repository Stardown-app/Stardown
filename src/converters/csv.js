/*
   Copyright 2024 Chris Wheeler

   Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
   file except in compliance with the License. You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software distributed under
   the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
   ANY KIND, either express or implied. See the License for the specific language
   governing permissions and limitations under the License.
*/

import * as tables from './utils/tables.js';

// - RFC 4180: https://datatracker.ietf.org/doc/html/rfc4180
// - Comma-separated values - Wikipedia:
//   https://en.wikipedia.org/wiki/Comma-separated_values#Basic_rules
// - csv — Python documentation:
//   https://docs.python.org/3/library/csv.html#dialects-and-formatting-parameters

/**
 * htmlTableToCsv converts an HTML table to CSV.
 * @param {DocumentFragment} frag
 * @param {string} delimiter - what to separate fields with.
 * @returns {Promise<string>}
 */
export async function htmlTableToCsv(frag, delimiter = ',') {
    const table = frag.firstChild;

    const ctx = {
        document: document,
        delimiter: delimiter,   // what to separate fields with
        encapsulator: '"',      // what to encapsulate fields with
        escaper: '"',           // what to escape the encapsulator within fields with
        lineTerminator: '\r\n', // what to separate rows with
    };

    return convertTable(ctx, table);
}

/**
 * convertTable converts an HTML table to CSV. Fields are encapsulated minimally.
 * @param {object} ctx
 * @param {Element} table
 * @returns {string}
 */
function convertTable(ctx, table) {
    /** @type {Element[][]} */
    let table2d = tables.to2dArray(table, ctx.document);
    table2d = tables.removeEmptyRows(table2d);
    table2d = tables.rectangularize(table2d, ctx.document);

    /** @type {string[]} */
    const csv = [];

    // for each row
    for (let y = 0; y < table2d.length; y++) {
        /** @type {Element[]} */
        const row = table2d[y];

        // for each cell
        for (let x = 0; x < row.length; x++) {
            /**
             * cell is a `<th>` or `<td>` element.
             * @type {Element}
             */
            const cell = row[x];

            /** @type {string} */
            let cellStr = (cell.textContent || '').trim().replaceAll(/\s+/g, ' ');

            if (
                cellStr.includes(ctx.encapsulator) ||
                cellStr.includes(ctx.delimiter) ||
                cellStr.includes(ctx.lineTerminator)
            ) {
                cellStr = cellStr.replaceAll(ctx.encapsulator, ctx.escaper + ctx.encapsulator);
                csv.push(ctx.encapsulator, cellStr, ctx.encapsulator);
            } else {
                csv.push(cellStr);
            }

            if (x < row.length - 1) {
                csv.push(ctx.delimiter);
            }
        }

        csv.push(ctx.lineTerminator);
    }

    return csv.join('');
}
