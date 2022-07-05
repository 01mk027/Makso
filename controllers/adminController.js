const Customer = require('../models/customer');
const Payment = require('../models/payment');
const Refund = require('../models/refund');
const Station = require('../models/station');


const mongoose = require('mongoose');
const moment = require('moment');
const excel = require('excel4node');
const bcrypt = require('bcryptjs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
require("dotenv").config();
const Iyzipay = require('iyzipay');
const iyzipay = new Iyzipay({
  apiKey: 'sandbox-Ml3B2YTHlq5G7Ryx33k5Mo5Pj2sQNiLg',
  secretKey: 'sandbox-Wk9Dt4kyNI02W1IRbNly3bNESYI0FYCu',
  uri: 'https://sandbox-api.iyzipay.com'
});



moment.locale("tr");

let resultForAll;
let resultForADay;
let resultForAnInterval;
let resultForAMonth;
let refunds;






exports.getDashboard = (req, res, next) => {
  res.render('admin/adminDashboard.ejs',{
    adminInfo: req.session.admin,
    pageTitle: 'Dashboard',
    unauthorizedPassAdmin: req.flash("unauthorizedPassAdmin")
  });
};

exports.seeAllPayments = async (req, res, next) => {
//stationAuth, paymentAuth, customerAuth
  //req.session.isAdmin = true;
  //req.session.admin = user;
  let x;
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
  //lastLogin lastLogout
    resultForAll = await Payment.find().populate('customerId').populate('stationId');

    let totalEvs = 0;
    let totalTedas = 0;
    let totalPayout = 0;
    let iyziCommissionRateAmount = 0;
    let iyziCommissionFee = 0;
    for(let i=0; i<resultForAll.length; i++)
    {
      Date(resultForAll[i].paymentDate.setHours(resultForAll[i].paymentDate.getHours() - 3));
      if(resultForAll[i].merchantPayoutAmount)
      {
        totalPayout += resultForAll[i].merchantPayoutAmount;
      }
      else if(!resultForAll[i].merchantPayoutAmount)
      {
        totalPayout += 0;
      }

      if(resultForAll[i].EVSCommissionFee)
      {
        totalEvs += resultForAll[i].EVSCommissionFee;
      }
      else if(!resultForAll[i].EVSCommissionFee)
      {
        totalEvs += 0;
      }

      if(resultForAll[i].kwhPerHourPrice)
      {
        totalTedas += resultForAll[i].kwhPerHourPrice;
      }
      else if(!resultForAll[i].EVSCommissionFee)
      {
        totalTedas += 0;
      }
      //iyziCommissionRateAmount, iyziCommissionFee
      if(resultForAll[i].iyziCommissionRateAmount){
        iyziCommissionRateAmount += resultForAll[i].iyziCommissionRateAmount;
      }
      else if(!resultForAll[i].iyziCommissionRateAmount){
        iyziCommissionRateAmount += 0;
      }

      if(resultForAll[i].iyziCommissionFee)
      {
        iyziCommissionFee += resultForAll[i].iyziCommissionFee;
      }
      else if(!resultForAll[i].iyziCommissionFee)
      {
        iyziCommissionFee += 0;
      }
    }
    res.render('admin/payments/allPayments.ejs',{
      docs: resultForAll,
      pageTitle:'Tüm ödemeler',
      totalEvs: totalEvs,
      totalTedas: totalTedas,
      totalPayout: totalPayout,
      iyziCommissionFee: iyziCommissionFee,
      iyziCommissionRateAmount: iyziCommissionRateAmount,
      captionWithPayment: 'Ödeme sonuçları aşağıda listelenmektedir',
      captionWithoutPayment: 'Ödeme kaydı bulunamadı'
    });

  }
  else
  {
    res.redirect('/admin/admin-dashboard');//========== BURAYA YETKİSİ OLMAYANLAR İÇİN HATA MESAJI EKLENECEK =================//
  }

};

async function sketchUserActivityGraph(arrX, arrY, mainTitle, xTitle, yTitle, res)
{
  const width = 500; //px
  const height = 500; //px
  const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour});
  let xLabels = arrX;
  let image;
  (async () => {
    const configuration = {
          type: 'line',
          data: {
             labels: xLabels,
             datasets:[{
               label: "Kullanıcı Aktivitesi",
               data: arrY,
               borderWidth: 3,
               backgroundColor: '#FF118D',
               pointStyle: 'circle',
               pointRadius: 5
             }]
          },
          currentDevicePixelRatio: 2,
          options:{
            plugins: {
                        legend: {
                            display: false,
                        },
                        title: {
                           display: true,
                           text: mainTitle
                        }
                    },//plugins
                    scales: {
                            x: {
                              display: true,
                              title: {
                                display: true,
                                text: xTitle
                              }
                            },
                            y: {
                              display: true,
                              title: {
                                display: true,
                                text: yTitle
                              }
                            }
                          }

          }//options
      }
      image = await chartJSNodeCanvas.renderToBuffer(configuration);
      //const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
      //const stream = chartJSNodeCanvas.renderToStream(configuration);
      res.type('image/png');
      res.send(image);
  })();
}




function keepRefunds(refunds)
{
  return refunds;
}


function getXLSStation(location, howManyUser, howManyChargeStarted, howManyChargeTerminated, wastedPower, howManyOutOfService, totalOperatingTime, lastOpeningTime, lastOutOfService, lastRepairingTime, lastRepairingFinishTime, res)
{
  let workbook = new excel.Workbook({
      dateFormat: 'm/d/yy hh:mm:ss'
  });
  const captionStyle = workbook.createStyle({
  font: { color: "black", size: 12, bold: true }
  });

  const contentStyle = workbook.createStyle({
    font: {color: "black", size:12, bold: false}
  });
  console.log(totalOperatingTime, lastOpeningTime, lastOutOfService, lastRepairingTime, lastRepairingFinishTime);
  worksheet = workbook.addWorksheet('İstasyon Bilgileri');

  worksheet.cell(1, 1).string("Konum").style(captionStyle);
  worksheet.cell(1, 2).string("Kullanan Müşteri Sayısı").style(captionStyle);
  worksheet.cell(1, 3).string('Şarj Başlatılma Sayısı').style(captionStyle);
  worksheet.cell(1, 4).string('Şarj Sona Erdirilme Sayısı').style(captionStyle);
  worksheet.cell(1, 5).string('Toplam Güç').style(captionStyle);
  worksheet.cell(1, 6).string("Servis Dışı Olma Sayısı").style(captionStyle);
  worksheet.cell(1, 7).string("Toplam Çalışma (sn.)").style(captionStyle);
  worksheet.cell(1, 8).string("Devreye Alınma Sayısı").style(captionStyle);
  worksheet.cell(1, 9).string("En Son Servis Dışı Olma").style(captionStyle);
  worksheet.cell(1, 10).string("Son tamir başlangıç zm.").style(captionStyle);
  worksheet.cell(1, 11).string("Son tamir bitiş zm.").style(captionStyle);

// lastOpeningTime, lastOutOfService, lastRepairingTime, lastRepairingFinishTime, res
//lastOpeningTime = moment(lastOpeningTime).format("YYYY-MM-DD HH:mm:ss");
for(let i=9; i<12;i++)
{
  worksheet.column(i).setWidth(40);
}

lastOutOfService = moment(lastOutOfService).format("YYYY-MM-DD HH:mm:ss");
lastRepairingTime = moment(lastRepairingTime).format("YYYY-MM-DD HH:mm:ss");
lastRepairingFinishTime = moment(lastRepairingFinishTime).format("YYYY-MM-DD HH:mm:ss");
worksheet.cell(2, 1).string(location).style(contentStyle);
worksheet.cell(2, 2).number(howManyUser).style(contentStyle);
worksheet.cell(2, 3).number(howManyChargeStarted).style(contentStyle);
worksheet.cell(2, 4).number(howManyChargeTerminated).style(contentStyle);
worksheet.cell(2, 5).number(wastedPower).style(contentStyle);
worksheet.cell(2, 6).number(howManyOutOfService).style(contentStyle);
worksheet.cell(2, 7).number(totalOperatingTime).style(contentStyle);
worksheet.cell(2, 8).number(lastOpeningTime).style(contentStyle);
worksheet.cell(2, 9).string(lastOutOfService.toString()).style(contentStyle);
worksheet.cell(2, 10).string(lastRepairingTime.toString()).style(contentStyle);
worksheet.cell(2, 11).string(lastRepairingFinishTime.toString()).style(contentStyle);

return workbook.write(`${location}_istasyonu_bilgi.xlsx`, res);

}


function getXLSRefunds(resultAcc, refundMode, res)
{

  let workbook = new excel.Workbook({
      dateFormat: 'm/d/yy hh:mm:ss'
  });
  const captionStyle = workbook.createStyle({
  font: { color: "black", size: 12, bold: true }
  });

  const contentStyle = workbook.createStyle({
    font: {color: "black", size:12, bold: false},
    numberFormat: '₺#,##0.000000; (₺#,##0.000000); -'
  });

  let fileName = '';
  let worksheet1;
  if(refundMode == 'y')
  {
     worksheet1 = workbook.addWorksheet('İade edilenler');
     fileName = 'iade_kabul_dokumu.xlsx';
  }
  else if(refundMode == 'n')
  {
    worksheet1 = workbook.addWorksheet('İade edilmeyenler');
    fileName = 'iade_red_dokumu.xlsx';
  }
//  let worksheet2 = workbook.addWorkSheet('İade edilmeyenler');

  worksheet1.cell(1, 1).string("İsim").style(captionStyle);
  worksheet1.cell(1, 2).string("Soyisim").style(captionStyle);
  worksheet1.cell(1, 3).string('TCKN').style(captionStyle);
  worksheet1.cell(1, 4).string('Ödeme Tarihi').style(captionStyle);
  worksheet1.cell(1, 5).string('Talep Tarihi').style(captionStyle);
  worksheet1.cell(1, 6).string("Miktar").style(captionStyle);
  worksheet1.cell(1, 7).string("İyzico").style(captionStyle);
  worksheet1.cell(1, 8).string("İyzico Ödeme Başı").style(captionStyle);
  worksheet1.cell(1, 9).string("EVS").style(captionStyle);
  worksheet1.cell(1, 10).string("TEİAŞ").style(captionStyle);
  worksheet1.cell(1, 11).string("Net Kar").style(captionStyle);
  worksheet1.cell(1, 12).string("Kart Tipi").style(captionStyle);
  worksheet1.cell(1, 13).string("Kart Birliği").style(captionStyle);
  worksheet1.cell(1, 14).string("Kart Ailesi").style(captionStyle);
  worksheet1.cell(1, 15).string("Admin isim").style(captionStyle);
  worksheet1.cell(1, 16).string("Admin Soyisim").style(captionStyle);
  worksheet1.cell(1, 17).string("İşlem Tarihi").style(captionStyle);
//customerName, customerSurname, customerIdentityNumber, paymentDate, requestDate, price, iyziCommissionRateAmount, iyziCommissionFee, EVSCommissionFee, kwhPerHourPrice, cardType, cardAssociation, cardFamily, responserName, responserSurname, resultingTime
  for(let i=0; i<resultAcc.length; i++)
  {
      worksheet1.cell(i+2, 1).string(resultAcc[i].customerName).style(contentStyle);
      worksheet1.cell(i+2, 2).string(resultAcc[i].customerSurname).style(contentStyle);
      worksheet1.cell(i+2, 3).string(resultAcc[i].customerIdentityNumber).style(contentStyle);
      var d1 = new Date(resultAcc[i].paymentDate);
      var d2 = new Date(resultAcc[i].requestDate);
      //d.setHours(d.getHours() - 3);
      worksheet1.cell(i+2, 4).string(d1.toLocaleString('tr-TR')).style(contentStyle);
      worksheet1.cell(i+2, 5).string(d2.toLocaleString('tr-TR')).style(contentStyle);
      worksheet1.cell(i+2, 6).string(resultAcc[i].price).style(contentStyle);
      worksheet1.cell(i+2, 7).number(resultAcc[i].paymentId.iyziCommissionRateAmount).style(contentStyle);
      worksheet1.cell(i+2, 8).number(resultAcc[i].paymentId.iyziCommissionFee).style(contentStyle);
      worksheet1.cell(i+2, 9).number(resultAcc[i].paymentId.EVSCommissionFee).style(contentStyle);
      worksheet1.cell(i+2, 10).number(resultAcc[i].paymentId.kwhPerHourPrice).style(contentStyle);
      worksheet1.cell(i+2, 11).number(resultAcc[i].paymentId.merchantPayoutAmount).style(contentStyle);
      worksheet1.cell(i+2, 12).string(resultAcc[i].cardType).style(contentStyle);
      worksheet1.cell(i+2, 13).string(resultAcc[i].cardAssociation).style(contentStyle);
      worksheet1.cell(i+2, 14).string(resultAcc[i].cardFamily).style(contentStyle);
      worksheet1.cell(i+2, 15).string(resultAcc[i].responserName).style(contentStyle);
      worksheet1.cell(i+2, 16).string(resultAcc[i].responserSurname).style(contentStyle);
      var d3 = new Date(resultAcc[i].resultingTime);
      worksheet1.cell(i+2, 17).string(d3.toLocaleString('tr-TR')).style(contentStyle);
  }


return workbook.write(`${fileName}`, res);


/*
  console.log('V-V-V-V-V-V-V-V-V');
  console.log(resultAcc);
  console.log('V-V-V-V-V-V-V-V-V');

  console.log('X-X-X-X-X-X-X-X-X');
  console.log(resultRef);
  console.log('X-X-X-X-X-X-X-X-X');
*/
}


///////////////////////////////////////////////// PAYMENT CONTROLS START /////////////////////////////////////////////////////////




function getXLS(result, fileName, res)
{
  let workbook = new excel.Workbook({
    dateFormat: 'm/d/yy hh:mm:ss'
});
  let worksheet = workbook.addWorksheet('Tüm ödemeler');

  const captionStyle = workbook.createStyle({
  font: { color: "black", size: 12, bold: true }
  });

  const contentStyle = workbook.createStyle({
    font: {color: "black", size:12, bold: false},
    numberFormat: '₺#,##0.000000; (₺#,##0.000000); -'
  });

  const successfullStyle = workbook.createStyle({
    fill: {
      type: 'pattern',
      patternType: 'solid',
      bgColor: '#66FF00',
      fgColor: '#66FF00',
    }
  });

  const unsuccessfullStyle = workbook.createStyle({
  fill: {
    type: 'pattern',
    patternType: 'solid',
    bgColor: '#FF0000',
    fgColor: '#FF0000',
  }
});

  //console.log(resultForAll);
  worksheet.cell(1, 1).string("Durum").style(captionStyle);
  worksheet.cell(1, 2).string("Kar").style(captionStyle);
  worksheet.cell(1, 3).string(`İyzico`).style(captionStyle);
  worksheet.cell(1, 4).string(`EVS`).style(captionStyle);
  worksheet.cell(1, 5).string(`TEİAŞ`).style(captionStyle);
  worksheet.cell(1, 6).string("İsim").style(captionStyle);
  worksheet.cell(1, 7).string("Soyisim").style(captionStyle);
  worksheet.cell(1, 8).string("Tel. No").style(captionStyle);
  worksheet.cell(1, 9).string("Tarih").style(captionStyle);
  worksheet.cell(1, 10).string("Açıklama").style(captionStyle);
  worksheet.cell(1, 11).string("İstasyon").style(captionStyle);
  worksheet.cell(1, 12).string("Banka").style(captionStyle);
  worksheet.cell(1, 13).string("Kart Tipi").style(captionStyle);
  worksheet.cell(1, 14).string("Kart Şirketi").style(captionStyle);
  worksheet.cell(1, 15).string("İyzico Komisyon").style(captionStyle);


  for(let i=0; i<result.length; i++)
  {
    if(result[i].status == "success")
    {
      worksheet.cell(i+2, 1).string("BAŞARILI").style(successfullStyle);
    }
    else
    {
      worksheet.cell(i+2, 1).string("BAŞARISIZ").style(unsuccessfullStyle);
    }

    if(!result[i].merchantPayoutAmount)
    {
      worksheet.cell(i+2, 2).string("Kar yok").style(unsuccessfullStyle);
    }
    else if(result[i].merchantPayoutAmount)
    {
      worksheet.cell(i+2, 2).number(result[i].merchantPayoutAmount).style(contentStyle);
    }

    if(result[i].iyziCommissionFee)
    {
      worksheet.cell(i+2, 3).number(result[i].iyziCommissionFee).style(contentStyle);
    }
    else if(!result[i].iyziCommissionFee)
    {
      worksheet.cell(i+2, 3).number(0).style(unsuccessfullStyle);
    }

    if(result[i].EVSCommissionFee)
    {
      worksheet.cell(i+2, 4).number(result[i].EVSCommissionFee).style(contentStyle);
    }
    else if(result[i].EVSCommissionFee)
    {
      worksheet.cell(i+2, 4).number(0).style(unsuccessfullStyle);
    }

    if(result[i].kwhPerHourPrice)
    {
      worksheet.cell(i+2, 5).number(result[i].kwhPerHourPrice).style(contentStyle);
    }
    else if(!result[i].kwhPerHourPrice)
    {
      worksheet.cell(i+2, 5).number(0).style(unsuccessfullStyle);
    }
    worksheet.cell(i+2, 6).string(result[i].customerId.name).style(contentStyle);
    worksheet.cell(i+2, 7).string(result[i].customerId.surname).style(contentStyle);
    worksheet.cell(i+2, 8).string(result[i].customerId.phoneNumber).style(contentStyle);
    var d = new Date(result[i].paymentDate);
    //d.setHours(d.getHours() - 3);
    worksheet.cell(i+2, 9).string(d.toLocaleString('tr-TR'));
    if(result[i].status == "success")
    {
      worksheet.cell(i+2, 10).string("Ödeme başarılı").style(contentStyle);
    }
    else{
      worksheet.cell(i+2, 10).string(result[i].errorMessage).style(contentStyle);
    }

    worksheet.cell(i+2, 11).string(result[i].stationId.location).style(contentStyle);
    worksheet.cell(i+2, 12).string(result[i].cardFamily).style(contentStyle);
    worksheet.cell(i+2, 13).string(result[i].cardType).style(contentStyle);
    worksheet.cell(i+2, 14).string(result[i].cardAssociation).style(contentStyle);

    if(result[i].iyziCommissionFee)
    {
      worksheet.cell(i+2, 15).number(result[i].iyziCommissionFee).style(contentStyle);
    }
    else if(!result[i].iyziCommissionFee)
    {
      worksheet.cell(i+2, 15).number(0).style(unsuccessfullStyle);
    }
  }
  for(let i=8; i<14; i++)
  {
    worksheet.column(i).setWidth(40);
  }

  return workbook.write(`${fileName}`, res);
}





exports.createDocumentForAll = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    getXLS(resultForAll, "tum_odemeler.xlsx", res);
  }
};


//req.session.processing = true;
exports.paymentForADayGet = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    res.render('admin/payments/paymentForADay.ejs',{
      pageTitle:'Günlük Ödeme Sorgula'
    });
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.paymentForADayResult = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
  let requestDayStart = moment(req.query.requestDay).format("YYYY-MM-DD");
  let requestDayEnd = moment(req.query.requestDay).add(1,"days").format("YYYY-MM-DD");
  //console.log(requestDayStart, requestDayEnd)
  const d = new Date("2022-05-01");
  const d2 = new Date("2022-05-02");

  const d3 = new Date("2022-04-30");
//Net kar, EVS'ye ödenen,	TEDAŞ'a ödenen

  let totalPayout = 0;
  let totalEvs = 0;
  let totalTedas = 0;
  let iyziCommissionFee = 0;
  let iyziCommissionRateAmount = 0;

  resultForADay = await Payment.find({paymentDate: {
    $gte: requestDayStart,//d
    $lt: requestDayEnd//d2
  }}).populate('customerId').populate('stationId');

  for(let i=0; i<resultForADay.length; i++)
  {
    Date(resultForADay[i].paymentDate.setHours(resultForADay[i].paymentDate.getHours() - 3));
    if(resultForADay[i].merchantPayoutAmount)
    {
      totalPayout += resultForADay[i].merchantPayoutAmount;
    }
    else if(!resultForADay[i].merchantPayoutAmount)
    {
      totalPayout += 0;
    }

    if(resultForADay[i].EVSCommissionFee)
    {
      totalEvs += resultForADay[i].EVSCommissionFee;
    }
    else if(!resultForADay[i].EVSCommissionFee)
    {
      totalEvs += 0;
    }

    if(resultForADay[i].kwhPerHourPrice)
    {
      totalTedas += resultForADay[i].kwhPerHourPrice;
    }
    else if(!resultForADay[i].EVSCommissionFee)
    {
      totalTedas += 0;
    }

    //iyziCommissionRateAmount, iyziCommissionFee
    if(resultForADay[i].iyziCommissionRateAmount){
      iyziCommissionRateAmount += resultForADay[i].iyziCommissionRateAmount;
    }
    else if(!resultForADay[i].iyziCommissionRateAmount){
      iyziCommissionRateAmount += 0;
    }

    if(resultForADay[i].iyziCommissionFee)
    {
      iyziCommissionFee += resultForADay[i].iyziCommissionFee;
    }
    else if(!resultForADay[i].iyziCommissionFee)
    {
      iyziCommissionFee += 0;
    }

  }
    res.render('admin/payments/paymentForADayResult.ejs',{
      pageTitle: 'Günlük Ödeme Sorgulaması Sonucu',
      docs: resultForADay,
      totalEvs: totalEvs,
      totalTedas: totalTedas,
      totalPayout: totalPayout,
      iyziCommissionFee: iyziCommissionFee,
      iyziCommissionRateAmount: iyziCommissionRateAmount,
      captionWithPayment: 'Ödeme sonuçları aşağıda listelenmektedir',
      captionWithoutPayment:'İlgili gün için ödeme bulunamadı'
    });
  }
  else{
    res.redirect('/admin/admin-dashboard');//========== BURAYA YETKİSİ OLMAYANLAR İÇİN HATA MESAJI EKLENECEK =================//
  }
};


exports.createDocumentForADay = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    getXLS(resultForADay, "gunluk_odeme.xlsx", res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};



exports.paymentForAnIntervalGet = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    res.render('admin/payments/paymentForAnInterval.ejs',{
      pageTitle: 'Tarih aralığı için ödeme sorgulaması',
    });
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.paymentForAnIntervalResult = async (req, res, next) => {
  //prevDate, forwDate
  //console.log(prevDate, forwDate);
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
      let prevDate = moment(req.query.prevDate).startOf('day').format('YYYY-MM-DD');
      let forwDate = moment(req.query.forwDate).endOf('day').add(1, 'days').format('YYYY-MM-DD');
      resultForAnInterval = await Payment.find({paymentDate: {
        $gte: prevDate,
        $lt: forwDate
      }}).populate('customerId').populate('stationId');

      let totalEvs = 0;
      let totalTedas = 0;
      let totalPayout = 0;
      let iyziCommissionFee = 0;
      let iyziCommissionRateAmount = 0;

      for(let i=0; i<resultForAnInterval.length; i++)
      {
        Date(resultForAnInterval[i].paymentDate.setHours(resultForAnInterval[i].paymentDate.getHours() - 3));
        if(resultForAnInterval[i].merchantPayoutAmount)
        {
          totalPayout += resultForAnInterval[i].merchantPayoutAmount;
        }
        else if(!resultForAnInterval[i].merchantPayoutAmount)
        {
          totalPayout += 0;
        }

        if(resultForAnInterval[i].EVSCommissionFee)
        {
          totalEvs += resultForAnInterval[i].EVSCommissionFee;
        }
        else if(!resultForAnInterval[i].EVSCommissionFee)
        {
          totalEvs += 0;
        }

        if(resultForAnInterval[i].kwhPerHourPrice)
        {
          totalTedas += resultForAnInterval[i].kwhPerHourPrice;
        }
        else if(!resultForAnInterval[i].EVSCommissionFee)
        {
          totalTedas += 0;
        }

        //iyziCommissionRateAmount, iyziCommissionFee
        if(resultForAnInterval[i].iyziCommissionRateAmount){
          iyziCommissionRateAmount += resultForAnInterval[i].iyziCommissionRateAmount;
        }
        else if(!resultForAnInterval[i].iyziCommissionRateAmount){
          iyziCommissionRateAmount += 0;
        }

        if(resultForAnInterval[i].iyziCommissionFee)
        {
          iyziCommissionFee += resultForAnInterval[i].iyziCommissionFee;
        }
        else if(!resultForAnInterval[i].iyziCommissionFee)
        {
          iyziCommissionFee += 0;
        }
      }


      //console.log(resultForAnInterval);

      res.render('admin/payments/paymentForAnIntervalResult.ejs',{
        pageTitle:'Tarih aralığı için ödeme sonuçları',
        docs: resultForAnInterval,
        totalEvs: totalEvs,
        totalTedas: totalTedas,
        totalPayout: totalPayout,
        iyziCommissionFee: iyziCommissionFee,
        iyziCommissionRateAmount: iyziCommissionRateAmount,
        captionWithPayment: 'Ödeme sonuçları aşağıda listelenmektedir',
        captionWithoutPayment:'İlgili tarih aralığı için ödeme bulunamadı'
      });
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.createDocumentForAnInterval = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    getXLS(resultForAnInterval, "tarih_araligi_odeme.xlsx", res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }

};

exports.paymentForAMonth = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    res.render('admin/payments/paymentForAMonth.ejs',{
      pageTitle: 'Aylık Ödeme Sorgulaması'
    });
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};




exports.paymentForAMonthResult = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    let lowerDate = moment().month(req.query.month).startOf('month').format('YYYY-MM-DD');
    let upperDate = moment().month(req.query.month).endOf('month').add(1, "days").format('YYYY-MM-DD');
    resultForAMonth = await Payment.find({paymentDate: {$gte: lowerDate, $lt:upperDate}}).populate('customerId').populate('stationId')
                                   .catch(err => console.log(err));

    let totalEvs = 0;
    let totalTedas = 0;
    let totalPayout = 0;
    let iyziCommissionFee = 0;
    let iyziCommissionRateAmount = 0;

    for(let i=0; i<resultForAMonth.length; i++)
    {
      Date(resultForAMonth[i].paymentDate.setHours(resultForAMonth[i].paymentDate.getHours() - 3));
      if(resultForAMonth[i].merchantPayoutAmount)
      {
        totalPayout += resultForAMonth[i].merchantPayoutAmount;
      }
      else if(!resultForAMonth[i].merchantPayoutAmount)
      {
        totalPayout += 0;
      }

      if(resultForAMonth[i].EVSCommissionFee)
      {
        totalEvs += resultForAMonth[i].EVSCommissionFee;
      }
      else if(!resultForAMonth[i].EVSCommissionFee)
      {
        totalEvs += 0;
      }

      if(resultForAMonth[i].kwhPerHourPrice)
      {
        totalTedas += resultForAMonth[i].kwhPerHourPrice;
      }
      else if(!resultForAMonth[i].EVSCommissionFee)
      {
        totalTedas += 0;
      }

      //iyziCommissionRateAmount, iyziCommissionFee
      if(resultForAMonth[i].iyziCommissionRateAmount){
        iyziCommissionRateAmount += resultForAMonth[i].iyziCommissionRateAmount;
      }
      else if(!resultForAMonth[i].iyziCommissionRateAmount){
        iyziCommissionRateAmount += 0;
      }

      if(resultForAMonth[i].iyziCommissionFee)
      {
        iyziCommissionFee += resultForAMonth[i].iyziCommissionFee;
      }
      else if(!resultForAMonth[i].iyziCommissionFee)
      {
        iyziCommissionFee += 0;
      }
    }

    res.render('admin/payments/paymentForAMonthResult.ejs',{
        pageTitle:'Tarih aralığı için ödeme sonuçları',
        docs: resultForAMonth,
        totalEvs: totalEvs,
        totalTedas: totalTedas,
        totalPayout: totalPayout,
        iyziCommissionFee: iyziCommissionFee,
        iyziCommissionRateAmount: iyziCommissionRateAmount,
        captionWithPayment: 'Ödeme sonuçları aşağıda listelenmektedir',
        captionWithoutPayment:'İlgili ay için ödeme bulunamadı'
       })
 }
 else{
   res.redirect('/admin/admin-dashboard');
 }

};



exports.createDocumentForAMonth = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.paymentAuth)
  {
    getXLS(resultForAMonth, "aylik_odemeler.xlsx", res);
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }
};

///////////////////////////////////////////////// PAYMENT CONTROLS END /////////////////////////////////////////////////////////

//////////////////////////////////////////////// REFUND CONTROLS START ////////////////////////////////////////////////////////
exports.getRefundRequests = (req, res, next) => {
  //res.redirect(req.get('referer'));
  if(req.session.isAdmin && req.session.admin.refundAuth)
  {
    Refund.find({ isResulted: false }).then(async (result) => {
      for(let i=0; i<result.length; i++)
      {
        result[i].paymentDate.setHours(result[i].paymentDate.getHours() - 3);
        result[i].requestDate.setHours(result[i].requestDate.getHours() - 3);
      }
      //refunds = await keepRefunds(result);
      console.log(refunds);
      res.render('admin/refund/allRefunds.ejs',{
        pageTitle: 'İade Talep Listesi',
        docs: result,
        captionWithRefund: 'İADE TALEPLERİ',
        captionWithoutRefund: 'Tüm iade talepleri işlenmiş, veya iade talebi yok.',
        refundSuccess: req.flash("refundRequestSuccessfull"),
        refundFail: req.flash("refundRequestFailed"),
        refundRejectSuccess: req.flash("refundRejectSuccessfull")
      })
    });
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }
};


exports.registerRefund = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.refundAuth)
  {
    let registerDate = new Date();
    registerDate.setHours(registerDate.getHours() + 3);

    //console.log(req.body.response);
    //<!--paymentTransactionId ipAddress price conversationId refundId!-->
    let paymentTransactionId = req.body.paymentTransactionId;
    let ipAddress = req.body.ipAddress;
    let price = req.body.price;
    let conversationId = req.body.conversationId;
    let refundId = req.body.refundId;
    let response = req.body.response;
    let refundResponse = "";
    //console.log(paymentTransactionId, ipAddress, price, conversationId, refundId);
    iyzipay.refund.create({
        conversationId: conversationId,
        paymentTransactionId: paymentTransactionId,
        price: price,
        ip: ipAddress
      },
      function (err, result) {
        if(result)
        {
          //console.log(result);
          Refund.findById({_id: refundId}).then(result => {
            result.response = response;
            result.isRefunded = true;
            result.isResulted = true;
            result.responserName = req.session.admin.name;
            result.responserSurname = req.session.admin.surname;
            result.resultingTime = registerDate;
            refundResponse = "İADE İŞLEMİ BAŞARILI";
            console.log("İADE İŞLEMİ BAŞARILI");
            req.flash("refundRequestSuccessfull", "İade işlemi başarıyla gerçekleştirildi.");
            res.redirect('/admin/refund-requests');
            return result.save().then(rs => console.log(rs)).catch(err => console.log(err))
          }).catch(err => console.log(err));
        }
        else if(err)
        {
          const refresh = () =>
          {
            req.flash("refundRequestFailed", "İade işlemi gerçekleştirilemedi.");
            res.redirect('/admin/refund-requests');
          }
          refresh();
        }
      });
  }
  else{
    res.redirect('admin/admin-dashboard');
  }
};



exports.refuseRefund = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.refundAuth)
  {
    let registerDate = new Date();
    registerDate.setHours(registerDate.getHours() + 3);
    let refundId = req.body.refundId;
    let response = req.body.response;
    Refund.findById(refundId).then(result => {
      result.response = response;
      result.isRefunded = false;
      result.isResulted = true;
      result.responserName = req.session.admin.name;
      result.responserSurname = req.session.admin.surname;
      result.resultingTime = registerDate;
      req.flash("refundRejectSuccessfull", "Red işlemi başarıyla gerçekleştirildi.");
      res.redirect('/admin/refund-requests');
      return result.save().then(rs => console.log(rs)).catch(err => console.log(err));
    })
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }
};

exports.createDocForAccRefunds = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.refundAuth)
  {
    let resultAcc = await Refund.find({
      isResulted: true,
      isRefunded: true
    }).populate('paymentId');

    for(let i=0; i<resultAcc.length; i++)
    {
      resultAcc[i].paymentDate.setHours(resultAcc[i].paymentDate.getHours() - 3);
      resultAcc[i].requestDate.setHours(resultAcc[i].requestDate.getHours() - 3);
      resultAcc[i].resultingTime.setHours(resultAcc[i].resultingTime.getHours() - 3);
    }


    getXLSRefunds(resultAcc, 'y', res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.createDocForRejRefunds = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.refundAuth)
  {
    let resultRef = await Refund.find({
      isResulted: true,
      isRefunded: false
    }).populate('paymentId');

    for(let i=0; i<resultRef.length; i++)
    {
      resultRef[i].paymentDate.setHours(resultRef[i].paymentDate.getHours() - 3);
      resultRef[i].requestDate.setHours(resultRef[i].requestDate.getHours() - 3);
      resultRef[i].resultingTime.setHours(resultRef[i].resultingTime.getHours() - 3);
    }


    getXLSRefunds(resultRef, 'n', res);
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }

};

//////////////////////////////////////////////// REFUND CONTROLS END ////////////////////////////////////////////////////////

//////////////////////////////////////////////// CUSTOMER CONTROLS START ////////////////////////////////////////////////////////

exports.listCustomers = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let customers = await Customer.find({ isAdmin: false });
    res.render('admin/customerManagement/allCustomers.ejs',{
      pageTitle: 'Tüm Müşteriler',
      docs: customers,
      suspendSuccess: req.flash("suspendSuccess"),
      activateSuccess: req.flash("activateSuccess"),
      discountEnabled: req.flash("discountEnabled"),
      discountDisabled: req.flash("discountDisabled")
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};


exports.customerDetails = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    //res.send(req.query.cun);
    let customerId;
    if(req.query.cun)
    {
      customerId = req.query.cun;
    }

    Customer.findById(customerId).lean().then(result => {
      result.birthDate.setHours(result.birthDate.getHours() - 3);
      result.registrationDate.setHours(result.registrationDate.getHours() - 3);
      result.lastLogin.setHours(result.lastLogin.getHours() - 3);
      result.lastLogout.setHours(result.lastLogout.getHours() - 3);
      result.birthDate = moment(result.birthDate).format('YYYY-MM-DD HH:mm:ss');
      result.registrationDate = moment(result.registrationDate).format('YYYY-MM-DD HH:mm:ss');
      result.lastLogin = moment(result.lastLogin).format('YYYY-MM-DD HH:mm:ss');
      result.lastLogout = moment(result.lastLogout).format('YYYY-MM-DD HH:mm:ss');
      res.render('admin/customerManagement/customerDetails.ejs',{
        pageTitle: 'Müşteri Detayları',
        docs: result
      });
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
}


exports.suspendUser = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    //console.log(req.body.id);
    let suspendedUser = await Customer.findById(req.body.id);

    Customer.updateOne({_id: req.body.id},{isSuspended: true}).then(result => {
      req.flash("suspendSuccess", `${suspendedUser.name} ${suspendedUser.surname} kişisinin hesabı askıya alındı.`);
      res.redirect('/admin/customer-list');
    })
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }
};


exports.activateUser = async (req, res, user) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let activatedUser = await Customer.findById(req.body.id);
    Customer.updateOne({_id: req.body.id},{isSuspended: false}).then(result => {
      req.flash("activateSuccess", `${activatedUser.name} ${activatedUser.surname} kişisinin hesabı aktif hale getirildi.`);
      res.redirect('/admin/customer-list');
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.permitDiscount = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let permittedUser = await Customer.findById(req.body.id);
    Customer.updateOne({_id: req.body.id},{loyaltyAgreement: true}).then(result => {
      req.flash("discountEnabled", `${permittedUser.name} ${permittedUser.surname} kişisinin indirim kullanımı aktif hale getirildi.`);
      res.redirect('/admin/customer-list');
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.preventDiscount = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let deniedUser = await Customer.findById(req.body.id);
    Customer.updateOne({_id: req.body.id},{loyaltyAgreement: false}).then(result => {
      req.flash("discountDisabled", `${deniedUser.name} ${deniedUser.surname} kişisinin indirim kullanımı pasif hale getirildi.`);
      res.redirect('/admin/customer-list');
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }

};

exports.sketchUserActivitySuccess = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
  let xArray = [];
  let yArray = [];
  await Payment.aggregate([{$match: {customerId: new mongoose.Types.ObjectId(req.query.id), status: "success"}},
  {$group : {
             _id :{ $dateToString: { format: "%Y-%m-%d", date: "$paymentDate"} },
             list: { $push: "$$ROOT" },
             count: { $sum: 1 }
          }
  }
  ]).then(async (re) => {
    for(let i=0; i<re.length; i++)
    {
      let dailyTotal = 0;
      await xArray.push(re[i]._id);
      for(j=0; j<re[i].list.length; j++)
      {
        dailyTotal += re[i].list[j].price;
      }
      await yArray.push(dailyTotal);
    }

});
  //arrX, arrY, xTitle, yTitle, userName, userSurname, res
  let userName = await Customer.findById(req.query.id).select(['name','surname']);
  sketchUserActivityGraph(xArray.sort(), yArray, `${userName.name} ${userName.surname} için başarılı ödeme grafiği`, 'Tarih', 'Ödenen Miktar', res);
}
else{
  res.redirect('/admin/admin-dashboard');
}
};

exports.sketchUserActivityUnsuccess = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let xArray = [];
    let yArray = [];
    await Payment.aggregate([{$match: {customerId: new mongoose.Types.ObjectId(req.query.id), status: "failure"}},
    {$group : {
               _id :{ $dateToString: { format: "%Y-%m-%d", date: "$paymentDate"} },
               list: { $push: "$$ROOT" },
               count: { $sum: 1 }
            }
    }
    ]).then(async (re) => {
      for(let i=0; i<re.length; i++)
      {
        await xArray.push(re[i]._id);
        await yArray.push(re[i].count);
      }
    });
      //arrX, arrY, mainTitle, xTitle, yTitle, res
      let userName = await Customer.findById(req.query.id).select(['name','surname']);
      sketchUserActivityGraph(xArray.sort(), yArray, `${userName.name} ${userName.surname} için başarısız ödeme sayısı grafiği`, 'Tarih', 'Başarısız deneme sayısı', res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};


exports.sketchUserStationUsage = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let arrX = [];
    let arrY = [];
    await Station.find().lean().then(result => {
      for(let i=0; i<result.length; i++)
      {
        arrX.push(result[i].location);
        let usedCount = 0;
        //console.log(result[i].location);
        for(let j=0; j<result[i].customerId.length; j++)
        {

          if(result[i].customerId[j] == req.query.id)
          {
            //console.log(result[i].location, result[i].chargeStartingTime[j], result[i].chargeFinishingTime[j]);
            usedCount++;
          }
        }
        arrY.push(usedCount);
      }
    });
    //arrX, arrY, mainTitle, xTitle, yTitle, res
    let userName = await Customer.findById(req.query.id).select(['name','surname']);
    sketchUserActivityGraph(arrX, arrY, `${userName.name} ${userName.surname} için istasyon kullanım sayısı grafiği`, 'İstasyon İsmi', 'Kullanım Sayısı', res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }

};


exports.sketchUserStationPayment = async (req, res, next) => {
  //paymentDate
  if(req.session.isAdmin && req.session.admin.customerAuth)
  {
    let mahfesigmazId = "625f1107528bf38f705860b4";
    let mahfesigmazSum = 0;

    let barajyoluId = "625f1135863655b55d433629";
    let barajyoluSum = 0;

    let sularId = "625f115540d9e6ce784c7218";
    let sularSum = 0;

    await Payment.find({customerId: req.query.id, status: "success"}).populate('stationId').then(result => {
      for(let i=0; i<result.length; i++)
      {
        //console.log(result[i].stationId._id);
         if(result[i].stationId._id == mahfesigmazId)
           mahfesigmazSum += result[i].price;
         else if(result[i].stationId._id == barajyoluId)
           barajyoluSum += result[i].price;
         else if(result[i].stationId._id == sularId)
           sularSum += result[i].price;
      }
    })

    let arrX = ["Mahfesığmaz", "Barajyolu", "Sular"];
    let arrY = [mahfesigmazSum, barajyoluSum, sularSum];

    let userName = await Customer.findById(req.query.id).select(['name','surname']);

    sketchUserActivityGraph(arrX, arrY, `${userName.name} ${userName.surname} için istasyon başı toplam ödeme grafiği`, 'İstasyon İsmi', 'Ödenen Toplam Miktar', res);
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};





//////////////////////////////////////////////// CUSTOMER CONTROLS END ////////////////////////////////////////////////////////


//////////////////////////////////////////////// STATION CONTROLS START ////////////////////////////////////////////////////////

exports.seeStations = (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
    Station.find().populate('customerId').lean().then(stations => {
      res.render("admin/stationManagement/station-list.ejs", {
        pageTitle: "İstasyonlar Listesi",
        stations: stations,
        stationSuspended: req.flash("suspendStation"),
        stationEnabled: req.flash("enableStation"),
        repairEnabled: req.flash("repairEnabled")
      });
    });
  }
  else
  {
    res.redirect('/admin/admin-dashboard');
  }
};

exports.stationDetails = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
    //res.send(req.query.stid);
    await Station.findById(req.query.stid).lean().then(result => {
      if(result.lastDisconnectionTime.length > 0)
      {
        result.lastDisconnectionTime[result.lastDisconnectionTime.length-1].setHours(result.lastDisconnectionTime[result.lastDisconnectionTime.length-1].getHours() - 3);
        result.lastDisconnectionTime[result.lastDisconnectionTime.length-1] = moment(result.lastDisconnectionTime[result.lastDisconnectionTime.length-1]).format("YYYY-MM-DD HH:mm:ss");
      }

      if(result.lastOpeningTime.length > 0)
      {
        result.lastOpeningTime[result.lastOpeningTime.length-1].setHours(result.lastOpeningTime[result.lastOpeningTime.length-1].getHours() - 3);
        result.lastOpeningTime[result.lastOpeningTime.length-1] = moment(result.lastOpeningTime[result.lastOpeningTime.length-1]).format("YYYY-MM-DD HH:mm:ss");
      }
      if(result.lastRepairingTime.length > 0)
      {
        result.lastRepairingTime[result.lastRepairingTime.length-1].setHours(result.lastRepairingTime[result.lastRepairingTime.length-1].getHours() - 3);
        result.lastRepairingTime[result.lastRepairingTime.length-1] = moment(result.lastRepairingTime[result.lastRepairingTime.length-1]).format("YYYY-MM-DD HH:mm:ss");
      }

      if(result.lastRepairingFinishTime.length > 0)
      {
        result.lastRepairingFinishTime[result.lastRepairingFinishTime.length-1].setHours(result.lastRepairingFinishTime[result.lastRepairingFinishTime.length-1].getHours() - 3);
        result.lastRepairingFinishTime[result.lastRepairingFinishTime.length-1] = moment(result.lastRepairingFinishTime[result.lastRepairingFinishTime.length-1]).format("YYYY-MM-DD HH:mm:ss");
      }



      //result.lastDisconnectionTime = moment(result.lastDisconnectionTime).format('YYYY-MM-DD HH:MM:ss');
      //console.log(result);
      res.render('admin/stationManagement/stationDetails.ejs',{
        pageTitle: "İstasyon Detayları",
        station: result
      })
    })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};


exports.disableStation = async (req, res, next) => {
  //console.log(req.query.stid);
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let disconnectionTime = new Date();
  disconnectionTime.setHours(disconnectionTime.getHours()+3);
  console.log(disconnectionTime);//+3 saat
  let location = await Station.find({_id: req.query.stid}).select('location');
  Station.updateOne({_id: req.query.stid},{isOpen: false, $push: {
    lastDisconnectionTime: disconnectionTime,
    disconnectionReason: 'FARAZİ'
    }
  }).then(async result => {
    await req.flash("suspendStation", `${location[0].location} konumundaki istasyon devre dışı bırakıldı.`);
    res.redirect('/admin/station-list');
  })
  }
  else{
    res.redirect('/admin/admin-dashboard');
  }
};

exports.enableStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  //res.send(req.query.stid);
  let diff = 0;
  let now = new Date();
  now.setHours(now.getHours()+3);

  await Station.findById(req.query.stid).lean().then(result => {

    let now = new Date();
    now.setHours(now.getHours()+3);
    let nowMoment = moment(now);
    let lastDisconnectionTimeMoment = moment(result.lastDisconnectionTime[result.lastDisconnectionTime.length -1]);
    diff = nowMoment.diff(lastDisconnectionTimeMoment, 'seconds');
  });

  let location = await Station.find({_id: req.query.stid}).select(['location', 'totalWastedTime']);


  Station.updateOne({_id: req.query.stid},{isOpen: true, totalWastedTime: location[0].totalWastedTime + diff, $push: {
     lastOpeningTime: now
   }}).then(async result => {
    await req.flash("enableStation", `${location[0].location} konumundaki istasyon etkinleştirildi.`);
    res.redirect('/admin/station-list');
  })

}
else{
  res.redirect('/admin/admin-dashboard');
}
};

exports.enableRepairStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let now = new Date();
  now.setHours(now.getHours()+3);
  let nowMoment = moment(now);
  let location = await Station.find({_id: req.query.stid}).select('location');
  Station.updateOne({_id: req.query.stid},{isRepairing: true, $push:{
    lastRepairingTime: now
  }}).then(async result => {
    await req.flash("repairEnabled", `${location[0].location} konumundaki istasyonun bakımı etkinleştirildi.`)
    res.redirect('/admin/station-list');
  })
 }
 else{
   res.redirect('/admin/admin-dashboard');
 }
};

exports.disableRepairStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let diff = 0;
  let now = new Date();
  now.setHours(now.getHours()+3);

  await Station.findById(req.query.stid).lean().then(result => {

    let now = new Date();
    now.setHours(now.getHours()+3);
    let nowMoment = moment(now);
    let lastDisconnectionTimeMoment = moment(result.lastRepairingTime[result.lastRepairingTime.length -1]);
    diff = nowMoment.diff(lastDisconnectionTimeMoment, 'seconds');
  });


  let location = await Station.find({_id: req.query.stid}).select('location');
  Station.updateOne({_id: req.query.stid},{isRepairing: false, $push:{
    lastRepairingFinishTime: now
  }}).then(async result => {
    await req.flash("repairEnabled", `${location[0].location} konumundaki istasyonun bakımı devre dışı bırakıldı.`)
    res.redirect('/admin/station-list');
  })
}
else{
  res.redirect('/admin/admin-dashboard');
}
};

exports.sketchProfitPerStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let mahfesigmazId = "625f1107528bf38f705860b4";
  let mahfesigmazSum = 0;

  let barajyoluId = "625f1135863655b55d433629";
  let barajyoluSum = 0;

  let sularId = "625f115540d9e6ce784c7218";
  let sularSum = 0;

  let arrX = ['Mahfesığmaz', 'Barajyolu', 'Sular'];
  let arrY = [];
  await Payment.find({status: "success"}).then(results => {
    for(let i=0; i<results.length; i++)
    {
      if(results[i].stationId == mahfesigmazId)
      {
        mahfesigmazSum += results[i].merchantPayoutAmount;
      }
      else if(results[i].stationId == barajyoluId)
      {
        barajyoluSum += results[i].merchantPayoutAmount;
      }
      else if(results[i].stationId == sularId)
      {
        sularSum += results[i].merchantPayoutAmount;
      }
    }
  });
  arrY.push(mahfesigmazSum);
  arrY.push(barajyoluSum);
  arrY.push(sularSum);
  sketchUserActivityGraph(arrX, arrY, `İstasyon başı kazanç grafiği`, 'İstasyon Konumu', 'Kar', res);
}
else{
  res.redirect('/admin/admin-dashboard');
}
};

exports.sketchCustomerUsageOfStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let arrX = [];
  let arrY = [];
  let location = await Station.find({_id: req.query.stid}).select('location');
  await Payment.aggregate([{$match: {stationId: new mongoose.Types.ObjectId(req.query.stid)}},
      {$group : {
             _id :{ customerId: "$customerId" },
             list: { $push: "$$ROOT" },
             count: { $sum: 1 }
          }
        }
  ]).then(async results => {
      for(let i=0;i<results.length; i++)
      {
        let userFullName = await Customer.find({_id: results[i]._id.customerId}).select(['name', 'surname']);
        //console.log(userFullName);
        let nameAndSurname = userFullName[0].name+' '+userFullName[0].surname;
        arrX.push(nameAndSurname);
        arrY.push(results[i].count);
      }
  });
  //console.log(arrX, arrY);
  sketchUserActivityGraph(arrX, arrY, `${location[0].location} konumundaki istasyonun kullanıcılar tarafından tercih edilme sayısı`, 'Kullanıcı Adı', 'Tercih edilme sayısı', res);
}
else{
  res.redirect('/admin/admin-dashboard');
}

};


exports.sketchNumberOfUsagePerStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let arrX = [];
  let arrY = [];
  await Payment.aggregate([
      {$group : {
             _id :{ stationId: "$stationId" },
             list: { $push: "$$ROOT" },
             count: { $sum: 1 }
          }
        }
  ]).then(async result => {
    for(let i=0; i<result.length; i++)
    {
      let stationName = await Station.find({_id: result[i]._id.stationId}).select("location");
      arrX.push(stationName[0].location);
      arrY.push(result[i].count);
    }
  });
  sketchUserActivityGraph(arrX, arrY, `İstasyon başı kullanım sayısı grafiği`, 'İstasyon Konumu', 'Tercih edilme sayısı', res);
}
else{
  res.redirect('/admin/admin-dashboard');
}

};


exports.sketchProfitPerCustomerForStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  let arrX = [];
  let arrY = [];
  await Payment.aggregate([{$match: {stationId: new mongoose.Types.ObjectId(req.query.stid)}},
    {$group : {
           _id :{ customerId: "$customerId" },
           list: { $push: "$$ROOT" },
           count: { $sum: "$merchantPayoutAmount" }
        }
      }
  ]).then(async result => {
    for(let i=0; i<result.length; i++)
    {
      //console.log(result[i]._id.customerId);
      let fullName = await Customer.findById(result[i]._id.customerId).select(["name", "surname"]);
      arrX.push(fullName.name+' '+fullName.surname);
      arrY.push(result[i].count);
    }
  });
  sketchUserActivityGraph(arrX, arrY, `İstasyon başı kullanıcının bıraktığı kazanç grafiği`, `Kullanıcı İsmi`, 'Kazanç', res);
}
else{
  res.redirect('/admin/admin-dashboard');
}
};

exports.createDocumentForStation = async (req, res, next) => {
  if(req.session.isAdmin && req.session.admin.stationAuth)
  {
  await Station.findById(req.query.stid).then(result => {
    let howManyUser, howManyChargeStarted, howManyChargeTerminated, howManyOutOfService, lastOutOfService, lastRepairingTime, lastRepairingFinishTime, lastOpeningTime;
    howManyUser = result.customerId.length;
    howManyChargeStarted = result.chargeStartingTime.length;
    howManyChargeTerminated = result.chargeFinishingTime.length;
    howManyOutOfService = result.lastDisconnectionTime.length;
    if(result.lastDisconnectionTime[result.lastDisconnectionTime.length -1])
    {
     lastOutOfService = result.lastDisconnectionTime[result.lastDisconnectionTime.length -1]
    }
    else if(!result.lastDisconnectionTime[result.lastDisconnectionTime.length -1])
    {
      lastOutOfService = "Hiç kesinti olmadı";
    }
    if(result.lastRepairingTime[result.lastRepairingTime.length -1])
    {
     lastRepairingTime = result.lastRepairingTime[result.lastRepairingTime.length -1]
    }
    else if(!result.lastRepairingTime[result.lastRepairingTime.length -1])
    {
      lastRepairingTime = "Hiç tamir edilmedi";
    }
    if(result.lastOpeningTime)
    {
     lastOpeningTime = result.lastOpeningTime
    }
    else if(!result.lastOpeningTime)
    {
      lastOpeningTime = "Hiç kapanmadı";
    }
    if(result.lastRepairingFinishTime)
    {
     lastRepairingFinishTime = result.lastRepairingFinishTime[result.lastRepairingFinishTime.length-1];
    }
    else if(!result.lastRepairingFinishTime)
    {
      lastRepairingFinishTime = "Henüz tamir edilmedi.";
    }

    getXLSStation(result.location, howManyUser, howManyChargeStarted, howManyChargeTerminated, result.wastedPower, howManyOutOfService, result.totalOperatingTime, result.lastOpeningTime.length, lastOutOfService, lastRepairingTime, lastRepairingFinishTime, res);
  });
}
else{
  res.redirect('/admin/admin-dashboard');
}
};





//////////////////////////////////////////////// STATION CONTROLS END ////////////////////////////////////////////////////////

exports.logout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/login');
  });
};
