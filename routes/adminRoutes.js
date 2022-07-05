const express = require('express');

const router = express.Router();

const adminController = require('../controllers/adminController');

const isAuth = require('../middleware/is-auth');

const isAdmin = require('../middleware/is-admin');

router.get('/admin-dashboard', isAdmin, adminController.getDashboard)

router.post('/admin-logout', isAdmin, adminController.logout);

router.get('/all-payments', isAdmin, adminController.seeAllPayments);

router.post('/create-document-for-all', isAdmin, adminController.createDocumentForAll);

router.get('/payment-for-a-day', isAdmin, adminController.paymentForADayGet);

router.get('/payment-for-a-day-result', isAdmin, adminController.paymentForADayResult);

router.post('/create-document-for-a-day', isAdmin, adminController.createDocumentForADay);

router.get('/payment-for-interval', isAdmin, adminController.paymentForAnIntervalGet);

router.get('/payment-for-interval-result', isAdmin, adminController.paymentForAnIntervalResult);

router.post('/create-document-for-an-interval', isAdmin, adminController.createDocumentForAnInterval);

router.get('/payment-for-month', isAdmin, adminController.paymentForAMonth);

router.get('/payment-for-month-result', isAdmin, adminController.paymentForAMonthResult);

router.post('/create-document-for-a-month', isAdmin, adminController.createDocumentForAMonth);

router.get('/refund-requests', isAdmin, adminController.getRefundRequests);

router.post('/registerRefund', isAdmin, adminController.registerRefund);

router.post('/refuseRefund', isAdmin, adminController.refuseRefund);

router.post('/create-document-for-accepted-refunds', isAdmin, adminController.createDocForAccRefunds);

router.post('/create-document-for-rejected-refunds', isAdmin, adminController.createDocForRejRefunds);

router.get('/customer-list', isAdmin, adminController.listCustomers);

router.get('/customer-details', isAdmin, adminController.customerDetails);

router.post('/suspend-user', isAdmin, adminController.suspendUser);

router.post('/activate-user', isAdmin, adminController.activateUser);

router.post('/permit-discount', isAdmin, adminController.permitDiscount);

router.post('/prevent-discount', isAdmin, adminController.preventDiscount);

router.get('/sketch-user-activities-success', isAdmin, adminController.sketchUserActivitySuccess);

router.get('/sketch-user-activities-unsuccess', isAdmin, adminController.sketchUserActivityUnsuccess);

router.get('/sketch-users-station-usage', isAdmin, adminController.sketchUserStationUsage);

router.get('/sketch-users-station-payment', isAdmin, adminController.sketchUserStationPayment);

router.get('/station-list', isAdmin, adminController.seeStations);

router.get('/station-details', isAdmin, adminController.stationDetails);

router.get('/disable-station', isAdmin, adminController.disableStation);

router.get('/enable-station', isAdmin, adminController.enableStation);

router.get('/enable-repair-station', isAdmin, adminController.enableRepairStation);

router.get('/disable-repair-station', isAdmin, adminController.disableRepairStation);

router.get('/sketch-customer-usage-of-station', isAdmin, adminController.sketchCustomerUsageOfStation);

router.get('/sketch-profit-per-station', isAdmin, adminController.sketchProfitPerStation);

router.get('/sketch-number-of-usage-per-station', isAdmin, adminController.sketchNumberOfUsagePerStation);

router.get('/sketch-profit-per-customer-for-station', isAdmin, adminController.sketchProfitPerCustomerForStation);

router.get('/create-document-for-station', isAdmin, adminController.createDocumentForStation);

module.exports = router;
