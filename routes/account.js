var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');
var nodemailer = require('nodemailer');
var config = require('../config');
var fs = require('fs');
var jwt = require('express-jwt');
var auth = jwt({ secret: config.secret, userProperty: config.userProperty });


router.post('/register', function (req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Please fill out all fields' });
    }

    var user = new User();

    user.username = req.body.username;

    user.setPassword(req.body.password);

    user.save(function (err, user) {
        if (err) { return next(err); }

        var loginData = user.getLoginData();
        return res.json(loginData);
    });
});

router.post('/ResetPassword', function (req, res, next) {
    var resetForm = req.body;

    if (!resetForm.eMail || !resetForm.password || !resetForm.PIN) {
        return res.status(400).json({ message: 'Por favor complete los datos' });
    }
    resetForm.eMail = resetForm.eMail.toLowerCase();
    User.findOne({ username: resetForm.eMail }, function (err, currentUser) {
        if (err) { return next(err); }
        if (!currentUser) {
            return res.status(400).json({ message: 'No se ha encontrado un usuario habilidato con este correo' });
        }

        if (currentUser.getPasswordPin() == resetForm.PIN) {

            currentUser.setPassword(resetForm.password);
            currentUser.eMailConfirmed = true;
            currentUser.save(function (err, user) {
                if (err) { return next(err); }

                return res.json(user.getLoginData());
            });
        }
    });
});


router.post('/ResetPasswordRandom', function (req, res, next) {
    var resetForm = req.body;

    if (!resetForm.eMail && !resetForm.id) {
        return res.status(400).json({ message: 'Especifique un correo o una identificación' });
    }
    resetForm.eMail = resetForm.eMail.toLowerCase();
    var query = resetForm.eMail ? { eMail: resetForm.eMail } : { $and: [{ identificationNumber: resetForm.id.number }, { identificationType: resetForm.id.type }] };

    User.findOne(query, function (err, currentUser) {
        if (err) { return next(err); }
        if (!currentUser) {
            return res.status(404).json({ message: 'No se encontro ningun paciente con estos datos' });
        }

        var pass = Math.floor((Math.random() * 99999) + 10000);
        currentUser.setPassword(pass.toString());
        currentUser.save(function (err, createdUser) {
            if (err) { return next(err); }

            fs.readFile(config.root + '/mail.md', 'utf8', function (err, data) {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Error inter' });
                }

                var htmlTemplate = data;
                var transporter = nodemailer.createTransport(config.smtpConfig);
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '"Laboratorio Clínico Eduardo Fernández" <' + config.smtpConfig.auth.user + '>',
                    to: currentUser.eMail,
                    subject: 'Recuperación de contraseña',
                    html: htmlTemplate
                        .replace("{{title}}", "Se acaba de reestablecer su contraseña")
                        .replace("{{msg}}", "Su nueva contraseña es la siguiente:")
                        .replace("{{user}}", "")
                        .replace("{{data}}", pass.toString())
                };

                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);

                        return res.status(500).json({ message: 'Error SMTP', details: error });
                    }
                    res.json({});
                });
            });
        })
    });
});

router.post('/ChangePassword', auth, function (req, res, next) {
    var resetForm = req.body;

    if (!resetForm.currentPassword || !resetForm.newPassword) {
        return res.status(400).json({ message: 'Please fill out all fields' });
    }
    var uid = req[config.userProperty]._id;
    User.findById(uid, function (err, currentUser) {
        if (err) { return next(err); }
        if (!currentUser) {
            return res.status(400).json({ message: 'No se encontró el usuario' });
        }

        if (currentUser.validPassword(resetForm.currentPassword)) {

            currentUser.setPassword(resetForm.newPassword);

            currentUser.save(function (err, user) {
                if (err) { return next(err); }

                return res.json(user.getLoginData());
            });
        }
        else {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }
    });
});

router.post('/PasswordPin', function (req, res, next) {
    var resetForm = req.body;

    if (!resetForm.eMail && !resetForm.id) {
        return res.status(400).json({ message: 'Especifique un correo o una identificación' });
    }
    resetForm.eMail = resetForm.eMail.toLowerCase();
    var query = resetForm.eMail ? { eMail: resetForm.eMail } : { $and: [{ identificationNumber: resetForm.id.number }, { identificationType: resetForm.id.type }] };

    User.findOne(query, function (err, currentUser) {
        if (err) { return next(err); }
        if (!currentUser) {
            return res.status(404).json({ message: 'No se encontro ningun paciente con estos datos' });
        }
        fs.readFile(config.root + '/mail.md', 'utf8', function (err, data) {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Error inter' });
            }

            var htmlTemplate = data;
            var transporter = nodemailer.createTransport(config.smtpConfig);
            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: '"Laboratorio Clínico Eduardo Fernández" <' + config.smtpConfig.auth.user + '>',
                to: currentUser.eMail,
                subject: 'Pin para reestablecer contraseña',
                html: htmlTemplate
                    .replace("{{title}}", "PIN para reestablecer contraseña")
                    .replace("{{msg}}", "Para reestablecer su contraseña por favor use este PIN")
                    .replace("{{user}}", "")
                    .replace("{{data}}", currentUser.getPasswordPin())
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);

                    return res.status(500).json({ message: 'Error SMTP' });
                }
                res.json({});
            });
        });
    });
});

router.post('/login', function (req, res, next) {
    if (!req.body.username || !req.body.password) {
        return res.status(400).json({ message: 'Please fill out all fields' });
    }

    passport.authenticate('local', function (err, user, info) {
        if (err) { return next(err); }

        if (user) {
            return res.json(user.getLoginData());
        } else {
            return res.status(401).json(info);
        }
    })(req, res, next);
});

router.get('/login/refresh', auth, function (req, res, next) {
    var uid = req[config.userProperty]._id;
    User.findById(uid, function (error, user) {
        if (error) { return next(error); }
        var loginData = user.getLoginData();
        return res.json(ld);
    });
});

module.exports = router;