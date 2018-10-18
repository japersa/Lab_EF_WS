var mongoose = require("mongoose");
var passport = require("passport");
var User = mongoose.model("User");
var nodemailer = require("nodemailer");
var config = require("../config");
var fs = require("fs");

/**
 *
 * Nota, verificar si también debe de grabar el campo email
 * Parametros username y password, guarda los dos y crear sesión.
 * @param {username, password} req
 * @param {UserRegister} res
 */
exports.register = function(req, res) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: "Please fill out all fields" });
  }
  var user = new User();
  user.username = req.body.username;
  user.eMail = req.body.username;
  user.setPassword(req.body.password);
  user.save(function(err, user) {
    if (err) {
      console.log(err);
      return res.status(404).json({ message: "Error al guardar el usuario" });
    }
    var loginData = user.getLoginData();
    return res.json(loginData);
  });
};
/**
 * Resetea el password, luego de verificar el pin y el email
 * @param {eMail, password, PIN} req
 * @param {user} res
 */
exports.ResetPassword = function(req, res) {
  var resetForm = req.body;
  if (!resetForm.eMail || !resetForm.password || !resetForm.PIN) {
    return res.status(400).json({ message: "Por favor complete los datos" });
  }
  resetForm.eMail = resetForm.eMail.toLowerCase();
  User.findOne({ eMail: resetForm.eMail }, function(err, currentUser) {
    if (err) {
      return res.status(404).json({
        message: "Ocurrio un error al realizar la consulta."
      });
    }
    if (!currentUser) {
      return res.status(400).json({
        message: "No se ha encontrado un usuario habilidato con este correo"
      });
    }
    if (currentUser.getPasswordPin() == resetForm.PIN) {
      currentUser.setPassword(resetForm.password);
      currentUser.eMailConfirmed = true;
      currentUser.save(function(err, user) {
        if (err) {
          return res.status(404).json({
            message: "Error al guardar el nuevo password."
          });
        }
        return res.json(user.getLoginData());
      });
    }
  });
};
/**
 * Valida las credenciales y las cambia según el usuario autenticado (token)
 * @param {currentPassword, newPassword} req
 * @param {userUpdate} res
 */
exports.ChangePassword = function(req, res) {
  var resetForm = req.body;

  if (!resetForm.currentPassword || !resetForm.newPassword) {
    return res.status(400).json({ message: "Please fill out all fields" });
  }
  var uid = req[config.userProperty]._id;
  User.findById(uid, function(err, currentUser) {
    if (err) {
      return res.status(404).json({ message: "Error al buscar el ID" });
    }
    if (!currentUser) {
      return res.status(400).json({ message: "No se encontró el usuario" });
    }

    if (currentUser.validPassword(resetForm.currentPassword)) {
      currentUser.setPassword(resetForm.newPassword);

      currentUser.save(function(err, user) {
        if (err) {
          return res
            .status(400)
            .json({ message: "Error al guardar el nuevo password" });
        }
        return res.json(user.getLoginData());
      });
    } else {
      return res
        .status(400)
        .json({ message: "La contraseña actual es incorrecta" });
    }
  });
};
/**
 *
 * @param {eMail || id{number,type}} req
 * @param {*} res
 */
exports.PasswordPin = function(req, res) {
  var resetForm = req.body;

  if (!resetForm.eMail && !resetForm.id) {
    return res
      .status(400)
      .json({ message: "Especifique un correo o una identificación" });
  }
  resetForm.eMail = resetForm.eMail.toLowerCase();
  // Si se le pasa el email busca por email, si no busca por los parametros pasados extras a la aplicación
  var query = resetForm.eMail
    ? { eMail: resetForm.eMail }
    : {
        $and: [
          { identificationNumber: resetForm.id.number },
          { identificationType: resetForm.id.type }
        ]
      };

  User.findOne(query, function(err, currentUser) {
    if (err) {
      return res.status(404).json({ message: "Error al buscar" });
    }
    if (!currentUser) {
      return res
        .status(404)
        .json({ message: "No se encontro ningun paciente con estos datos" });
    }
    fs.readFile(config.root + "/mail.md", "utf8", function(err, data) {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error inter" });
      }
      var htmlTemplate = data;
      var transporter = nodemailer.createTransport(config.smtpConfig);
      // setup e-mail data with unicode symbols
      var mailOptions = {
        from:
          '"Laboratorio Clínico Eduardo Fernández" <' +
          config.smtpConfig.auth.user +
          ">",
        to: currentUser.eMail,
        subject: "Pin para reestablecer contraseña",
        html: htmlTemplate
          .replace("{{title}}", "PIN para reestablecer contraseña")
          .replace(
            "{{msg}}",
            "Para reestablecer su contraseña por favor use este PIN"
          )
          .replace("{{user}}", "")
          .replace("{{data}}", currentUser.getPasswordPin())
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          return res.status(500).json({ message: "Error SMTP" });
        }
        res.json({ message: "se ha enviado un email con éxito" });
      });
    });
  });
};
/**
 *
 * @param {username, password } req
 * @param {userAutenticate} res
 */
exports.login = function(req, res, next) {
  console.log(req.body);
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ message: "Please fill out all fields" });
  }
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      return res.status(404).json({ message: "Error al autenticar" });
    }
    if (user) {
      return res.json(user.getLoginData());
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
};
/**
 * Refresca el token, revisando que éxista el usuario.
 * @param {token :id} req
 * @param {user} res
 */
exports.refresh = function(req, res) {
  var uid = req[config.userProperty]._id;
  User.findById(uid, function(error, user) {
    if (error) {
      return res.status(404).json({ message: "Error al buscar id" });
    }
    var loginData = user.getLoginData();
    return res.json(loginData);
  });
};
/**
 * Refresca el token, revisando que éxista el usuario.
 * @param {eMail || id{number,type}} req
 * @param {user} res
 */
exports.ResetPasswordRandom = function(req, res, next) {
  var resetForm = req.body;

  if (!resetForm.eMail && !resetForm.id) {
    return res
      .status(400)
      .json({ message: "Especifique un correo o una identificación" });
  }
  resetForm.eMail = resetForm.eMail.toLowerCase();
  var query = resetForm.eMail
    ? { eMail: resetForm.eMail }
    : {
        $and: [
          { identificationNumber: resetForm.id.number },
          { identificationType: resetForm.id.type }
        ]
      };

  User.findOne(query, function(err, currentUser) {
    if (err) {
      return res.status(404).json({
        message: "Error al intentar realizar la consulta en la base de datos."
      });
    }
    if (!currentUser) {
      return res
        .status(404)
        .json({ message: "No se encontro ningun paciente con estos datos" });
    }
    console.log(currentUser);
    var pass = Math.floor(Math.random() * 99999 + 10000);
    currentUser.setPassword(pass.toString());
    currentUser.save(function(err, createdUser) {
      if (err) {
        return next(err);
      }

      fs.readFile(config.root + "/mail.md", "utf8", function(err, data) {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: "Error inter" });
        }

        var htmlTemplate = data;
        var transporter = nodemailer.createTransport(config.smtpConfig);
        // setup e-mail data with unicode symbols
        var mailOptions = {
          from:
            '"Laboratorio Clínico Eduardo Fernández" <' +
            config.smtpConfig.auth.user +
            ">",
          to: currentUser.eMail,
          subject: "Recuperación de contraseña",
          html: htmlTemplate
            .replace("{{title}}", "Se acaba de reestablecer su contraseña")
            .replace("{{msg}}", "Su nueva contraseña es la siguiente:")
            .replace("{{user}}", "")
            .replace("{{data}}", pass.toString())
        };

        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
            return res
              .status(500)
              .json({ message: "Error SMTP", details: error });
          }
          res.json({ message: "se ha enviado un email con éxito" });
        });
      });
    });
  });
};
