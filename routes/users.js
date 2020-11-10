const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const {MongoClient} = require('mongodb');

let mongoUser, mongoPass, mongoDatabase, connectionString;
function setConfigValues() {
  let json;
  try {
    json = require('../secret/mongo.json');
  }
  catch {
    json = null;
  }

  mongoUser = process.env.MONGO_USER || json.user;
  mongoPass = process.env.MONGO_PASS || json.password;
  mongoDatabase = process.env.MONGO_DB || json.database;

  connectionString = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.a009p.mongodb.net/${mongoDatabase}?retryWrites=true&w=majority`;
}

async function createNewUser(user) {
  setConfigValues();
  const client = new MongoClient(connectionString);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    const result = await client.db(mongoDatabase).collection('user').insertOne(user);
    // console.log("Users:");
    // console.log(result);

    return result;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    await client.close();
  }
}

async function getUserByUsername(username) {
  setConfigValues();
  const client = new MongoClient(connectionString);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Make the appropriate DB calls
    const result = await client.db(mongoDatabase).collection('user').findOne({username: username});
    // console.log("Users:");
    // console.log(result);

    return result;
  }
  catch (e) {
    console.error(e);
  }
  finally {
    await client.close();
  }
}

/* POST new user */
router.post('/', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { username: req.body.username, password: hashedPassword };

    createNewUser(user).then((result) => {
      res.status(201).send("User created successfully.");
    });

  }
  catch {
    res.status(500).send();
  }
});

router.post('/login', async (req, res) => {
  getUserByUsername(req.body.username).then(async (result) => {
    if (result == null || result.length < 1) {
      res.status(404).send("User not found.");
    }
    else {
      try {
          if(await bcrypt.compare(req.body.password, result.password)) {
            res.send('Login successful');
          } else {
            res.status(404).send('Not Allowed');
          }
        }
        catch {
          res.status(500).send();
        }
    }
  });
});

module.exports = router;
