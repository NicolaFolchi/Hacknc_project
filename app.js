let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
let session = require('express-session');

// ========= routes ==============
let dashboardRouter = require("./routes/dashboard");
let publicRouter = require("./routes/public");
let usersRouter = require("./routes/users");

//okta API
let okta = require("@okta/okta-sdk-nodejs");
let ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
//user authentication with okta
let oktaClient = new okta.Client({
  orgUrl: 'https://dev-838812.okta.com',
  token: "00dtUt2yZHG9W0CZ4sMF1_8M-N87o7wXQhWCLJBpux"
});
const oidc = new ExpressOIDC({
  issuer: "https://dev-838812.okta.com/oauth2/default",
  client_id: "0oa1kkvwcp9TYd7nu357",
  client_secret: "cjrFAlzTnWNrfQ73ANS4T7znss3nVzP6ulTPF1jH",
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

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
app.use(oidc.router);

// this allows us to access the user information stored at okta at any time.
app.use(function(req, res, next) {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});
//middleware that prevents an non-user to visit a given route if they are not an user
function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}

// enabling of routes
app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/users', usersRouter);

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
