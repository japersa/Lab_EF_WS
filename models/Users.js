var mongoose = require("mongoose");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
var config = require("../config");

var UserSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true },
  eMail: { type: String, unique: true },
  phoneNumber: Number,
  eMailConfirmed: Boolean,
  phoneNumberConfirmed: Boolean,
  hash: String,
  salt: String
});

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha1")
    .toString("hex");
};
UserSchema.methods.validPassword = function(password) {
  var hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, "sha1")
    .toString("hex");
  return this.hash === hash;
};
UserSchema.methods.getLoginData = function() {
  var result = {};
  result.token = this.generateJWT();
  result.user = {
    username: this.username,
    id: this._id
  };
  return result;
};
UserSchema.methods.getPasswordPin = function() {
  var _salt = this.salt;
  var start = _salt.length - 5;
  var rawPin = _salt.substring(start);
  var pin = rawPin.toUpperCase();
  return pin;
};

UserSchema.methods.generateJWT = function() {
  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      exp: parseInt(exp.getTime() / 1000)
    },
    config.secret
  );
};
mongoose.model("User", UserSchema);
