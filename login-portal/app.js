let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
let session = require('express-session');

//okta API
let okta = require("@okta/okta-sdk-nodejs");
let ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;

let dashboardRouter = require("./routes/dashboard");         
let publicRouter = require("./routes/public");

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "esta es mi string para que mis cookies se mantengan seguras, deliciosas y bueno, crugientes jojo",
  resave: true,
  saveUninitialized: false
}));

app.use('/', publicRouter);
app.use('/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
