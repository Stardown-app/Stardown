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
 * A TableConverter is an object that assists with converting an HTML table to a
 * markdown or CSV table. A TableConverter instance should not be used for multiple
 * tables.
 */
export class TableConverter {
    constructor() {
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
     * toCsv returns the CSV representation of the table. If the addRow and addCell
     * methods were used correctly, the table should not contain any nulls when this
     * method is called.
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
