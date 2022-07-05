const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema({
  name:{
    type: String,
    required: true
  },
  surname:{
    type: String,
    required: true
  },
  phoneNumber:{
    type: String,
    required: true
  },
  password:{
    type: String,
    required: true
  },
  creditCards: [{cardNumber: String, expireMonth: String, expireYear:String, cvv: String, bankName: String, cardType: String}],
  billAddress:{
    type: String,
    required: true
  },
  city:{
    type: String,
    required: true
  },
  country:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  identityCardNumber:{
    type: String,
    required: true
  },
  birthDate:{
    type: Date,
    required: true
  },
  registrationDate:{
    type: Date,
    required: true
  },
  lastLogin:{
    type: Date,
    required: false
  },
  lastLogout:{
    type: Date,
    required: false
  },
  visitedStations:{
    stations:[]
  },
  membershipPoint:{
    type: Number,
    required: false
  },
  zipCode:{
    type: String,
    required: true
  },
  loyaltyAgreement:{
    type: Boolean,
    required: false
  },
  isAdmin:{
    type: Boolean,
    required: false
  },
  stationAuth:{
    type: Boolean,
    required: false
  },
  paymentAuth:{
    type: Boolean,
    required: false
  },
  customerAuth:{
    type: Boolean,
    required: false
  },
  refundAuth:{
    type: Boolean,
    required: false
  },
  isSuspended:{
    type: Boolean,
    required: false
  }
});


module.exports = mongoose.model("Customer", customerSchema);
