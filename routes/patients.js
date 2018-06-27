var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var Patient = mongoose.model('Patient');
var User = mongoose.model('User');
var fs = require('fs');
var jwt = require('express-jwt');
var nodemailer = require('nodemailer');
var config = require('../config');

var auth = jwt({ secret: config.secret, userProperty: config.userProperty });

/* Patients */
router.get('/', auth, function (req, res, next) {
    var uid = req[config.userProperty]._id;

    Patient.find({ user: uid }, function (err, patients) {
        if (err) { return next(err); }

        res.json(patients);
    });
});

router.post('/', function (req, res, next) {
    var patData = new Patient(req.body);
    if (!patData.eMail || !patData.eMail.includes("@")) {
        return res.status(400).json({ message: 'Debe proporcionar un eMail valido par poder obtener los resultados en línea.' });
    }
    patData.eMail = patData.eMail.toLowerCase();
    var savePat = function (_pat, _uid, _res) {
        _pat.user = _uid;
        _pat.save(function (err, savedPat) {
            if (err) { return next(err); }

            _res.json(savedPat);
        });
    }

    var saveUser = function (_pat, _callback) {
        var nums = new Date().getTime().toString();
        var pass = Math.floor((Math.random() * 99999) + 10000);

        var _user = new User();
        _user.username = _pat.eMail.toLowerCase();
        _user.setPassword(pass.toString());
        _user.eMail = _pat.eMail.toLowerCase();
        _user.phoneNumber = _pat.phoneNumber;
        _user.eMailConfirmed = false;
        _user.phoneNumberConfirmed = false;

        _user.save(_callback);

        fs.readFile(config.root + '/mail.md', 'utf8', function (err, data) {
            if (!err) {
                var htmlTemplate = data;
                var transporter = nodemailer.createTransport(config.smtpConfig);
                // setup e-mail data with unicode symbols
                var mailOptions = {
                    from: '"Laboratorio Clínico Eduardo Fernández" <' + config.smtpConfig.auth.user + '>',
                    to: _user.eMail,
                    subject: 'Contraseña para resultados en línea',
                    html: htmlTemplate
                        .replace("{{title}}", "Contraseña para resultados en línea")
                        .replace("{{msg}}", "Gracias por usar nuestro servicio de resultados en línea. Puede ingresar desde nuestra página (Opción 'Resultados en línea') o desde nuestra aplicación móvil con su correo '" + _user.eMail + "' y la siguiente contraseña")
                        .replace("{{user}}", "")
                        .replace("{{data}}", pass.toString())
                };

                transporter.sendMail(mailOptions, function (error, info) { });
            }
        });
    }

    Patient.findOne({ $or: [{ eMail: patData.eMail }, { $and: [{ identificationNumber: patData.identificationNumber }, { identificationType: patData.identificationType }] }] },//ini
        function (err, existingPat) {
            if (err) { return next(err); }
            if (!existingPat) {
                //no existe este paciente
                User.findOne({ eMail: patData.eMail.toLowerCase() }, function (err, currentUser) {
                    if (err) { return next(err); }

                    if (!currentUser) {
                        //No existe ni paciente ni usuario
                        saveUser(patData, function (err, createdUser) {
                            savePat(patData, createdUser._id, res);
                        });
                    }
                    else {
                        //Existe usuario pero no paciente
                        savePat(patData, currentUser._id, res);
                    }
                });
            }
            else {
                //Existe paciente

                /*
                posibilidades:
                    1. Paciente con el mismo Id y el mismo correo
                        * Significa que no hay ningun cambio por hacer, solo actualziar datos personales
                    
                    2. Paciente con el mismo Id y nuevo correo
                        * Significa que se transfiere a otro usuario el cual podria ser nuevo
                        
                    3. Paciente con nuevo Id y el mismo correo
                        * Significa un nuevo paciente para asignarle a usuario existente
                
                */

                existingPat.firstName = patData.firstName;
                existingPat.lastName = patData.lastName;
                existingPat.phoneNumber = patData.phoneNumber;
                existingPat.birthDate = patData.birthDate;

                //Vericicacion 1 (Paciente con el mismo Id y el mismo correo)
                if (patData.eMail.toLowerCase() == existingPat.eMail.toLowerCase() && (patData.identificationNumber == existingPat.identificationNumber && patData.identificationType == existingPat.identificationType)) {
                    // no hay ningun cambio por hacer, solo actualziar datos personales.
                    patData.eMail = patData.eMail.toLowerCase();
                    savePat(existingPat, existingPat.user, res);
                }
                //Vericicacion 2 (Paciente con el mismo Id y nuevo correo)
                else if (patData.eMail.toLowerCase() != existingPat.eMail.toLowerCase() && (patData.identificationNumber == existingPat.identificationNumber && patData.identificationType == existingPat.identificationType)) {
                    //se transfiere a otro usuario
                    existingPat.eMail = patData.eMail.toLowerCase();

                    //Buscar si existe tal usuario
                    User.findOne({ eMail: existingPat.eMail.toLowerCase() }, function (err_v2, currentUser) {
                        if (err_v2) { return next(err_v2); }

                        if (!currentUser) {
                            //No existe usuario, se crea y se asigna.
                            saveUser(existingPat, function (err_v2_u, createdUser) {
                                savePat(existingPat, createdUser._id, res);
                            });
                        }
                        else {
                            //Existe usuario, se asigna
                            savePat(existingPat, currentUser._id, res);
                        }
                    });
                }
                //Verificacion 3 (Paciente con nuevo Id y el mismo correo)
                else {
                    User.findOne({ eMail: patData.eMail }, function (err_v2, currentUser) {
                        if (err_v2) { return next(err_v2); }

                        if (!currentUser) {
                            //No existe usuario, pero si paciente.
                            saveUser(patData, function (err_v2_u, createdUser) {
                                savePat(patData, createdUser._id, res);
                            });
                        }
                        else {
                            //Existe usuario pero no paciente
                            savePat(patData, currentUser._id, res);
                        }
                    });
                }
            }
        });//fin 
});

router.param('patient', function (req, res, next, id) {
    var query = Patient.findById(id);

    query.exec(function (err, pat) {
        if (err) { return next(err); }
        if (!pat) { return next(new Error('can\'t find patient')); }

        req.pat = pat;
        return next();
    });
});

router.get('/:patient', auth, function (req, res) {
    res.json(req.pat);
});

module.exports = router;