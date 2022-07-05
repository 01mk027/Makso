const bcrypt = require('bcryptjs');
const Station = require('../models/station');
const Customer = require('../models/customer');
const Payment = require('../models/payment');
const moment = require('moment');
const Iyzipay = require('iyzipay');
require('dotenv').config();
const iyzipay = new Iyzipay({
  apiKey: 'sandbox-Ml3B2YTHlq5G7Ryx33k5Mo5Pj2sQNiLg',
  secretKey: 'sandbox-Wk9Dt4kyNI02W1IRbNly3bNESYI0FYCu',
  uri: 'https://sandbox-api.iyzipay.com'
});


exports.getCharge = (req, res, next) => {
Customer.find({_id: req.session.customer._id}, ['creditCards','loyaltyAgreement'])
.then(result => {

    res.render('station/charge.ejs',{
      pageTitle: 'Ödeme Sayfası',
      stationId: req.query.stid,
      loyaltyAgreement: result[0].loyaltyAgreement,
      cards: result[0].creditCards
      });


  });
}


exports.chargeError = (req, res, next) => {
  res.render('status/chargeStatus.ejs',{
    pageTitle:'Şarj Durumu',
    errorMessage: req.flash("errorCharge"),
    successMessage: req.flash("successMessage")
  });
};


exports.postCharge = (req, res, next) =>
{
  let isSuccess = false;
  const cardNumber = req.body.cardNumber;
  const expireMonth = req.body.expireMonth;
  const expireYear = req.body.expireYear;
  const cvv = req.body.cvv;
  console.log("cvv = ", cvv);
  const stationId = req.body.stationId;
  let priceAmount = 1;
  let voltageType = req.body.voltageType;
  if(voltageType == 'AC')
  {
    priceAmount = req.body.ACDesc * 30;
  }
  else
  {
    priceAmount = req.body.DCDesc * 30;
  }

  let discount = 0;
  if(req.body.discount)
  {
    discount = req.body.discount;
  }

  if(discount == 'on')
  {
    priceAmount = priceAmount - (priceAmount / 5);
  }

  let lastLoginDate = moment(req.session.customer.lastLogin).format('YYYY-MM-DD HH:MM:ss');
  let registrationDate = moment(req.session.customer.registrationDate).format('YYYY-MM-DD HH:MM:ss');
  let startDate = new Date();
  startDate.setHours(startDate.getHours() + 3);
  let ip = '85.34.78.112';
    setTimeout(() => {
      var request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: '123456789',
        price: priceAmount,
        paidPrice: priceAmount,
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: 'B67832',
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
            cardHolderName: req.session.customer.name+' '+req.session.customer.surname,
            cardNumber: cardNumber,
            expireMonth: expireMonth,
            expireYear: expireYear,
            cvc: cvv,
            registerCard: '0'
        },
        buyer: {
            id: 'BY789',
            name: req.session.customer.name,
            surname: req.session.customer.surname,
            gsmNumber: req.session.customer.phoneNumber,
            email: req.session.customer.email,
            identityNumber: req.session.customer.identityCardNumber,
            lastLoginDate: lastLoginDate,
            registrationDate: registrationDate,
            registrationAddress: req.session.customer.billAddress,
            ip: ip,  //düzenlenecek
            city: req.session.customer.city,
            country: req.session.customer.country,
            zipCode: req.session.customer.zipCode
        },
        shippingAddress: {
            contactName: req.session.customer.name+' '+req.session.customer.surname,
            city: req.session.customer.city,
            country: req.session.customer.country,
            address: req.session.customer.billAddress,
            zipCode: req.session.customer.zipCode
        },
        billingAddress: {
          contactName: req.session.customer.name+' '+req.session.customer.surname,
          city: req.session.customer.city,
          country: req.session.customer.country,
          address: req.session.customer.billAddress,
          zipCode: req.session.customer.zipCode
        },
        basketItems: [
            {
                id: 'BI102',
                name: 'Game code',
                category1: 'Game',
                category2: 'Online Game Items',
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: priceAmount
            }
        ]
    };
      iyzipay.payment.create(request, function (err, result) {
        console.log(result);
          if(result.status == "success")
          {
            let paymentTransactionId;
            let price;
            let paidPrice;
            let iyziCommissionRateAmount;
            let iyziCommissionFee;
            let merchantPayoutAmount;
            for(let i=0; i < result.itemTransactions.length; ++i)
            {
                paymentTransactionId = result.itemTransactions[i].paymentTransactionId;
                price = result.itemTransactions[i].price;
                paidPrice = result.itemTransactions[i].paidPrice;
                iyziCommissionRateAmount = result.itemTransactions[i].iyziCommissionRateAmount;
                iyziCommissionFee = result.itemTransactions[i].iyziCommissionFee;
                merchantPayoutAmount = result.itemTransactions[i].merchantPayoutAmount;
            }
            //console.log(paymentTransactionId, price, paidPrice, iyziCommissionRateAmount, iyziCommissionFee, merchantPayoutAmount);
            let EVSCommissionRate = 0.005;
            let EVSCommissionFee = merchantPayoutAmount * EVSCommissionRate;
            merchantPayoutAmount = merchantPayoutAmount - EVSCommissionFee;
            let kwhPerHourPrice = 2.048204 * 0.5;
            merchantPayoutAmount = merchantPayoutAmount - kwhPerHourPrice;
            console.log(merchantPayoutAmount);
            const payment = new Payment({
              customerId: req.session.customer._id,
              stationId: req.body.stationId,
              paymentDate: startDate,
              status: result.status,
              conversationId: result.conversationId,
              paymentId: result.paymentId,
              paymentTransactionId: result.itemTransactions[0].paymentTransactionId,
              cardNumber: cardNumber,
              expireMonth: expireMonth,
              expireYear: expireYear,
              cvv: cvv,
              cardType: result.cardType,
              cardAssociation: result.cardAssociation,
              cardFamily: result.cardFamily,
              binNumber: result.binNumber,
              lastNumber: result.lastNumber,
              paymentTransactionId: paymentTransactionId,
              price: price,
              paidPrice: paidPrice,
              iyziCommissionRateAmount: iyziCommissionRateAmount,
              iyziCommissionFee: iyziCommissionFee,
              merchantPayoutAmount: merchantPayoutAmount,
              EVSCommissionRate: EVSCommissionRate,
              EVSCommissionFee: EVSCommissionFee,
              kwhPerHourPrice: kwhPerHourPrice,
              errorCode: '',
              errorMessage: '',
              ipAddress: ip,
              isRequestedForRefund: false
            });
            let finishDate = new Date();
            finishDate.setHours(finishDate.getHours() + 3);
            console.log(req.session.customer._id);
            Station.findById(req.body.stationId).then(result => {
              result.updateOne({
                $push: {customerId: req.session.customer._id, chargeStartingTime: startDate, chargeFinishingTime: finishDate},
                wastedPower: result.wastedPower + 50,
                totalWastedTime: 0,
                totalOperatingTime: result.totalOperatingTime + Math.abs(finishDate.getSeconds() - startDate.getSeconds()),
                isOpen: true
              }).then(res => {
                console.log("Updated Status for Station");
              }).catch(err => console.log(err));
            }).then(res => {
                console.log("Found");
            }).catch(err => {
              console.log(err);
            });
              req.flash("successMessage", "İşlem başarılı.");
              res.redirect('/sarjSonuc');
              Customer.findById(req.session.customer._id).then(result => {
                result.membershipPoint += 5;
                //if(result.membershipPoint >= 15) result.loyaltyAgreement = true;
                return result.save();
              })
              return payment.save().then(res => console.log("OK"));


          }
          else
          {
            const payment = new Payment({
              customerId: req.session.customer._id,
              stationId: req.body.stationId,
              paymentDate: startDate,
              status: result.status,
              conversationId: result.conversationId,
              paymentId: '',
              cardNumber: cardNumber,
              expireMonth: expireMonth,
              expireYear: expireYear,
              cvv: cvv,
              cardType: '',
              cardAssociation: '',
              cardFamily: '',
              binNumber: '',
              lastNumber: '',
              paymentTransactionId: '',
              price: '',
              paidPrice: '',
              iyziCommissionRateAmount: '',
              iyziCommissionFee: '',
              merchantPayoutAmount: '',
              errorCode: result.errorCode,
              errorMessage: result.errorMessage,
            });
            req.flash("errorCharge", result.errorMessage);
            res.redirect('/sarjSonuc');
            return payment.save().then(res => console.log(result.errorMessage));
          }
      });
        //res.redirect('/dashboard');
    }, 5000);

}
