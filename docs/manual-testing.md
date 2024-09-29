# Manual testing

When fully manually testing Stardown, use the descriptions here in each of the officially supported browsers to search for bugs.

### Sample web pages

Here are a bunch of web pages with interesting features for testing.

- [tiny table](https://www.markdownguide.org/extended-syntax/#tables)
- [small table](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#tables_for_visually_impaired_users)
- [complex table](https://en.wikipedia.org/wiki/English_modal_auxiliary_verbs#Modal_auxiliary_verbs_distinguished_grammatically)
- [table with link images](https://en.wikipedia.org/wiki/1926_World_Table_Tennis_Championships)
- [tables with spanned images](https://en.wikipedia.org/wiki/Toshimi_Kitazawa)
- [massive table](https://www.worldometers.info/world-population/population-by-country/)
- [tables used for presentation without the presentation role](https://news.ycombinator.com/)
- [Wikipedia references](https://en.wikipedia.org/wiki/Shanti_Kumar_Morarjee)
- [Wikipedia location map](https://en.wikipedia.org/wiki/Bush_Kill_%28Pepacton_Reservoir_tributary%29) cannot render well because two images have to overlap
- [code blocks that use `<pre>` but not `<code>`](https://www.cnblogs.com/unity2018/p/8492463.html)
- [code blocks with inline element headers](https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Advanced#the_scope_attribute)
- [MS doc code blocks](https://devblogs.microsoft.com/dotnet/csharp-13-explore-preview-features/)
- [block quote](https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1)
- [image with an absolute src](https://betterexplained.com/articles/math-empathy/#post-6251:~:text=Math%20Empathy%20Checklist,different%20mental%20checklist.)
- [images with relative srcs](https://textbundle.org/)
- [iframe](https://www.w3schools.com/html/html_iframe.asp)
- [YouTube video](https://www.youtube.com/watch?v=jfKfPfyJRdk)
- [PDFs](https://haslab.github.io/SAFER/scp21.pdf) should make Stardown show an error message like "Stardown cannot run on PDFs"

### Context types

When the user right-clicks part of a web page, their browser detects the type of the content they right-clicked and makes that info available to installed browser extensions.

- **selection**: anything that the user has selected by clicking and dragging with their mouse or using selection shortcuts.
- **link**: any clickable link on a page. However, for a link that is also an image, Stardown should show only the image copy option.
- **image**: types supported include png, jpg, svg, webp, gif, and base64-encoded. Types not supported include background images, `canvas` HTML elements, inline `svg` HTML elements, and sometimes images within `a` HTML elements for some reason.
- **video**: a video rendered with the `video` HTML element, such as YouTube videos and mp4 files hosted by GitHub ([example on this page](https://github.com/wheelercj/zq)). This option doesn't appear for some video sites like [Vimeo](https://player.vimeo.com/video/55073825) probably because their `video` HTML element is buried under many other things, and [Asciinema](https://asciinema.org/) because they don't use the `video` HTML element.
  - Markdown of YouTube videos is expected to render well in Obsidian and Discord, but not in GitHub by default.
  - Markdown of GitHub mp4s is expected to render well only in GitHub.
  - If the user changes the setting "Optimize markdown of YouTube videos for __" to "GitHub", then the output should render well in at least GitHub, Obsidian, and VS Code.
- **audio**: an audio player rendered with the `audio` HTML element. Some good examples are the first two audio players on [New Audio HTML Element: Master It Out Now With Our Code Example »](https://html.com/tags/audio/).
- **table**: a table of data rendered with the `table` HTML element. Browsers do not offer a built-in context type for this, so Stardown has its own table detection code that runs each time the user makes a selection.

### Features

- [ ] **Pressing any button in the popup** should do what the button's text describes.
- [ ] **Pressing Alt+C** copies a markdown link for the page, unless part of the page is selected in which case markdown of the selection is copied instead.
- [ ] **Right-clicking an empty part of a page** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking a website's unselected header** shows the "Copy markdown link to here" option.
- [ ] **Right-clicking selected text** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking an unselected image** shows the "Copy markdown of image" option.
- [ ] **Selecting text, then right-clicking an unselected image**, due to browser limitations, shows no context menu option in Chromium and shows "Copy markdown of selection" in Firefox.
- [ ] **Selecting text and image(s), then right-clicking the selected text** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and image(s), then right-clicking a selected image** shows the "Copy markdown of selection" option.
- [ ] **Selecting text and link(s), then right-clicking a selected link** shows the "Copy markdown of selection" option.
- [ ] **Right-clicking a link that is not an image** shows the "Copy markdown of link" option.
- [ ] **Right-clicking a link that is an image** might not show any context menu options due to browser limitations. If a context menu option appears, it should be "Copy markdown of image".
- [ ] **Right-clicking a video** shows the "Copy markdown of video" option, but may require a second right-click for the correct context menu to appear because some videos (e.g. YouTube videos) have a special context menu.
- [ ] **Right-clicking an audio player** shows the "Copy markdown of audio" option.
- [ ] **Selecting the contents of a table and right-clicking the selection** shows several options: "Copy markdown of table", "Copy TSV of table", "Copy CSV of table", "Copy JSON of table", and "Copy HTML of table". Each option should result in a table with everything aligned correctly, leaving some cells empty and others duplicated as necessary.
- [ ] "Copy markdown link to here" copies a markdown link for the page with an HTML element ID from where the page was right-clicked, if one exists there.
- [ ] "Copy markdown of selection", by default, copies markdown of the selected text (including all of the page's formatting that markdown supports), and a markdown link containing a text fragment and possibly an HTML element ID.
- [ ] "Copy markdown of image" copies markdown of the image using the image's URL and any alt text.
- [ ] "Copy markdown of link" copies markdown of the link, using the same title and URL as the link in the page (except for any character escapes or encodings).
- [ ] "Copy markdown of video" copies markdown of the video using the video source's URL.
- [ ] "Copy markdown of audio" copies a markdown link to either an audio file or a site that plays the audio.
- [ ] **Change settings and repeat as necessary**

### Errors and warnings

When something goes wrong, Stardown should still respond well.

#### Text fragment timeout

1. Turn on the "Show warning notifications" setting
2. Go to https://markdownguide.offshoot.io/basic-syntax/#blockquotes-1
3. Select the text "rendered output" (this phrase appears 32 times on this somewhat long page)
4. Right-click the selection and choose "Copy markdown of selection"
5. After several seconds:
  - Stardown's icon should display a green check (✓) to indicate success.
  - A system notification should appear that says "Warning" and explains that the fragment generator timed out.
  - The clipboard should now have a markdown link without a text fragment.
