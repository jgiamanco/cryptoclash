var express = require('express');
var mongoose = require('mongoose');
var app = express();
var path = require('path')
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Utils
//var priceHistory = require('./helpers/priceHistory');

// Models
var Message = require('./models/Message.js');
var Price = require('./models/Price.js');

// Database configuration with mongoose
mongoose.connect(process.env.MONGODB_URI || "mongodb://team:test@ds117878.mlab.com:17878/heroku_hc9dctcq");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
 console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
 console.log("Mongoose connection successful.");
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Set static directory
app.use('/assets',express.static(path.join(__dirname, '/assets')));

// Routes
app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});
app.get('/crypto-compare', function(req,res){
	res.sendFile(__dirname + '/crypto-compare.html')
});


app.get('/api/messages', function(req,res,next){
	Message.find({}, function(err, data) {
		if(err) {
			console.log('Error:', err);
		} else {
			res.json( data );
		}
	}).sort({_id:-1}).limit(50);
});

app.get('/api/history/:currency' , function(req,res){
	Price.find( { currency : req.params.currency }, function(err, data){
		if(err) {
			console.log('Error:', err);
		} else {
			res.json( data );
		}
	} ).sort({ date : -1 }).limit(25);
});


io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('chat message', function(msg){

		// Using our Message model, create a new entry
     // This effectively passes the result object to the entry
     var message = new Message( msg );

     // Now, save that entry to the db
     message.save(function(err, doc) {
       // Log any errors
       if (err) {
         console.log(err);
       }
       // Or log the doc
       else {
         console.log(doc);
       }
     });

     io.emit('chat message', msg);
		
	});	
});

http.listen(process.env.PORT  || 8080, function(){
	console.log('listening on :8080');
});