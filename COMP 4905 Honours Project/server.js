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

router.get('/', function (req, res) {
    res.sendFile(path.join(publicPath + '/index.html'));
});

router.get('/filesDrop', function (req, res) {
    res.sendFile(path.join(publicPath + '/filesdrop.html'));
    console.log('Files Drop Reached');
});

router.post('/setupFiles', uploadMultiples, function (req, res, next) {
    if (req.files) {
        console.log(req.files);
        console.log("Files uploaded");
        var mp3File = req.files.musicMP3File[0].originalname;
        console.log(mp3File);
        var pdfFile = req.files.musicPDFFile[0].originalname;
        console.log(pdfFile);
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
            console.log("The data successfully saved into a JSON file.");
        })
    }
    else {
        return res.send("There was an error uploading the files.");
    }
});

router.get('/getFileNames', function (req, res) {
    var submitFileData = "";
    fs.readFile('submitFileData.json', 'utf-8', (error, fileData) => {
        if (error) {
            throw error;
        }
        submitFileData = JSON.parse(fileData.toString());
    });
    console.log(submitFileData);

});

router.post('/sendTimeInfo', function (req, res) {
    var timePageData = JSON.stringify(req.body);
    console.log(timePageData);
    fs.writeFileSync('timePageData.json', timePageData, (error) => {
        if (error) {
            throw err;
        }
        console.log("The data successfully saved into a JSON file.");
    })
});

router.get('/reviewPlayback', function (req, res) {
    res.sendFile(path.join(publicPath + '/reviewPlayback.html'));
});


app.use('/', router);
app.use(express.static(publicPath));

app.listen(port);
console.log('Server started at http://localhost:' + port);