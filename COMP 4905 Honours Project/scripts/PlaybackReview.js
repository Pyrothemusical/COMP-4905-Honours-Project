/* * * * * * * * * * *
 *
 * Student Name: Alex Gan
 * Student Number: 101071670
 * JS File Description: JS script for Review Timestamps Page
 * - Allows user to review music playthrough and document highlights based on submitted information
 * - Coordinates PDF viewer and MP3 player to match document highlgihts and audio player current timestamp together
 * - Handles user's mouse and click movements by highighting specified document areas accordingly
 * 
 * * * * * * * * * * */

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
    mouseOverBar = false,
    userRectDrawn = false,
    manualPageChange = false;

/* * * * * *
 *
 * HTML Button Helper Functions
 * - Verifies if specified button state should be enabled or disabled
 *
 * * * * * */

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

/* * * * * *
 *
 * HTML Home Button Event Handler Function
 *
 * * * * * */

function goHome() {
    window.location.replace('http://localhost:1337/filesDrop');
}

/* * * * * *
 *
 * Get Current Page Info Function
 * - Retrieves all timestamp and page information with page number matching current page number in PDF viewer
 *
 * * * * * */

function getPageInfo(pageNum) {
    currentPageInfo = [];

    currentPageInfo = playbackData.filter(function (element) {
        return element.pageNum === pageNum;
    });
    currentPageInfo.sort((a, b) => a.startTime - b.startTime);
    console.log(currentPageInfo);
}

/* * * * * *
 *
 * Mouse Event Handler Functions
 * - Highlights rectangle area based on current mouse's position and page information submitted by user
 * - Directs MP3 player to jump to available associated timestamp based on where user clicked on the document page
 * - Checks if mouse's current x and y click location is within any highlight rectangle area information present on current document page
 *
 * * * * * */

function mouseMove(e) {
    if (userRectDrawn === true && pageRendering === false) {
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
        userRectDrawn = true;
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


/* * * * * *
 *
 * UpdateTime Event Handler Function for MP3 Player
 * - Checks if current time on MP3 player relates to any highlighted area 
 * on current document page based on user-submitted information
 *
 * * * * * */

function updateTime(e) {
    if (mouseOverBar === false && manualPageChange == false) {
        for (var i = 0; i < playbackData.length; i++) {
            checkTimestamp(playbackData[i]);
        }
    }
    manualPageChange = false;
}

/* * * * * *
 *
 * Check Timestamp Function
 * - Highlights document area if input timestamp information is within range of MP3 player current timestamp
 * - If current document page does not match with input timestamp information, application renders required page
 * - Afterwards, highlights document area associated with Mp3 player current timestamp
 *
 * * * * * */

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
            userRectDrawn = false;
        }
    }

}

/* * * * * *
 *
 * Init function initializes all button and mouse event handler listeners
 *
 * * * * * */

function init() {
    document.getElementById('btnPrev').addEventListener('click', onPrevPage);
    document.getElementById('btnNext').addEventListener('click', onNextPage);
    document.getElementById('btnHome').addEventListener('click', goHome);

    canvas.addEventListener('mousemove', mouseMove, false);
    canvas.addEventListener('click', click, false);
    mp3Audio.addEventListener('timeupdate', updateTime, false);
    mp3Audio.addEventListener('play', updateTime, false);
}

/* * * * * *
 *
 * PDF.js Main Helper Functions
 * - Renders page specified by page number
 * - Handles previous and next page event handlers
 * - JS Code from: https://mozilla.github.io/pdf.js/examples/
 *
 * * * * * */

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
    manualPageChange = true;
    mp3Audio.pause();

    if (currPage <= 1) {
        return;
    }
    currPage--;
    userRectDrawn = false;
    mouseOverBar = false;
    queueRenderPage(currPage);
    checkButtonPrevEnable();
    checkButtonNextEnable();
}

/**
 * Displays next page.
 */
function onNextPage() {
    manualPageChange = true;
    mp3Audio.pause();

    if (currPage >= pdfDoc.numPages) {
        return;
    }
    currPage++;
    userRectDrawn = false;
    mouseOverBar = false;
    queueRenderPage(currPage);
    checkButtonPrevEnable();
    checkButtonNextEnable();
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
        /* * *
        * Asynchronously downloads PDF.
        * * */
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