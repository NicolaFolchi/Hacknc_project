let createError = require('http-errors');
let express = require('express');
let path = require('path');
let logger = require('morgan');
let session = require('express-session');
let app = express();



// ********************************************CHAT ROOM****************************
let server = require('http').Server(app);
let io = require('socket.io')(server);


// // view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

let rooms = {};

app.get('/chatrooms', function(req, res){
  res.render('chatrooms', {rooms: rooms})
});

app.post('/room', function(req, res){
  if(rooms[req.body.room] != null){
    return res.redirect('/chatrooms')
  }
  rooms[req.body.room] = {users: {}};
  res.redirect(req.body.room);
  // submit to socket, send message that new room was created
  io.emit('room-created', req.body.room)
});

app.get('/:room', function(req, res){
  // ISSUE WITH COMMENTED CODE = WOULD NOT ALLOW ME TO ACCESS THE CHAT AFTER CREATING IT
  // if(rooms[req.body.room] == null){
  //   return res.redirect('/chatrooms')
  // }
  res.render('room', {myRoom: req.params.room});
});

io.on('connection', function(socket) {
  socket.on('new-user', function(room, name) {
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
  })
  socket.on('send-chat-message', function(room, message) {
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
  })
  socket.on('disconnect', function() {
    getUserRooms(socket).forEach(function(room) {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })
})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

// *********************************************************************************

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
let oidc = new ExpressOIDC({
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
