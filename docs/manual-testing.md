# Manual testing

When fully manually testing Stardown, use the descriptions here in each of the officially supported browsers to search for bugs.

### Sample web pages

Here are a bunch of web pages with interesting features for testing.

- [short Wikipedia page](https://en.wikipedia.org/wiki/Harjant_Gill)
- [short Wikipedia page with many references](https://en.wikipedia.org/wiki/Shanti_Kumar_Morarjee)
- [long Wikipedia page](https://en.wikipedia.org/wiki/Cold_War)
- [insanely long Wikipedia page](https://en.wikipedia.org/wiki/Scythians)
- [Wikipedia article with math elements](https://en.wikipedia.org/wiki/Kinematics)
- [Wikipedia location map](https://en.wikipedia.org/wiki/Bush_Kill_%28Pepacton_Reservoir_tributary%29) cannot render well as markdown because two images overlap on the website
- [tiny table](https://www.markdownguide.org/extended-syntax/#tables)
- [small table](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Table_accessibility#recap_tables_for_visually_impaired_users)
- [complex table](https://en.wikipedia.org/wiki/English_modal_auxiliary_verbs#Modal_auxiliary_verbs_distinguished_grammatically)
- [complex table 2](https://en.wikipedia.org/wiki/Dear_Evan_Hansen#Original_West_End_production)
- [table with link images](https://en.wikipedia.org/wiki/1926_World_Table_Tennis_Championships)
- [table with horizontally spanned image](https://en.wikipedia.org/wiki/Toshimi_Kitazawa)
- [table with vertically spanned image](https://en.wikipedia.org/wiki/Gabiadji)
- [table of numbers (mostly)](https://finance.yahoo.com/quote/%5EGSPC/history/)
- [massive table](https://www.worldometers.info/world-population/population-by-country/)
- [tables used for presentation without the presentation role](https://news.ycombinator.com/)
- [code blocks that use `<pre>` but not `<code>`](https://www.cnblogs.com/unity2018/p/8492463.html)
- [code blocks with inline element headers](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#the_scope_attribute)
- [MS doc code blocks](https://devblogs.microsoft.com/dotnet/csharp-13-explore-preview-features/)
- [MkDocs code blocks](https://squidfunk.github.io/mkdocs-material/reference/)
- [block quote](https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1)
- [definition list](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#Legend)
- [several definition lists](https://forgottenrealms.fandom.com/wiki/Template:Location)
- [image with an absolute src](https://betterexplained.com/articles/math-empathy/#post-6251:~:text=Math%20Empathy%20Checklist,different%20mental%20checklist.)
- [images with relative srcs](https://textbundle.org/)
- [GitHub issue with several timeline item types](https://github.com/Stardown-app/Stardown/issues/44)
- [YouTube video](https://www.youtube.com/watch?v=jfKfPfyJRdk)
- [PDFs](https://haslab.github.io/SAFER/scp21.pdf) should make Stardown show an error message like "Stardown cannot run on PDFs"
- On [HBR1 - Music on Futurenet](http://www.hbr1.com/), writing to Stardown's notepad works but writing to the clipboard fails silently for some reason. Writing to the clipboard works on other http sites like [http://detectportal.firefox.com/success.txt](http://detectportal.firefox.com/success.txt), so it's not because it's http. Maybe it's because of HBR1's unusual HTML. The site is ancient and I haven't seen this problem anywhere else, so it's not a priority to fix this.

### Context types

When the user right-clicks part of a web page, their browser detects the type of the content they right-clicked and makes that info available to installed browser extensions.

- **selection**: anything that the user has selected by clicking and dragging with their mouse or using selection shortcuts.
- **link**: any clickable link on a page. However, for a link that is also an image, Stardown should show only the image copy option.
- **image**: types supported include png, jpg, svg, webp, gif, and base64-encoded. Types not supported include background images, `canvas` HTML elements, inline `svg` HTML elements, and sometimes images within `a` HTML elements for some reason.
- **video**: a video rendered with the `video` HTML element, such as YouTube videos and mp4 files hosted by GitHub ([example on this page](https://github.com/wheelercj/zq)). This option doesn't appear for some video sites like [Vimeo](https://player.vimeo.com/video/55073825) probably because their `video` HTML element is buried under many other things, and [Asciinema](https://asciinema.org/) because they don't use the `video` HTML element.
    - Markdown of YouTube videos is expected to render well in Obsidian and Discord, but not in GitHub by default.
    - Markdown of GitHub mp4s is expected to render well only in GitHub.
    - If the user changes the setting "Optimize markdown of YouTube videos for \_" to "GitHub", then the output should render well in at least GitHub, Obsidian, and VS Code.
- **audio**: an audio player rendered with the `audio` HTML element. Some good examples are the first two audio players on [New Audio HTML Element: Master It Out Now With Our Code Example »](https://html.com/tags/audio/).
- **table**: a table of data rendered with the `table` HTML element. Browsers do not offer a built-in context type for this, so Stardown has its own table detection code that runs each time the user makes a selection.

### Features

- [ ] **Pressing any button in the popup** should do what the button's text describes.
- [ ] **Pressing Stardown's copy shortcut** copies a markdown link for the page, unless part of the page is selected in which case markdown of the selection is copied instead.
- [ ] **Right-clicking an unselected part of a page** shows the "Copy link for this page" and "Copy link for this section" options.
- [ ] **Right-clicking an unselected image** shows the "Copy image" option.
- [ ] **Selecting text and/or image(s), then right-clicking the selection** shows the options "Copy selection", "Copy selection, cite source", and "Copy selection as a quote".
- [ ] **Right-clicking a link that is not an image** shows the "Copy link" option.
- [ ] **Right-clicking a link that is an image** might not show any context menu options due to browser limitations. If a context menu option appears, it should be "Copy image".
- [ ] **Right-clicking a video** shows the "Copy video" option, but may require a second right-click for the correct context menu to appear because some videos (e.g. YouTube videos) have a special context menu.
- [ ] **Right-clicking an audio player** shows the "Copy audio" option.
- [ ] **Selecting the contents of a table and right-clicking the selection** shows several options: "Copy markdown of table", "Copy TSV of table", "Copy CSV of table", "Copy JSON of table", and "Copy HTML of table". Each option should result in a table with everything aligned correctly, leaving some cells empty and others duplicated as necessary.
- [ ] Context menu options
    - [ ] "Copy link for this page" copies a markdown link for the page. The link is guaranteed to not have an HTML element ID nor a text fragment.
    - [ ] "Copy link for this section" copies a markdown link for the page with the nearest HTML element ID above (_above_ in the HTML element tree sense) where the page was right-clicked.
    - [ ] "Copy selection" copies markdown of the selection (including all of the page's formatting that markdown supports).
    - [ ] "Copy selection, cite source" does the same as "Copy selection" but also includes a markdown link containing a text fragment and possibly an HTML element ID.
    - [ ] "Copy selection as a quote" does the same as "Copy selection, cite source" but formats the output as a markdown block quote.
    - [ ] "Copy image" copies markdown of the image using the image's URL and any alt text.
    - [ ] "Copy link" copies markdown of the link, using the same title and URL as the link in the page (except for any character escapes or encodings).
    - [ ] "Copy video" copies markdown of the video using the video source's URL.
    - [ ] "Copy audio" copies a markdown link to either an audio file or a site that plays the audio.
- [ ] **Change settings and repeat as necessary**
