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
                    return ' | ' + cell.textContent.trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
                }
            }
            return ' | ' + content.trim().replaceAll(/\s+/g, ' ').replaceAll('|', '\\|');
        },
    });

    t.addRule('tableRow', {
        filter: 'tr',
        replacement: function (content, tr) {
            switch (getRowType(tr)) {
                case RowType.headerRow:
                    content = content.trim() + ' |';
                    const rowSize = tr.childNodes.length;
                    const maxRowSize = getMaxRowSize(tr);
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
                case RowType.bodyRow:
                case RowType.error:
                    return content.trim() + ' |\n';
                default:
                    console.error(`tableRow replacement: unknown row type`);
                    return content.trim() + ' |\n';
            }
        },
    });

    t.addRule('table', {
        filter: function (table) {
            return table.nodeName === 'TABLE';
        },
        replacement: function (content, table) {
            if (isHideButtonTable(table)) {
                return '';
            }
            return '\n' + content + '\n';
        },
    });
}

/**
 * RowType is an enum for the different types of rows.
 */
const RowType = {
    error: 'error',
    headerRow: 'headerRow',
    bodyRow: 'bodyRow',
};

/**
 * getRowType determines the type of a given table row.
 * @param {*} tr - the tr element.
 * @returns {RowType}
 */
function getRowType(tr) {
    const parent = tr.parentNode;
    const trs = parent.childNodes;
    switch (parent.nodeName) {
        case 'TABLE':
        case 'THEAD':
            if (trs[0] === tr) {
                return RowType.headerRow;
            } else {
                return RowType.bodyRow;
            }
        case 'TBODY':
            const tbody = parent;
            const prev = tbody.previousSibling;
            if (prev && prev.nodeName !== 'CAPTION') {
                return RowType.bodyRow;
            }
            if (trs[0] === tr) {
                return RowType.headerRow;
            } else {
                return RowType.bodyRow;
            }
        default:
            console.error('getRowType: unknown parent node:', parent.nodeName);
            return RowType.error;
    }
}

/**
 * getMaxRowSize returns the number of cells in the row with the most cells. The given
 * tr may or may not be that row; it only has to be one of the rows in the table.
 * @param {*} tr - the tr element.
 * @returns {number}
 */
function getMaxRowSize(tr) {
    const parent = tr.parentNode;
    let maxSize = 0;

    switch (parent.nodeName) {
        case 'TABLE':
            const trs = parent.childNodes;
            for (let i = 0; i < trs.length; i++) {
                if (trs[i].length > maxSize) {
                    maxSize = trs[i].length;
                }
            }
            return maxSize;
        case 'THEAD':
        case 'TBODY':
            const table = parent.parentNode;
            for (let i = 0; i < table.childNodes.length; i++) {
                const node = table.childNodes[i];
                if (node.nodeName === 'TR' && node.childNodes.length > maxSize) {
                    maxSize = node.childNodes.length;
                } else {
                    const trs = node.childNodes;
                    for (let j = 0; j < trs.length; j++) {
                        if (trs[j].childNodes.length > maxSize) {
                            maxSize = trs[j].childNodes.length;
                        }
                    }
                }
            }
            return maxSize;
        default:
            console.error(`getMaxRowSize: unknown parent.nodeName: ${parent.nodeName}`);
            return tr.length;
    }
}

/**
 * isHideButtonTable reports whether an HTML table contains nothing but a "hide" button.
 * These tables are erroneously created from some Wikipedia tables that have a "hide"
 * button in their top-right corner.
 * @param {*} table - the HTML table element node.
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
