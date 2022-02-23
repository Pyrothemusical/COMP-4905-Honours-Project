const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const router = express.Router();
const port = process.env.PORT || 8080;
const publicPath = __dirname;

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

router.post('/uploadFiles', uploadMultiples, function (req, res, next) {
    if (req.files) {
        console.log(req.files);

        console.log("Files uploaded");
    }

});

app.use('/', router);
app.use(express.static(publicPath));

app.listen(port);
console.log('Server started at http://localhost:' + port);