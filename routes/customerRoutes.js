const express = require('express');

const router = express.Router();

const customerController = require('../controllers/customerController');

const adminController = require('../controllers/adminController');

const isUser = require('../middleware/is-user');

const isAuth = require('../middleware/is-auth');

const isAdmin = require('../middleware/is-admin');

router.get('/', customerController.getMain);

router.get('/register', customerController.getRegister);

router.post('/register', customerController.postRegister);

router.get('/login', customerController.getLogin);

router.post('/login', customerController.postLogin);

router.get('/dashboard', isUser, customerController.getDashboard);

router.post('/logout', customerController.postLogout);

router.get('/admin-dashboard', isAdmin, adminController.getDashboard);

router.get('/update', isAuth, customerController.getUpdate);

router.post('/update', isAuth, customerController.postUpdate);

router.get('/add-card', isUser, customerController.getAddCard);

router.post('/add-card', isUser, customerController.postAddCard)

router.get('/customer-payments', isUser, customerController.getPayments);

router.get('/my-cards', isUser, customerController.getCards);

router.post('/delete-card', isUser, customerController.deleteCard);

router.get('/refundable-list', isUser, customerController.refundableList);

router.get('/refund-form', isUser, customerController.refundForm);

router.post('/complete-refund-request', isUser, customerController.completeRefundRequest);

router.get('/refund-list', isUser, customerController.myCompletedRequests)

module.exports = router;
