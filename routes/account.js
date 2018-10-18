var express = require("express");
var router = express.Router();
var config = require("../config");
var jwt = require("express-jwt");
var auth = jwt({ secret: config.secret, userProperty: config.userProperty });
var ctrlAccount = require("../controllers/account");

router.post("/register", ctrlAccount.register);
router.post("/ResetPassword", ctrlAccount.ResetPassword);
router.post("/ResetPasswordRandom", ctrlAccount.ResetPasswordRandom);
router.post("/ChangePassword", auth, ctrlAccount.ChangePassword);
router.post("/PasswordPin", ctrlAccount.PasswordPin);
router.post("/login", ctrlAccount.login);
router.get("/login/refresh", auth, ctrlAccount.refresh);

module.exports = router;
