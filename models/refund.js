const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const refundSchema = new Schema({
  paymentId:{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Payment'
  },
  paymentTransactionId:
  {
    type: String,
    required: true
  },
  conversationId:{
    type: String,
    required: true
  },
  ipAddress:{
    type: String,
    required: true
  },
  customerId:{
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Customer'
  },
  customerName:{
    type: String,
    required: true
  },
  customerSurname:{
    type: String,
    required: true
  },
  customerIdentityNumber:{
    type: String,
    required: true
  },
  requestDescription:{
    type: String,
    required: true
  },
  price:{
    type: String,
    required: true
  },
  paymentDate:{
    type: Date,
    required: true
  },
  requestDate:{
    type: Date,
    required: true
  },
  cardType:{
    type:String,
    required: false
  },
  cardAssociation:{
    type:String,
    required: false
  },
  cardFamily:{
    type:String,
    required: false
  },
  response:{
    type: String,
    required: false
  },
  responserName:{
    type: String,
    required: false
  },
  responserSurname:{
    type: String,
    required: false
  },
  isRefunded:{
    type: Boolean,
    required: false
  },
  isResulted:{
    type: Boolean,
    required: false
  },
  resultingTime:{
    type: Date,
    required: false
  }
});

module.exports = mongoose.model('Refund', refundSchema);
