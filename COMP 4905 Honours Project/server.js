/* * * * * * * * * * *
 *
 * Student Name: Alex Gan
 * Student Number: 101071670
 * JS File Description: Application server-side code
 * - Handles managing different routes, saving submitted files as static files, and creating JSON files for sotring information
 *
 * * * * * * * * * * */

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const app = express();
const router = express.Router();
const port = process.env.PORT || 8080;
const publicPath = __dirname;

app.use(express.json());

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var destinationPath = './uploads';
        if (file.fieldname === 'musicPDFFile') {
            destinationPath += '/pdf';
        } else if (file.fieldname === 'musicMP3File') {
            destinationPath += '/mp3';
        }
        callback(null, destinationPath);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
const upload = multer({ storage: storage });
const uploadMultiples = upload.fields([{ name: 'musicPDFFile', maxCount: 1 }, { name: 'musicMP3File', maxCount: 1 }]);

/* * * * * *
 *
 * HTTP GET Request to retrieve Home Page
 *
 * * * * * */
router.get('/', function (req, res) {
    res.sendFile(path.join(publicPath + '/index.html'));
});

/* * * * * *
 *
 * HTTP GET Request to retrieve FilesDrop Page
 *
 * * * * * */
router.get('/filesDrop', function (req, res) {
    res.sendFile(path.join(publicPath + '/filesdrop.html'));
});

/* * * * * *
 *
 * HTTP POST Request to save PDF and MP3 files as static files,
 * write filenames in submitFileData.json file, and send SetupTimestamps Page
 *
 * * * * * */
router.post('/setupFiles', uploadMultiples, function (req, res, next) {
    if (req.files) {
        var mp3File = req.files.musicMP3File[0].originalname;
        var pdfFile = req.files.musicPDFFile[0].originalname;
        var fileNames = {
            "pdfFileName": pdfFile,
            "mp3FileName": mp3File
        };
        var fileNamesData = JSON.stringify(fileNames);

        res.sendFile(path.join(publicPath + '/setupTimestamps.html'));
        fs.writeFileSync('submitFileData.json', fileNamesData, (error) => {
            if (error) {
                throw err;
            }
        })
    }
    else {
        return res.send("There was an error uploading the files.");
    }
});

/* * * * * *
 *
 * HTTP POST Request to save user-submitted timestamp and document
 * information in the timePageData.json file
 *
 * * * * * */
router.post('/sendTimeInfo', function (req, res) {
    var timePageData = JSON.stringify(req.body);
    fs.writeFileSync('timePageData.json', timePageData, (error) => {
        if (error) {
            throw err;
        }
    })
});

/* * * * * *
 *
 * HTTP GET Request to retrieve ReviewPlayback Page
 *
 * * * * * */
router.get('/reviewPlayback', function (req, res) {
    res.sendFile(path.join(publicPath + '/reviewPlayback.html'));
});


app.use('/', router);
app.use(express.static(publicPath));

app.listen(port);
console.log('Server started at http://localhost:' + port);