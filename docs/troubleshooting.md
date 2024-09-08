# Troubleshooting

## The right-click options disappeared

Try reinstalling Stardown. The context menu options may have disappeared because of an occasionally reoccuring bug in browsers that is fixed by reinstalling the extension. However, due to browser limitations, the context menu options will never appear for some types of links, images, and videos. Specifically, they cannot appear for canvases, background images, inline SVGs, HTML anchors that contain both text and image(s), videos that don't have a `<video>` HTML element, and videos with a `<video>` HTML element that's covered by other elements.

## The right-click option copied a link for the entire page, not a specific part

Stardown looks for an HTML element ID where you right-clicked, but some parts of websites don't have any IDs. If there is no HTML element ID where you right-click and you don't select text before right-clicking, the link Stardown creates will be for the entire page, not for the part of the page where you right-clicked. Most websites assign an ID to each section title.

It's also not possible to link to text within [HTML iframes](https://www.w3schools.com/html/html_iframe.asp) because text fragments don't support iframes.

Lastly, a small number of sites allow creating text fragment links but don't allow using them.

## Something else is wrong

If reinstalling Stardown doesn't fix it and [the issues page](https://github.com/Stardown-app/Stardown/issues?q=is%3Aissue) doesn't have an issue for it yet, please make a new issue.
