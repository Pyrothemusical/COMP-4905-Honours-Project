/* * * * * * * * * * *
 *
 * Student Name: Alex Gan
 * Student Number: 101071670
 * JS File Description: JS script for Setup Timestamps Page
 * - Allows user to collect and submit timestamp and highlighted document area page information
 * - Allows user to highlight document areas based on mouse's click and drag movements
 * - Records when user highlights specific document area based on current timestamp of MP3 player
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
    ctx = canvas.getContext('2d'),
    mp3Audio = document.getElementById('mp3Recording'),
    rect = {},
    currTime = 0,
    timeStampResults = [],
    finalTimeStampResults = [],
    drag = false;

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

function checkButtonUndoEnable() {
    if (timeStampResults.length > 0) {
        enableButton('#btnUndo');
    }
    else {
        disableButton('#btnUndo');
    }
}

function checkButtonClearEnable() {
    if (timeStampResults.length > 0) {
        enableButton('#btnClear');
    }
    else {
        disableButton('#btnClear');
    }
}

function checkButtonSubmitEnable() {
    if (timeStampResults.length === 0) {
        disableButton('#btnSubmit');
    }
    else {
        enableButton('#btnSubmit');
    }
}

/* * * * * *
 *
 * HTML Undo and Clear Button Event Handler Functions
 *
 * * * * * */

function undoAction() {
    timeStampResults.pop();
    ctx.putImageData(pdfPages[currPage], 0, 0);

    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
}

function clearAll() {
    timeStampResults = [];
    ctx.putImageData(pdfPages[currPage], 0, 0);

    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
}

/* * * * * *
 *
 * Drawing Rectangle Helper Functions
 * - Resets rectangle properties
 * - Checks if user drew an empty rectangle
 *
 * * * * * */

function resetRect() {
    rect.startX = 0;
    rect.startY = 0;
    rect.h = 0;
    rect.w = 0;
}

function verifyEmptyRect() {
    if ((rect.h === 0 && rect.w === 0) || (typeof rect.h === 'undefined' && typeof rect.w === 'undefined'))  {
        return true;
    }
    else {
        return false;
    }
}
/* * * * * *
 *
 * Storing Time and Document Page Info Helper Functions
 * - Checks if the current time with the user's highlighted document area already exists as a duplicate
 * - Stores time and document page information in an array
 * - If the specified timestamp already has a document page area information associated with it, 
 * the application replaces the timestamp with the most recent user-submitted information
 *
 * * * * * */

function findDupTime() {
    for (var i = 0; i < timeStampResults.length; i++) {
        if (timeStampResults[i].time === currTime) {
            return i;
        }
    }
    return -1;
}

function storeTimePage() {
    var timeInfo = {
        time: currTime,
        pageNum: currPage,
        rectStartX: rect.startX,
        rectStartY: rect.startY,
        rectH: rect.h,
        rectW: rect.w
    };

    if (timeStampResults.length !== 0) {
        var dupInd = findDupTime();
        if (dupInd !== -1) {
            timeStampResults[dupInd] = timeInfo;
        }
        else {
            timeStampResults.push(timeInfo);
        }
    }
    else {
        timeStampResults.push(timeInfo);
    }
}

/* * * * * *
 *
 * Mouse Event Handler Functions
 * - Draws rectangle border based on mouse's drag movements
 * - Collects mp3 file time information based on mouse left click
 * - Collects document shaded area information based on mouse left release
 *
 * * * * * */

function mouseDown(e) {
    rect.startX = e.pageX - this.offsetLeft;
    rect.startY = e.pageY - this.offsetTop;
    currTime = mp3Audio.currentTime;
    drag = true;
}

function mouseUp() {
    drag = false;
    if (verifyEmptyRect() === false) {
        storeTimePage();
    }
    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
    resetRect();
}

function mouseMove(e) {
    if (drag) {
        ctx.putImageData(pdfPages[currPage], 0, 0);
        rect.w = (e.pageX - this.offsetLeft) - rect.startX;
        rect.h = (e.pageY - this.offsetTop) - rect.startY;
        draw();
    }
}

/* * * * * *
 *
 * Main JS Draw function
 * - Allows user to draw rectangle border 
 * over specified document area with mouse movements
 *
 * * * * * */

function draw() {
    ctx.setLineDash([6]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
}

/* * * * * *
 *
 * Init function initializes all button and mouse event handler listeners
 *
 * * * * * */

function init() {
    document.getElementById('btnPrev').addEventListener('click', onPrevPage);
    document.getElementById('btnNext').addEventListener('click', onNextPage);
    document.getElementById('btnUndo').addEventListener('click', undoAction);
    document.getElementById('btnClear').addEventListener('click', clearAll);
    document.getElementById('btnSubmit').addEventListener('click', submitTimeData);

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
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
    queueRenderPage(currPage);
    checkButtonPrevEnable();
    checkButtonNextEnable();
}

/* * * * * *
 *
 * Submit Helper Function
 * - Creates JSON object from JS objects containing page and timestamp information
 * - Sorts JS objects based on rectangle highlight event starting time
 * - Creates XMLHttpRequest object to send JSON object to application server-side
 * - Directs application to Review Playback page
 *
 * * * * * */

function submitTimeData() {
    timeStampResults.sort((a, b) => a.time - b.time);

    for (var i = 0; i < timeStampResults.length; i++) {
        var timeEntry = {
            startTime: timeStampResults[i].time,
            pageNum: timeStampResults[i].pageNum,
            rectStartX: timeStampResults[i].rectStartX,
            rectStartY: timeStampResults[i].rectStartY,
            rectH: timeStampResults[i].rectH,
            rectW: timeStampResults[i].rectW
        };

        if (i === timeStampResults.length - 1) {
            timeEntry.endTime = mp3Audio.duration;
        }
        else {
            timeEntry.endTime = timeStampResults[i + 1].time;
        }

        finalTimeStampResults.push(timeEntry);
    }

    finalTimeStampResults.sort((a, b) => a.startTime - b.startTime);

    var timeJSONData = JSON.stringify(finalTimeStampResults);
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open("POST", "/sendTimeInfo");
    xmlHTTP.setRequestHeader("Content-Type", "application/json");
    xmlHTTP.send(timeJSONData);

    window.location.replace('http://localhost:1337/reviewPlayback');
}

init();

$(document).ready(function () {

    $.getJSON('http://localhost:1337/submitFileData.json', function (data) {

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

    checkButtonPrevEnable();
    checkButtonNextEnable();
    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
});