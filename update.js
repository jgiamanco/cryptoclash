const mongoose = require('mongoose');
const Price = require('./models/Price.js');
const axios = require('axios');
const currencies = [ 'BTC', 'ETH', 'XRP', 'DOGE' ]; // Currencies in ticker symbols
const dbUser = process.env.mongoUser;
const dbUserPw = process.env.mongoPw

mongoose.connect(process.env.MONGODB_URI || `mongodb://${dbUser}:${dbUserPw}@ds117878.mlab.com:17878/heroku_hc9dctcq`);
let db = mongoose.connection;


// Once logged in to the db through mongoose, log a success message
db.once("open", () => {
    console.log("Mongoose connection successful.");
});


// let now = new Date(); // first find the start of today in unix time
// let mins = new Date( now.getFullYear(), now.getMonth(), now.getDate(),now.getHours(), now.getMinutes() )/60000;
// let lastFive = mins-(mins%5);


const fetchTicker = async (event, context, callback) => { // fetches and saves prices for provided symbol starting from index
    let unixTime = new Date()/1000 | 0;
    console.log(`AWS trigger:\n${event}\n`);
    console.log(`Log Stream:\n${context.logStreamName}`);
    db.on("error", error => {
        console.log("Mongoose Error: ", error);
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