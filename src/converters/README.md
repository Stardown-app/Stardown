# Stardown-converters

This package converts HTML to other markup languages such as markdown. It depends on `document` and `location`, and may occasionally benefit from `DOMParser` if it's available. It also depends on Stardown's `getSetting` function.

## Usage

To convert HTML to markdown:

```js
import { htmlToMd } from './converters/md.js';

const html = '<div>...</div>';
const frag = document.createRange().createContextualFragment(html);
const markdown = await htmlToMd(frag);
console.log(markdown);
```

HTML tables can be converted to a variety of formats besides markdown, such as CSV:

```js
import { htmlTableToCsv } from './converters/csv.js';

const html '<table>...</table>';
const frag = document.createRange().createContextualFragment(html);
const csv = await htmlTableToCsv(frag, ',');
console.log(csv);
```

## Implementation

Stardown-converters' markdown converter uses two map data structures to determine how to convert each HTML node. Below are parts of one of the maps.

```js
/** @type {Map<string, function(object, Element): string>} */
const elementConverters = new Map([
    ['BR', (ctx, el) => '\n'],
    ['HR', (ctx, el) => '\n\n* * *\n\n'],
    ['A', convertA],
    ['EM', convertEm],
    ['IMG', convertImg],
    ['DIV', convertChildNodes],
    ['SCRIPT', (ctx, el) => ''],
```

When the markdown converter encounters a `<br>`, it queries the `elementConverters` map for `BR`, gets the corresponding function, and calls that function. Some elements like `<br>` are easy to convert which is why they have anonymous functions, but most of them are more complicated. Every function in the map takes in a context object named `ctx` (see details below) and an element's data, and returns a string. Some of the functions are specialized for a specific element, like the `convertImg` function which is just for `<img>` elements, but others are more general such as `convertChildNodes`, which is for any element that should be ignored but may have descendants that should not be ignored. Some of the element types have the anonymous function `(ctx, el) => ''` so that they and their descendants are ignored. Some element types are ignored in the map because they are handled in another element's convert function; for example, `<li>` (list item) is ignored in the map because it is handled in `convertUl` and `convertOl`. Any element whose type is not present in the `elementConverters` map will have `convertChildNodes` called on it. Many elements that use `convertChildNodes` are kept in the map so that the code is more explicit and easier to modify if needed.

Every element is a node, but while most nodes are elements, not all are. Each node encountered requires first querying the `nodeConverters` map to determine whether the node is an element or something else like text. Then if the node is an element, the `elementConverters` map is queried.

Stardown previously used [Turndown](https://github.com/mixmark-io/turndown) to convert HTML to markdown but eventually outgrew it. Turndown is better than Stardown-converters when any customization needed is relatively simple, or when the functionality must work in different environments such as with ActiveX. Stardown-converters is specially made for Stardown but is easy to separate from it and may someday be turned into a separate, imported package.

Stardown-converters' strengths:

- easier to add support for other markup languages
- fewer abstractions, making it easier to understand and modify
- great performance
- stateless interface
- easier to determine context when converting an element because:
  - context objects (see details below)
  - Stardown-converters doesn't assume you will always want to convert everything from the innermost elements outward

Almost all of the functions in this package are synchronous because:

- so far, most of them don't need to be async
- async function calls run a little slower, which adds up with tons of function calls like in this package

### Context objects

Most of the functions in Stardown-converters have a parameter named `ctx`, which is short for context. A `ctx` is an ordinary JavaScript object that may be empty or may have whatever attributes and methods would be useful.

For example, settings and environment info could be put into `ctx` to be used throughout a converter:

```js
const ctx = {
    locationHref: location.href,
    document: document,
    mdSubBrackets: await getSetting('mdSubBrackets'),
    mdBulletPoint: await getSetting('mdBulletPoint'),
    omitNav: await getSetting('omitNav'),
    omitFooter: await getSetting('omitFooter'),
    mdYoutube: await getSetting('mdYoutube'),
    indent: '',
};
```

`ctx` can be used to send info to all descendants of a specific element:

```js
/**
 * @param {object} ctx
 * @param {Element} el
 * @returns {string}
 */
function convertTable(ctx, el) {
    if (ctx.inTable) {
        return ctx.escape(el.textContent);
    }
    const newCtx = { ...ctx, inTable: true };
    // below this, another convert function is called with newCtx on the table's descendants
```

The code above correctly prevents attempts to nest markdown tables since markdown does not support nested tables, unlike HTML. Note the creation of `newCtx` instead of directly modifying the existing `ctx`; this is necessary to only send `inTable` down to descendants and not also up to ancestors.

Similarly, `ctx` can be used to help with list indentation:

```js
const newCtx = { ...ctx, indent: ctx.indent + '    ' };
```
