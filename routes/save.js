require('dotenv').config();

const express = require('express');
const router = express.Router();
const {MongoClient} = require('mongodb');
const auth = require('../src/auth');

const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASS = process.env.MONGO_PASS;
const MONGO_DB = process.env.MONGO_DB;
const CONNECTION_STRING = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@cluster0.a009p.mongodb.net/${MONGO_DB}?retryWrites=true&w=majority`;

function filterAndReformat(data, filename) {
    const finalData = [];

    for (let row of data) {
        const fields = [];
        for (let field of row) {
            if (field.isClassified) {
                // Remove the actual data (like names, addresses, etc.) and only leave meta-data
                // Only data about the data will remain, i.e. the type of data
                delete field.isClassified;
                delete field.value;

                field.FieldNumber = field.number;
                delete field.number;

                field.Category = field.category;
                delete field.category;

                fields.push(field);
            }
        }
        if (fields.length > 0) {
            finalData.push({uploadDate: new Date().toISOString(), file: filename, fields: fields});
        }
    }

    return finalData;
}

async function addDataEntries(data) {
    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        const result = await client.db(MONGO_DB).collection('meta').insertMany(data, {ordered: true});
        return result;
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await client.close();
    }
}

/* POST revised data to be saved in the database */
router.post('/', auth,  function(req, res, next) {
    try {
        if (Array.isArray(req.body.data)) {
            // Filter out all data entries that aren't classified as (protected) personal information and reformat
            const metaData = filterAndReformat(req.body.data, req.body.filename);

            addDataEntries(metaData).then((result) => {
                res.status(201).send(result);
            });
        }
        else {
            res.status(400).send("Invalid data");
        }
    }
    catch (e) {
        res.status(500).send("Internal server error: " + e);
    }
});

module.exports = router;