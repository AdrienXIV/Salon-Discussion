var express = require('express');
var path = require('path');
var mongodb = require('mongodb');
var bodyParser = require('body-parser');

var app = express();
var dbConn = mongodb.MongoClient.connect('mongodb://localhost:27017');

app.use(express.static(__dirname + '/'));

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req,res)=>{
    res.send('index.html', {root: __dirname + '/'});
});

app.post('/post-feedback', (req,res)=>{
    dbConn.then((db)=>{
        delete req.body._id; //sécurité
        db.collection('feedbacks').insertOne(req.body);
    });
    res.send('Data received: \n' + JSON.stringify(req.body));
});

app.listen(3000, (error)=>{
    if(error) throw error;
    else console.log('Serveur lancé sur le port 3000.');
});