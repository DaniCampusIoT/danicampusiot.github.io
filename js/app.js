//menu lateral
var menu_visible = false;
let menu = document.getElementById("nav");
function showHideMenu(){
    if(menu_visible == false){ //si está oculto
        menu.style.display = "block";
        menu_visible = true;
    }
    else{
        menu.style.display = "none";
        menu_visible = false;
    }
}
//oculto el menu una vez que selecciono una opcion
let links = document.querySelectorAll("nav a");
for (var x = 0; x < links.length ; x++){
    links[x].onclick = function(){
        menu.style.display = "none";
        menu_visible = false;
    }    
}

//Animacion barras
function crearBarra(id_barra){
    for(i=0;i<=16;i++){
        let div = document.createElement("div");
        div.className = "e";
        id_barra.appendChild(div);
    }
}

let electronica = document.getElementById("electronica");
crearBarra(electronica);
let robotica = document.getElementById("robotica");
crearBarra(robotica);
let cpp = document.getElementById("cpp");
crearBarra(cpp);
let catia = document.getElementById("catia");
crearBarra(catia);
let impresion3d = document.getElementById("impresion3d");
crearBarra(impresion3d);
let iot = document.getElementById("iot");
crearBarra(iot);


//Ahora voy a guardar la cantidad de barritas que se van a ir pintando por cada barar
//para eso utilizo un arreglo, cada posiciòn pertenece a un elemento
//comienzan en -1 porque no tiene ninguna pintada al iniciarse
let contadores = [-1,-1,-1,-1,-1,-1];
//esta variable la voy a utilizar de bandera para saber si ya ejecuto la animación
let entro = false;

//función que aplica las animaciones de la habilidades
function efectoHabilidades(){
    var habilidades = document.getElementById("habilidades");
    var distancia_skills = window.innerHeight - habilidades.getBoundingClientRect().top;
    if(distancia_skills>=300 && entro==false){
        entro = true;
        const intervalElectronica = setInterval(function(){
            pintarBarra(electronica, 14, 0, intervalElectronica);
        },100);
        const intervalRobotica = setInterval(function(){
            pintarBarra(robotica, 13, 1, intervalRobotica);
        },100);
        const intervalCpp = setInterval(function(){
            pintarBarra(cpp, 15, 2, intervalCpp);
        },100);
        const intervalCatia = setInterval(function(){
            pintarBarra(catia, 14, 3, intervalCatia);
        },100);
        const intervalIoT = setInterval(function(){
            pintarBarra(iot, 14, 4, intervalIoT);
        },100);
        const intervalImpresion3d = setInterval(function(){
            pintarBarra(impresion3d, 16, 5, intervalImpresion3d);
        },100);
    }
}

//lleno una barra particular con la cantidad indicada
function pintarBarra(id_barra, cantidad, indice, interval){
    contadores[indice]++;
    x = contadores[indice];
    if(x < cantidad){
        let elementos = id_barra.getElementsByClassName("e");
        elementos[x].style.backgroundColor = "#940253";
    }else{
        clearInterval(interval)
    }
}

//detecto el scrolling del mouse para aplicar la animación de la barra
window.onscroll = function(){
    efectoHabilidades();
}

// Cambio de idiomas

const flagsElement = document.getElementById("flags");

const textsToChange = document.querySelectorAll("[data-section]");

const changeLanguage = async language => {
    const requestJSON = await fetch(`languages/${language}.json`);
    const texts = await requestJSON.json();

    for(const textToChange of textsToChange){
        const section = textToChange.dataset.section;
        const value = textToChange.dataset.value;

        textToChange.innerHTML = texts[section][value];
    }
}


flagsElement.addEventListener("click", (e) => {
    changeLanguage(e.target.parentElement.dataset.language);
})