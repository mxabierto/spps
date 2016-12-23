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
/*AQUÏ BLASSO JUGANDO AL PROGRAMMER*/
var db = pgp(cn);

/* GET home page. */
router.get('/', function(req, res, next) {

    db.manyOrNone('select * from unidad',[]).then(function ( data ) {

        res.render('index', { title: 'MIIPPS',unidades: data });

    }).catch(function (error) {
        console.log(error);
    });
});


router.post('/paes/', function (req,res ) {
    var unidad = req.body.unidad;
    console.log(unidad);
    db.manyOrNone('select * from pae where unidad = $1',[unidad]).then(function (data) {
        res.render('paes', {paes: data});
    }).catch(function (error) {
        console.log(error);
    })
});


router.post('/fichas/',function (req, res) {
    var id_pae = req.body.id_pae;
    console.log('id_pae ', id_pae);


        db.manyOrNone('select id, nombre from ficha where id_pae = $1 ', [id_pae]).then(function (data) {
            res.render('fichas', {fichas: data});
        }).catch(function (error) {
            console.log(error);
        });

});


router.post('/ficha/', function (req, res ) {
    var id_ficha = req.body.id_ficha;

    if (id_ficha != '' && id_ficha != null) {
        db.oneOrNone('select * from ficha where id = $1', [ id_ficha ]).then(function (data) {
            if (data) {
                res.render('ficha', {ficha: data});
            }else{
                res.send('<strong>Seleccione un indicador</strong>');
            }
        }).catch(function (error) {
            console.log(error);
        });
    }else {
        res.send('<strong>Seleccione un indicador</strong>');
    }
});

module.exports = router;
