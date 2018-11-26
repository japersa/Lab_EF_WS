var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var passport = require("passport");
var Patient = mongoose.model("Patient");
var User = mongoose.model("User");
var fs = require("fs");
var jwt = require("express-jwt");
var nodemailer = require("nodemailer");
var config = require("../config");
var assert = require("assert");
var ctrlPatien = require("../controllers/patients");
var auth = jwt({ secret: config.secret, userProperty: config.userProperty });

/* Patients */
router.get("/", auth, ctrlPatien.getAll);
router.post("/", ctrlPatien.post);
router.param("patient", ctrlPatien.patient);
router.get("/:patient", auth, ctrlPatien.patientId);

module.exports = router;
