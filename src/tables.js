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

/*
    HTML table definition:

    In this order: optionally a caption element, followed by zero or more colgroup
    elements, followed optionally by a thead element, followed by either zero or more
    tbody elements or one or more tr elements, followed optionally by a tfoot element,
    optionally intermixed with one or more script-supporting elements.

    Source: [the HTML Standard](https://html.spec.whatwg.org/multipage/tables.html)
*/

import { TableConverter } from './tableConverter.js';
import { TurndownService } from './turndown.js';

/**
 * addTableRules adds to a Turndown service instance Turndown rules for converting HTML
 * tables to markdown or CSV. The rules apply to both source-formatted tables and tables
 * in block quotes. Even though most or all markdown renderers don't render tables
 * within block quotes, Stardown puts into block quotes not just the content of tables
 * but also their markdown (or CSV) syntax because the output will at least usually not
 * look good either way, keeping table syntax is more intuitive and easier for the user
 * to edit into a table that's outside a block quote, and maybe some markdown renderers
 * do allow tables to be in block quotes.
 * @param {TurndownService} t - the Turndown service instance.
 * @param {string} tableFormat - the Stardown setting for the table format.
 */
export function addTableRules(t, tableFormat) {
    /*
        Most of the table rules are not used because it's easier to convert complicated
        tables to markdown or CSV by processing them as a whole rather than as
        individual elements.
    */

    t.addRule('tableCaption', {
        filter: 'caption',
        replacement: () => '',
    });

    t.addRule('tableCell', {
        filter: ['th', 'td'],
        replacement: () => '',
    });

    t.addRule('tableRow', {
        filter: 'tr',
        replacement: () => '',
    });

    t.addRule('table', {
        filter: 'table',
        replacement: function (content, table) {
            if (isHideButtonTable(table)) {
                return '';
            }

            if (tableFormat === 'html') {
                return '\n' + table.outerHTML + '\n';
            }

            const tableConv = new TableConverter();

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

                    let cellContent;
                    if (isUnconvertibleCell(cell)) {
                        cellContent = cell.textContent;
                    } else {
                        cellContent = t.turndown(cell);
                    }

                    const colspan = Number(cell.getAttribute('colspan') || 1);
                    const rowspan = Number(cell.getAttribute('rowspan') || 1);

                    tableConv.addCell(cellContent, colspan, rowspan);
                }

                tableConv.addRow();
            }

            let tableText;
            if (tableFormat === 'csv') {
                tableText = tableConv.toCsv();
            } else if (tableFormat === 'tsv') {
                tableText = tableConv.toCsv('\t');
            } else {
                tableText = tableConv.toMarkdown();
            }

            let caption = '';
            if (tableFormat === 'markdown') {
                caption = table.querySelector('caption');
            }

            if (caption) {
                return '\n**' + caption.textContent + '**\n\n' + tableText + '\n';
            } else {
                return '\n' + tableText + '\n';
            }
        },
    });
}

/**
 * isHideButtonTable reports whether an HTML table contains nothing but a "hide" button.
 * These tables are erroneously created from some Wikipedia tables that have a "hide"
 * button in their top-right corner.
 * @param {Node} table - the table element.
 * @returns {boolean}
 */
function isHideButtonTable(table) {
    const trs = table.querySelectorAll('tr');
    if (trs.length !== 1) {
        return false;
    }
    const tds = trs[0].querySelectorAll('td');
    if (tds.length !== 0) {
        return false;
    }
    const ths = trs[0].querySelectorAll('th');
    if (ths.length !== 1) {
        return false;
    }
    const buttons = ths[0].querySelectorAll('button');
    if (buttons.length !== 1) {
        return false;
    }
    return buttons[0].textContent === 'hide';
}

/**
 * getTableTrs gets the tr elements of an HTML table, but not any tr elements of any
 * child tables.
 * @param {Node} table - the table element.
 * @returns {Node[]} the tr elements.
 */
function getTableTrs(table) {
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

/**
 * isUnconvertibleCell reports whether an HTML table cell contains HTML that can't be
 * converted to markdown or CSV.
 * @param {Node} cell - the cell element.
 * @returns {boolean}
 */
function isUnconvertibleCell(cell) {
    for (let i = 0; i < cell.childNodes.length; i++) {
        const childName = cell.childNodes[i].nodeName;
        if (childName === 'TABLE' || childName.startsWith('H')) {
            return true;
        }
    }
    return false;
}
