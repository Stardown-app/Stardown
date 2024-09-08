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

/**
 * to2dArray converts an HTML table element to a 2D array table cell elements (`<th>`s
 * and/or `<td>`s). It may contain empty rows and some rows may have more cells than
 * others.
 * @param {Element} table
 * @param {Document} doc
 * @returns {Element[][]}
 */
export function to2dArray(table, doc) {
    const tableConv = new TableConverter(doc);

    const trs = getTableTrs(table);

    // for each row
    for (let y = 0; y < trs.length; y++) {
        const tr = trs[y];

        // for each cell in the row
        for (let x = 0; x < tr.children.length; x++) {
            const cell = tr.children[x];
            if (cell.nodeName !== 'TH' && cell.nodeName !== 'TD') {
                continue;
            }

            const colspan = Number(cell.getAttribute('colspan') || 1);
            const rowspan = Number(cell.getAttribute('rowspan') || 1);

            tableConv.addCell(cell, colspan, rowspan);
        }

        tableConv.addRow();
    }

    return tableConv.table;
}

/**
 * removeEmptyRows removes empty rows from a table.
 * @param {Element[][]} table
 * @returns {Element[][]}
 */
export function removeEmptyRows(table) {
    return table.filter(row => row.length > 0 && row.some(cell => cell.childNodes.length > 0));
}

/**
 * rectangularize ensures all rows in the table have the same number of cells by adding
 * empty cells to the ends of shorter rows.
 * @param {Element[][]} table
 * @param {Document} doc
 * @returns {Element[][]}
 */
export function rectangularize(table, doc) {
    let maxRowSize = 0;
    for (let y = 0; y < table.length; y++) {
        const row = table[y];
        if (row.length > maxRowSize) {
            maxRowSize = row.length;
        }
    }

    for (let y = 0; y < table.length; y++) {
        const row = table[y];
        for (let x = row.length; x < maxRowSize; x++) {
            row.push(doc.createElement('td'));
        }
    }

    return table;
}

/**
 * A TableConverter is an object that assists with converting an HTML table to a 2D
 * array. A TableConverter instance should not be used for multiple tables.
 */
class TableConverter {
    /**
     * @param {Document} doc
     */
    constructor(doc) {
        /** @type {(Element|null)[][]} */
        this.table = [[]];
        this.X = 0;
        this.Y = 0; // Y increases downwards
        this.doc = doc;
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
     * cells are added to match the HTML span(s). Spanning cells have duplicate content
     * unless the content includes any images or videos.
     * @param {Element} cell - a `<th>` or `<td>` element.
     * @param {number} colspan - the number of columns the HTML cell spans.
     * @param {number} rowspan - the number of rows the HTML cell spans.
     */
    addCell(cell, colspan = 1, rowspan = 1) {
        // while before the end of the row and not on a null cell
        while (this.X < this.table[this.Y].length && this.table[this.Y][this.X] !== null) {
            this.X++;
        }

        const hasMedia = Boolean(
            cell.querySelector('img') ||
            cell.querySelector('svg') ||
            cell.querySelector('video')
        );

        // for each row and column the cell spans
        for (let y = this.Y; y < this.Y + rowspan; y++) {
            // if there is no row at Y, add one
            if (y === this.table.length) {
                this.table.push([]);
            }

            const row = this.table[y];

            // for each undefined cell left of X, add a null as a placeholder
            for (let i = row.length; i < this.X; i++) {
                row.push(null);
            }

            // for each column the cell spans
            for (let x = this.X; x < this.X + colspan; x++) {
                // assign the cell
                if (x === row.length) {
                    if (hasMedia && x > this.X) {
                        row.push(this.doc.createElement('td'));
                    } else {
                        row.push(cell);
                    }
                } else {
                    if (hasMedia && x > this.X) {
                        row[x] = this.doc.createElement('td');
                    } else {
                        row[x] = cell;
                    }
                }
            }
        }

        this.X += colspan;
    }
}

/**
 * getTableTrs gets the tr elements of an HTML table, but not any tr elements of any
 * child tables.
 * @param {Element} table - the table element.
 * @returns {Element[]} - the tr elements.
 */
function getTableTrs(table) {
    /** @type {Element[]} */
    const trs = [];
    for (let i = 0; i < table.children.length; i++) {
        const child = table.children[i];
        if (child.nodeName === 'TR') {
            trs.push(child);
        } else if (
            child.nodeName === 'TBODY' ||
            child.nodeName === 'THEAD' ||
            child.nodeName === 'TFOOT'
        ) {
            for (let j = 0; j < child.children.length; j++) {
                const grandchild = child.children[j];
                if (grandchild.nodeName === 'TR') {
                    trs.push(grandchild);
                }
            }
        }
    }

    return trs;
}
