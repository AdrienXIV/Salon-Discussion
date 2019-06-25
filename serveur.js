/*  EXPRESS & HTTP SETUP  */

const express = require('express');
const path = require('path');
const app = express();
const serveur = require('http').Server(app);

const bodyParser = require('body-parser');

//récupérer les fichiers html sans utiliser les extensions 
app.use(express.static(__dirname + '/', {
    extensions: ['html']
}));
//body-parser est un middleware express qui lit les entrées d'un formulaire et les stocke sous la forme d'un objet javascript accessible via req.body
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => res.sendFile('index.html', {
    root: __dirname
}));

const port =  process.env.NODE_PORT || 3333;
serveur.listen(port, () => console.log('Serveur en écoute sur le port ' + port));

app.post('/formulaire-connexion', (req, res) => {
    res.redirect('connexion');
})
app.post('/formulaire-inscription', (req, res) => {
    res.redirect('inscription');
})


/*  PASSPORT SETUP  */

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.redirect('salon'));
app.get('/error', (req, res) => res.redirect("/"));

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
    let mdp = crypt(req.body.mdp);
    var myData = new identification({
        username: req.body.utilisateur,
        password: mdp,
        pseudo: req.body.pseudo
    });

    var user = req.body;
    identification.findOne({
        username: user.utilisateur
    }, (err, existingUser) => {
        if (err) throw err;
        else if (existingUser == null) {
            console.log("n'existe pas")
            myData.save();
            res.redirect('salon');
        } else {
            console.log("existe")
            res.redirect('/');
        }
    })
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
            pseudo(user.pseudo); //stocke le pseudo en l'envoyant dans une fonction
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false);
            }

            if (decrypt(user.password) != password) {
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
        res.redirect('salon');

    });



/* CHIFFREMENT MOT DE PASSE */

const crypto = require('crypto');

const algorithm = 'aes-192-cbc'; //algorithme de chiffrement
const password = 'l5JmP+G0/1zB%;r8B8?2?2pcqGcL^3'; //clé de chiffrement

function decrypt(encrypted) {
    let key = crypto.scryptSync(password, 'salt', 24);
    let iv = Buffer.alloc(16, 0); // Initialisation du vector.

    let decipher = crypto.createDecipheriv(algorithm, key, iv); //déchiffrer, obligation de le réinitialiser pour éviter une erreur
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');

    decrypted += decipher.final('utf8');
    return decrypted;
}

function crypt(text) {
    let key = crypto.scryptSync(password, 'salt', 24);
    let iv = Buffer.alloc(16, 0); // Initialisation du vector.

    let cipher = crypto.createCipheriv(algorithm, key, iv); //chiffrer, obligation de le réinitialiser pour éviter une erreur
    let crypted = cipher.update(text, 'utf8', 'hex');

    crypted += cipher.final('hex');
    return crypted;
}


/* Socket IO */

var io = require('socket.io')(serveur);

io.sockets.on('connection', (socket) => {
    socket.emit('message', 'azerty')
    socket.on('salle', function (msg) {
        console.log(msg)
    })
})
/*
//essai
app.get('/salle0', (req, res) => {
    res.write('<!DOCTYPE html>');
    res.write('<html>')
    res.write('<head>')
    res.write(`<title>Salon de discussion</title>`)
    res.write(`<link rel="icon" href="public/images/discussion.png" />`)
    res.write(`<link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css">`)
    res.write(`<link rel="stylesheet" href="public/style.css">`)
    res.write(`</head>`)
    res.write(`<body>`)
    res.write(`<div class="container-fluid titre-color" style="margin-bottom:10px;">`)
    res.write(`<div class="container">`)
    res.write(`<div class="row">`)
    res.write(`<article class="col-sm-12 col-md col-xl col-lg text-center">`)
    res.write(`<h1>Salon de discussion</h1>`)
    res.write(`<p>Salles</p>`)
    res.write(`</article>`)
    res.write(`</div>`)
    res.write(`</div>`)
    res.write(`</div>`)
    res.write(`<p><strong> azertyu </strong></p>`)
    res.write(`<button type="button" class="btn btn-outline-secondary btn-accueil" id="accueil">Accueil</button>`)
    res.write(`<script type="text/javascript" src="public/salle.js"></script>`)
    res.write(`</body>`)
    res.write(`</html>`)
    res.end();
})*/
var pseudonyme;
function pseudo(pseudo) {
    pseudonyme = pseudo;
}
io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
   socket.on('nouveau_client', function (pseudo) {
        //pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo + " vient de se connecter !");

    });   
    
    // écoute si quelqu'un envoie un message et renvoie le message avec le pseudo de la personne connectée sur la page
    socket.on('zone-chat', function (message) {
        socket.emit('zone-pseudo', pseudonyme);
        socket.emit('zone-chat', message);
        //message = ent.encode(message);
    });
});