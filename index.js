require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use("/", bodyParser.urlencoded({extended: false}))
const mongodb = require("mongodb")
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log("MongoDB database connection established successfully")
})

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//URL shortener API
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
});

const URL = mongoose.model("URL", urlSchema)

app.post("/api/shorturl", function(req, res){
  let originalUrl = req.body.url;

  let urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi

  if(!urlRegex.test(originalUrl)){
    res.json({error: 'invalid url'});
    return;
  }
  
  URL.findOne({original_url: originalUrl}, (error, result)=>{
    if (error){
      console.error(error);
    }
    if (result){
      res.json({
      original_url: result.original_url,
      short_url: result.short_url
    })
    } else {
      let newShortUrl = 1;
      URL.findOne({})
        .sort({short_url:-1})
        .exec((error, result)=>{
          if(error){
            console.error(error);
          }
          if(result != undefined){
            console.log("1")
            newShortUrl = result.short_url + 1
          }
          let newUrl = new URL({original_url: originalUrl,
      short_url: newShortUrl})
          newUrl.save((error, result)=>{
            if(error)console.error(error);
            res.json({original_url: originalUrl,
      short_url: newShortUrl})
          })
        })
    }
  })
})

app.get('/api/shorturl/:short_url', function(req, res) {
  let urlParams = req.params.short_url;
  URL.findOne({short_url: urlParams}, (error, result) => {
    if(error) console.error(error);
    if(!error && result != undefined){
      res.redirect(result.original_url)
    } else {
      res.send('Url not found in dabatabase')
    }
  })
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
