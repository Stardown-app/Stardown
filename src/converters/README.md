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

Stardown-converters' markdown converter is implemented with a class named `MdConverter` that has many methods, including one method for each [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element). These have names that start with `convert` and end with the element's uppercase tag name. A few examples are below. They each take a context object named `ctx` (details in the next section) and an [element](https://developer.mozilla.org/en-US/docs/Web/API/Element), and return a string.

```js
export class MdConverter {

    convertBR(ctx, el) {
        return '\n';
    }

    convertHR(ctx, el) {
        return '\n\n* * *\n\n';
    }

    convertSCRIPT(ctx, el) {
        return '';
    }

    convertLI(ctx, el) {
        return '';
    }

    convertSTRONG(ctx, el) {
        if (ctx.inStrong) {
            return this.convertNodes(ctx, el.childNodes);
        }
        const newCtx = { ...ctx, inStrong: true };

        const text = this.convertNodes(newCtx, el.childNodes).trim();
        if (!text) {
            return '';
        }

        return '**' + text.replaceAll('\n', ' ') + '**';
    }
}
```

A few elements including `<br>` and `<hr>` are simple to convert, and some elements like `<script>` are always converted to empty strings so that they are ignored. Some elements like `<li>` are set to be converted to empty strings because they are expected to only appear within other elements that are handled as a group (in this case, either `<ul>`, `<ol>`, or `<menu>`). However, most are more complicated like `<strong>`. The `convertSTRONG` example above shows:

1. `<strong>` element nesting is detected to avoid adding extra asterisks
2. all of the `<strong>` element's child nodes are converted to a string of markdown
3. the string is trimmed because markdown renderers require the asterisks to be next to non-whitespace characters
4. the string is checked to make sure it's not empty because markdown renderers require bold elements to have content
5. newline characters are removed because markdown renderers don't allow bold elements to span multiple lines
6. the result is wrapped with asterisks and returned

The `MdConverter` class should have a method for each HTML element, but any element without a corresponding method will be skipped and its child nodes will be processed. The markdown converter is implemented as a class so that it can be subclassed, such as to add support for other markdown flavors.

In HTML, every element is a node but not all nodes are elements. Each node encountered requires first checking its type to determine whether the node is an element or something else like text.

Stardown previously used [Turndown](https://github.com/mixmark-io/turndown) to convert HTML to markdown but eventually outgrew it. Turndown is better than Stardown-converters when any customization needed is relatively simple, or when the functionality must work in different environments such as with ActiveX. Stardown-converters is specially made for Stardown but is easy to separate from it and may someday be turned into a separate, imported package.

Stardown-converters' strengths:

- easier to add support for other markdown flavors and markup languages
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
    indent: '',
    omitNav: await getSetting('omitNav'),
    omitFooter: await getSetting('omitFooter'),
    mdSubBrackets: await getSetting('mdSubBrackets'),
    mdBulletPoint: await getSetting('mdBulletPoint'),
    mdYoutube: await getSetting('mdYoutube'),
};
```

`ctx` can be used to send info to all descendants of a specific element:

```js
function convertTABLE(ctx, el) {
    if (ctx.inTable) {
        return this.convertText(ctx, el);
    }
    const newCtx = { ...ctx, inTable: true };
    // below this, another convert function is called with newCtx on the table's descendants
```

The code above correctly prevents attempts to nest markdown tables since markdown does not support nested tables, unlike HTML. Note the creation of `newCtx` instead of directly modifying the existing `ctx`; this is necessary to only send `inTable` down to descendants and not also up to ancestors.

Similarly, `ctx` can be used to help with list indentation:

```js
const newCtx = { ...ctx, indent: ctx.indent + '    ' };
```
