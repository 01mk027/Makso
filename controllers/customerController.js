const bcrypt = require('bcryptjs');
const Customer = require('../models/customer');
const Station = require('../models/station');
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Luhn = require('luhn-js');
const moment = require('moment');
moment.locale('tr');
const mongoose = require('mongoose');


exports.getMain = (req, res, next) => {
  res.render('customer/main.ejs',{
    pageTitle: 'Ana Sayfa'
  });
}

exports.getRegister = (req, res, next) => {
  res.render('customer/register.ejs',{
    pageTitle: 'Kayıt Sayfası',
    errorRegister: req.flash('errorRegister')
  });
};

exports.postRegister = (req, res, next) => {
  const name = req.body.name;
  const surname = req.body.surname;
  const phoneNumber = req.body.phoneNumber;
  const password = req.body.password;
  const billAddress = req.body.billAddress;
  const city = req.body.city;
  const country = req.body.country;
  const email = req.body.email;
  const identityCardNumber = req.body.tckn;
  const birthDate = req.body.birthDate;
  let registrationDate = new Date();
  registrationDate.setHours(registrationDate.getHours() + 3);
  const zipCode = req.body.zipCode;
  let isAdmin = false;
  let stationAuth = false;
  let paymentAuth = false;
  let customerAuth = false;
  let refundAuth = false;
  let isSuspended = false;
  if(req.body.isAdmin && req.body.stationAuth && req.body.paymentAuth && req.body.customerAuth && req.body.refundAuth)
  {
    isAdmin = req.body.isAdmin;
    stationAuth = req.body.stationAuth;
    paymentAuth = req.body.paymentAuth;
    customerAuth = req.body.customerAuth;
    refundAuth = req.body.refundAuth;
  }

  Customer.findOne({email: email})
  .then(userDoc => {
    if(userDoc){
      req.flash('errorRegister', 'Aynı mail adresi ile kayıt yapılmıştır.');
      return res.redirect('/register');
    }
    return bcrypt.hash(password, 12).then(hashedPassword => {
      const customer = new Customer({
        name: name,
        surname: surname,
        phoneNumber: phoneNumber,
        password: hashedPassword,
        payments:{
          items:[]
        },
        billAddress: billAddress,
        city: city,
        country: country,
        email: email,
        identityCardNumber: identityCardNumber,
        birthDate: birthDate,
        registrationDate: registrationDate,
        //lastLogin: new Date(),
        //lastLogout: new Date(),
        visitedStations:{
          stations:[]
        },
        membershipPoint:0,
        zipCode: zipCode,
        loyaltyAgreement: false,
        isAdmin: isAdmin,
        stationAuth: stationAuth,
        paymentAuth: paymentAuth,
        customerAuth: customerAuth,
        refundAuth: refundAuth,
        isSuspended: isSuspended
      });
      return customer.save();
    });
  })
  .then(result => {
    res.redirect('/login');
  })
  .catch(err => {
    console.log(err);
  })
};

exports.getLogin = (req, res, next) => {
  let ipAddress = req.headers['x-forwarded-for']?.split(',').shift()
  || req.socket?.remoteAddress;
  
  res.render('customer/login.ejs',{
    pageTitle:'Giriş Sayfası',
    errorMail: req.flash('errorMail'),
    errorPassword: req.flash('errorPassword'),
    userSuspended: req.flash("userSuspended"),
    ipAddress: ipAddress
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  var requestIp = require('request-ip');
  let clientIp = requestIp.getClientIp(req);
  console.log(clientIp);

/*
////////////////////////// HEROKU'DA TEST EDİLECEK /////////////////////////////
  let ipAddress = req.headers['x-forwarded-for']?.split(',').shift()
    || req.socket?.remoteAddress;
  console.log(ipAddress);
////////////////////////// HEROKU'DA TEST EDİLECEK /////////////////////////////
*/


  //let date = new Date();
  //date = date.getHours()+3;
  let date = new Date();
  date.setHours(date.getHours() + 3);
  //console.log(date);
  Customer.findOne({email: email})
  .then(user => {
    if(!user)
    {
      req.flash('errorMail', 'Mail adresi kayıtlı değil.');
      return res.redirect('/login');
    }
    bcrypt.compare(password, user.password)
    .then(doMatch => {
      if(doMatch)
      {
        if(user.isSuspended)
        {
          req.flash("userSuspended", `Sayın ${user.name} ${user.surname} hesabınız askıya alınmıştır.`);
          return res.redirect('/login');
        }
        req.session.isLoggedIn = true;
        req.session.customer = user;
        req.session.isUser = true;
        if(user.isAdmin)
        {
           req.session.isAdmin = true;
           req.session.admin = user;
        }
        return req.session.save(err => {
          console.log(err);
          user.updateOne({lastLogin: date})
          .then(result => {
            console.log("UPDATED LOGIN");
          }).catch(err => console.log(err));
          if(!user.isAdmin)
          {
            res.redirect('/dashboard');
          }
          else
          {
            res.redirect('/admin/admin-dashboard');
          }
        })
      }
      else{
        req.flash('errorPassword', 'Şifre yanlış');
        res.redirect('/login');
      }

    }).catch(err => {
        console.log(err);
        res.redirect('/login');
    });
  })
  .catch(err => console.log(err));
};

exports.getDashboard = (req, res, next) => {
  if(req.session.isUser)
  {
    Station.find({isOpen: true}).populate('customerId').then(async stations => {
      let membershipPoint = 0;
      //console.log(stations[0].customerId[0]._id);
      let isFound = false;
      for(let i=0; i<stations.length;i++)
      {
        for(let j=0; j<stations[i].customerId.length; j++)
        {
          if(String(stations[i].customerId[j]._id) === String(req.session.customer._id))
          {
            membershipPoint = stations[i].customerId[j].membershipPoint;
            isFound = true;
            break;
          }
          if(isFound) break;
        }
      }


      res.render('customer/dashboard.ejs',{
        pageTitle:'Dashboard',
        id: req.session.customer._id,
        name: req.session.customer.name,
        surname: req.session.customer.surname,
        stations:stations,
        successCharge: req.flash("successCharge"),
        membershipPoint: membershipPoint,
        unauthorizedPass: req.flash("unauthorizedPass")
      });

    });
  }
  else{
    res.redirect('/login');
  }

};

exports.getUpdate = (req, res, next) => {

    res.render('customer/update.ejs',{
      pageTitle: 'Üye bilgisi Güncelleme Sayfası',
      isAdmin: req.session.isAdmin,
      isUser: req.session.isUser,
      userInfo: req.session.customer
    });
};

exports.postUpdate = (req, res, next) => {
  let name = req.body.name;
  let surname = req.body.surname;
  let phoneNumber = req.body.phoneNumber;
  let password = req.body.password;
  let billAddress = req.body.billAddress;
  let city = req.body.city;
  let country = req.body.country;
  let email = req.body.email;
  let tckn = req.body.tckn;
  let zipCode = req.body.zipCode;
  let isAdmin = false;//req.body.isAdmin;
  let stationAuth = false;//req.body.stationAuth;
  let paymentAuth = false;//req.body.paymentAuth;
  let customerAuth = false;//req.body.customerAuth;
  //console.log(name, surname, phoneNumber, password, billAddress, city, country, email , zipCode, isAdmin, stationAuth, paymentAuth, customerAuth);
  if(req.session.isAdmin)
  {
    isAdmin = req.body.isAdmin;
    stationAuth = req.body.stationAuth;
    paymentAuth = req.body.paymentAuth;
    customerAuth = req.body.customerAuth;
  }
    /*Customer.find({_id: req.session.customer._id}).then(res => {
      console.log(res[0]);
    })*/
    return bcrypt.hash(password, 12).then(hashedPassword => {
    Customer.findById(req.session.customer._id).then(res => {
      res.name = name;
      res.surname = surname;
      res.phoneNumber = phoneNumber;
      res.password = hashedPassword;//unutma!!!
      res.billAddress = billAddress;
      res.city = city;
      res.country = country;
      res.email = email;
      res.identityCardNumber = tckn;
      res.zipCode = zipCode;
      res.isAdmin = isAdmin;
      res.stationAuth = stationAuth;
      res.paymentAuth = paymentAuth;
      res.customerAuth = customerAuth;
      return res.save().then(res => console.log(res)).catch(err => console.log(err))
    }).then(result => {
      req.session.destroy(err => {
        console.log(err);
        res.redirect('/login');
      })
    }).catch(err => {
      console.log(err);
    })
  })


};


exports.getPayments = (req, res, next) => {
  Payment.find({customerId: req.session.customer._id}).populate('stationId','location').select("status price paymentDate location")
  .then(result => {
    for(let i=0; i<result.length; i++)
    {
      result[i].paymentDate.setHours(result[i].paymentDate.getHours() - 3);
    }
      res.render('customer/customerPayments',{
        pageTitle:'Ödemeler',
        docs: result
      })
  });
};


exports.getAddCard = (req, res, next) => {
  if(req.session.isUser)
  {
    res.render('customer/add-card.ejs',{
      pageTitle: 'Kart Ekleme Sayfası',
      errorMessage:req.flash("errorCardNo"),
      errorAddCard: req.flash("errorAddCard"),
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.getCards = (req, res, next) => {
  Customer.findById(req.session.customer._id).select('creditCards')
          .then(result => {
            //console.log(result.creditCards[2].cardNumber);
            res.render('customer/cardList.ejs',{
              pageTitle:'Kartlarım',
              cards: result,
              successCardAdd: req.flash("successAddCard")
            })
          })
};



//cardNumber,expireMonth,expireYear,cvc
exports.postAddCard = (req, res, next) => {
  let cardNumber = req.body.cardNumber;
  let expireMonth = req.body.expireMonth;
  let expireYear = req.body.expireYear;
  let cvv = req.body.cvv;
  let bankName = req.body.bankName;
  let cardType = req.body.cardType;
  console.log(bankName, cardType);
  //console.log(cardNumber,expireMonth,expireYear,cvc);
  if(!Luhn.isValid(cardNumber))
  {
    req.flash("errorCardNo", "Kart numarası geçersiz, lütfen yeniden girin.");
    res.redirect('/add-card');
  }
  else{
    let card = {
      cardNumber: cardNumber,
      expireMonth: expireMonth,
      expireYear: expireYear,
      cvv: cvv,
      bankName: bankName,
      cardType: cardType
    };
    //console.log(card);
    if(cardNumber && expireMonth && expireYear && cvv && bankName && cardType)
    {
      Customer.findById(req.session.customer._id)
            .updateOne({
              $push: {creditCards:card}
            }).then(result => {
              req.flash("successAddCard", "Kart ekleme işlemi başarılı");
              res.redirect('/my-cards');
            })
              .catch(err => console.log(err))
     }
     else{
       req.flash("errorAddCard", "Eksik bilgiler var.");
       res.redirect('/add-card');
     }
  }
};


exports.deleteCard = (req, res, next) => {
  let cardId = req.body.cardId;
  Customer.update({_id: req.session.customer._id}
    ,{$pull: {creditCards:{_id: cardId}}}
  ).then(result => {
    res.redirect('/my-cards');
  })
  .catch(err => console.log(err));

};

exports.refundableList = (req, res, next) => {
  Payment.find({customerId: req.session.customer._id, status: "success"})//,['conversationId', 'paidPrice'])
         .populate('stationId',['location'])
         .then(async (result) => {
           for(let i=0; i<result.length; i++)
           {
             result[i].paymentDate.setHours(result[i].paymentDate.getHours() - 3);
              await bcrypt.hash(result[i].paymentTransactionId, 12).then(hashedId => {
                result[i].paymentTransactionId = hashedId;
              })
           }

           res.render('customer/refundableList.ejs',{
             pageTitle: 'İade Talep Sayfası',
             docs: result,
             successAddRequest: req.flash("successAddRequest"),
             failAddRequest: req.flash("failAddRequest")
           });
         });
};

exports.refundForm = (req, res, next) => {
  res.render('customer/refundForm.ejs',{
    pageTitle:'İade Formu',
    paymentTransactionId: req.query.q1,
    id: req.query.q2
  });
};

/*paymentTransactionId
 conversationId,
 ipAddress,customerName,
 customerSurname,
 customerIdentityNumber,
 requestDescription,
 price,
 paymentDate,
 requestDate,
 cardType,
 cardAssociation,
 cardFamily,
 response,
 isRefunded,
 refundDescription
*/
exports.completeRefundRequest = (req, res, next) => {
  const refundDescription = req.body.refundDescription;
  const transactionId = req.body.transactionId;
  const id = req.body.id;
  var objectId = mongoose.Types.ObjectId(id);
  //console.log(transactionId);
  //res.send(refundDescription);
  //res.send(refundDescription);
  //paymentTransactionId = 18661712
  let requestDate = new Date();
  requestDate.setHours(requestDate.getHours() + 3);
  //Model.findOneAndUpdate([conditions], [update], [options], [callback])
  //console.log(id);
  //console.log(typeof id);

Payment.find({_id: id}).then(result => {
  Refund.find({paymentId: id}).then(ress => {
    if(ress.length > 0)
    {
      req.flash("failAddRequest", "Aynı ödeme için birden fazla talep oluşturulamaz.");
      res.redirect('/refundable-list');
    }
    else
    {
      bcrypt.compare(result[0].paymentTransactionId, transactionId).then(async doMatch => {
        if(doMatch){
            const refund = new Refund({
               paymentId: id,
               paymentTransactionId: result[0].paymentTransactionId,
               conversationId: result[0].conversationId,
               ipAddress: result[0].ipAddress,
               customerId: req.session.customer._id,
               customerName: req.session.customer.name,
               customerSurname: req.session.customer.surname,
               customerIdentityNumber: req.session.customer.identityCardNumber,
               requestDescription: refundDescription,
               price: result[0].paidPrice,
               paymentDate: result[0].paymentDate,
               requestDate: requestDate,
               cardType: result[0].cardType,
               cardAssociation: result[0].cardAssociation,
               cardFamily: result[0].cardFamily,
               response:'Cevap bekleniyor',
               responserName:'',
               responserSurname:'',
               isRefunded: false,
               isResulted: false
            });



            return refund.save().then(update => {
              Payment.findOneAndUpdate(
                  { _id: id },
                  { $set: { isRequestedForRefund: true } },
                  {new: true, passRawResult: true},
                  (err, doc, raw) =>
                   {
                      //console.log(doc);
                   }
                )
            }).then(result => {
                 req.flash("successAddRequest","Talebiniz başarıyla eklendi.");
                 res.redirect('/refundable-list');
               })
            .catch(err => {
              /*req.flash("failAddRequest", "Veritabanında hata var.");
              res.redirect('/refundable-list');*/
              console.log(err);
            })


           }
})
    }//else
  })
})
/*.then(ress => {

  Payment.findOneAndUpdate(
    { _id: id },
    { $set: { isRequestedForRefund: true } },
    {new: true, passRawResult: true}).then(result => {
      req.flash("successAddRequest","Talebiniz başarıyla eklendi.");
      res.redirect('/refundable-list');
    }).catch(err => {
    });
    */
//});
};


exports.myCompletedRequests = (req, res, next) => {// response, isRefunded
  Refund.find({customerId: req.session.customer._id},['paymentDate', 'requestDate', 'price', 'requestDescription','response','isRefunded']).then(
    result => {
      for(let i=0; i<result.length; i++)
      {
        result[i].paymentDate.setHours(result[i].paymentDate.getHours()-3);
        result[i].requestDate.setHours(result[i].requestDate.getHours()-3);
        //result[i].requestDate = moment(result[i].requestDate).format('LLLL');
      }
      res.render('customer/completedRefundRequests.ejs',{
        pageTitle: 'İade Taleplerim',
        docs: result
      });
    }
  )

};













exports.postLogout = (req, res, next) => {
  let date = new Date();
  date.setHours(date.getHours() + 3);
  //console.log(date);
  Customer.findById(req.session.customer._id)
  .then(customer => {
      customer.updateOne({lastLogout: date}).then(result => {
        console.log("UPDATED LOGOUT");
      })
  });
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/login');
  })
};
