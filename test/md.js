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

import test from 'node:test'; // https://nodejs.org/api/test.html
import assert from 'node:assert/strict'; // https://nodejs.org/api/assert.html#assert
import { JSDOM } from 'jsdom'; // https://www.npmjs.com/package/jsdom
import { newTurndownService } from '../src/newTurndownService.js';

global.location = { href: 'https://example.com' };

/**
 * escape escapes many markdown patterns, but not square brackets.
 * @param {string} text - the text to escape markdown characters in.
 * @returns {string}
 */
export function escape(text) {
    return text
        .replaceAll('\\', '\\\\')
        .replaceAll('#', '\\#')
        .replaceAll('_', '\\_')
        .replaceAll('*', '\\*')
        .replaceAll('`', '\\`')
        .replaceAll(/^>/g, '\\>')
        .replaceAll(/^-/g, '\\-')
        .replaceAll(/^\+ /g, '\\+ ')
        .replaceAll(/^(=+)/g, '\\$1')
        .replaceAll(/^~~~/g, '\\~~~')
        .replaceAll(/^(\d+)\. /g, '$1\\. ')
}

const turndownService = newTurndownService(
    '-', 'underlined', 'source with link', true, true, escape,
);

function runTest() {
    test('HTML to markdown', async t => {
        global.document = new JSDOM(htmlInput).window.document;
        const mdActual = turndownService.turndown(htmlInput);

        const actualLines = mdActual.split('\n');
        const expectedLines = mdExpected.split('\n');
        const minLength = Math.min(actualLines.length, expectedLines.length);

        for (let i = 0; i < minLength; i++) {
            const actualLine = actualLines[i];
            const expectedLine = expectedLines[i];
            assert.equal(actualLine, expectedLine);
        }

        assert.equal(actualLines.length, expectedLines.length, 'The number of lines is unexpected');
    });
}

const htmlInput = `
<h1>Header level 1</h1>
<h2>Header level 2</h2>
<h3>Header level 3</h3>
<h4>Header level 4</h4>
<h5>Header level 5</h5>
<h6>Header level 6</h6>
<p>paragraph</p>
<p>another paragraph</p>
<p>Multi-line
paragraph.</p>
<p>Paragraph with <br /> line break.</p>
<p>
    <strong>bold</strong>
    <em>emphasis</em>
</p>
<p><strong><em>both bold and emphasis</em></strong></p>
<p><em><strong>both bold and emphasis</strong></em></p>
<p><em>Entirely emphasized but <strong>only partly bold</strong>.</em></p>
<p>boldLetters<strong>Within</strong>String</p>
<p>emphasizedLetters<em>Within</em>String</p>
<p>boldAndEmphasizedLetters<strong><em>Within</em></strong>String</p>
<blockquote>To make all your unknowns known, you must make all your knowns unknown. — Unknown</blockquote>
<blockquote>
    <p>When a measure becomes a target, it ceases to be a good measure. — Goodhart's Law</p>
</blockquote>
<blockquote>
    <p>Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it.</p>
    <p>And to make matters worse: complexity sells better. — Edsger Dijkstra</p>
</blockquote>
<blockquote>
    <blockquote>
        You miss 100% of the shots you don't take. — Wayne Gretzky
    </blockquote>
    — Michael Scott
</blockquote>
<blockquote>
    <strong>Bold</strong> and <em>emphasis</em> in a block quote.
</blockquote>
<p><img alt="Grapefruit slice" src="grapefruit-slice.jpg"></p>
<p>Press <code>Alt+C</code> to copy.</p>
<code>Code elements can contain \`backticks\`.</code>
<pre>
  .
 ...
.....
 ...
  .
</pre>
<pre><code>This text is in a code block.</code></pre>
<pre><code class="language-go">import "fmt"

func main() {
    fmt.Println("Hello")
}</code></pre>
<pre><code class="language-html">&lt;h1&gt;Section title&lt;/h1&gt;</code></pre>
<ol>
    <li>Ordered list item 1</li>
    <li><p>Ordered list item 2</p></li>
    <li>Ordered list item 3</li>
</ol>
<ol>
    <li>Another ordered list item 1</li>
    <li>item 2
        <ol>
            <li>Nested ordered list item 1</li>
            <li>Nested item 2</li>
        </ol>
    </li>
    <li>item 3
        <ul>
            <li>Nested unordered list item 1</li>
            <li>Nested item 2</li>
        </ul>
    </li>
</ol>
<ul>
    <li>Unordered list item 1</li>
    <li><p>item 2</p></li>
    <li>item 3</li>
</ul>
<ul>
    <li>Another unordered list item 1</li>
    <li>item 2
        <ul>
            <li>Nested unordered list item a</li>
            <li>Nested item b</li>
        </ul>
    </li>
    <li>item 3
        <ol>
            <li>Nested ordered list item a</li>
            <li>Nested item b</li>
        </ol>
    </li>
</ul>
<ol>
    <li>Ordered list item 1</li>
    <li><p>Item 2 with block quote</p>
        <blockquote>
            <p>Premature optimization is the root of all evil. — Donald Knuth</p>
        </blockquote>
    </li>
    <li><p>Item 3 with code block</p>
        <pre><code class="language-python">while True:
    print(exec(input(">>> ")))</code></pre>
    </li>
    <li><p>Item 4 with image</p>
        <img alt="Orange slice" src="orange-slice.jpg">
    </li>
</ol>
<hr>
It's possible to open a <a href="https://en.wikipedia.org/wiki/Special:Random">random Wikipedia page</a>.
<p>Click <strong><a href="https://pairdrop.net/">here</a></strong> to send something to another device in your LAN.</p>
<p><em><a href="https://bitwarden.com/">Bitwarden</a></em> is a great password manager.</p>
<p><a href="zombo.com"><img src="lemon-slice.jpg" alt="Lemon slice"></a></p>
<table>
    <tr>
        <td>one</td>
        <td>two</td>
    </tr>
    <tr>
        <td>three</td>
        <td>four</td>
    </tr>
</table>
<p><del>This is stricken through.</del></p>
<p><mark>This is highlighted.</mark></p>
`;

const mdExpected = `# Header level 1

## Header level 2

### Header level 3

#### Header level 4

##### Header level 5

###### Header level 6

paragraph

another paragraph

Multi-line paragraph.

Paragraph with  
line break.

**bold** *emphasis*

***both bold and emphasis***

***both bold and emphasis***

*Entirely emphasized but **only partly bold**.*

boldLetters**Within**String

emphasizedLetters*Within*String

boldAndEmphasizedLetters***Within***String

> To make all your unknowns known, you must make all your knowns unknown. — Unknown

> When a measure becomes a target, it ceases to be a good measure. — Goodhart's Law

> Simplicity is a great virtue but it requires hard work to achieve it and education to appreciate it.
> 
> And to make matters worse: complexity sells better. — Edsger Dijkstra

> > You miss 100% of the shots you don't take. — Wayne Gretzky
> 
> — Michael Scott

> **Bold** and *emphasis* in a block quote.

![Grapefruit slice](grapefruit-slice.jpg)

Press \`Alt+C\` to copy.

\`\`Code elements can contain \`backticks\`.\`\`

  .
 ...
.....
 ...
  .

\`\`\`
This text is in a code block.
\`\`\`

\`\`\`go
import "fmt"

func main() {
    fmt.Println("Hello")
}
\`\`\`

\`\`\`html
<h1>Section title</h1>
\`\`\`

1.  Ordered list item 1
2.  Ordered list item 2
\ \ \ \ 
3.  Ordered list item 3

1.  Another ordered list item 1
2.  item 2
    1.  Nested ordered list item 1
    2.  Nested item 2
3.  item 3
    -   Nested unordered list item 1
    -   Nested item 2

-   Unordered list item 1
-   item 2
\ \ \ \ 
-   item 3

-   Another unordered list item 1
-   item 2
    -   Nested unordered list item a
    -   Nested item b
-   item 3
    1.  Nested ordered list item a
    2.  Nested item b

1.  Ordered list item 1
2.  Item 2 with block quote
\ \ \ \ 
    > Premature optimization is the root of all evil. — Donald Knuth
\ \ \ \ 
3.  Item 3 with code block
\ \ \ \ 
    \`\`\`python
    while True:
        print(exec(input(">>> ")))
    \`\`\`
\ \ \ \ 
4.  Item 4 with image
\ \ \ \ 
    ![Orange slice](orange-slice.jpg)

* * *

It's possible to open a [random Wikipedia page](https://en.wikipedia.org/wiki/Special:Random).

Click **[here](https://pairdrop.net/)** to send something to another device in your LAN.

*[Bitwarden](https://bitwarden.com/)* is a great password manager.

[![Lemon slice](lemon-slice.jpg)](zombo.com)

| one | two |
| --- | --- |
| three | four |

~~This is stricken through.~~

==This is highlighted.==`;

runTest();
