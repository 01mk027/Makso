const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
require("dotenv").config();



const MONGO_URI = 'mongodb+srv://neverrun:19899891@cluster0.eigs1.mongodb.net/ocharge';
const app = express();
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: 'sessions'
})


const csrfProtection = csrf();

/*
app.set('view engine','ejs');
app.set('views', 'views');
*/
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const stationRoutes = require('./routes/stationRoutes');
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  name:'Bir',
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}));




app.use(csrfProtection);
app.use(flash());


app.use(function(req, res, next) {
    if (!req.user)
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    next();
})


app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.isUser = req.session.isUser;
  res.locals.isAdmin = req.session.isAdmin;
  res.locals.csrfToken = req.csrfToken();
  next();
});









app.use('/',customerRoutes);
app.use('/',stationRoutes);
app.use('/admin',adminRoutes);

mongoose.connect(MONGO_URI)
.then(result => {
  console.log('Connected!');
  app.listen(3000);
})
.catch(err => {
  console.log(err);
});
