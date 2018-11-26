var mongoose = require("mongoose");
var User = mongoose.model("User");
var fs = require("fs");
var config = require("../config");
var nodemailer = require("nodemailer");

exports.savePat = function(_pat, _uid, _res) {
  console.log("====> 2");
  _pat.user = _uid;
  _pat.save(function(err, savedPat) {
    if (err) {
      return next(err);
    }
    _res.json(savedPat);
  });
};

exports.saveUser = function(_pat, _callback) {
  var nums = new Date().getTime().toString();
  var pass = Math.floor(Math.random() * 99999 + 10000);

  var _user = new User();
  _user.username = _pat.eMail.toLowerCase();
  _user.setPassword(pass.toString());
  _user.eMail = _pat.eMail.toLowerCase();
  _user.phoneNumber = _pat.phoneNumber;
  _user.eMailConfirmed = false;
  _user.phoneNumberConfirmed = false;

  _user.save(_callback);

  fs.readFile(config.root + "/mail.md", "utf8", function(err, data) {
    if (!err) {
      var htmlTemplate = data;
      var transporter = nodemailer.createTransport(config.smtpConfig);
      // setup e-mail data with unicode symbols
      var mailOptions = {
        from:
          '"Laboratorio Clínico Eduardo Fernández" <' +
          config.smtpConfig.auth.user +
          ">",
        to: _user.eMail,
        subject: "Contraseña para resultados en línea",
        html: htmlTemplate
          .replace("{{title}}", "Contraseña para resultados en línea")
          .replace(
            "{{msg}}",
            "Gracias por usar nuestro servicio de resultados en línea. Puede ingresar desde nuestra página (Opción 'Resultados en línea') o desde nuestra aplicación móvil con su correo '" +
              _user.eMail +
              "' y la siguiente contraseña"
          )
          .replace("{{user}}", "")
          .replace("{{data}}", pass.toString())
      };

      transporter.sendMail(mailOptions, function(error, info) {});
    }
  });
};
