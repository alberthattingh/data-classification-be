var express = require('express');
var router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const readExcel = require('read-excel-file/node');
const Field = require('../models/field');

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
    if (file.mimetype === "text/plain" ||
        file.mimetype === "text/csv" ||
        // file.mimetype === "application/json" ||
        file.mimetype === "application/vnd.ms-excel" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
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

// Function to read and parse an excel file into an array of fields
async function readExcelFileIntoRows(file) {
    return readExcel(file.path).then((rows) => {
        const newRows = [];
        for (let row of rows) {
            const columns = [];
            for (let i = 0; i < row.length; i++) {
                const field = new Field(i, row[i]);
                columns.push(field);
            }
            newRows.push(columns);
        }
        // console.table(newRows);
        return newRows;
    });
}

// Function to read and parse a text file into an array of fields
async function readTextFileIntoRowsOfFields(file, sep) {
    const fileAsString = fs.readFileSync(file.path).toString();
    const lines = fileAsString.split('\n');

    const rows = [];
    for (let line of lines) {
        const divs = line.split(sep);
        const columns = [];
        for (let i = 0; i < divs.length; i++) {
            const field = new Field(i, divs[i]);
            columns.push(field);
        }
        rows.push(columns);
    }
    // console.table(rows);
    return rows;
}

// Function that classifies the data in the file
async function classify(file) {
    if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith(".xls")) {
        const rowsOfFields = await readExcelFileIntoRows(file);
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.txt')) {
        const rowsOfFields = await readTextFileIntoRowsOfFields(file, '|');
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.csv')) {
        const rowsOfFields = await readTextFileIntoRowsOfFields(file, ',');
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.json')) {
        // Not supported at the moment -- add support at later stage
        return [];
    }
    else {
        // This is not supposed to ever be run
        // Files are filtered to allow only the above types
        // throw new Error('Unsupported file type');
        return [];
    }
}


/* The actual endpoint -- handles POST request to classify data in a file */
router.post('/', authenticateToken, upload.single('dataFile'), (req, res) => {
    const username = req.user.username;
    const file = req.file;
    // console.log(file);

    classify(file).then((classifiedData) => {
        if (classifiedData.length > 0) {
            res.json({username: req.user.username, data: classifiedData});
        }
        else {
            res.json({username: req.user.username, data: classifiedData});
        }
    });
});

module.exports = router;