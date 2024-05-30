const pageMenuItem = {
    id: 'page',
    title: 'Copy markdown link to here',
    contexts: ['page', 'editable'],
};

const selectionMenuItem = {
    id: 'selection',
    title: 'Copy markdown of selection',
    contexts: ['selection'],
};

const linkMenuItem = {
    id: 'link',
    title: 'Copy markdown of link',
    contexts: ['link'],
};

const imageMenuItem = {
    id: 'image',
    title: 'Copy markdown of image',
    contexts: ['image'],
};

const videoMenuItem = {
    id: 'video',
    title: 'Copy markdown of video',
    contexts: ['video'],
};

const audioMenuItem = {
    id: 'audio',
    title: 'Copy markdown of audio',
    contexts: ['audio'],
};

export {
    pageMenuItem as page_item,
    selectionMenuItem as selection_item,
    linkMenuItem as link_item,
    imageMenuItem as image_item,
    videoMenuItem as video_item,
    audioMenuItem as audio_item
}