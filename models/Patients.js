var mongoose = require('mongoose');

var PatientSchema = new mongoose.Schema({
  identificationType: { type: String, required: true},
  identificationNumber: { type: String, required: true},
  firstName: { type: String, required: true},
  lastName: { type: String, required: true},
  eMail: String,
  phoneNumber: Number,
  birthDate: Date,
  user: { type: mongoose.Schema.ObjectId, ref: 'User', required:true }
});

mongoose.model('Patient', PatientSchema);