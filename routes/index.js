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


router.get('/miipps', isAuthenticated, function(req, res, next) {

    db.manyOrNone('select * from unidad',[]).then(function ( data ) {

        res.render('miipps', { title: 'MIIPPS',unidades: data });

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

router.post('/tabla-indicador/', function(req, res){
    var id_ficha = req.body.id_ficha;
    if (id_ficha != '' && id_ficha != null ) {
        db.manyOrNone ('select indicador.anio, indicador.numerador, indicador.denominador, indicador.valor, entidad.nombre, (select color from meta where ' +
            'id_ficha = indicador.id_ficha  and min <= indicador.valor and max > indicador.valor and (meta.anio = indicador.anio or meta.anio is null ) ) as color '+
            'from indicador, entidad where  indicador.entidad = entidad.id and id_ficha= $1',[ id_ficha ]).then(function(data){
            if (data){
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


});

router.post('/anios',function (req, res) {
    db.manyOrNone('select distinct(anio) from indicador where id_ficha = $1 order by anio', [ req.body.id ]).then(function ( data ) {
        res.render('anios', {anios: data, id_ficha: req.body.id  });
    }).catch(function (error) {
        console.log(error);
    });


});




module.exports = router;
