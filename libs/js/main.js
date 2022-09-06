var bd, cuerpoTablaHTML, botonEnviar, solicitud, modalHTML, botonEditar, contIngresos = 0;
var arrMenu = ["a-dashboard", "a-ingreso", "a-tabla-i", "a-gasto", "a-tabla-g", 
                "a-clientes", "a-proveedores", "a-configuraciones", "a-usuarios"];
    

// Módulo principal----------------------------------------------
window.addEventListener("load", iniciar);

function iniciar() {
    solicitud = indexedDB.open("hotelDB");
    solicitud.addEventListener("error", mostrarError);
    solicitud.addEventListener("success", comenzar);
    solicitud.addEventListener("upgradeneeded", crearTablas);   

    var formIngreso = document.getElementById("form-ingreso1"); 
    formIngreso.addEventListener("submit", (e)=>{e.preventDefault();});

    salir = document.getElementById("cerrar-sesion");
    salir.addEventListener("click", cerrarSesion);

    cerrarSesion();

}

//================= Derivadas de "Iniciar()" =================

function mostrarError(evento) {
    alert("Error: " + evento.code + " " + evento.message);
    }

function comenzar(evento) {
    bd = evento.target.result;
    var transaccion = bd.transaction(["darkMode"]);
    var almacen = transaccion.objectStore("darkMode");
    var puntero = almacen.openCursor(null, "prev");
    puntero.addEventListener("success", loadTheme);      
    }

function loadTheme(evento) {
    var puntero = evento.target.result;
    if (puntero) {
        let modo = puntero.value.theme;
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
    }
    else{
        return;
    }

     mostrar();   
}

function crearTablas(evento) {
    var baseDeDatos = evento.target.result;
    var tabIngresos = baseDeDatos.createObjectStore("tabIngresos", {keyPath: "id", autoIncrement: true});
    tabIngresos.createIndex("porFecha", "fecha", {unique: false});
    tabIngresos.createIndex("porHora", "hora", {unique: false});
    tabIngresos.createIndex("porHabitacion", "habitacion", {unique: false});
    tabIngresos.createIndex("porDetalle", "detalle", {unique: false});
    tabIngresos.createIndex("porServicio", "servicio", {unique: false});
    tabIngresos.createIndex("porCantidad", "cantidad", {unique: false});
    tabIngresos.createIndex("porPrecioUnitario", "precioUnitario", {unique: false});
    tabIngresos.createIndex("porTipoPago", "tipoPago", {unique: false});
    tabIngresos.createIndex("porEncargado", "encargado", {unique: false});
    tabIngresos.createIndex("porSubTotal", "subTotal", {unique: false});
    tabIngresos.createIndex("porSubTotal2", "subTotal", {unique: false});
    tabIngresos.createIndex("porObservaciones", "observaciones", {unique: false});

    
    var darkMode = baseDeDatos.createObjectStore("darkMode", {keyPath: "id", autoIncrement: false});
    darkMode.createIndex("theme", "theme", {unique: true});
}

//================= Funciones utilitarias =================

function formatoMoneda(fin){
    let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
    let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;

    if (cantidad < 0 || precioUnitario < 0){
        document.getElementById(`cantidad-ingreso${fin}`).classList.add("negativo");
        document.getElementById(`precio-ingreso${fin}`).classList.add("negativo");
    } else{
        document.getElementById(`cantidad-ingreso${fin}`).classList.remove("negativo");
        document.getElementById("precio-ingreso1").classList.remove("negativo");
        let subt = cantidad * precioUnitario;
        let cadena1 = subt.toString();
        let cadena2, cadena3, cadena4, cadenaFinal;

    switch(cadena1.length){
        case 4:
                cadena2 = cadena1.substring(0, 1);
                cadena3 = cadena1.substring(1, 4);
                cadenaFinal = `$${cadena2}.${cadena3}`;
                break;
            case 5:
                cadena2 = cadena1.substring(0, 2);
                cadena3 = cadena1.substring(2, 5);
                cadenaFinal = `$${cadena2}.${cadena3}`;
                break;
            case 6:
                cadena2 = cadena1.substring(0, 3);
                cadena3 = cadena1.substring(3, 6);
                cadenaFinal = `$${cadena2}.${cadena3}`;
                break;
            case 7:
                cadena2 = cadena1.substring(0, 1);
                cadena3 = cadena1.substring(1, 4);
                cadena4 = cadena1.substring(4, 7);
                cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`;
                break;
            case 8:
                cadena2 = cadena1.substring(0, 2);
                cadena3 = cadena1.substring(2, 5);
                cadena4 = cadena1.substring(5, 8);
                cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`;
                break;

            default:
                cadenaFinal = `$${subt}`;
                break;
        }  
        document.getElementById(`txt-subtotal${fin}`).value = cadenaFinal;  
    }
}    

function nuevoIngreso(fin, id1="") {
    let id = id1;
    let fecha = document.getElementById(`fecha-ingreso${fin}`).value;
    let hora = document.getElementById(`hora-ingreso${fin}`).value;
    let habitacion = document.getElementById(`lista-habitaciones${fin}`).value;
    let servicio = document.getElementById(`lista-servicios${fin}`).value;
    let detalle = document.getElementById(`detalle-ingreso${fin}`).value.toLowerCase();
    let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
    let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;
    let tipoPago = document.getElementById(`tipo-pago${fin}`).value;
    let encargado = document.getElementById(`lista-encargados${fin}`).value;
    let subTotal = cantidad*precioUnitario;
    let subTotal2 = document.getElementById(`txt-subtotal${fin}`).value;
    // let observaciones = document.getElementById(`observaciones${fin}`).value.toLowerCase();
    
    var transaccion = bd.transaction(["tabIngresos"], "readwrite");
    var almacen = transaccion.objectStore("tabIngresos");
    if (id == "") {
        almacen.put({fecha, habitacion, detalle, servicio, cantidad, 
        precioUnitario, tipoPago, encargado, subTotal, subTotal2});}else{
        almacen.put({id, fecha, hora, habitacion, detalle, servicio, cantidad, 
        precioUnitario, tipoPago, encargado, subTotal, subTotal2});
        }
    // }
    // else{
        // alert("Debe escribir un texto para la nueva tarea");
    // }
    if (fin == 2){
        cerrarModal();
    }else{};
    mostrar();
}

function mostrar() {
    // document.getElementById("form-ingreso1").reset();
    document.getElementById("borde-tabla").innerHTML = `
    <table id="tab-ingresos" class="">
    <thead>
        <tr>
            <th class="fecha th2">Fecha</th>
            <td class="hora th2">Hora</td>
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
    document.querySelector("table#tab-ingresos tbody").innerHTML = "";
    var transaccion = bd.transaction(["tabIngresos"]);
    var almacen = transaccion.objectStore("tabIngresos");
    var puntero = almacen.openCursor(null, "prev");
    puntero.addEventListener("success", mostrarIngresos);      
}

function mostrarIngresos(evento) {
    var puntero = evento.target.result;
    let options = {
        numberPerPage:16,
        goBar:true, 
        pageCounter:false,
    };

    let filterOptions = {
        el:"#searchBox"
    };
    // Desestructurar 
    if (puntero) { 
        contIngresos += 1;
        let {id, fecha, hora, habitacion, servicio, detalle, cantidad, precioUnitario,
            tipoPago, encargado, subTotal2, observaciones} = puntero.value;

        cuerpoTablaHTML += `
            <tr class="" id="${id}">
                <td class="fecha" id="fe${id}">${fecha}</td>
                <td class='centrar' id="ho${id}">${hora}</td>
                <td class="centrar habitacion" id="ha${id}">${habitacion}</td>
                <td class="servicio" id="se${id}">${servicio}</td>
                <td class="detalle" id="de${id}">${detalle}</td>
                <td class="cantidad" id="ca${id}">${cantidad}</td>
                <td class="moneda" id="pr${id}">${precioUnitario}</td>
                <td class="moneda" id="su${id}">${subTotal2}</td>
                <td class="pago" id="ti${id}">${tipoPago}</td>
                <td class="turno" id="en${id}">${encargado}</td>
                <td class="btnFilas" onclick="showModal(${id})">
                <span class="icon-pencil primary"></span></td>
                <td class="btnFilas" onclick="eliminarIngreso(${id})">
                <span class="icon-trash-can-outline danger"></span></td>
            </tr>`;
        
        puntero.continue();
        
        }
        else {
            document.querySelector("table#tab-ingresos tbody").innerHTML = cuerpoTablaHTML;
            paginate.init("#tab-ingresos", options, filterOptions); 
            document.getElementById("total-registros2").innerText = contIngresos;
            contIngresos = 0;
            
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
    // let hora =  document.querySelector(`#ho${id}`).innerHTML;
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
    // document.getElementById("hora-ingreso2").value = hora;
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
    let texto = document.getElementById("detalle-ingreso2").value;
        if(texto.trim() == ""){
            alert("Debe diligenciar los campos vacíos");
        }
        else{
            nuevoIngreso(2, id2);
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
        document.getElementById("searchBox").addEventListener("keyup", e => {if (e.key == "Enter"){ filtrar("buscar-i");}});
    }
}

function toggleDark(theme){

    document.getElementById("sun").classList.toggle("active");
    document.getElementById("moon").classList.toggle("active");

    document.body.classList.toggle("dark-theme-variables");
    console.log(document.body.classList);
    console.log(document.getElementById("sun").classList)
    console.log(document.getElementById("moon").classList)

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

function filtrar(id){
    if(id=="buscar-i"){
        if(document.getElementById("searchBox").value.trim() !== ""){
            paginate.filter();
            document.getElementById("buscar-i").style.display = "none";
            document.getElementById("cerrar-buscar-i").style.display = "flex";
            document.getElementById("searchBox").addEventListener("keyup", e => {
                if (e.key == "Backspace" || e.key == "Delete"){
                    filtrarOff();
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

function filtrarOff(){
    if(document.getElementById("searchBox").value.trim() == ""){
        paginate.filter();
        document.getElementById("cerrar-buscar-i").style.display = "none";
        document.getElementById("buscar-i").style.display = "flex";
        document.getElementById("searchBox").value = "";
    }
}
