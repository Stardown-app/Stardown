# Troubleshooting

## The right-click option copied a link for the entire page, not a specific part

Stardown looks for an HTML element ID where you right-clicked, but some parts of websites don't have any IDs. If there is no HTML element ID where you right-click and you don't select text before right-clicking, the link Stardown creates will be for the entire page, not for the part of the page where you right-clicked. Most websites assign an ID to each section title.

It's also not possible to link to text within [HTML iframes](https://www.w3schools.com/html/html_iframe.asp) because text fragments don't support iframes.

Lastly, a small number of sites allow creating text fragment links but don't allow using them.

## The right-click options disappeared

Due to browser limitations, Stardown's context menu options cannot appear for certain kinds of links, images, and videos. Specifically, they cannot appear for canvases, background images, inline SVGs, HTML anchors that contain both text and image(s), videos that don't have a `<video>` HTML element, and videos with a `<video>` HTML element that's covered by other elements.

Besides those possibilities, browsers have an occasionally reoccuring bug that makes the context menu options disappear. Reinstalling Stardown should fix this.

## Something else is wrong

If reinstalling Stardown doesn't fix it and [the issues page](https://github.com/Stardown-app/Stardown/issues?q=is%3Aissue) doesn't have an issue for it yet, please make a new issue.
