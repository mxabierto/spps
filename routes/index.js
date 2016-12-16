var express = require('express');
var router = express.Router();

var pgp = require('pg-promise')();

var cn = {
    host: 'localhost',
    //port: 5433,
    database: 'karen',
    user: 'mtorres',
    password: 'test'
};

var db = pgp(cn);

//var unidades=[{key:1,value:"CENAPRECE"},{key:2,value:"CENSIA"},{key:3,value:"CENSIDA"},{key:4,value:"CNEGSR"},{key:5,value:"DGE"},{key:6,value:"DGPS"},{key:7,value:"STCONAPRA"},{key:8,value:"STCONSAME"}]

/* GET home page. */
router.get('/', function(req, res, next) {

  db.manyOrNone('select nombre from unidad',[]).then(function ( data ) {

      res.render('index', { title: 'Tablero SPPS',unidades: data });

  }).catch(function (error) {
      console.log(error);
  });
});

module.exports = router;
