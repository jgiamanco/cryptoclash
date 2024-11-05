const { MongoClient, ServerApiVersion } = require('mongodb');
const Price = require('./models/Price.js');
const axios = require('axios');
const currencies = [ 'BTC', 'ETH', 'XRP', 'DOGE' ]; // Currencies in ticker symbols
const dbUser = process.env.mongoUser;
const dbUserPw = process.env.mongoPw

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

// let now = new Date(); // first find the start of today in unix time
// let mins = new Date( now.getFullYear(), now.getMonth(), now.getDate(),now.getHours(), now.getMinutes() )/60000;
// let lastFive = mins-(mins%5);


const fetchTicker = async (event, context, callback) => { // fetches and saves prices for provided symbol starting from index
    let unixTime = new Date()/1000 | 0;
    console.log(`AWS trigger:\n${event}\n`);
    console.log(`Log Stream:\n${context.logStreamName}`);
    client.on("error", error => {
        console.log("MongoDB Error: ", error);
        callback(error);    });    
    //using a map with Promise.all dispatches all requests concurrently and maintains the order  
    let prices = await Promise.all(currencies.map(tickerSymbol => 
       axios.get(`https://min-api.cryptocompare.com/data/pricehistorical?fsym=${tickerSymbol}&tsyms=USD,EUR&ts=${unixTime}`)
       .then(res => {// when the request is done
            let data = res.data; // convert response to json
            console.log(data);
            var price = new Price({ // prepare the price for db entry
                currency: tickerSymbol.toString(),
                price: data[tickerSymbol].USD,
                date: unixTime
            });

            price.save((err,res) => 
                console.log(err?
                    `ERROR:\n\n ${err}`:
                    `New price auto fetched for: ${res._doc.currency} date: ${Date(res._doc.date)}`
                )
            );                
        })
        .catch(err => {
            throw err
        })
    ));
    return prices;
}

module.exports.handler = fetchTicker;