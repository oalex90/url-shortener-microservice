'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var urlExists = require('url-exists');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true }); //connect to database

var UrlSchema = new mongoose.Schema({ //define schema for Url collection/model
  url: { type: String, required: true },
  short: { type: Number, required: true }
});

var IndexSchema = new mongoose.Schema({ //define schema for Index collection/model which will store short index
  name: String,
  index: Number
})

var Url = new mongoose.model('Url', UrlSchema); //connect to Url collection/model
var Index = new mongoose.model("Index", IndexSchema); //conect to Index collection/model

const BASEURL = "https://url-shortener-fcc-ajo.glitch.me/api/shorturl/"

const initUrls = [ //initial Url values in db
  {url: "https://www.google.com", short: 1},
  {url: "https://www.freecodecamp.org", short: 2},
  {url: "https://www.freecodecamp.org/forum/", short: 3}
];

const initIndex = {name: "index", index: 4}; //initial Index value in db

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
app.use(bodyParser.urlencoded({extended: false})) //mounts body-parser middleware which allows us to extract form data

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/initDb', (req,res)=>{ //delete current db and create a new one with initial values
  Url.deleteMany({}, (err, data)=>{ //delete all documents in Url collection/model
    console.log("deleted", data)
  })
  Index.deleteMany({}, ()=>{}) //delete all documents in Index collection/model
  Index.create(initIndex, ()=>{}) //create initial Index document
  Url.create(initUrls, (err, data)=> { //create initial Url documents
    ("initData", data)
    res.json({data: data})
  })
})

  
app.post("/api/shorturl/new", function (req, res) { //when form post button clicked, try to create shortend url
  var url = req.body.url; //use body-parser to get url from html form input
  urlExists(url, (err,exists)=>{ //use url-exists to determine if valid url
    if(exists){ //if url is valid...
      Url.findOne({url: url}, (err, data)=>{ //check if url value exists in Url model
        if (data){ //if document exists, display the exisiting short value for that url
          console.log("found", data);
          res.json({original_url: url, short_url: data.short})

        } else{ //if document doesn't exists create a new document in Url model
          console.log("no match found")
          let index;
          Index.findOne({name: "index"},(err,data)=>{ //get index from Index model
            index = data.index;
            data.index = index + 1; //increment index value
            data.save((er,dat)=>{}) //update index value in Index model
            let newUrl = {url: url, short: index}; 
            Url.create(newUrl, (err,data)=>{ //create new Url document
              res.json({original_url: data.url, short_url: data.short })
            })
          })
        }
      })
    }else{ //if invalid url, display error message
      res.json({error: "invalid URL"})
    }
  })
  
});

app.get("/api/shorturl/:number", (req,res)=>{ //when url with short value entered, go to corresponding url if exists
  let input = req.params.number; //get short value from url
  if(/^\d+$/.test(input)){ //if input is a number (does not contain anything but numbers)...
    Url.findOne({short: parseInt(input)}, (err,data)=>{ //check if short value exists in Url model
      if (data){ //if exists, redirect to the corresponding url address
        res.redirect(data.url);
      } else{ // if doesn't exist, display error message
        res.json({error: "Invalid Path"});
      }
    })
  } else{ //if input is not a number, display error message
    res.json({error: "Invalid Path"});
  }
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
