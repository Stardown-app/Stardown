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

/**
 * A TableConverter is an object that assists with converting an HTML table to markdown
 * or another plaintext format. A TableConverter instance should not be used for
 * multiple tables.
 */
export class TableConverter {
    constructor() {
        /** @type {(string|null)[][]} */
        this.table = [[]]; // a 2D array where each cell can be a string or null
        this.X = 0;
        this.Y = 0; // Y increases downwards
    }

    /**
     * addRow adds an empty row to the end of the TableConverter instance's table.
     */
    addRow() {
        this.table.push([]);
        this.X = 0;
        this.Y++;
    }

    /**
     * addCell adds a cell to the end of the TableConverter instance's current last row.
     * If the HTML cell spans multiple rows and/or columns, multiple TableConverter
     * cells are added to match the HTML span(s).
     * @param {string} content - the HTML cell's content.
     * @param {number} colspan - the number of columns the HTML cell spans.
     * @param {number} rowspan - the number of rows the HTML cell spans.
     */
    addCell(content, colspan = 1, rowspan = 1) {
        // while before the end of the row and not on a null cell
        while (this.X < this.table[this.Y].length && this.table[this.Y][this.X] !== null) {
            this.X++;
        }

        // for each row and column the cell spans
        for (let y = this.Y; y < this.Y + rowspan; y++) {
            // if there is no row at Y, add one
            if (y === this.table.length) {
                this.table.push([]);
            }

            const row = this.table[y];

            // for each undefined column left of X, add null cells as placeholders
            for (let i = row.length; i < this.X; i++) {
                row.push(null);
            }

            // for each column the cell spans
            for (let x = this.X; x < this.X + colspan; x++) {
                // assign the cell's content
                if (x === row.length) {
                    row.push(content);
                } else {
                    row[x] = content;
                }
            }
        }

        this.X += colspan;
    }

    /**
     * toMarkdown returns the markdown representation of the table. If the addRow and
     * addCell methods were used correctly, the table should not contain any nulls when
     * this method is called.
     * @returns {string} - the markdown representation of the table.
     */
    toMarkdown() {
        this.removeEmptyRows();
        this.rectangularize();

        let markdown = [];

        // for each row
        for (let y = 0; y < this.table.length; y++) {
            const row = this.table[y];
            markdown.push('|');

            // for each cell
            for (let x = 0; x < row.length; x++) {
                let cell = row[x];
                cell = cell.trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
                markdown.push(` ${cell} |`);
            }

            markdown.push('\n');

            // if this is the first row, add a separator row
            if (y === 0) {
                markdown.push('|');
                for (let x = 0; x < row.length; x++) {
                    markdown.push(' --- |');
                }
                markdown.push('\n');
            }
        }

        return markdown.join('');
    }

    /**
     * toCsv returns the CSV representation of the table. Fields are encapsulated
     * minimally. If the addRow and addCell methods were used correctly, the table
     * should not contain any nulls when this method is called.
     * @param {string} delimiter - what to separate fields with.
     * @param {string} encapsulator - what to encapsulate fields with.
     * @param {string} escaper - what to escape the encapsulator within fields with.
     * @param {string} lineTerminator - what to separate rows with.
     * @param {boolean} trimFields - whether to trim surrounding whitespace characters
     * from fields.
     * @returns {string} - the CSV representation of the table.
     */
    toCsv(
        delimiter = ',',
        encapsulator = '"',
        escaper = '"',
        lineTerminator = '\n',
        trimFields = false,
    ) {
        // [RFC 4180](https://datatracker.ietf.org/doc/html/rfc4180)
        // [Comma-separated values - Wikipedia](https://en.wikipedia.org/wiki/Comma-separated_values#Basic_rules)
        // [csv — Python documentation](https://docs.python.org/3/library/csv.html#dialects-and-formatting-parameters)

        this.removeEmptyRows();
        this.rectangularize();

        let csv = [];

        // for each row
        for (let y = 0; y < this.table.length; y++) {
            const row = this.table[y];
            // for each cell
            for (let x = 0; x < row.length; x++) {
                let cell = row[x];
                if (trimFields) {
                    cell = cell.trim();
                }
                if (
                    cell.includes(encapsulator) ||
                    cell.includes(delimiter) ||
                    cell.includes(lineTerminator)
                ) {
                    cell = cell.replaceAll(encapsulator, escaper + encapsulator);
                    csv.push(encapsulator, cell, encapsulator);
                } else {
                    csv.push(cell);
                }
                if (x < row.length - 1) {
                    csv.push(delimiter);
                }
            }

            csv.push(lineTerminator);
        }

        return csv.join('');
    }

    /**
     * toJson returns a JSON representation of the table. If the addRow and addCell
     * methods were used correctly, the table should not contain any nulls when this
     * method is called but may contain strings of the word "null".
     * @returns {string}
     */
    toJson() {
        // [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)

        this.removeEmptyRows();
        // this.rectangularize(); // no need to rectangularize for JSON

        let json = ['['];

        // for each row
        for (let y = 0; y < this.table.length; y++) {
            const row = this.table[y];
            json.push('[');

            // for each cell
            for (let x = 0; x < row.length; x++) {
                let cell = row[x];
                if (cell.startsWith('\\-')) { // because Turndown escapes leading minuses
                    cell = cell.slice(1);
                }

                if (cell === '') {
                    json.push('null');
                } else if (['true', 'false', 'null'].includes(cell)) {
                    json.push(cell);
                } else if (canBeJsonNumber(cell)) {
                    json.push(toJsonNumber(cell));
                } else {
                    // backslashes are escaped by Turndown
                    cell = cell.replaceAll('"', '\\"');
                    json.push('"' + cell + '"');
                }

                if (x < row.length - 1) {
                    json.push(', ');
                }
            }

            json.push(']');
            if (y < this.table.length - 1) {
                json.push(', ');
            }
        }

        json.push(']');

        return json.join('');
    }

    /**
     * removeEmptyRows removes empty rows from the table.
     * @private
     */
    removeEmptyRows() {
        this.table = this.table.filter(row => row.some(cell => cell));
    }

    /**
     * rectangularize ensures all rows in the table have the same number of cells by
     * adding empty cells to the ends of shorter rows.
     * @private
     */
    rectangularize() {
        let maxRowSize = 0;
        for (let y = 0; y < this.table.length; y++) {
            const row = this.table[y];
            if (row.length > maxRowSize) {
                maxRowSize = row.length;
            }
        }

        for (let y = 0; y < this.table.length; y++) {
            const row = this.table[y];
            for (let x = row.length; x < maxRowSize; x++) {
                row.push('');
            }
        }
    }
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
