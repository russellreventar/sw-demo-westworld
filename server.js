var path = require('path');
var webpack = require('webpack');
var express = require('express');
var config = require('./webpack.config');
var morgan = require('morgan');
var app = express();
var compiler = webpack(config);
var fs = require('fs');

app.use(require('webpack-hot-middleware')(compiler));
app.use(morgan('dev'));
app.use(express.static('dist'))
app.use(express.static(__dirname))

app.get('/bandits', function(req, res) {
  fs.readFile('data/bandits.json', function(err, data) {
    setTimeout(() => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.parse(data));
    }, 2000)
  })
})

app.put('/status/:banditId', function(req, res) {
  fs.readFile('data/bandits.json', function(err,data) {
    var bandits = JSON.parse(data);
    var banditIndex = bandits.findIndex(x => x.id == req.params.banditId);
    bandits[banditIndex].captured = req.query.isCaptured == 'true';

    fs.writeFile('data/bandits.json', JSON.stringify(bandits, null, '\t'), function(err) {
      res.sendStatus(200);
    })
  })
})

app.put('/escaped/:banditId', function(req, res) {
  fs.readFile('data/bandits.json', function(err,data) {
    var bandits = JSON.parse(data);
    var banditIndex = bandits.findIndex(x => x.id == req.params.banditId);
    bandits[banditIndex].captured = false;
    fs.writeFile('data/bandits.json', JSON.stringify(bandits, null, '\t'), function(err) {
      res.setHeader('Content-Type', 'application/json');
      res.send(bandits);
    })
  })
})

app.listen(3000, function(err) {
  if (err) { return console.error(err); }
  console.log('Listening at http://localhost:3000/');
})
