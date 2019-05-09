/*  EXPRESS SETUP  */

const express = require('express');
const path = require('path');
const app = express();

const bodyParser = require('body-parser');
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => res.sendFile('index.html', {
    root: __dirname
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Serveur en écoute sur le port ' + port));


/*  PASSPORT SETUP  */

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.redirect('salle.html'));
app.get('/error', (req, res) => res.send("Erreur identifiants"));

passport.serializeUser(function (user, done) {
    //user => stocke un id comme clé dans le paramètre done
    // req.session.passport.user = {id: 'exemple'}
    done(null, user.id);
    //user.id => sauvegarder la session (cookie)
});

passport.deserializeUser(function (id, done) {
    //id => correspond à la clé de l'objet 'user' plus haut pour récupérer toutes les infos de cet objet (nom, mail etc)
    User.findById(id, function (err, user) {
        done(err, user);
        //user => l'objet récupéré est attaché à la requête req.user
    });
});


// MONGOOSE connexion
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/discussion', {
    useNewUrlParser: true
});

//création d'un schéma
const Schema = mongoose.Schema;
const UserDetail = new Schema({
    username: String,
    password: String,
    pseudo: String
});
//nom de la collection
const identification = mongoose.model('identification', UserDetail, 'identification');

//requête lors du formulaire d'inscription
app.post("/inscription", (req, res) => {
    var myData = new identification({
        username: req.body.utilisateur,
        password: req.body.mdp,
        pseudo: req.body.pseudo
    });
    myData.save(); //envoie des données à mongodb
    res.redirect('salle.html')
});

/* PASSPORT LOCAL AUTHENTICATION */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function (username, password, done) {
        //username => input utilisateur
        //password => input mdp
        //done => fonction de vérification appelée plus bas (if(err), if(!user) etc..)

        identification.findOne({
            username: username
        }, function (err, user) { //user => myData = new Identification({})
            console.log("parametre user : " + user);
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            if (user.password != password) {
                //user.password => password dans le schema de la base de données
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

app.post('/connexion',
    passport.authenticate('local', {
        failureRedirect: '/error'
    }),
    function (req, res) {
        res.redirect('salle.html');
    });