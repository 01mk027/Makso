const express = require('express');

const router = express.Router();

const stationController = require('../controllers/stationController');

const isAuth = require('../middleware/is-auth');
const Station = require('../models/station');

router.get('/sarj', isAuth, stationController.getCharge);

router.post('/sarj', isAuth, stationController.postCharge);

router.get('/sarjSonuc', isAuth, stationController.chargeError);

module.exports = router;
