var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

/* Middleware -- runs before request is handled -- to authenticate access token */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err);
        if (err)
            return res.sendStatus(403);
        req.user = user;
        next();
    });
}

/* GET home page. */
router.get('/', authenticateToken, (req, res) => {
    res.json({username: req.user.username, data: 'Some data'});
});

module.exports = router;