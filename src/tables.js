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

/**
 * addTableRules adds to a Turndown service instance Turndown rules for how to convert
 * HTML tables to markdown. The rules apply to both source-formatted markdown and
 * markdown in block quotes. Even though most or all markdown renderers don't render
 * tables within block quotes, Stardown puts into block quotes not just the content of
 * tables but also their markdown syntax because the output will (at least usually) not
 * look good either way, keeping table syntax is more intuitive and easier for the user
 * to edit into a table that's outside a block quote, and maybe some markdown renderers
 * do allow tables to be in block quotes.
 * @param {TurndownService} t - the Turndown service instance.
 */
export function addTableRules(t) {
    t.addRule('caption', {
        filter: 'caption',
        replacement: function (content, caption) {
            return '**' + content + '**\n\n';
        },
    });

    t.addRule('tableCell', {
        filter: ['th', 'td'],
        replacement: function (content, cell) {
            for (let i = 0; i < cell.childNodes.length; i++) {
                const childName = cell.childNodes[i].nodeName;
                // If the cell contains something that can't render in a cell...
                if (childName === 'TABLE' || childName.startsWith('H')) {
                    // ...just get its non-markdown text.
                    return ' | ' + formatCellContent(cell.textContent);
                }
            }

            content = ' | ' + formatCellContent(content);

            // if the row spans multiple columns, add empty cells for the remaining
            // columns
            const colspan = cell.getAttribute('colspan') || 1;
            for (let i = 1; i <= colspan - 1; i++) {
                content += ' |'
            }

            return content;
        },
    });

    t.addRule('tableRow', {
        filter: 'tr',
        replacement: function (content, tr) {
            const table = getTable(tr);

            if (!isFirstRow(tr, table)) {
                // this row is a body row
                return content.trim() + ' |\n';
            }

            // this row will be the header row
            content = content.trim() + ' |';

            const rowSize = getRowSize(tr);
            const maxRowSize = getMaxRowSize(table);

            // add more cells to the header row if needed
            for (let i = rowSize; i < maxRowSize; i++) {
                content += ' |';
            }

            // append a table divider
            content += '\n|';
            for (let i = 0; i < maxRowSize; i++) {
                content += ' --- |';
            }

            return content + '\n';
        },
    });

    t.addRule('table', {
        filter: 'table',
        replacement: function (content, table) {
            if (isHideButtonTable(table)) {
                return '';
            }
            return '\n' + content + '\n';
        },
    });
}

/**
 * formatCellContent prepares a table cell's content to be incorporated into a table
 * row.
 * @param {string} content - the table cell's content.
 * @returns {string}
 */
function formatCellContent(content) {
    return content.trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
}

/**
 * isFirstRow reports whether a table row is the first row in its table.
 * @param {Node} tr - the tr element.
 * @param {Node} table - the table element.
 * @returns {boolean}
 */
function isFirstRow(tr, table) {
    const trs = table.querySelectorAll('tr');
    return trs[0] === tr;
}

/**
 * getRowSize gets the number of cells in a table row. Cells that span multiple columns
 * are counted as multiple cells.
 * @param {Node} tr - the tr element.
 * @returns {number}
 */
function getRowSize(tr) {
    let rowSize = tr.childNodes.length;
    for (let i = 0; i < tr.childNodes.length; i++) {
        const cell = tr.childNodes[i];
        const colspan = cell.getAttribute('colspan') || 1;
        rowSize += colspan - 1;
    }
    return rowSize;
}

/**
 * getMaxRowSize returns the number of cells in the table's row with the most cells.
 * Cells that span multiple columns are counted as multiple cells.
 * @param {Node} table - the table element.
 * @returns {number}
 */
function getMaxRowSize(table) {
    const trs = table.querySelectorAll('tr');

    let maxSize = 0;
    for (let i = 0; i < trs.length; i++) {
        const rowLen = getRowSize(trs[i]);
        if (rowLen > maxSize) {
            maxSize = rowLen;
        }
    }

    return maxSize;
}

/**
 * getTable gets the table element that contains the given table row.
 * @param {Node} tr - the tr element.
 * @returns {Node}
 */
function getTable(tr) {
    const parent = tr.parentNode;
    if (parent.nodeName === 'TABLE') {
        return parent;
    } else {
        return parent.parentNode;
    }
}

/**
 * isHideButtonTable reports whether an HTML table contains nothing but a "hide" button.
 * These tables are erroneously created from some Wikipedia tables that have a "hide"
 * button in their top-right corner.
 * @param {Node} table - the HTML table element node.
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
