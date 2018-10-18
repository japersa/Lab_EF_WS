var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongoose = require("mongoose");
var User = mongoose.model("User");

passport.use(
  new LocalStrategy(function(username, password, done) {
    console.log("entro a passport...");
    User.findOne({ username: username.toLowerCase() }, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          message: "Aún no está habilitado para descargar resultados."
        });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: "La contraseña es incorrecta." });
      }
      return done(null, user);
    });
  })
);
