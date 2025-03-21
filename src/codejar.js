"use strict";
/*
    Where this code came from:

    1. Copy https://github.com/antonmedv/codejar/blob/master/codejar.ts
    2. Transpile from TypeScript to JavaScript with `tsc src/codejar.ts` (no tsconfig.json
       is needed)
    3. Add `export` to the `CodeJar` function
    4. Comment-out the lines with `exports`
    5. Replace each instance of `this` with `undefined` and delete unnecessary ones

    Compiling TypeScript:
    https://code.visualstudio.com/docs/typescript/typescript-compiling
*/

/*
    MIT License

    Copyright (c) 2020 Anton Medvedev

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/
var __assign = function () {
    __assign =
        Object.assign ||
        function (t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
    return __assign.apply(undefined, arguments);
};
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.CodeJar = CodeJar;
var globalWindow = window;
export function CodeJar(editor, highlight, opt) {
    if (opt === void 0) {
        opt = {};
    }
    var options = __assign(
        {
            tab: "\t",
            indentOn: /[({\[]$/,
            moveToNewLine: /^[)}\]]/,
            spellcheck: false,
            catchTab: true,
            preserveIdent: true,
            addClosing: true,
            history: true,
            window: globalWindow,
            autoclose: {
                open: "([{'\"",
                close: ")]}'\"",
            },
        },
        opt,
    );
    var window = options.window;
    var document = window.document;
    var listeners = [];
    var history = [];
    var at = -1;
    var focus = false;
    var onUpdate = function () {
        return void 0;
    };
    var prev; // code content prior keydown event
    editor.setAttribute("contenteditable", "plaintext-only");
    editor.setAttribute("spellcheck", options.spellcheck ? "true" : "false");
    editor.style.outline = "none";
    editor.style.overflowWrap = "break-word";
    editor.style.overflowY = "auto";
    editor.style.whiteSpace = "pre-wrap";
    var doHighlight = function (editor, pos) {
        highlight(editor, pos);
    };
    var isLegacy = false; // true if plaintext-only is not supported
    if (editor.contentEditable !== "plaintext-only") isLegacy = true;
    if (isLegacy) editor.setAttribute("contenteditable", "true");
    var debounceHighlight = debounce(function () {
        var pos = save();
        doHighlight(editor, pos);
        restore(pos);
    }, 30);
    var recording = false;
    var shouldRecord = function (event) {
        return (
            !isUndo(event) &&
            !isRedo(event) &&
            event.key !== "Meta" &&
            event.key !== "Control" &&
            event.key !== "Alt" &&
            !event.key.startsWith("Arrow")
        );
    };
    var debounceRecordHistory = debounce(function (event) {
        if (shouldRecord(event)) {
            recordHistory();
            recording = false;
        }
    }, 300);
    var on = function (type, fn) {
        listeners.push([type, fn]);
        editor.addEventListener(type, fn);
    };
    on("keydown", function (event) {
        if (event.defaultPrevented) return;
        prev = toString();
        if (options.preserveIdent) handleNewLine(event);
        else legacyNewLineFix(event);
        if (options.catchTab) handleTabCharacters(event);
        if (options.addClosing) handleSelfClosingCharacters(event);
        if (options.history) {
            handleUndoRedo(event);
            if (shouldRecord(event) && !recording) {
                recordHistory();
                recording = true;
            }
        }
        if (isLegacy && !isCopy(event)) restore(save());
    });
    on("keyup", function (event) {
        if (event.defaultPrevented) return;
        if (event.isComposing) return;
        if (prev !== toString()) debounceHighlight();
        debounceRecordHistory(event);
        onUpdate(toString());
    });
    on("focus", function (_event) {
        focus = true;
    });
    on("blur", function (_event) {
        focus = false;
    });
    on("paste", function (event) {
        recordHistory();
        handlePaste(event);
        recordHistory();
        onUpdate(toString());
    });
    on("cut", function (event) {
        recordHistory();
        handleCut(event);
        recordHistory();
        onUpdate(toString());
    });
    function save() {
        var s = getSelection();
        var pos = { start: 0, end: 0, dir: undefined };
        var anchorNode = s.anchorNode,
            anchorOffset = s.anchorOffset,
            focusNode = s.focusNode,
            focusOffset = s.focusOffset;
        if (!anchorNode || !focusNode) throw "error1";
        // If the anchor and focus are the editor element, return either a full
        // highlight or a start/end cursor position depending on the selection
        if (anchorNode === editor && focusNode === editor) {
            pos.start =
                anchorOffset > 0 && editor.textContent
                    ? editor.textContent.length
                    : 0;
            pos.end =
                focusOffset > 0 && editor.textContent
                    ? editor.textContent.length
                    : 0;
            pos.dir = focusOffset >= anchorOffset ? "->" : "<-";
            return pos;
        }
        // Selection anchor and focus are expected to be text nodes,
        // so normalize them.
        if (anchorNode.nodeType === Node.ELEMENT_NODE) {
            var node = document.createTextNode("");
            anchorNode.insertBefore(node, anchorNode.childNodes[anchorOffset]);
            anchorNode = node;
            anchorOffset = 0;
        }
        if (focusNode.nodeType === Node.ELEMENT_NODE) {
            var node = document.createTextNode("");
            focusNode.insertBefore(node, focusNode.childNodes[focusOffset]);
            focusNode = node;
            focusOffset = 0;
        }
        visit(editor, function (el) {
            if (el === anchorNode && el === focusNode) {
                pos.start += anchorOffset;
                pos.end += focusOffset;
                pos.dir = anchorOffset <= focusOffset ? "->" : "<-";
                return "stop";
            }
            if (el === anchorNode) {
                pos.start += anchorOffset;
                if (!pos.dir) {
                    pos.dir = "->";
                } else {
                    return "stop";
                }
            } else if (el === focusNode) {
                pos.end += focusOffset;
                if (!pos.dir) {
                    pos.dir = "<-";
                } else {
                    return "stop";
                }
            }
            if (el.nodeType === Node.TEXT_NODE) {
                if (pos.dir != "->") pos.start += el.nodeValue.length;
                if (pos.dir != "<-") pos.end += el.nodeValue.length;
            }
        });
        editor.normalize(); // collapse empty text nodes
        return pos;
    }
    function restore(pos) {
        var _a;
        var _b, _c;
        var s = getSelection();
        var startNode,
            startOffset = 0;
        var endNode,
            endOffset = 0;
        if (!pos.dir) pos.dir = "->";
        if (pos.start < 0) pos.start = 0;
        if (pos.end < 0) pos.end = 0;
        // Flip start and end if the direction reversed
        if (pos.dir == "<-") {
            var start = pos.start,
                end = pos.end;
            pos.start = end;
            pos.end = start;
        }
        var current = 0;
        visit(editor, function (el) {
            if (el.nodeType !== Node.TEXT_NODE) return;
            var len = (el.nodeValue || "").length;
            if (current + len > pos.start) {
                if (!startNode) {
                    startNode = el;
                    startOffset = pos.start - current;
                }
                if (current + len > pos.end) {
                    endNode = el;
                    endOffset = pos.end - current;
                    return "stop";
                }
            }
            current += len;
        });
        if (!startNode)
            (startNode = editor), (startOffset = editor.childNodes.length);
        if (!endNode)
            (endNode = editor), (endOffset = editor.childNodes.length);
        // Flip back the selection
        if (pos.dir == "<-") {
            (_a = [endNode, endOffset, startNode, startOffset]),
                (startNode = _a[0]),
                (startOffset = _a[1]),
                (endNode = _a[2]),
                (endOffset = _a[3]);
        }
        {
            // If nodes not editable, create a text node.
            var startEl = uneditable(startNode);
            if (startEl) {
                var node = document.createTextNode("");
                (_b = startEl.parentNode) === null || _b === void 0
                    ? void 0
                    : _b.insertBefore(node, startEl);
                startNode = node;
                startOffset = 0;
            }
            var endEl = uneditable(endNode);
            if (endEl) {
                var node = document.createTextNode("");
                (_c = endEl.parentNode) === null || _c === void 0
                    ? void 0
                    : _c.insertBefore(node, endEl);
                endNode = node;
                endOffset = 0;
            }
        }
        s.setBaseAndExtent(startNode, startOffset, endNode, endOffset);
        editor.normalize(); // collapse empty text nodes
    }
    function uneditable(node) {
        while (node && node !== editor) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                var el = node;
                if (el.getAttribute("contenteditable") == "false") {
                    return el;
                }
            }
            node = node.parentNode;
        }
    }
    function beforeCursor() {
        var s = getSelection();
        var r0 = s.getRangeAt(0);
        var r = document.createRange();
        r.selectNodeContents(editor);
        r.setEnd(r0.startContainer, r0.startOffset);
        return r.toString();
    }
    function afterCursor() {
        var s = getSelection();
        var r0 = s.getRangeAt(0);
        var r = document.createRange();
        r.selectNodeContents(editor);
        r.setStart(r0.endContainer, r0.endOffset);
        return r.toString();
    }
    function handleNewLine(event) {
        if (event.key === "Enter") {
            var before = beforeCursor();
            var after = afterCursor();
            var padding = findPadding(before)[0];
            var newLinePadding = padding;
            // If last symbol is "{" ident new line
            if (options.indentOn.test(before)) {
                newLinePadding += options.tab;
            }
            // Preserve padding
            if (newLinePadding.length > 0) {
                preventDefault(event);
                event.stopPropagation();
                insert("\n" + newLinePadding);
            } else {
                legacyNewLineFix(event);
            }
            // Place adjacent "}" on next line
            if (
                newLinePadding !== padding &&
                options.moveToNewLine.test(after)
            ) {
                var pos = save();
                insert("\n" + padding);
                restore(pos);
            }
        }
    }
    function legacyNewLineFix(event) {
        // Firefox does not support plaintext-only mode
        // and puts <div><br></div> on Enter. Let's help.
        if (isLegacy && event.key === "Enter") {
            preventDefault(event);
            event.stopPropagation();
            if (afterCursor() == "") {
                insert("\n ");
                var pos = save();
                pos.start = --pos.end;
                restore(pos);
            } else {
                insert("\n");
            }
        }
    }
    function handleSelfClosingCharacters(event) {
        var _a;
        var open = options.autoclose.open;
        var close = options.autoclose.close;
        if (open.includes(event.key)) {
            preventDefault(event);
            var pos = save();
            var wrapText =
                pos.start == pos.end ? "" : getSelection().toString();
            var text =
                event.key +
                wrapText +
                ((_a = close[open.indexOf(event.key)]) !== null && _a !== void 0
                    ? _a
                    : "");
            insert(text);
            pos.start++;
            pos.end++;
            restore(pos);
        }
    }
    function handleTabCharacters(event) {
        if (event.key === "Tab") {
            preventDefault(event);
            if (event.shiftKey) {
                var before = beforeCursor();
                var _a = findPadding(before),
                    padding = _a[0],
                    start = _a[1];
                if (padding.length > 0) {
                    var pos = save();
                    // Remove full length tab or just remaining padding
                    var len = Math.min(options.tab.length, padding.length);
                    restore({ start: start, end: start + len });
                    document.execCommand("delete");
                    pos.start -= len;
                    pos.end -= len;
                    restore(pos);
                }
            } else {
                insert(options.tab);
            }
        }
    }
    function handleUndoRedo(event) {
        if (isUndo(event)) {
            preventDefault(event);
            at--;
            var record = history[at];
            if (record) {
                editor.innerHTML = record.html;
                restore(record.pos);
            }
            if (at < 0) at = 0;
        }
        if (isRedo(event)) {
            preventDefault(event);
            at++;
            var record = history[at];
            if (record) {
                editor.innerHTML = record.html;
                restore(record.pos);
            }
            if (at >= history.length) at--;
        }
    }
    function recordHistory() {
        if (!focus) return;
        var html = editor.innerHTML;
        var pos = save();
        var lastRecord = history[at];
        if (lastRecord) {
            if (
                lastRecord.html === html &&
                lastRecord.pos.start === pos.start &&
                lastRecord.pos.end === pos.end
            )
                return;
        }
        at++;
        history[at] = { html: html, pos: pos };
        history.splice(at + 1);
        var maxHistory = 300;
        if (at > maxHistory) {
            at = maxHistory;
            history.splice(0, 1);
        }
    }
    function handlePaste(event) {
        var _a;
        if (event.defaultPrevented) return;
        preventDefault(event);
        var originalEvent =
            (_a = event.originalEvent) !== null && _a !== void 0 ? _a : event;
        var text = originalEvent.clipboardData
            .getData("text/plain")
            .replace(/\r\n?/g, "\n");
        var pos = save();
        insert(text);
        doHighlight(editor);
        restore({
            start: Math.min(pos.start, pos.end) + text.length,
            end: Math.min(pos.start, pos.end) + text.length,
            dir: "<-",
        });
    }
    function handleCut(event) {
        var _a;
        var pos = save();
        var selection = getSelection();
        var originalEvent =
            (_a = event.originalEvent) !== null && _a !== void 0 ? _a : event;
        originalEvent.clipboardData.setData("text/plain", selection.toString());
        document.execCommand("delete");
        doHighlight(editor);
        restore({
            start: Math.min(pos.start, pos.end),
            end: Math.min(pos.start, pos.end),
            dir: "<-",
        });
        preventDefault(event);
    }
    function visit(editor, visitor) {
        var queue = [];
        if (editor.firstChild) queue.push(editor.firstChild);
        var el = queue.pop();
        while (el) {
            if (visitor(el) === "stop") break;
            if (el.nextSibling) queue.push(el.nextSibling);
            if (el.firstChild) queue.push(el.firstChild);
            el = queue.pop();
        }
    }
    function isCtrl(event) {
        return event.metaKey || event.ctrlKey;
    }
    function isUndo(event) {
        return isCtrl(event) && !event.shiftKey && getKeyCode(event) === "Z";
    }
    function isRedo(event) {
        return isCtrl(event) && event.shiftKey && getKeyCode(event) === "Z";
    }
    function isCopy(event) {
        return isCtrl(event) && getKeyCode(event) === "C";
    }
    function getKeyCode(event) {
        var key = event.key || event.keyCode || event.which;
        if (!key) return undefined;
        return (
            typeof key === "string" ? key : String.fromCharCode(key)
        ).toUpperCase();
    }
    function insert(text) {
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        document.execCommand("insertHTML", false, text);
    }
    function debounce(cb, wait) {
        var timeout = 0;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            clearTimeout(timeout);
            timeout = window.setTimeout(function () {
                return cb.apply(void 0, args);
            }, wait);
        };
    }
    function findPadding(text) {
        // Find beginning of previous line.
        var i = text.length - 1;
        while (i >= 0 && text[i] !== "\n") i--;
        i++;
        // Find padding of the line.
        var j = i;
        while (j < text.length && /[ \t]/.test(text[j])) j++;
        return [text.substring(i, j) || "", i, j];
    }
    function toString() {
        return editor.textContent || "";
    }
    function preventDefault(event) {
        event.preventDefault();
    }
    function getSelection() {
        // @ts-ignore
        return editor.getRootNode().getSelection();
    }
    return {
        updateOptions: function (newOptions) {
            Object.assign(options, newOptions);
        },
        updateCode: function (code, callOnUpdate) {
            if (callOnUpdate === void 0) {
                callOnUpdate = true;
            }
            editor.textContent = code;
            doHighlight(editor);
            callOnUpdate && onUpdate(code);
        },
        onUpdate: function (callback) {
            onUpdate = callback;
        },
        toString: toString,
        save: save,
        restore: restore,
        recordHistory: recordHistory,
        destroy: function () {
            for (
                var _i = 0, listeners_1 = listeners;
                _i < listeners_1.length;
                _i++
            ) {
                var _a = listeners_1[_i],
                    type = _a[0],
                    fn = _a[1];
                editor.removeEventListener(type, fn);
            }
        },
    };
}
