var mp3FileName = "";
var pdfFileName = "";
var mp3SrcURL = 'http://localhost:1337/uploads/mp3/';
var pdfSrcURL = 'http://localhost:1337/uploads/pdf/';

const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
    currPage = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5,
    pdfPages = [],
    canvas = document.getElementById('pdfViewer'),
    mp3Audio = document.getElementById('mp3Recording'),
    ctx = canvas.getContext('2d'),
    playbackData = [],
    currentPageInfo = [],
    mouseOverBar = false;
    rectDrawn = false;

function disableButton(id) {
    $(id).css('cursor', 'not-allowed');
    $(id).css('pointer-events', 'none');
    $(id).css('opacity', '0.6');
}

function enableButton(id) {
    $(id).css('cursor', 'pointer');
    $(id).css('pointer-events', 'auto');
    $(id).css('opacity', '1');
}

function checkButtonPrevEnable() {
    if (currPage === 1) {
        disableButton('#btnPrev');
    }
    else {
        enableButton('#btnPrev');
    }
}

function checkButtonNextEnable() {
    if (pdfDoc !== null && currPage === pdfDoc.numPages) {
        disableButton('#btnNext');
    }
    else {
        enableButton('#btnNext');
    }
}

function checkMouseRect(currentX, currentY) {

    if (pageRendering === false) {
        for (var i = 0; i < currentPageInfo.length; i++) {

            startX = currentPageInfo[i].rectStartX;
            startY = currentPageInfo[i].rectStartY;
            endX = currentPageInfo[i].rectStartX + currentPageInfo[i].rectW;
            endY = currentPageInfo[i].rectStartY + currentPageInfo[i].rectH;

            if (startX <= currentX && startY <= currentY && endX >= currentX && endY >= currentY) {
                return currentPageInfo[i];
            }
        }
    }

    return false;
}

function getPageInfo(pageNum) {
    currentPageInfo = [];

    currentPageInfo = playbackData.filter(function (element) {
        return element.pageNum === pageNum;
    });
    currentPageInfo.sort((a, b) => a.startTime - b.startTime);
    console.log(currentPageInfo);
}

function mouseMove(e) {
    if (rectDrawn === true && pageRendering === false) {
        ctx.putImageData(pdfPages[currPage], 0, 0);
    }
    currX = e.pageX - this.offsetLeft;
    currY = e.pageY - this.offsetTop;

    ctx.fillStyle = 'rgba(255, 0, 0, .2)';
    var drawRect = checkMouseRect(currX, currY);

    if (drawRect === false) {
        mouseOverBar = false;
    }
    else {
        ctx.fillRect(drawRect.rectStartX, drawRect.rectStartY, drawRect.rectW, drawRect.rectH);
        mouseOverBar = true;
        rectDrawn = true;
    }
}

function click(e) {
    currX = e.pageX - this.offsetLeft;
    currY = e.pageY - this.offsetTop;

    if (pageRendering === false) {
        var timeFind = checkMouseRect(currX, currY);

        if (timeFind !== false) {
            mp3Audio.currentTime = timeFind.startTime;
            mp3Audio.play();
        }
    }

}

function checkTimestamp(element) {
    if (mp3Audio.currentTime >= element.startTime && mp3Audio.currentTime <= element.endTime) {
        if (element.pageNum !== currPage) {
            currPage = element.pageNum;
            queueRenderPage(currPage);
            checkButtonPrevEnable();
            checkButtonNextEnable();
        }

        if (pageRendering === false) {
            ctx.putImageData(pdfPages[currPage], 0, 0);
            ctx.fillStyle = 'rgba(255, 0, 0, .2)';
            ctx.fillRect(element.rectStartX, element.rectStartY, element.rectW, element.rectH);
            rectDrawn = false;
        }
    }

}

function updateTime(e) {
    if (mouseOverBar === false) {
        for (var i = 0; i < playbackData.length; i++) {
            checkTimestamp(playbackData[i]);
        }
    }
}

function init() {
    document.getElementById('btnPrev').addEventListener('click', onPrevPage);
    document.getElementById('btnNext').addEventListener('click', onNextPage);
    document.getElementById('btnHome').addEventListener('click', goHome);

    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('click', click, false);
    mp3Audio.addEventListener('timeupdate', updateTime, false);
}

function renderPage(num) {
    pageRendering = true;
    getPageInfo(num);

    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        var viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function () {
            pageRendering = false;

            pdfPages[num] = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Update page counters
    document.getElementById('pageNum').textContent = num;
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
    if (currPage <= 1) {
        return;
    }
    currPage--;
    rectDrawn = false;
    mouseOverBar = false;
    queueRenderPage(currPage);
    checkButtonPrevEnable();
    checkButtonNextEnable();
}

/**
 * Displays next page.
 */
function onNextPage() {
    if (currPage >= pdfDoc.numPages) {
        return;
    }
    currPage++;
    rectDrawn = false;
    mouseOverBar = false;
    queueRenderPage(currPage);
    checkButtonPrevEnable();
    checkButtonNextEnable();
}

function goHome() {
    window.location.replace('http://localhost:1337/filesDrop');
}

init();

$(document).ready(function () {

    $.getJSON('http://localhost:1337/submitFileData.json', function (data) {
        console.log(data);

        mp3FileName = data.mp3FileName;
        pdfFileName = data.pdfFileName;

        var mp3Src = mp3SrcURL.concat(mp3FileName);
        var pdfSrc = pdfSrcURL.concat(pdfFileName);

        mp3Audio.src = mp3Src;

        pdfjsLib.getDocument(pdfSrc).promise.then(function (pdfDoc_) {
            pdfDoc = pdfDoc_;
            document.getElementById('pageCount').textContent = pdfDoc.numPages;
            if (pdfDoc.numPages === 1) {
                disableButton('#btnPrev');
                disableButton('#btnNext');
            }
            // Initial/first page rendering
            renderPage(currPage);
        });


    });

    $.getJSON('http://localhost:1337/timePageData.json', function (data) {
        playbackData = data;
        console.log('Time Page Data');
        console.log(playbackData);
    });

    checkButtonPrevEnable();
    checkButtonNextEnable();
});