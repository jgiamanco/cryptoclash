var express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
const uri = process.env.MONGODB_URI || `mongodb+srv://${dbUser}:${dbUserPw}@cryptoclash.huwah.mongodb.net/?retryWrites=true&w=majority&appName=cryptoClash`;
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);

// Show any mongoose errors
client.on("error", function(error) {
 console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
client.once("open", function() {
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