var bd, cuerpoTablaHTML, botonEnviar, solicitud, modalHTML, botonEditar, contIngresos = 0, totalIngresos = 0;
var arrMenu = ["a-dashboard", "a-ingreso", "a-tabla-i", "a-gasto", "a-tabla-g", 
                "a-clientes", "a-proveedores", "a-configuraciones", "a-usuarios"];
    

// Módulo principal----------------------------------------------
window.addEventListener("load", iniciar);

function iniciar() {
    solicitud = indexedDB.open("hotelDB");
    solicitud.addEventListener("error", mostrarError);
    solicitud.addEventListener("upgradeneeded", crearTablas); 
    solicitud.addEventListener("success", comenzar);  

    const formIngreso = document.getElementById("form-ingreso1"); 
    formIngreso.addEventListener("submit", (e)=>{e.preventDefault();});

    const salir = document.getElementById("cerrar-sesion");
    salir.addEventListener("click", cerrarSesion);

    // cerrarSesion();
    toggleElement("a-ingreso");
}

//================= Derivadas de "Iniciar()" =================

function mostrarError(evento) {
    alert("Error: " + evento.code + " " + evento.message);
    }

function comenzar(evento) {
    bd = evento.target.result;

    var transaccion = bd.transaction(["darkMode"], "readwrite");
    let almacen = transaccion.objectStore("darkMode");
    var puntero = almacen.openCursor(null, "prev");
    puntero.addEventListener("success", setTheme);
    }

function setTheme(evento){
    let puntero = evento.target.result;
    let id = 1;
    let theme = false;
    if(puntero){
        let transaccion2 = bd.transaction(["darkMode"]);
        let almacen2 = transaccion2.objectStore("darkMode");
        let solicitud = almacen2.get(1);

        solicitud.addEventListener("success", loadTheme);
        }else{
        let transaccion = bd.transaction(["darkMode"], "readwrite");
        let almacen = transaccion.objectStore("darkMode");
        almacen.put({id, theme}); 
    }
    }

function loadTheme(evento) {

        let modo = evento.target.result.theme;
        let modoOn = (modo == true) ? "dark-theme-variables" : null;
        document.body.classList.add(`${modoOn}`);
        if (document.body.classList.contains("dark-theme-variables")){
            document.getElementById("sun").classList.remove("active");
            document.getElementById("moon").classList.add("active");
        }
        else{
            document.getElementById("sun").classList.add("active");
            document.getElementById("moon").classList.remove("active");
        }

     mostrar(); 
}

function crearTablas(evento) {
    var baseDeDatos = evento.target.result;
    var tabIngresos = baseDeDatos.createObjectStore("tabIngresos", {keyPath: "id", autoIncrement: true});
    tabIngresos.createIndex("porFecha", "fecha", {unique: false});
    tabIngresos.createIndex("porYear", "year", {unique: false});
    tabIngresos.createIndex("porMes", "mes", {unique: false});
    tabIngresos.createIndex("porDia", "dia", {unique: false});
    tabIngresos.createIndex("porHora", "hora", {unique: false});
    tabIngresos.createIndex("porTimeStamp", "timeStamp", {unique: false});
    tabIngresos.createIndex("porHabitacion", "habitacion", {unique: false});
    tabIngresos.createIndex("porDetalle", "detalle", {unique: false});
    tabIngresos.createIndex("porServicio", "servicio", {unique: false});
    tabIngresos.createIndex("porCantidad", "cantidad", {unique: false});
    tabIngresos.createIndex("porPrecioUnitario", "precioUnitario", {unique: false});
    tabIngresos.createIndex("porPrecioUnitario2", "precioUnitario2", {unique: false});
    tabIngresos.createIndex("porTipoPago", "tipoPago", {unique: false});
    tabIngresos.createIndex("porEncargado", "encargado", {unique: false});
    tabIngresos.createIndex("porSubTotal", "subTotal", {unique: false});
    tabIngresos.createIndex("porSubTotal2", "subTotal2", {unique: false});
    tabIngresos.createIndex("porObservaciones", "observaciones", {unique: false});

    
    var darkMode = baseDeDatos.createObjectStore("darkMode", {keyPath: "id", autoIncrement: false});
    darkMode.createIndex("theme", "theme", {unique: true});
}

//================= Funciones utilitarias =================

function subTotal(fin){
    let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
    let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;

    if (cantidad < 0 || precioUnitario < 0){
        document.getElementById(`cantidad-ingreso${fin}`).classList.add("negativo");
        document.getElementById(`precio-ingreso${fin}`).classList.add("negativo");
    } else{
        document.getElementById(`cantidad-ingreso${fin}`).classList.remove("negativo");
        document.getElementById("precio-ingreso1").classList.remove("negativo");
        let subt = cantidad * precioUnitario;
        
        document.getElementById(`txt-subtotal${fin}`).value = moneda(subt); 
    }
}    

function nuevoIngreso(fin, id1=""){
    let id = id1;
    let fecha = document.getElementById(`fecha-ingreso${fin}`).value;
    let fechaCadena = fecha+"T00:00:00";
    let objetoFecha = new Date(fechaCadena);
    let timeStamp = Date.parse(fechaCadena);
    let year = objetoFecha.getFullYear();
    let mes = `${year}:`+objetoFecha.getMonth();
    let dia = `${mes}:${objetoFecha.getDate()}`;
    let hora = document.getElementById(`hora-ingreso${fin}`).value;
    let habitacion = document.getElementById(`lista-habitaciones${fin}`).value;
    let servicio = document.getElementById(`lista-servicios${fin}`).value;
    let detalle = document.getElementById(`detalle-ingreso${fin}`).value.toLowerCase();
    let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
    let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;
    let precioUnitario2 = moneda(precioUnitario);
    let tipoPago = document.getElementById(`tipo-pago${fin}`).value;
    let encargado = document.getElementById(`lista-encargados${fin}`).value;
    let subTotal = cantidad*precioUnitario;
    let subTotal2 = document.getElementById(`txt-subtotal${fin}`).value;
    // let observaciones = document.getElementById(`observaciones${fin}`).value.toLowerCase();
    
    var transaccion = bd.transaction(["tabIngresos"], "readwrite");
    var almacen = transaccion.objectStore("tabIngresos");
    if (id == "") {
        almacen.put({fecha, year, mes, dia, hora, timeStamp, habitacion, detalle, servicio, cantidad, 
        precioUnitario, precioUnitario2, tipoPago, encargado, subTotal, subTotal2});
    }else{
        almacen.put({id, fecha, year, mes, dia, hora, timeStamp, habitacion, detalle, servicio, cantidad, 
        precioUnitario, precioUnitario2, tipoPago, encargado, subTotal, subTotal2});
        }

    if (fin == 2){
        cerrarModal();
    }else{};
    mostrar();
}

function mostrar() {
    var miFecha = null, miYear = null, miFiltro = null, miIndex = null;
    
    // document.getElementById("form-ingreso1").reset();

    miFecha = new Date();
    miYear = miFecha.getFullYear();
    miYearCadena = `${miYear}-01-01T00:00:00`;
    miMesCadena = `${miYear}-0${miFecha.getMonth()+1}-01T00:00:00`;
    miHoyCadena = `${miYear}-0${miFecha.getMonth()+1}-${miFecha.getDate()}T00:00:00`;
    miIndex = "porTimeStamp";

    if (document.getElementById("lista-rango-i").value == "1"){
        let inicioI = Date.parse(miHoyCadena);
        let finI = Date.parse(new Date);
        let rangoI = IDBKeyRange.bound(inicioI, finI);
        miFiltro = rangoI;
        toggleRango(false);
        buscarIndice(miIndex, miFiltro);
        }else if (document.getElementById("lista-rango-i").value == "2"){
            let inicioI = Date.parse(miMesCadena);
            let finI = Date.parse(new Date);
            let rangoI = IDBKeyRange.bound(inicioI, finI);
            miFiltro = rangoI;
            toggleRango(false);
            buscarIndice(miIndex, miFiltro);
            }else if (document.getElementById("lista-rango-i").value == "3"){
                let inicioI = Date.parse(miYearCadena);
                let finI = Date.parse(new Date);
                let rangoI = IDBKeyRange.bound(inicioI, finI);
                miFiltro = rangoI;
                toggleRango(false);
                buscarIndice(miIndex, miFiltro);
                }else if (document.getElementById("lista-rango-i").value == "4"){
                    let finI = Date.parse(new Date);
                    let rangoI = IDBKeyRange.bound(0, finI);
                    miFiltro = rangoI;
                    toggleRango(false);
                    buscarIndice(miIndex, miFiltro);
                    }else if (document.getElementById("lista-rango-i").value == "5"){
                        toggleRango(true);
                        resetTableI();
                        document.getElementById("total-registros2").innerText = 0;
                        document.getElementById("total-ingresos2").innerText = moneda("0");

                        document.getElementById("fecha-inicio-i").addEventListener("input", buscarRango);
                        document.getElementById("fecha-fin-i").addEventListener("input", buscarRango);

                        }else{
                            resetTableI();
                            return;
                            }      
}

function toggleRango(value = false){
    if (value){
        document.getElementById("label-inicio-i").classList.remove("disabled");
        document.getElementById("label-fin-i").classList.remove("disabled");
        document.getElementById("fecha-inicio-i").classList.remove("disabled");
        document.getElementById("fecha-fin-i").classList.remove("disabled");
        document.getElementById("fecha-inicio-i").removeAttribute("disabled");
        document.getElementById("fecha-fin-i").removeAttribute("disabled");  
        return;    
    } else{
        document.getElementById("fecha-inicio-i").value = "";
        document.getElementById("fecha-fin-i").value = "";
        document.getElementById("label-inicio-i").classList.add("disabled");
        document.getElementById("label-fin-i").classList.add("disabled");
        document.getElementById("fecha-inicio-i").classList.add("disabled");
        document.getElementById("fecha-fin-i").classList.add("disabled");
        document.getElementById("fecha-inicio-i").setAttribute("disabled", "true");
        document.getElementById("fecha-fin-i").setAttribute("disabled", "true"); 
        return;
    }
}

function buscarRango(){
    let fechaIni = document.getElementById("fecha-inicio-i").value;
    let inicioICadena = fechaIni+"T00:00:00";
    let inicioI = Date.parse(inicioICadena);
    let fechaFin = document.getElementById("fecha-fin-i").value;
    let fechaFinCadena = fechaFin+"T00:00:00";
    let finI = Date.parse(fechaFinCadena);
    miIndex = "porTimeStamp";

    if (fechaIni.trim() !== "" && fechaFin !== "" && finI >= inicioI){
        let rangoI = IDBKeyRange.bound(inicioI, finI);
        buscarIndice(miIndex, rangoI);
        }else if (fechaIni.trim() !== "" && fechaFin !== "" && finI < inicioI){
        resetTableI();
        alert("La fecha inicial debe ser menor a la fecha final");
        return;
        }else{
            return;
        }
}

function buscarIndice(indice, filtro){
    resetTableI();
    var transaccion = bd.transaction(["tabIngresos"]);
    var almacen = transaccion.objectStore("tabIngresos");

    theIndex = almacen.index(indice);
    var request = theIndex.openCursor(filtro, "prev");
    request.addEventListener("success", mostrarIngresos);
    request.addEventListener("error", resetTableI);
}

function resetTableI(){
    document.getElementById("borde-tabla").innerHTML = `
    <table id="tab-ingresos" class="">
    <thead id = "head-i">
        <tr id="head-2">
            <th class="fecha th2">Fecha</th>
            <th class="hora th2">Hora</th>
            <th class="habitacion th2">Hab.</th>
            <th class="servicio th2">Servicio</th>
            <th class="detalle th2">Cliente / Detalle</th>
            <th class="cantidad th2">Cant.</th>
            <th class="precio moneda th2">Precio</th>
            <th class="subt moneda th2">SubTotal</th>
            <th class="pago th2">Pago</th>
            <th class="turno th2">Turno</th>
            <th class="opciones th2" colspan="2">Ops.</th>
        </tr>
    </thead>
    <tbody id="cuerpoTabla">
    </tbody>
    </table>
    `;

    cuerpoTablaHTML="";
    document.getElementById("cuerpoTabla").innerHTML = "";
}

function mostrarIngresos(evento) {
    var puntero = evento.target.result;
    let options = {numberPerPage:15, goBar:true, pageCounter:false}, filterOptions = {el:"#searchBox"};
    // Desestructurar 
    if (puntero) { 
        contIngresos += 1;
        let {id, fecha, hora, habitacion, servicio, detalle, cantidad, precioUnitario, precioUnitario2,
            tipoPago, encargado, subTotal, subTotal2} = puntero.value;

        cuerpoTablaHTML += `
            <tr class="" id="${id}">
                <td class="fecha" id="fe${id}">${fecha}</td>
                <td class='centrar' id="ho${id}">${hora}</td>
                <td class="centrar habitacion" id="ha${id}">${habitacion}</td>
                <td class="servicio" id="se${id}">${servicio}</td>
                <td class="detalle" id="de${id}">${detalle}</td>
                <td class="cantidad" id="ca${id}">${cantidad}</td>
                <td class="moneda" id="pr${id}" style="display: none">${precioUnitario}</td>
                <td class="moneda" id="pr2${id}">${precioUnitario2}</td>
                <td class="moneda" id="su${id}">${subTotal2}</td>
                <td class="pago" id="ti${id}">${tipoPago}</td>
                <td class="turno" id="en${id}">${encargado}</td>
                <td class="btnFilas" onclick="showModal(${id})">
                <span class="icon-pencil primary"></span></td>
                <td class="btnFilas" onclick="eliminarIngreso(${id})">
                <span class="icon-trash-can-outline danger"></span></td>
            </tr>`;

        totalIngresos += subTotal;
        
        puntero.continue();
        
        }
        else {
            document.getElementById("cuerpoTabla").innerHTML = cuerpoTablaHTML;
            paginate.init("#tab-ingresos", options, filterOptions); 
            document.getElementById("total-registros2").innerText = contIngresos;
            document.getElementById("total-ingresos2").innerText = moneda(totalIngresos);
            contIngresos = 0;
            totalIngresos = 0;
            cuerpoTablaHTML = "";
        }
}

function eliminarIngreso(id) {
    if (confirm("Está seguro de eliminar este registro?")){
    var transaccion = bd.transaction(["tabIngresos"], "readwrite");
    var almacen = transaccion.objectStore("tabIngresos");
    almacen.delete(id);
    mostrar();
    }else{return};
}

function showModal(id){
    modalHTML = `<button  class="btn-form" id="btn-editar" onclick="editarIngreso(${id})">Editar</button>`;
    document.getElementById("div-btn").innerHTML = modalHTML;   

    let fecha = document.querySelector(`#fe${id}`).innerHTML;
    let hora =  document.querySelector(`#ho${id}`).innerHTML;
    let habitacion =  document.querySelector(`#ha${id}`).innerHTML;
    let servicio =  document.querySelector(`#se${id}`).innerHTML;
    let detalle =  document.querySelector(`#de${id}`).innerHTML;
    let cantidad =  document.querySelector(`#ca${id}`).innerHTML;
    let precio =  document.querySelector(`#pr${id}`).innerHTML;
    let pago =  document.querySelector(`#ti${id}`).innerHTML;
    let encargado =  document.querySelector(`#en${id}`).innerHTML;
    let subtotal =  document.querySelector(`#su${id}`).innerHTML;
    // let observaciones =  document.querySelector(`#ob${id}`).innerHTML;

    

    document.getElementById("modal1").classList.add("isVisible");
    document.getElementById("modal-dialog").classList.add("animation");
    document.getElementById("modal1").classList.remove("noVisible");
    document.getElementById("modal-dialog").classList.remove("noAnimation");

    document.getElementById("fecha-ingreso2").value = fecha;
    document.getElementById("hora-ingreso2").value = hora;
    document.getElementById("lista-habitaciones2").value = habitacion;
    document.getElementById("lista-servicios2").value = servicio;
    document.getElementById("detalle-ingreso2").value = detalle;
    document.getElementById("cantidad-ingreso2").value = cantidad;
    document.getElementById("precio-ingreso2").value = precio;
    document.getElementById("tipo-pago2").value = pago;
    document.getElementById("lista-encargados2").value = encargado;
    document.getElementById("txt-subtotal2").value = subtotal;
    // document.getElementById("observaciones2").value = observaciones;

    document.addEventListener("keyup", e => {if (e.key == "Escape"){ cerrarModal();}});
}

function editarIngreso(id2) {
    formu2 = document.getElementById("form-editar");
    formu2.addEventListener("submit", (e) => {
    e.preventDefault();
    });
    validarForm(".validar-edit-i", 2, id2);
}

function validarForm(tag, fin, id2){
    let inputs = document.querySelectorAll(tag);
    let validar = 0;
    inputs.forEach(element => {
        validar += (element.value.trim() == "")? 0 : 1;       
    });
        if(validar < inputs.length){
            alert("Debe diligenciar los campos vacíos");
        }
        else{
            nuevoIngreso(fin, id2);
    }
}

function cerrarModal(){
    document.getElementById("modal-dialog").classList.remove("animation");
    document.getElementById("modal1").classList.remove("isVisible");
    document.getElementById("modal-dialog").classList.add("noAnimation");
    document.getElementById("modal1").classList.add("noVisible");
}

function cerrarSesion(){ //======== Oculta todas las secciones dentro de MAIN ======//
    for (let i=0; i<arrMenu.length; i++){
            document.getElementById(`${arrMenu[i]}id`).style.display = "none";
    }
    toggleElement("cerrar-sesion");
    document.getElementById("cerrar-sesion").classList.remove("active");
}

function toggleElement(idElement){ //===== on/off la clase active elementos del menu ====//
    for (let i=0; i<arrMenu.length; i++){ //===== Oculta el reto de secciones ====//
        if (idElement == arrMenu[i]){
            document.getElementById(idElement).classList.add("active");
            document.querySelector(`.${arrMenu[i]}`).style.display = "grid";
            document.querySelector(`.${idElement}`).classList.add("animation");
        } else{
            document.getElementById(arrMenu[i]).classList.remove("active");
            document.getElementById(`${arrMenu[i]}id`).style.display = "none";
        }
    }
    if (document.querySelector(".a-tabla-i").style.display == "grid"){
        document.getElementById("searchBox").addEventListener("keyup", e => {if (e.key == "Enter"){ buscar("buscar-i");}});
    }
}

function toggleDark(){

    document.getElementById("sun").classList.toggle("active");
    document.getElementById("moon").classList.toggle("active");

    document.body.classList.toggle("dark-theme-variables");

    var transaccion = bd.transaction(["darkMode"], "readwrite");
    var almacen = transaccion.objectStore("darkMode");
    let id = 1;

    if (document.getElementById("moon").classList.contains("active")){
        let theme = true;
        almacen.put({id, theme});
    }
    else{
        let theme = false;
        almacen.put({id, theme});
    }
    
}

function moneda(valor){ //Convierte números enteros en cadena de texto con formato de moneda hasta $99.999.999.999
    let cadena1, cadena2, cadena3, cadena4, cadena5, cadenaFinal;
    cadena1 = valor.toString();

    switch(cadena1.length){
        case 4:
                cadena2 = cadena1.substring(0, 1);
                cadena3 = cadena1.substring(1, 4);
                return cadenaFinal = `$${cadena2}.${cadena3}`;
            case 5:
                cadena2 = cadena1.substring(0, 2);
                cadena3 = cadena1.substring(2, 5);
                return cadenaFinal = `$${cadena2}.${cadena3}`;
            case 6:
                cadena2 = cadena1.substring(0, 3);
                cadena3 = cadena1.substring(3, 6);
                return cadenaFinal = `$${cadena2}.${cadena3}`;
            case 7:
                cadena2 = cadena1.substring(0, 1);
                cadena3 = cadena1.substring(1, 4);
                cadena4 = cadena1.substring(4, 7);
                return cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`;
            case 8:
                cadena2 = cadena1.substring(0, 2);
                cadena3 = cadena1.substring(2, 5);
                cadena4 = cadena1.substring(5, 8);
                return cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`;
            case 9:
                cadena2 = cadena1.substring(0, 3);
                cadena3 = cadena1.substring(3, 6);
                cadena4 = cadena1.substring(6, 9);
                return cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`;
            case 10:
                cadena2 = cadena1.substring(0, 1);
                cadena3 = cadena1.substring(1, 4);
                cadena4 = cadena1.substring(4, 7);
                cadena5 = cadena1.substring(7, 10);
                return cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}.${cadena5}`;
            case 11:
                cadena2 = cadena1.substring(0, 2);
                cadena3 = cadena1.substring(2, 5);
                cadena4 = cadena1.substring(5, 8);
                cadena5 = cadena1.substring(8, 11);
                return cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}.${cadena5}`;

            default:
                return cadenaFinal = `$${cadena1}`;
        }  
}

function buscar(id){
    if(id=="buscar-i"){
        if(document.getElementById("searchBox").value.trim() !== ""){
            paginate.filter();
            document.getElementById("buscar-i").style.display = "none";
            document.getElementById("cerrar-buscar-i").style.display = "flex";
            document.getElementById("searchBox").addEventListener("keyup", e => {
                if (e.key == "Backspace" || e.key == "Delete"){
                    buscarOff();
                }
                else{ return; }
            });
        }else{return;}
    }else{
        document.getElementById("searchBox").value = "";
        paginate.filter();
        document.getElementById("cerrar-buscar-i").style.display = "none";
        document.getElementById("buscar-i").style.display = "flex";
    }
}

function buscarOff(){
    if(document.getElementById("searchBox").value.trim() == ""){
        paginate.filter();
        document.getElementById("cerrar-buscar-i").style.display = "none";
        document.getElementById("buscar-i").style.display = "flex";
        document.getElementById("searchBox").value = "";
    }
}
