const mongoose = require('mongoose');
const Price = require('./../models/Price.js');
const axios = require('axios');
const currencies = [ 'BTC', 'ETH', 'XRP', 'DOGE' ]; // Currencies in ticker symbols
const dbUser = process.env.mongoUser;
const dbUserPw = process.env.mongoPw

mongoose.connect(process.env.MONGODB_URI || "mongodb://${dbUser}:${dbUserPw@ds117878.mlab.com:17878/heroku_hc9dctcq");
let db = mongoose.connection;


// Once logged in to the db through mongoose, log a success message
db.once("open", () => {
    console.log("Mongoose connection successful.");
});


let now = new Date(); // first find the start of today in unix time
let mins = new Date( now.getFullYear(), now.getMonth(), now.getDate(),now.getHours(), now.getMinutes() )/60000;
let lastFive = mins-(mins%5);
let unixTime = lastFive*60;
let lastDay = [ unixTime ]; // begin an array of this week's unix dates
// for( var i = 0; i < (12*24); i++ ){ // populate the last week array
//     unixTime -= 300;
//     lastDay.unshift(unixTime);
// }

const fetchTicker = async tickerSymbol => { // fetches and saves prices for provided symbol starting from index
    url = 'https://min-api.cryptocompare.com/data/pricehistorical?fsym=' + tickerSymbol
    
    //using a map with Promise.all dispatches all requests concurrently and maintains the order  
    let prices = await Promise.all(lastDay.map(timeStamp => 
       axios.get(url + `&tsyms=USD,EUR&ts=${timeStamp}`)
       .then(res => {// when the request is done
            let data = res.data; // convert response to json
            console.log(data);
            var price = new Price({ // prepare the price for db entry
                currency: tickerSymbol.toString(),
                price: data[tickerSymbol].USD,
                date: timeStamp
            });
            return price;
            // price.save
            // .then(() => console.log("New price auto fetched for: "+ res._doc.currency + " date: " + Date(res._doc.date) ))
            // .catch(err => console.log(`ERROR:\n\n ${err}`));                
        })
        .catch(err => {
            throw err
        })
    ));
    return prices;
}

module.exports =  fetchAlltickers = async (event,context,callback) => {
    console.log(`Triggering event:\n${event}\n`);
    console.log(`Log Stream:\n${context.logStreamName}`);
    // Show any mongoose errors
    db.on("error", error => {
        console.log("Mongoose Error: ", error);
        callback(error);
    });
    let currencyIndex = 0;
    let fetchInterval = setInterval( () => {  // loop through currencies at an interval due to API request limits
        var currentTicker = currencies[currencyIndex]
        fetchTicker(currentTicker)
        .then(prices =>
            prices.forEach(price =>
                fs.appendFile('prices.json',JSON.stringify(price)+'\n',() => console.log(price))
            )
        )
        .catch(err => {            
            console.log(`failed to fetch prices for ${currentTicker}, error:\n${err}`);
            callback(err);
        })
        if( currencyIndex === currencies.length-1 ){ clearInterval( fetchInterval ); } //ckear interval
        currencyIndex++;
    } ,1000);
}