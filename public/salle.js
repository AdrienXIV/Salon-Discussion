var salle = document.getElementsByClassName('salle-block');
var btn = document.getElementById('button');

var salleCompteur = 0;
var tab = [0];


var boucle = setInterval(() => {
    for (let i = 0; i < salle.length; i++) {
        bordure(i);
    }
}, 50);

btn.addEventListener('click', () => {
    let txt = window.prompt('Nom de la salle', 'Salle')

    if (txt == null) return;
    else ajout(txt);
});

function bordure(i) {
    salle[i].onclick = () => {
        tab.push(i);
        salle[tab[0]].style.border = 'solid 1px #27ae60';
        //salle[i].style.borderColor = '';
        salle[i].style.border = '3px solid #27ae60';
        tab.shift();
    };
};

function ajout(txt) {
    var newDiv = document.createElement('div');
    newDiv.className = 'container salle-block text-center';
    newDiv.innerText = txt;

    document.body.appendChild(newDiv);
};