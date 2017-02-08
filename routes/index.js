var express = require('express');
var router = express.Router();

var pgp = require('pg-promise')();

var cn = {
    host: 'localhost',
    //port: 5433,
    database: 'spps',
    user: 'sppsuser',
    password: 'sppspass'
};

var db = pgp(cn);


// Configuring Passport
var passport = require('passport');
var expressSession = require('express-session');

router.use(expressSession({secret: 'mySecretKey', resave : false , saveUninitialized: false}));
router.use(passport.initialize());
router.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
var flash = require('connect-flash');
router.use(flash());

var bCrypt = require('bcrypt-nodejs');
var LocalStrategy = require('passport-local').Strategy;


passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        // check in postgres if a user with username exists or not
        db.oneOrNone('select * from usuarios where usuario = $1', [ username ]).then(function (user) {
            // session

            if (!user){
                console.log('User Not Found with username '+username);
                return done(null, false, req.flash('message', 'Usuario no registrado'));
            }

            if (!isValidPassword(user ,password)){
                console.log('Contraseña no válida');
                return done(null, false, req.flash('message', 'Contraseña no válida')); // redirect back to login page
            }

            return done(null,user);
        }).catch(function (error) {
            console.log(error);
            return done(error);
        });
    }
));

var isValidPassword = function(user, password){
    return bCrypt.compareSync(password, user.contrasena);
};

// Passport needs to be able to serialize and deserialize users to support persistent login sessions
passport.serializeUser(function(user, done) {
    console.log('serializing user: ');
    console.log(user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    db.one(' select * from usuarios where id = $1',[ id ]).then(function (user) {
        //console.log('deserializing user:',user);
        done (null, user);
    }).catch(function (error) {
        done(error);
        console.log(error);
    });
});

var isAuthenticated = function (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects
    if (req.isAuthenticated())
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
};

var isNotAuthenticated = function (req, res, next) {
    if (req.isUnauthenticated())
        return next();
    // if the user is authenticated then redirect him to the main page
    res.redirect('/principal');
};


// Generates hash using bCrypt
var createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
};


/* Handle Login POST */
router.post('/login', passport.authenticate('login', {
    successRedirect: '/miipps',
    failureRedirect: '/',
    failureFlash : true
}));

/* Handle Logout */
router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
});


/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', {title: 'MIIPPS', message: req.flash('message') });
});


/* GET pruebas. */
router.get('/pruebas', function (req, res) {
    db.manyOrNone('select * from unidad',[]).then(function ( data ) {
        res.render('pruebas', {title: 'pruebas MIIPPS',unidades: data, section: 'miipps'  });
    }).catch(function (error) {
        console.log(error);
    });
});

router.get('/miipps', isAuthenticated, function(req, res, next) {

    db.manyOrNone('select * from unidad',[]).then(function ( data ) {

        res.render('miipps', { title: 'MIIPPS',unidades: data, section: 'miipps' });

    }).catch(function (error) {
        console.log(error);
    });
});


router.post('/select-pae/', function (req,res ) {
    var unidad = req.body.unidad;
    console.log(unidad);
    db.manyOrNone('select * from pae where unidad = $1',[unidad]).then(function (data) {
        res.render('paes', {paes: data});
    }).catch(function (error) {
        console.log(error);
    })
});


router.post('/select-ficha/',function (req, res) {
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
/*Desglose de valores estatales a partir de datos municipales, jurisdicccionales o estatales */
/*Falta limitar indicador.anio....indicador.anio=2015 estaba, pero solo hay un año*/
router.post('/tabla-indicador/', function(req, res){
    var id_ficha = req.body.id_ficha;
    if (id_ficha != '' && id_ficha != null ) {
        db.manyOrNone ('select round(avg(indicador.anio)) as anii, sum(indicador.numerador) as numi, sum(indicador.denominador) as deni, round(cast(100*sum(indicador.numerador)/sum(indicador.denominador) as numeric),2) as vali, entidad.nombre, (select color from meta where ' +
            'id_ficha = avg(indicador.id_ficha)  and min <= 100*sum(indicador.numerador)/sum(indicador.denominador) and max > 100*sum(indicador.numerador)/sum(indicador.denominador) and (meta.anio = avg(indicador.anio) or meta.anio is null ) ) as color '+
            'from indicador, entidad where  indicador.entidad = entidad.id and id_ficha= $1 group by entidad.nombre order by entidad.nombre',[ id_ficha ]).then(function(data){
            if (data.length){
                res.render('tabla_indicador', { datos: data }  );
            }else{
                res.send('<strong>Seleccione un indicador</strong>');
            }
        }).catch(function(error){
            console.log(error);
        });
    }else {
        res.send('<strong>Seleccione un indicador</strong>');
    }

});
/*Pinta Estados a partir de cualquier desagregado */

router.post('/colores', function (req, res) {
    console.log('colores ',req.body.id);

    db.manyOrNone ('select entidad.id, '+
        '(select color from meta where id_ficha = avg(indicador.id_ficha)  and min <= 100*sum(indicador.numerador)/sum(indicador.denominador) and max > 100*sum(indicador.numerador)/sum(indicador.denominador) and (meta.anio = avg(indicador.anio) or meta.anio is null ) ) as color'+
        ' from indicador, entidad where  indicador.entidad = entidad.id and indicador.id_ficha= $1 and indicador.anio = $2 group by entidad.id',[
        req.body.id,
        req.body.anio
    ]).then(function (data) {
        console.log(data);
        res.json(data);
    }).catch(function (error) {
        console.log(error)
    })


});

/*Pintar municipios desde desagregado municipal*/
/*
router.post('/colores', function (req, res) {
 console.log('colores ',req.body.id);

 db.manyOrNone ('select (indicador.entidad*1000+indicador.id_municipio) as id, '+
 '(select color from meta where id_ficha = indicador.id_ficha  and min <= indicador.valor and max > indicador.valor and (meta.anio = indicador.anio or meta.anio is null ) ) as color,'+
 'indicador.anio from indicador where indicador.id_ficha= $1 and indicador.anio = $2 ',[
 req.body.id,
 req.body.anio
 ]).then(function (data) {
 console.log(data);
 res.json(data);
 }).catch(function (error) {
 console.log(error)
 })

 });*/

/*Pintar jurisdicciones desde desagregado municipal o jurisdiccional*/
/*
 router.post('/colores', function (req, res) {
 console.log('colores ',req.body.id);

 db.manyOrNone ('select (indicador.entidad*100+indicador.cve_jurisdiccion) as id, '+
 '(select color from meta where id_ficha = avg(indicador.id_ficha)  and min <= 100*sum(indicador.numerador)/sum(indicador.denominador) and max > 100*sum(indicador.numerador)/sum(indicador.denominador) and (meta.anio = avg(indicador.anio) or meta.anio is null ) ) as color,'+
 'avg(indicador.anio) from indicador where indicador.id_ficha= $1 and indicador.anio = $2 group by indicador.entidad,indicador.cve_jurisdiccion',[
 req.body.id,
 req.body.anio
 ]).then(function (data) {
 console.log(data);
 res.json(data);
 }).catch(function (error) {
 console.log(error)
 })

 });*/

/*Pintar estados solo desde desagregado estatal */
/*
router.post('/colores', function (req, res) {
    console.log('colores ',req.body.id);

    db.manyOrNone ('select entidad.id, '+
    '(select color from meta where id_ficha = indicador.id_ficha  and min <= indicador.valor and max > indicador.valor and (meta.anio = indicador.anio or meta.anio is null ) ) as color,'+
        'indicador.anio from indicador, entidad where  indicador.entidad = entidad.id and indicador.id_ficha= $1 and indicador.anio = $2',[
            req.body.id,
            req.body.anio
    ]).then(function (data) {
        console.log(data);
        res.json(data);
    }).catch(function (error) {
        console.log(error)
    })


});*/


router.post('/anios',function (req, res) {
    db.manyOrNone('select distinct(anio) from indicador where id_ficha = $1 order by anio', [ req.body.id ]).then(function ( data ) {
        res.render('anios', {anios: data, id_ficha: req.body.id  });
    }).catch(function (error) {
        console.log(error);
    });


});


router.get('/captura', isAuthenticated, function (req, res) {

    db.task(function (t) {
       return this.batch([
            this.manyOrNone('select id, nombre from ficha'),
            this.manyOrNone('select * from entidad')
        ])
    }).then(function (data) {
        res.render('captura', {
            title: 'Captura',
            section: 'captura',
            message: '',
            fichas: data[0],
            entidades: data[1]
        });
    }).catch(function (error) {
        console.log(error);
    });

});


router.post('/indicador', isAuthenticated, function (req, res) {
    console.log(req.body);

    db.one('select * from indicador where id_ficha = $1 and entidad = $2 and anio = $3', [
        +req.body.id_ficha,
        +req.body.entidad,
        +req.body.anio
    ]).then(function (data) {
        res.json({
            numerador: data.numerador,
            denominador: data.denominador,
            valor: data.valor
        })
    }).catch(function (error) {
        console.log(error);
        res.json({
            numerador: null,
            denominador: null,
            valor : null
        })
    });
});

router.post('/captura/guardar', isAuthenticated,function ( req, res) {
console.log(req.body);
    db.one('select count(*) as count from indicador where id_ficha = $1 and entidad = $2 and anio = $3', [
        +req.body.id_ficha,
        +req.body.entidad,
        +req.body.anio
    ]).then(function (data) {

        if (data.count > 0 ){
            return db.one('update indicador set numerador = $4, denominador = $5, valor = $6 where id_ficha=$1 and entidad=$2 and anio=$3 returning id_ficha', [
                +req.body.id_ficha,
                +req.body.entidad,
                +req.body.anio,
                +req.body.numerador,
                +req.body.denominador,
                +req.body.valor
            ]);
        }else {
            return db.one('insert into indicador (id_ficha, entidad, anio, numerador, denominador, valor ) values ($1, $2, $3, $4, $5, $6) returning id_ficha', [
                +req.body.id_ficha,
                +req.body.entidad,
                +req.body.anio,
                +req.body.numerador,
                +req.body.denominador,
                +req.body.valor
            ]);
        }

    }).then(function (data) {
        console.log( data );
        res.json({
           status: 'Ok',
            message: 'Datos guardados'
        });
    }).catch(function (error) {
       console.log(error);
       res.json({
           status: 'Error',
           message: 'Ocurrió un error al guardar los datos'
       })
    });


});

router.get('/miipps/159/:id/:anio',function(req,res){
    /*res.json([{'entidad':'AGS','valor':6.54},
        {'entidad':'BC','valor':4.42},
        {'entidad':'BCS','valor':4.31}])*/

    db.manyOrNone ('select entidad.abrevia as entidad, 100*sum(indicador.numerador)/sum(indicador.denominador) as valor'+
        ' from indicador, entidad where  indicador.entidad = entidad.id and indicador.id_ficha= $1 and indicador.anio = $2 group by entidad.id',[
        req.params.id,
        req.params.anio
    ]).then(function (data) {
        console.log(data);
        res.json(data);
    }).catch(function (error) {
        console.log(error)
    })
});

module.exports = router;
