/* * * * * * * * * * *
 *
 * Student Name: Alex Gan
 * Student Number: 101071670
 * JS File Description: JS script for Filedrop Page
 * - Allows user to select and submit PDF and MP3 file for future application use
 *
 * * * * * * * * * * */

var pdfFilePresent = false;
var mp3FilePresent = false;

/* * * * * *
 * 
 * HTML Button Helper Functions
 * - Verifies if submit button state should be enabled or disabled 
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

function checkButtonEnable() {
    if (pdfFilePresent === true && mp3FilePresent === true) {
        enableButton('#btnSubmit');
    }
    else {
        disableButton('#btnSubmit');
    }
}

/* * * * * *
 *
 * HTML Input Change Event Handlers
 * - Checks when a user submits a pdf or mp3 file to use with application
 * - Verifies if user submitted correct file format for corresponding file input
 * - Notifies user through file html label if they submitted expected file type correctly
 *
 * * * * * */

$('#pdfFile').change(function (e) {
    if (typeof e.target.files[0] !== 'undefined') {
        var fileName = e.target.files[0].name;

        if (e.target.files[0].type === "application/pdf") {
            pdfFilePresent = true;
            $('#pdfFileName').html(fileName);
        }
        else {
            pdfFilePresent = false;
            $('#pdfFileName').html("PLEASE SUBMIT A PDF FILE.");
        }
        checkButtonEnable();
    }
    else {
        pdfFilePresent = false;
        $('#pdfFileName').html("PLEASE SUBMIT A PDF FILE.");
        checkButtonEnable();
    }

});

$('#mp3File').change(function (e) {
    if (typeof e.target.files[0] !== 'undefined') {
        var fileName = e.target.files[0].name;

        if (e.target.files[0].type === "audio/mpeg") {
            mp3FilePresent = true;
            $('#mp3FileName').html(fileName);
        }
        else {
            mp3FilePresent = false;
            $('#mp3FileName').html("PLEASE SUBMIT A MP3 FILE.");
        }
        checkButtonEnable();
    }
    else {
        mp3FilePresent = false;
        $('#mp3FileName').html("PLEASE SUBMIT A MP3 FILE.");
        checkButtonEnable();
    }
});

$(document).ready(function () {
    disableButton('#btnSubmit');
});