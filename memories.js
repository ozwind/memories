let index = 0;
var images;
var intervalId;
var $video;
const mcStore = 'memoriesCollection';
var map;

function init() {
    $video = $('#video');

    $("#startShow").on("click", startShow);
    $("#full").on("click", full);
    $("#randomize").on("click", randomize);
    $("#previous").on("click", previous);
    $("#next").on("click", next);
    $("#reload").on("click", reload);
    $(window).resize(resize);


    $('#cbThumbs').change(function () {
        showThumbs();
    });

    var $collection = $('#collection');
    let memCol = localStorage.getItem(mcStore);
    memCol = setImages(memCol);

    $collection.val(memCol);
    setTooltip($collection);

    $('#image').on('click', function () {
        full();
    });

    document.addEventListener("fullscreenchange", function () {
        if (!document.fullscreenElement) { // full screen exit
            var $full = getFullScreenElem();
            $full.removeAttr("src"); // stop showing full screen image
            stopShow();
            showImage();
        }
    });

    $(document).keydown(function (event) {
        if (document.activeElement === $('#collection')[0]) {
            return;
        }

        if (event.which == 37) {
            previous();
        } else if (event.which == 39) {
            next();
        }
    });

    $collection.change(function (event) {
        var val = event.target.value;
        setImages(val);
        setTooltip($collection);
        localStorage.setItem(mcStore, val);
        index = 0;
        $("#thumbs").empty();
        showImage();
        preload();
    });

    // stop the slideshow interval when a key is pressed
    $(document).on('keydown', function (event) {
        stopShow();
    });

    $('#info').click(function() {
        if (images[index].site) {
            window.open(images[index].site, '_blank');
        }
    });

    showImage();
    preload();
}

function setImages(col) {
    if ('family' === col) {
        images = family;
    } else if ('scenic' === col) {
        images = scenic;
    } else if ('legacy' === col) {
        images = legacy;
    } else if ('camcorder' === col) {
        images = camcorder;
    } else {
        images = family;
        col = 'family';
    }
    return col;
}

function setTooltip($collection) {
    var val = $collection.val();
    var query = "option[value='" + val + "']";
    var tooltip = $collection.find(query)[0].title;
    $collection[0].title = tooltip;
}

function preload() {
    map = new Map();

    setTimeout(function() {
        showThumbs();
        for (var idx in images) {
            map.set(images[idx].image, idx);
        }
    }, 30);
}

function reload() {
    location.reload();
}

function resize() {
    calcVideo();
    setImageSize();
    showThumbs();
}

function setImageSize() {
    if (!document.fullscreenElement) {
        const borderX = 5;
        const borderY = 50;
        var $image = $('#image');
        var offset = $image.offset();
        var imgWidth = $image[0].naturalWidth;
        var imgHeight = $image[0].naturalHeight;
        var winWidth = $(window).width() - borderX;
        var winHeight = $(window).height() - borderY;
        var deltaX = winWidth - offset.left - imgWidth;
        var deltaY = winHeight - offset.top - imgHeight;
        var width, height;

        if (deltaX < 0 || deltaY < 0) {
            if (deltaX < deltaY) {
                var scale = (winWidth - offset.left - borderX) / imgWidth;
                width = scale * imgWidth;
                height = scale * imgHeight;
            } else {
                var scale = (winHeight - offset.top - borderY) / imgHeight;
                width = scale * imgWidth;
                height = scale * imgHeight;
            }
        } else {
            var scale = (winWidth - offset.left - borderX) / imgWidth;
            width = scale * imgWidth;
            height = scale * imgHeight;
            if (height > (winHeight - offset.top - borderY)) {
                scale = (winHeight - offset.top - borderY) / imgHeight;
                width = scale * imgWidth;
                height = scale * imgHeight;
            }
        }

        $image.css('width', width + 'px');
        $image.css('height', height + 'px');
    }
}

// Calculate video size
function calcVideo() {
    const $iframe = $('#video iframe');
    const winWidth = $(window).width();
    const winHeight = $(window).height();
    const lsWidth = $('#leftSide').width();
    const rsWidth = winWidth - lsWidth;

    if (images[index].smugmug) {
        const txt = images[index].smugmug;
        const idxWidth = txt.indexOf('?width');
        const parms = new URLSearchParams(txt.substr(idxWidth));
        const urlWidth = Number(parms.get('width'));
        const urlHeight = Number(parms.get('height'));
        const scale = rsWidth < urlWidth ? rsWidth / urlWidth : 1;
        const width = Math.floor(urlWidth * scale);
        const height = Math.floor(urlHeight * scale);
        parms.set('width', width);
        parms.set('height', height);
        const url = "https://api.smugmug.com/services/embed/"
            + txt.substr(0, idxWidth) + "?" + parms.toLocaleString();
        const src = $iframe.attr('src');
        $iframe.attr('src', url);
        $iframe.width(width);
        $iframe.height(height);

        return {width,height,url};
    }
    else if (images[index].youtube) {
        const width = rsWidth;
        const height = rsWidth * 9 / 16;
        const url = "https://www.youtube.com/embed/" + images[index].youtube + "?autoplay=1&rel=0";
        $iframe.width(width);
        $iframe.height(height);
        return {width,height,url};
    }
}

function showImage() {
    var $full = getFullScreenElem();
    var elem = $full.attr('src') ? $full : $("#image");

    $("*").blur(); // remove keyboard focus
    document.title = $("#collection option:selected").text();

    $("#info").text("");
    $video.empty();

    if (!document.fullscreenElement && images[index].smugmug) {
        elem.hide();
        showCaptionText();
        showPlayer();
    }
    else if (!document.fullscreenElement && images[index].youtube) {
        elem.hide();
        showCaptionText();
        showPlayer();
    }
    else {
        elem.show();
        elem.attr("src", images[index].image).on('load', function (evt) {
            setImageSize();
            showCaptionText();
        });
    }

    selectThumb(true);
}

function selectThumb(select) {
    const $thumb = $($('#thumbs img')[index]);
    if (select) {
        $thumb.addClass('selected');
    }
    else {
        $thumb.removeClass('selected');
    }
}

function showPlayer() {
    const video = calcVideo();

    var player = $('<iframe>', {
        'src': video.url,
        'width': video.width,
        'height': video.height,
        'frameborder': '0',
        'allowfullscreen': 'true',
        'scrolling': 'no'
    });

    $video.append(player);
}

function showCaptionText() {
    const $info = $("#info");
    $info.text((index + 1) + "/" + images.length + ") " + images[index].info);
    if (images[index].site) {
        $info.addClass("clickable");
    }
    else {
        $info.removeClass("clickable");
    }
}

function previous() {
    selectThumb(false);
    index = index > 0 ? --index : images.length - 1;
    showImage();
}

function next() {
    selectThumb(false);
    index = index < (images.length - 1) ? ++index : 0;
    showImage();
}

function full() {
    var $full = getFullScreenElem();
    $full.attr("src", images[index].image);
    $full[0].requestFullscreen();
}

function getFullScreenElem() {
    return $("#fullScreen");
}

function startShow() {
    full();
    intervalId = setInterval(next, 5000);
}

function stopShow() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
    }
}

function randomize() {
    for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [images[i], images[j]] = [images[j], images[i]];
        map.set(images[i].image, i);
        map.set(images[j].image, j);
    }

    index = 0;
    showImage();
    showThumbs();
}

function showThumbs() {
    const $thumbs = $("#thumbs");
    $thumbs.empty();

    if (!$("#cbThumbs").is(':checked')) {
        return;
    }

    for (var i = 0; i < images.length; i++) {
        var $thumb = $("<img class='thumb'>");
        $thumb.attr("src", images[i].image);
        $thumb.attr('title', images[i].info);
        $thumb.on('click', function (evt) {
            selectThumb(false);
            index = Number(map.get($(evt.target).attr('src')));
            $('html, body').animate({ scrollTop: 0 }, 'slow');
            showImage();
        });
        $thumbs.append($thumb);
    }

    selectThumb(true);
}
