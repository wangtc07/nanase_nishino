function CommentSanitize(form){
    form.text.value = del4Byte( form.text.value);
    form.author.value = del4Byte( form.author.value);
    form.url.value = del4Byte( form.url.value);
}
function del4Byte(text) {
    var ranges = [
        '[\uD800-\uDBFF][\uDC00-\uDFFF]'
    ];
    return text.replace(new RegExp(ranges.join('|'), 'g'), ' ');
}

