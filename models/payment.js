const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const paymentSchema = new Schema({
  customerId:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:'Customer'
  },
  stationId:{
    type: Schema.Types.ObjectId,
    required: true,
    ref:'Station'
  },
  paymentDate:{
    type: Date,
    required: true
  },
  status:{
    type: String,
    required: true
  },
  conversationId:{
    type: Number,
    required: true
  },
  paymentId:{
    type: String,
    required: false
  },
  paymentTransactionId:{
    type: String,
    required: false
  },
  cardNumber:{
    type: String,
    required: true
  },
  expireMonth:{
    type: String,
    required: true
  },
  expireYear:{
    type: String,
    required: true
  },
  cvv:{
    type: Number,
    required: true
  },
  cardType: {
    type: String,
    required: false
  },
  cardAssociation:{
    type: String,
    required: false
  },
  cardFamily:{
    type: String,
    required: false
  },
  binNumber:{
    type: String,
    required: false
  },
  lastNumber:{
    type: String,
    required: false
  },
  paymentTransactionId:{
    type: String,
    required: false
  },
  price:{
    type: Number,
    required: false
  },
  paidPrice:{
    type: Number,
    required: false
  },
  iyziCommissionRateAmount:{
    type: Number,
    required: false
  },
  iyziCommissionFee:{
    type: Number,
    required: false
  },
  merchantPayoutAmount:{
    type: Number,
    required: false
  },
  EVSCommissionRate:{
    type: Number,
    required: false
  },
  EVSCommissionFee:{
    type: Number,
    required: false
  },
  kwhPerHourPrice:{
    type: Number,
    required: false
  },
  errorCode:{
    type: String,
    required: false
  },
  errorMessage:{
    type: String,
    required: false
  },
  ipAddress:
  {
    type: String,
    required: false
  },
  isRequestedForRefund:{
    type: Boolean,
    required: false
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
