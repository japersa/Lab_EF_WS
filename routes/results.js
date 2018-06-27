var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
var jwt = require('express-jwt');
var fs = require('fs');
var path = require('path');
var auth = jwt({ secret: config.secret, userProperty: config.userProperty });

var soap = require('soap');

var host = 'http://192.168.0.169';
var dir = ':8002/';

// var url = '/omega/webservice.wsdl';
var url = host + dir + 'WebServiceConsultaAvicena.asmx?WSDL';

var getOmegaDate = function (unix) {
    var dt = new Date(Number(unix));
    var str = dt.getUTCDate() + '/' + (dt.getUTCMonth() + 1) + '/' + dt.getUTCFullYear();
    return str;
}

var getOmegaIdType = function (labcliType) {
    var map = {
        CC: 1,
        CE: 2,
        PA: 3,
        RC: 4,
        TI: 5,
        MS: 7,
        AS: 41,
        ASI: 41,
        NIT: 42,
        SYS: 44,
        AMB: 45
    };
    var omegaType = map[labcliType];

    return omegaType;
}

router.get('/', auth, function (req, res, next) {
    soap.createClient(url, function (err, client) {
        var args = {
            TipoIdentificacion: getOmegaIdType(req.query.identificationType),
            Identificacion: req.query.identificationNumber,
            FechaInicial: getOmegaDate(req.query.from),
            FechaFinal: getOmegaDate(req.query.to)
        };

        client.fncGetSolicitudesByPacienteByFechas(args, function (err, result) {
            console.log(result);
            var response = result.fncGetSolicitudesByPacienteByFechasResult;
            var query = response.Consulta[0];
            if (query.EstadoFinal != '1') {
                //retornar 500
                return res.status(500).json({ message: 'No se pudo procesar la solicitud a OMEGA' });
            }

            var peticiones = query.Paciente.Peticiones.Peticion;

            var resp_result = [];
            for (var i = 0; i < peticiones.length; i++) {
                var p = peticiones[i];
                resp_result.push({
                    number: p.NumeroPeticion + (p.EstadoPeticion === 'T' ? '' : '0'),
                    date: p.FechaPeticion,
                    state: p.EstadoPeticion,
                    module: p.Modulo,
                    description: p.Descripcion.split(',').join(', ')
                });
            }

            //retornar resultado
            return res.json(resp_result);
        });
    });
});

router.get('/pdf', auth, function (req, res, next) {

    soap.createClient(url, function (err, client) {
        var args = {
            FechaPeticion: getOmegaDate(req.query.date),
            NumeroPeticion: req.query.number,
            Modulo: req.query.module
        };


        client.fncGetURLPDF(args, function (err, result) {
            console.log(result);
            var query = result.fncGetURLPDFResult;
            if (query.strError) {
                //retornar 500
                return res.status(500).json({ message: 'No se pudo procesar la solicitud a OMEGA: ' + query.strError });
            }

            var url = query.URL_PDF; /// "http://localhost:8004/EduFerTestPdf.pdf";

            // var src = request(url);
            // req.pipe(src).pipe(res);

            var file_name = "public/tmp/" + req.query.number + "-" + req.query.module + ".pdf";

            try {
                request
                    .get(url)
                    .on('response', function (response) {
                        console.log(response.statusCode)
                        console.log(response.headers['content-type'])
                    })
                    .on('end', function () {
                        // store pdf into DB here.
                        //fs.createReadStream(file_name).pipe(res); // send the pdf to client

                        res.json({ url: file_name.replace("public/", "") });
                    })
                    .pipe(fs.createWriteStream(config.root + '/' + file_name)) //store the pdf in your server


                /*
                var uploadsDir = config.root + '/public/tmp/';
                fs.readdir(uploadsDir, function(err, files) {
                files.forEach(function(file, index) {
                    fs.stat(path.join(uploadsDir, file), function(err, stat) {
                    var endTime, now;
                    if (err) {
                        return console.error(err);
                    }
                    now = new Date().getTime();
                    endTime = new Date(stat.ctime).getTime() + 3600000;
                    if (now > endTime) {
                        return rimraf(path.join(uploadsDir, file), function(err) {
                        if (err) {
                            return console.error(err);
                        }
                        console.log('successfully deleted');
                        });
                    }
                    });
                });
                });
                */

            } catch (error) {
                res.status(500).json({ message: 'Bloque catch de Request' });
            }

        });
    });

    ///delete old temps
    var uploadsDir = config.root + '/public/tmp';
    fs.readdir(uploadsDir, function (err, files) {
        files.forEach(function (file, index) {
            fs.stat(path.join(uploadsDir, file), function (err, stat) {
                var endTime, now;
                if (err) {
                    return console.error(err);
                }
                now = new Date().getTime();
                endTime = new Date(stat.ctime).getTime() + 3600000;
                if (now > endTime) {
                    return fs.unlink(path.join(uploadsDir, file), function (err) {
                        if (err) return console.error(err);
                        console.log('file deleted successfully');
                    });
                }
            });
        });
    });
});

module.exports = router;