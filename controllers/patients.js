var mongoose = require("mongoose");
var Patient = mongoose.model("Patient");
var User = mongoose.model("User");
var fs = require("fs");
var jwt = require("express-jwt");
var nodemailer = require("nodemailer");
var config = require("../config");
var service = require("../services/generalService");

exports.getAll = function(req, res) {
  var uid = req[config.userProperty]._id;
  Patient.find({ user: uid }, function(err, patients) {
    if (err) {
      return res.status(404).json({ message: "Error al guardar el usuario" });
    }
    res.status(200).json(patients);
  });
};

exports.patientId = function(req, res) {
  res.json(req.pat);
};
exports.patient = function(req, res, next, id) {
  var query = Patient.findById(id);

  query.exec(function(err, pat) {
    if (err) {
      return next(err);
    }
    if (!pat) {
      return next(new Error("can't find patient"));
    }

    req.pat = pat;
    return next();
  });
};

exports.post = function(req, res) {
  var patData = new Patient(req.body);
  if (!patData.eMail || !patData.eMail.includes("@")) {
    return res.status(400).json({
      message:
        "Debe proporcionar un eMail valido par poder obtener los resultados en línea."
    });
  }
  patData.eMail = patData.eMail.toLowerCase();

  Patient.findOne(
    {
      $or: [
        { eMail: patData.eMail },
        {
          $and: [
            { identificationNumber: patData.identificationNumber },
            { identificationType: patData.identificationType }
          ]
        }
      ]
    }, //ini
    function(err, existingPat) {
      if (err) {
        return next(err);
      }
      if (!existingPat) {
        //no existe este paciente
        User.findOne({ eMail: patData.eMail.toLowerCase() }, function(
          err,
          currentUser
        ) {
          if (err) {
            return next(err);
          }

          if (!currentUser) {
            //No existe ni paciente ni usuario
            console.log("=================");
            console.log(patData);
            service.saveUser(patData, function(err, createdUser) {
              console.log("=========");
              console.log(createdUser);
              service.savePat(patData, createdUser._id, res);
            });
          } else {
            //Existe usuario pero no paciente
            service.savePat(patData, currentUser._id, res);
          }
        });
      } else {
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
        if (
          patData.eMail.toLowerCase() == existingPat.eMail.toLowerCase() &&
          (patData.identificationNumber == existingPat.identificationNumber &&
            patData.identificationType == existingPat.identificationType)
        ) {
          // no hay ningun cambio por hacer, solo actualziar datos personales.
          patData.eMail = patData.eMail.toLowerCase();
          service.savePat(existingPat, existingPat.user, res);
        }
        //Vericicacion 2 (Paciente con el mismo Id y nuevo correo)
        else if (
          patData.eMail.toLowerCase() != existingPat.eMail.toLowerCase() &&
          (patData.identificationNumber == existingPat.identificationNumber &&
            patData.identificationType == existingPat.identificationType)
        ) {
          //se transfiere a otro usuario
          existingPat.eMail = patData.eMail.toLowerCase();

          //Buscar si existe tal usuario
          User.findOne({ eMail: existingPat.eMail.toLowerCase() }, function(
            err_v2,
            currentUser
          ) {
            if (err_v2) {
              return next(err_v2);
            }

            if (!currentUser) {
              //No existe usuario, se crea y se asigna.
              saveUser(existingPat, function(err_v2_u, createdUser) {
                service.savePat(existingPat, createdUser._id, res);
              });
            } else {
              //Existe usuario, se asigna
              service.savePat(existingPat, currentUser._id, res);
            }
          });
        }
        //Verificacion 3 (Paciente con nuevo Id y el mismo correo)
        else {
          User.findOne({ eMail: patData.eMail }, function(err_v2, currentUser) {
            if (err_v2) {
              return next(err_v2);
            }

            if (!currentUser) {
              //No existe usuario, pero si paciente.
              saveUser(patData, function(err_v2_u, createdUser) {
                service.savePat(patData, createdUser._id, res);
              });
            } else {
              //Existe usuario pero no paciente
              service.savePat(patData, currentUser._id, res);
            }
          });
        }
      }
    }
  ); //fin
};
