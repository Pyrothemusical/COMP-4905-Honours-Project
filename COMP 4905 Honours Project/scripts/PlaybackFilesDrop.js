var pdfFilePresent = false;
var mp3FilePresent = false;

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

function checkButtonEnable() {
    if (pdfFilePresent === true && mp3FilePresent === true) {
        console.log('Submit Button Enabled.');
        enableButton('#btnSubmit');
    }
    else {
        console.log('Submit Button Disabled.');
        disableButton('#btnSubmit');
    }
}

$('#pdfFile').change(function (e) {
    var fileName = e.target.files[0].name;
    console.log(e.target.files[0]);
    $('#pdfFileName').html(fileName);

    if (e.target.files[0].type === "application/pdf") {
        pdfFilePresent = true;
    }
    else {
        pdfFilePresent = false;
        $('#pdfFileName').html("PLEASE SUBMIT A PDF FILE.");
    }
    checkButtonEnable();
});

$('#mp3File').change(function (e) {
    var fileName = e.target.files[0].name;
    console.log(e.target.files[0]);
    $('#mp3FileName').html(fileName);

    if (e.target.files[0].type === "audio/mpeg") {
        mp3FilePresent = true;
    }
    else {
        mp3FilePresent = false;
        $('#mp3FileName').html("PLEASE SUBMIT A MP3 FILE.");
    }
    checkButtonEnable();
});

$(document).ready(function () {
    disableButton('#btnSubmit');
});