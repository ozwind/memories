let index = 0;
var images;
var intervalId;
const mcStore = 'memoriesCollection';
var map;

function init() {
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

    $collection = $('#collection');
    let memCol = localStorage.getItem(mcStore);
    if ('family' === memCol) {
        images = family;
    } else if ('scenic' === memCol) {
        images = scenic;
    } else {
        images = family;
        memCol = 'family';
    }

    $('#collection').val(memCol);

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

    $('#collection').change(function (event) {
        var val = event.target.value;
        if (val === 'scenic') {
            images = scenic;
        } else if (val === 'family') {
            images = family;
        }
        localStorage.setItem(mcStore, val);
        index = 0;
        $("#cbThumbs").prop('checked', false);
        $("#thumbs").empty();
        preload();
        showImage();
    });

    // stop the slideshow interval when a key is pressed
    $(document).on('keydown', function (event) {
        stopShow();
    });

    preload();
    showImage();
}

function preload() {
    map = new Map();

    for (var idx in images) {
        map.set(images[idx].image, idx);
        $('<img>').attr('src', images[idx].image).on('load', function (evt) {
            var idxImg = map.get(this.src);
            images[idxImg].width = evt.target.width;
            images[idxImg].height = evt.target.height;
        });
    }
}

function reload() {
    location.reload();
}

function resize() {
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

function showImage() {
    var $full = getFullScreenElem();
    var elem = $full.attr('src') ? $full : $("#image");

    $("*").blur(); // remove keyboard focus
    document.title = $("#collection option:selected").text();

    $("#info").text("");
    elem.attr("src", images[index].image).on('load', function (evt) {
        setImageSize();
        $("#info").text((index + 1) + "/" + images.length + ") " + images[index].info);
    });
}

function previous() {
    index = index > 0 ? --index : images.length - 1;
    showImage();
}

function next() {
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
    var $thumbs = $("#thumbs");
    var $row = $('<div class="row"></div>');
    var hasElems = false;
    var rowWidth = 0;
    var winWidth = $(window).width();

    $thumbs.empty();

    if (!$("#cbThumbs").is(':checked')) {
        return;
    }

    for (var i = 0; i < images.length; i++) {
        var width = 5 + Math.round(images[i].width * 100 / images[i].height);
        rowWidth += width;
        if (rowWidth > winWidth) {
            $thumbs.append($row);
            $row = $('<div class="row"></div>');
            hasElems = false;
            rowWidth = width;
        }
        var $thumb = $("<img class='thumb'>");
        loadThumb($thumb, images[i].image);
        $row.append($thumb);
        hasElems = true;
    }

    if (hasElems) {
        $thumbs.append($row);
    }
}

function loadThumb($thumb, image) {
    setTimeout(function() {
        $thumb.attr("src", image);
        $thumb.on('click', function (evt) {
            index = Number(map.get(this.src));
            $('html, body').animate({ scrollTop: 0 }, 'slow');
            showImage();
        });
    }, 20);
}
