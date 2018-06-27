var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');
var passport = require('passport');

//Data access
var mongoose = require('mongoose');
require('./models/Patients');
require('./models/Users');
require('./config/passport');
mongoose.connect(config.database);

var account = require('./routes/account');
var users = require('./routes/users');
var patients = require('./routes/patients');
var results = require('./routes/results');


var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    next();
}

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(allowCrossDomain);
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.set('view engine', 'html');
app.use('/account', account);
app.use('/patients', patients);
app.use('/results', results);
app.use('/users', users);

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

module.exports = app;
