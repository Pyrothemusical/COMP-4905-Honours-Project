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

function findDupTime() {
    for (var i = 0; i < timeStampResults.length; i++) {
        if (timeStampResults[i].time === currTime) {
            return i;
        }
    }
    return -1;
}

function retrieveTimePage() {
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
    console.log(timeStampResults);
}

function mouseDown(e) {
    rect.startX = e.pageX - this.offsetLeft;
    rect.startY = e.pageY - this.offsetTop;
    currTime = mp3Audio.currentTime;
    drag = true;
}

function mouseUp() {
    drag = false;
    if (verifyEmptyRect() === false) {
        retrieveTimePage();
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

function draw() {
    ctx.setLineDash([6]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff0000';
    ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
}

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
            //ctx.fillStyle = 'rgba(255,0,0,.2)';
            //ctx.fillRect(200, 200, 100, 100);

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

function undoAction() {
    timeStampResults.pop();
    ctx.putImageData(pdfPages[currPage], 0, 0);
    console.log(timeStampResults);

    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
}

function clearAll() {
    timeStampResults = [];
    ctx.putImageData(pdfPages[currPage], 0, 0);
    console.log(timeStampResults);

    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
}

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
    console.log(timeJSONData);
    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.open("POST", "/sendTimeInfo");
    xmlHTTP.setRequestHeader("Content-Type", "application/json");
    xmlHTTP.send(timeJSONData);

    window.location.replace('http://localhost:1337/reviewPlayback');
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

    checkButtonPrevEnable();
    checkButtonNextEnable();
    checkButtonUndoEnable();
    checkButtonClearEnable();
    checkButtonSubmitEnable();
});