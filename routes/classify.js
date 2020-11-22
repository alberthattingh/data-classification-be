var express = require('express');
var router = express.Router();
const fs = require('fs');
const auth = require('../src/auth');
const multer = require('multer');
const readExcel = require('read-excel-file/node');
const Field = require('../src/field');
const {MongoClient} = require('mongodb');

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

// Method to get all records from the database meta collection
async function getAllPreviouslyClassifiedData() {
    const MONGO_USER = process.env.MONGO_USER;
    const MONGO_PASS = process.env.MONGO_PASS;
    const MONGO_DB = process.env.MONGO_DB;
    const CONNECTION_STRING = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.a009p.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority`;

    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        const result = await client.db(MONGO_DB).collection('meta').find({}).toArray();
        // console.log("Users:");
        // console.log(result);

        return result;
    }
    catch (e) {
        console.error("Error: " + e);
    }
    finally {
        await client.close();
    }
}

// Function to read and parse an excel file into an array of fields
async function readExcelFileIntoRows(file) {
    return readExcel(file.path).then((rows) => {
        const newRows = [];
        let counter = 0;
        for (let row of rows) {
            const columns = [];
            for (let i = 0; i < row.length; i++) {
                const field = new Field(counter, row[i]);
                if (field.value !== null) {
                    columns.push(field);
                }
                counter++;
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
    let counter = 0;
    for (let line of lines) {
        const divs = line.split(sep);
        const columns = [];
        for (let i = 0; i < divs.length; i++) {
            const field = new Field(counter, divs[i].trim());
            columns.push(field);
            counter++;
        }
        rows.push(columns);
    }
    // console.table(rows);
    return rows;
}

// Function that classifies the data in the file
async function parseFile(file) {
    if (file.originalname.endsWith('.xlsx')) {
        const rowsOfFields = await readExcelFileIntoRows(file);
        fs.unlinkSync(file.path);
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.txt')) {
        const rowsOfFields = await readTextFileIntoRowsOfFields(file, '|');
        fs.unlinkSync(file.path);
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.csv')) {
        const rowsOfFields = await readTextFileIntoRowsOfFields(file, ',');
        fs.unlinkSync(file.path);
        return rowsOfFields;
    }
    else if (file.originalname.endsWith('.json')) {
        // Not supported at the moment -- add support at later stage
        fs.unlinkSync(file.path);
        return [];
    }
    else {
        // This is not supposed to ever be run
        // Files are filtered to allow only the above types
        // throw new Error('Unsupported file type');
        return [];
    }
}

function classifyFields(rows) {
    // RegEx patterns
    const EMAIL = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g ;
    const ADDRESS = /^\d+\s[A-z]+\s[A-z]+/g ;
    const SA_ID = /^(((\d{2}((0[13578]|1[02])(0[1-9]|[12]\d|3[01])|(0[13456789]|1[012])(0[1-9]|[12]\d|30)|02(0[1-9]|1\d|2[0-8])))|([02468][048]|[13579][26])0229))(( |-)(\d{4})( |-)(\d{3})|(\d{7}))$/g ;
    const CELL = /^((?:\+27|27)|0)(=60|61|71|81|72|82|73|83|74|84|75|85|76|86|79)(\d{7})$/g ;
    const RACE = /^((white)|(black)|(caucasion)|(african)|(coloured)|(indian)|(asian))$/gi ;
    const SEX = /^((male)|(female)|(non-binary)|(non binary))$/gi ;
    const MARITAL = /^((single)|(married)|(divorced)|(widowed)|(separated))$/gi ;
    const LANG = /^((afr)|(afrikaans)|(zulu)|(sotho)|(english)|(eng)|(venda)|(xhosa)|(tswana)|(ndebele)|(swati)|(tsonga))$/gi ;
    const ORIENTATION = /^((straight)|(heterosexual)|(gay)|(homosexual)|(lesbian))$/gi ;

    for (let row of rows) {
        for (let field of row) {
            if (EMAIL.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Email Address");
            }
            else if (SA_ID.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("ID Number");
            }
            else if (CELL.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Cell Number");
            }
            else if (RACE.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Ethnicity");
            }
            else if (LANG.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Language");
            }
            else if (ORIENTATION.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Sexual Orientation");
            }
            else if (ADDRESS.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Street Address");
            }
            else if (MARITAL.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Marital Status");
            }
            else if (SEX.test(field.value)) {
                field.setClassificationStatus(true);
                field.setCategory("Gender");
            }
            else {
                field.setClassificationStatus(false);
            }
        }
    }

    return rows;
}


/* The actual endpoint -- handles POST request to classify data in a file */
router.post('/', auth, upload.single('dataFile'), (req, res) => {
    const username = req.user.username;
    const file = req.file;
    // console.log(file);

    parseFile(file).then((rowsOfFields) => {
        if (rowsOfFields.length > 0) {
            const classifiedData = classifyFields(rowsOfFields);

            res.json({username: req.user.username,
                filename: req.file.filename,
                data: classifiedData});
        }
        else {
            res.json({username: req.user.username, data: rowsOfFields});
        }
    });
});

/* Endpoint that handles GET requests -- gets all data from DB to display to user */
router.get('/', auth, (req, res, next) => {
    try {
        getAllPreviouslyClassifiedData().then((result) => {
            res.json(result);
        });
    }
    catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;