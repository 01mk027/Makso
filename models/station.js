const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stationSchema = new Schema({
  customerId:[{
    type: Schema.Types.ObjectId,
    required: false,
    ref:'Customer'
  }],
  chargeStartingTime:[{
    type: Date,
    required: false
  }],
  chargeFinishingTime:[{
    type: Date,
    required: false
  }],
  wastedPower:{
    type: Number,
    required: false
  },
  lastDisconnectionTime:[{  //En son tamire girdiği, veya bakıma girdiği zamanı temsil ediyor.
    type: Date,
    required: false
  }],
  lastOpeningTime:[{  //En son açıldığı zamanı, veya bakıma girdiği zamanı temsil ediyor.
    type: Date,
    required: false
  }],
  disconnectionReason:[{
    type: String,
    required: false
  }],
  currentQrCode:{
    type: String,
    required: false
  },
  location:{
    type: String,
    required: false
  },
  lastRepairingTime:[{  //Admin tarafından ayarlanacak.
    type: Date,
    required: false
  }],
  lastRepairingFinishTime:[{
    type: Date,
    required: false
  }],
  totalWastedTime:{  //isOpen, true olduğu andan itibaren artmaya başlayacak, false olduğunda duracak. Toplam off olduğu zamanı temsil eder.
    type: Number,
    required: false
  },
  totalOperatingTime:{
    type: Number,
    required: false
  },
  isOpen:{        //Admin tarafından ayarlanacak.
    type: Boolean,
    required: false
  },
  isRepairing:{
    type: Boolean,
    required: false
  }
});

module.exports = mongoose.model('Station', stationSchema);
