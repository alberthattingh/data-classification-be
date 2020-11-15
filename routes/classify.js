var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');

// Set configurations for storing uploaded files with multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname)
    }
});

// Set filter to only accept certain file types for upload
const fileFilter = (req, file, cb) => {
    if (file.mimeType === "text/plain" ||
        file.mimeType === "text/csv" ||
        file.mimeType === "application/json" ||
        file.mimeType === "application/vnd.ms-excel" ||
        file.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        // accept these files -- save and classify
        cb(null, true); // continue with the file without throwing an error
    }
    else {
        cb(null, false); // dont continue with the file, but dont throw error either
    }
};

const upload = multer({storage: storage, fileFilter: fileFilter});

/* Middleware -- runs before request is handled -- to authenticate access token */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // console.log(err);
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
}


router.post('/', authenticateToken, upload.single('dataFile'), (req, res) => {
    const username = req.user.username;
    const file = req.file;
    console.log(file);

    res.json({username: req.user.username, data: 'Some data'});
});

module.exports = router;