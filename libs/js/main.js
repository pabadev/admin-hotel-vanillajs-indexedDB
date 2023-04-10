var bd,
  cuerpoTablaHTML,
  cuerpoTablaHTML2,
  botonEnviar,
  solicitud,
  modalHTML,
  botonEditar,
  contIngresos = 0,
  totalIngresos = 0;
var arrMenu = [
  "a-dashboard",
  "a-ingreso",
  "a-tabla-i",
  "a-egreso",
  "a-tabla-g",
  "a-clientes",
  "a-proveedores",
  "a-configuraciones",
  "a-usuarios",
];
var dataRango = [],
  meses = [],
  dataMes = [],
  refreshPercent = true,
  idVal = null;
var miFecha = null,
  miYear = null,
  miFiltro = null,
  miIndex = null,
  mesNum = null,
  diaNum = null,
  fechaIng = Date.parse(new Date()),
  fechaItem;
var options = { numberPerPage: 15, goBar: true, pageCounter: false },
  filterOptions = { el: "#searchBox" };
var chartExiste = false,
  nuevoRegistro = false,
  textoBD = "";

//============== Módulo principal=================================

window.addEventListener("load", iniciar);

async function iniciar() {
  await dbSetup(); //Configura la base de datos
  await setTheme(); //Establece el tema guardado por el usuario
  toggleElement("a-ingreso"); //Solo muestra formulario Ingresos
  menuGraf = setArrYears(); //Carga años para select de Charts

  document.getElementById("form-ingreso1").onsubmit = (e) => e.preventDefault();
  document.getElementById("form-egreso1").onsubmit = (e) => e.preventDefault();
  document.getElementById("cerrar-sesion").onclick = () => cerrarSesion();
  document.getElementById("theme-toggler").onclick = () => toggleDark();

  mostrar(true); //True para actualizar porcentajes
  // mostrarGastos();
}

//================= Derivadas de "Iniciar()" =================

function dbSetup() {
  //Inicializa la base de datos
  return new Promise((resolve, reject) => {
    var solicitud = window.indexedDB.open("hotelDB");

    solicitud.onupgradeneeded = (evento) => {
      var baseDeDatos = evento.target.result;

      var tabIngresos = baseDeDatos.createObjectStore("tabIngresos", {
        keyPath: "id",
        autoIncrement: true,
      });
      tabIngresos.createIndex("porTimeStamp", "timeStamp", { unique: false });

      var tabGastos = baseDeDatos.createObjectStore("tabGastos", {
        keyPath: "id",
        autoIncrement: true,
      });
      tabGastos.createIndex("porTimeStamp", "timeStamp", { unique: false });

      var darkMode = baseDeDatos.createObjectStore("darkMode", {
        keyPath: "id",
        autoIncrement: false,
      });
      darkMode.createIndex("theme", "theme", { unique: true });
    };

    solicitud.onsuccess = (evento) => {
      bd = evento.target.result;
      resolve();
    };

    solicitud.onerror = (evento) => {
      alert("Error: " + evento.code + " " + evento.message);
      reject(evento);
    };
  });
}

function setTheme() {
  //Establece el tema de colores al inicio
  return new Promise(function (resolve, reject) {
    var transaccion = bd.transaction(["darkMode"], "readwrite");
    let almacen = transaccion.objectStore("darkMode");
    almacen.openCursor(null, "prev").onsuccess = (evento) => {
      let puntero = evento.target.result;
      let id = 1;
      let theme = false;
      if (puntero) {
        let modo = puntero.value.theme;
        let modoOn = modo == true ? "dark-theme-variables" : null;
        document.body.classList.add(`${modoOn}`);
        if (document.body.classList.contains("dark-theme-variables")) {
          document.getElementById("sun").classList.remove("active");
          document.getElementById("moon").classList.add("active");
        } else {
          document.getElementById("sun").classList.add("active");
          document.getElementById("moon").classList.remove("active");
        }
        resolve();
      } else {
        let transaccion = bd.transaction(["darkMode"], "readwrite");
        let almacen = transaccion.objectStore("darkMode");
        almacen.put({ id, theme });
        resolve();
      }
    };
  });
}

function toggleElement(idElement) {
  // Establece "Nuevo Ingreso" como seleccionada
  //===== on/off la clase active elementos del menu ====//
  for (let i = 0; i < arrMenu.length; i++) {
    //===== Oculta el resto de secciones ====//
    if (idElement == arrMenu[i]) {
      document.getElementById(idElement).classList.add("active");
      document.querySelector(`.${arrMenu[i]}`).style.display = "grid";
      document.querySelector(`.${idElement}`).classList.add("animation");

      if (idElement == "a-dashboard") {
        mostrarGrafico();
      }
      if (idElement == "a-ingreso") {
        document.getElementById("fecha-ingreso1").defaultValue =
          fechasCadena().hoy;
        document.getElementById("hora-ingreso1").defaultValue =
          fechasCadena().hora;
      }
      if (idElement == "a-egreso") {
        resetTableG();
      }
    } else {
      document.getElementById(arrMenu[i]).classList.remove("active");
      document.getElementById(`${arrMenu[i]}id`).style.display = "none";
    }
  }
  if (document.querySelector(".a-tabla-i").style.display == "grid") {
    document.getElementById("searchBox").addEventListener("keyup", (e) => {
      if (e.key == "Enter") {
        buscar("buscar-i");
      }
    });
  }
}

const fechasCadena = () => {
  //Retorna objeto con strings de año, mes, hoy y hora
  let meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  let arrYear = new Date().toLocaleDateString().split("/");
  let mes = arrYear[1].length > 1 ? `${arrYear[1]}` : `0${arrYear[1]}`;
  let dia = arrYear[0].length > 1 ? `${arrYear[0]}` : `0${arrYear[0]}`;
  let nombreMes = meses[parseInt(mes) - 1];

  let arrHora = new Date().toLocaleTimeString().split(":");
  let hh = arrHora[0].length > 1 ? `${arrHora[0]}` : `0${arrHora[0]}`;
  let mm = arrHora[1].length > 1 ? `${arrHora[1]}` : `0${arrHora[1]}`;
  `${hh}:${mm}`;

  return {
    hoy: `${arrYear[2]}-${mes}-${dia}`,
    mes: `${arrYear[2]}-${mes}-01T00:00:00`,
    year: `${arrYear[2]}`,
    hora: `${hh}:${mm}`,
    mesNum: `${mes}`,
    mesNombre: `${nombreMes}`,
  };
};

function mostrar(refresh) {
  //Carga los datos para la tabla y los porcentajes == Refactorizar
  let fechas = fechasCadena();
  let tsMes = Date.parse(fechas.mes);
  miIndex = "porTimeStamp";
  let opciones = parseInt(document.getElementById("lista-rango-i").value);
  let arrDesde = [fechas.hoy, fechas.mes, fechas.year, 0];
  console.log(fechas.year);

  if (opciones !== 5) {
    let inicioI = Date.parse(arrDesde[opciones - 1]);
    let finI = Date.parse(new Date());
    let rangoI = IDBKeyRange.bound(inicioI, finI);
    miFiltro = rangoI;

    if (refresh && fechaIng >= tsMes) {
      refreshPercent = true;
    } else {
      refreshPercent = false;
    }

    toggleRango();
    buscarIndice(miIndex, miFiltro, fechas.year);
  } else {
    refreshPercent = false;
    toggleRango(true);
    resetTableI();
    document.getElementById("total-registros2").innerText = 0;
    document.getElementById("total-ingresos2").innerText = moneda("0");

    document
      .getElementById("fecha-inicio-i")
      .addEventListener("input", buscarRango);
    document
      .getElementById("fecha-fin-i")
      .addEventListener("input", buscarRango);
  }
}

function mostrarGastos(refresh) {
  //Carga los datos para la tabla y los porcentajes == Refactorizar
  let fechas = fechasCadena();
  let tsMes = Date.parse(fechas.mes);
  miIndex = "porTimeStamp";
  let opciones = parseInt(document.getElementById("lista-rango-g").value);
  let arrDesde = [fechas.hoy, fechas.mes, fechas.year, 0];

  if (opciones !== 5) {
    let inicioI = Date.parse(arrDesde[opciones - 1]);
    let finI = Date.parse(new Date());
    let rangoI = IDBKeyRange.bound(inicioI, finI);
    miFiltro = rangoI;

    // if (refresh && fechaIng >= tsMes) {
    //   refreshPercent = true;
    // } else {
    //   refreshPercent = false;
    // }

    toggleRangoGastos();
    buscarIndiceGastos(miIndex, miFiltro, fechas.year);
  } else {
    refreshPercent = false;
    toggleRangoGastos(true);
    resetTableG();
    document.getElementById("total-registros2-g").innerText = 0;
    document.getElementById("total-ingresos2-g").innerText = moneda("0");

    document
      .getElementById("fecha-inicio-g")
      .addEventListener("input", buscarRango);
    document
      .getElementById("fecha-fin-g")
      .addEventListener("input", buscarRango);
  }
}

//================= Funciones utilitarias =================

function subTotal(fin) {
  //Procesa texto para subtotal en formularios
  let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
  let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;
  let subt = cantidad * precioUnitario;
  document.getElementById(`txt-subtotal${fin}`).value = moneda(subt);
}

function subTotalEgreso(fin) {
  //Procesa texto para subtotal en formularios
  let cantidad = document.getElementById(`cantidad-egreso${fin}`).value;
  let precioUnitario = document.getElementById(`precio-egreso${fin}`).value;
  let subt = cantidad * precioUnitario;
  document.getElementById(`txt-subtotalE${fin}`).value = moneda(subt);
}

async function nuevoIngreso(fin, id1 = "") {
  //Inserta un registro de ingreso en la base de datos
  let id = id1;
  let fecha = document.getElementById(`fecha-ingreso${fin}`).value;
  let fechaCadena = fecha + "T00:00:00";
  let objetoFecha = new Date(fechaCadena);
  let mesNum = objetoFecha.getMonth();
  let timeStamp = Date.parse(fechaCadena);
  let year = objetoFecha.getFullYear();
  let mes = `${year}:` + objetoFecha.getMonth();
  let dia = `${mes}:${objetoFecha.getDate()}`;
  let meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  let nombreMes = meses[mesNum];
  let hora = document.getElementById(`hora-ingreso${fin}`).value;
  let habitacion = document.getElementById(`lista-habitaciones${fin}`).value;
  let servicio = document.getElementById(`lista-servicios${fin}`).value;
  let detalle = document
    .getElementById(`detalle-ingreso${fin}`)
    .value.toLowerCase();
  let cantidad = document.getElementById(`cantidad-ingreso${fin}`).value;
  let precioUnitario = document.getElementById(`precio-ingreso${fin}`).value;
  let precioUnitario2 = moneda(precioUnitario);
  let tipoPago = document.getElementById(`tipo-pago${fin}`).value;
  let encargado = document.getElementById(`lista-encargados${fin}`).value;
  let subTotal = cantidad * precioUnitario;
  let subTotal2 = document.getElementById(`txt-subtotal${fin}`).value;

  var transaccion = await bd.transaction(["tabIngresos"], "readwrite");
  var almacen = await transaccion.objectStore("tabIngresos");
  if (id == "") {
    fechaIng = null;
    fechaIng = timeStamp;
    await almacen.put({
      fecha,
      year,
      mes,
      nombreMes,
      dia,
      hora,
      timeStamp,
      habitacion,
      detalle,
      servicio,
      cantidad,
      precioUnitario,
      precioUnitario2,
      tipoPago,
      encargado,
      subTotal,
      subTotal2,
    });
  } else {
    await almacen.put({
      id,
      fecha,
      year,
      mes,
      nombreMes,
      dia,
      hora,
      timeStamp,
      habitacion,
      detalle,
      servicio,
      cantidad,
      precioUnitario,
      precioUnitario2,
      tipoPago,
      encargado,
      subTotal,
      subTotal2,
    });
  }

  showSnackbar();
  if (fin == 2) {
    cerrarModal();
  }
  nuevoRegistro = true; //Para validar si se actualiza el chart
  mostrar(true);
}

async function nuevoEgreso(fin, id1 = "") {
  //Inserta un registro de gasto en la base de datos
  let id = id1;
  let fecha = document.getElementById(`fecha-egreso${fin}`).value;
  let fechaCadena = fecha + "T00:00:00";
  let objetoFecha = new Date(fechaCadena);
  let mesNum = objetoFecha.getMonth();
  let timeStamp = Date.parse(fechaCadena);
  let year = objetoFecha.getFullYear();
  let mes = `${year}:` + objetoFecha.getMonth();
  let dia = `${mes}:${objetoFecha.getDate()}`;
  let meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  let nombreMes = meses[mesNum];
  let concepto = document.getElementById(`lista-conceptosE${fin}`).value;
  let detalle = document
    .getElementById(`detalle-egreso${fin}`)
    .value.toLowerCase();
  let cantidad = document.getElementById(`cantidad-egreso${fin}`).value;
  let precioUnitario = document.getElementById(`precio-egreso${fin}`).value;
  let precioUnitario2 = moneda(precioUnitario);
  let tipoPago = document.getElementById(`tipo-pagoE${fin}`).value;
  let encargado = document.getElementById(`lista-encargadosE${fin}`).value;
  let subTotal = cantidad * precioUnitario;
  let subTotal2 = document.getElementById(`txt-subtotalE${fin}`).value;

  var transaccion = await bd.transaction(["tabGastos"], "readwrite");
  var almacen = await transaccion.objectStore("tabGastos");
  if (id == "") {
    fechaIng = null;
    fechaIng = timeStamp;
    await almacen.put({
      fecha,
      year,
      mes,
      nombreMes,
      dia,
      timeStamp,
      detalle,
      concepto,
      cantidad,
      precioUnitario,
      precioUnitario2,
      tipoPago,
      encargado,
      subTotal,
      subTotal2,
    });
  } else {
    await almacen.put({
      id,
      fecha,
      year,
      mes,
      nombreMes,
      dia,
      timeStamp,
      detalle,
      concepto,
      cantidad,
      precioUnitario,
      precioUnitario2,
      tipoPago,
      encargado,
      subTotal,
      subTotal2,
    });
  }

  showSnackbar();
  if (fin == 2) {
    cerrarModal();
  }
  nuevoRegistro = true; //Para validar si se actualiza el chart
  mostrar(true);
}

async function mostrarGrafico(update) {
  //Prepara la busqueda de datos para Charts
  if (chartExiste && update != "update" && !nuevoRegistro) {
    return;
  } else {
    let miIndex = "porTimeStamp";
    toggleRango();
    let misDatos = await buscarIndiceGraf(miIndex, setRango());

    if ((update == "update" || nuevoRegistro) && chartExiste) {
      updateCharts(misDatos);
    } else {
      nuevoChart(misDatos);
    }

    chartExiste = true; //Para validar si se actualiza el chart
    nuevoRegistro = false; //Para validar si se actualiza el chart
  }
}

const setRango = () => {
  //Establece el rango a buscar
  // document.getElementById("lista-graf-i").options[0].setAttribute("selected", "selected");
  let activeYear = document.getElementById("lista-graf-i").value;

  miYearCadena = `${activeYear}-01-01T00:00:00`;
  finYearCadena = `${activeYear}-12-31T23:59:59`;

  let inicioI = Date.parse(miYearCadena);
  let finI = Date.parse(finYearCadena);
  let rangoI = IDBKeyRange.bound(inicioI, finI);
  return rangoI;
};

const setRangoAll = () => {
  //Establece el rango para cargar todos los registros

  let inicioI = 0;
  let finI = Date.now();

  let rangoI = IDBKeyRange.bound(inicioI, finI);
  return rangoI;
};

function toggleRango(value = false) {
  //Activa o desactiva inputs de fecha para rangos
  if (value) {
    document.getElementById("label-inicio-i").classList.remove("disabled");
    document.getElementById("label-fin-i").classList.remove("disabled");
    document.getElementById("fecha-inicio-i").classList.remove("disabled");
    document.getElementById("fecha-fin-i").classList.remove("disabled");
    document.getElementById("fecha-inicio-i").removeAttribute("disabled");
    document.getElementById("fecha-fin-i").removeAttribute("disabled");
    return;
  } else {
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

function toggleRangoGastos(value = false) {
  //Activa o desactiva inputs de fecha para rangos
  if (value) {
    document.getElementById("label-inicio-g").classList.remove("disabled");
    document.getElementById("label-fin-g").classList.remove("disabled");
    document.getElementById("fecha-inicio-g").classList.remove("disabled");
    document.getElementById("fecha-fin-g").classList.remove("disabled");
    document.getElementById("fecha-inicio-g").removeAttribute("disabled");
    document.getElementById("fecha-fin-g").removeAttribute("disabled");
    return;
  } else {
    document.getElementById("fecha-inicio-g").value = "";
    document.getElementById("fecha-fin-g").value = "";
    document.getElementById("label-inicio-g").classList.add("disabled");
    document.getElementById("label-fin-g").classList.add("disabled");
    document.getElementById("fecha-inicio-g").classList.add("disabled");
    document.getElementById("fecha-fin-g").classList.add("disabled");
    document.getElementById("fecha-inicio-g").setAttribute("disabled", "true");
    document.getElementById("fecha-fin-g").setAttribute("disabled", "true");
    return;
  }
}

function buscarRango() {
  //Procesa rangos personalizados
  let fechaIni = document.getElementById("fecha-inicio-i").value;
  let inicioICadena = `${fechaIni}T00:00:00`;
  let inicioI = Date.parse(inicioICadena);
  let fechaFin = document.getElementById("fecha-fin-i").value;
  let fechaFinCadena = `${fechaFin}T00:00:00`;
  let finI = Date.parse(fechaFinCadena);
  miIndex = "porTimeStamp";

  if (fechaIni.trim() !== "" && fechaFin !== "" && finI >= inicioI) {
    let rangoI = IDBKeyRange.bound(inicioI, finI);
    buscarIndice(miIndex, rangoI);
  } else if (fechaIni.trim() !== "" && fechaFin !== "" && finI < inicioI) {
    resetTableI();
    alert("La fecha inicial debe ser menor a la fecha final");
    return;
  } else {
    return;
  }
}

function buscarIndice(indice, filtro, year) {
  //Carga los datos para Tabla
  console.log(filtro);
  return new Promise((resolve) => {
    resetTableI();
    var transaccion = bd.transaction(["tabIngresos"]);
    var almacen = transaccion.objectStore("tabIngresos");

    theIndex = almacen.index(indice);
    theIndex.openCursor(filtro, "prev").onsuccess = (evento) => {
      var puntero = evento.target.result;
      // Desestructurar
      if (puntero) {
        contIngresos += 1;
        let {
          id,
          fecha,
          hora,
          habitacion,
          servicio,
          detalle,
          cantidad,
          precioUnitario,
          precioUnitario2,
          tipoPago,
          encargado,
          subTotal,
          subTotal2,
        } = puntero.value;

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
        dataMes.push(puntero.value);
        console.log(dataMes);

        puntero.continue();
      } else {
        document.getElementById("cuerpoTabla").innerHTML = cuerpoTablaHTML;
        paginate.init("#tab-ingresos", options, filterOptions);
        document.getElementById("total-registros2").innerText = contIngresos;
        document.getElementById("total-ingresos2").innerText =
          moneda(totalIngresos);
        contIngresos = 0;
        totalIngresos = 0;
        cuerpoTablaHTML = "";
        document.getElementById("searchBox").value = "";
        buscarOff();
        datosMes(dataMes, year);
        dataMes = [];
        resolve();
      }
    };
  });
}

function buscarIndiceGastos(indice, filtro, year) {
  //Carga los datos para Tabla
  return new Promise((resolve) => {
    resetTableG();
    console.log("resettableg");
    var transaccion = bd.transaction(["tabGastos"]);
    var almacen = transaccion.objectStore("tabGastos");

    theIndex = almacen.index(indice);
    theIndex.openCursor(filtro, "prev").onsuccess = (evento) => {
      var puntero = evento.target.result;
      // Desestructurar
      if (puntero) {
        console.log(puntero);
        contIngresos += 1;
        let {
          id,
          fecha,
          concepto,
          detalle,
          cantidad,
          precioUnitario,
          precioUnitario2,
          tipoPago,
          encargado,
          subTotal,
          subTotal2,
        } = puntero.value;

        cuerpoTablaHTML2 += `
          <tr class="" id="${id}g">
              <td class="fecha" id="fe${id}g">${fecha}</td>
              <td class="servicio" id="se${id}g">${concepto}</td>
              <td class="detalle" id="de${id}g">${detalle}</td>
              <td class="cantidad" id="ca${id}g">${cantidad}</td>
              <td class="moneda" id="pr${id}g" style="display: none">${precioUnitario}</td>
              <td class="moneda" id="pr2${id}g">${precioUnitario2}</td>
              <td class="moneda" id="su${id}g">${subTotal2}</td>
              <td class="pago" id="ti${id}g">${tipoPago}</td>
              <td class="turno" id="en${id}g">${encargado}</td>
              <td class="btnFilas" onclick="showModal(${id})">
              <span class="icon-pencil primary"></span></td>
              <td class="btnFilas" onclick="eliminarIngreso(${id})">
              <span class="icon-trash-can-outline danger"></span></td>
          </tr>`;

        totalIngresos += subTotal;
        dataMes.push(puntero.value);

        puntero.continue();
      } else {
        console.log(cuerpoTablaHTML2);
        document.getElementById("cuerpoTabla-g").innerHTML = cuerpoTablaHTML2;
        paginate.init("#tab-gastos", options, filterOptions);
        document.getElementById("total-registros2-g").innerText = contIngresos;
        document.getElementById("total-ingresos2-g").innerText =
          moneda(totalIngresos);
        contIngresos = 0;
        totalIngresos = 0;
        cuerpoTablaHTML = "";
        document.getElementById("searchBox-g").value = "";
        buscarOff();
        datosMes(dataMes, year);
        dataMes = [];
        resolve();
      }
    };
  });
}

function buscarIndiceGraf(indice, filtro) {
  //Carga los datos para Charts
  return new Promise((resolve) => {
    dataRango = [];
    var transaccion = bd.transaction(["tabIngresos"]);
    var almacen = transaccion.objectStore("tabIngresos");

    theIndex = almacen.index(indice);
    let cursor = theIndex.openCursor(filtro);
    cursor.onsuccess = (evento) => {
      let puntero = evento.target.result;
      if (puntero) {
        dataRango.push(puntero.value);
        puntero.continue();
      } else {
        resolve(dataRango);
      }
    };
  });
}

// =============== Backup de Base de datos ===============//
async function crearJson() {
  //Crea el Json con las tablas para descargar al PC
  let miJsonBase = {
    tabIngresos: [],
    tabGastos: [],
  };
  let misDatos = await buscarIndiceGraf("porTimeStamp", setRangoAll());
  miJsonBase.tabIngresos = misDatos;
  let miJson = JSON.stringify(miJsonBase);
  let nombreArchivo = `BD_${fechasCadena().hoy}_${fechasCadena().hora}`;
  var blob = new Blob([miJson], { type: "" });
  saveAs(blob, `${nombreArchivo}.json`);
}

async function importarJson() {
  //Proceso general de importacion del Backup
  textoBD = "";
  var areaFile = document.getElementById("areaFile");
  var rejilla = document.getElementById("rejilla");
  rejilla.style.display = "none";
  areaFile.style.display = "grid";
  let botonFile = document.getElementById("botonFile");
  let botonFile2 = document.getElementById("input-bd");
  let archivoBD;

  botonFile.onclick = () => {
    botonFile2.click();
  };

  botonFile2.onchange = async (evento) => {
    let data = evento.target.files;
    archivoBD = data[0];
    let lector = new FileReader();
    lector.readAsText(archivoBD);
    lector.onload = async (evento) => {
      textoBD = evento.target.result;
      let infoBD = JSON.parse(textoBD);
      await clearIDB("tabIngresos");
      await importIDB("tabIngresos", infoBD.tabIngresos);
      areaFile.style.display = "none";
      document.getElementById("noti-import").style.display = "grid";

      let linea = document.getElementById("progress-linea2");
      let percentage = document.getElementById("texto-prog");
      let cantidad = 0;
      let long = 500;
      let descuento = long / 100;
      linea.style.strokeDasharray = long;

      let tiempo = setInterval(() => {
        //Barra de progreso horizontal de 0 a 100%
        cantidad += 1;
        let valores = Math.ceil((long -= descuento));
        percentage.textContent = cantidad + "%";
        linea.style.strokeDashoffset = valores;

        if (cantidad >= 100) {
          clearInterval(tiempo);
        }
      }, 20);

      setTimeout(() => {
        //Espera 5 segundos para recargar la pagina
        window.location.href = "./index.html";
      }, 2500);
    };
  };
}

const ocultarDrag = () => {
  //Boton cancelar importacion de BD
  var areaFile = document.getElementById("areaFile");
  var rejilla = document.getElementById("rejilla");
  rejilla.style.display = "grid";
  areaFile.style.display = "none";
};

async function importIDB(tabla, arr) {
  //Insrtta todos los datos del Backup
  var transaccion = await bd.transaction(tabla, "readwrite");
  var almacen = await transaccion.objectStore(tabla);
  for (let obj of arr) {
    await almacen.put(obj);
  }
}

async function clearIDB(tabla) {
  //Limpia la BD antes de importar el Backup
  var transaccion = await bd.transaction(tabla, "readwrite");
  var almacen = await transaccion.objectStore(tabla);
  await almacen.clear();
}
// =============== FIN Backup de Base de datos ===============//

function resetTableI() {
  //completada ok
  document.getElementById("borde-tabla").innerHTML = `
    <table id="tab-ingresos" class="tabla-registros">
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

  cuerpoTablaHTML = "";
  document.getElementById("cuerpoTabla").innerHTML = "";
}

function resetTableG() {
  //completada ok
  document.getElementById("borde-tabla-g").innerHTML = `
    <table id="tab-gastos" class="tabla-registros">
    <thead id = "head-g">
        <tr id="head-g2">
            <th class="fecha th2">Fecha</th>
            <th class="servicio th2">Concepto</th>
            <th class="detalle th2">Detalle</th>
            <th class="cantidad th2">Cant.</th>
            <th class="precio moneda th2">Precio</th>
            <th class="subt moneda th2">SubTotal</th>
            <th class="pago th2">Pago</th>
            <th class="turno th2">Turno</th>
            <th class="opciones th2" colspan="2">Ops.</th>
        </tr>
    </thead>
    <tbody id="cuerpoTabla-g">
    </tbody>
    </table>
    `;

  cuerpoTablaHTML2 = "";
  document.getElementById("cuerpoTabla-g").innerHTML = "";
}

async function eliminarIngreso(id) {
  //completada ok---- Solicita confirmacion
  if (confirm("Está seguro de eliminar este registro?")) {
    fechaIng = await getRegistro(id);
    await eliminarRegistro(id);
    nuevoRegistro = true; //Para validar si se actualiza el chart
    mostrar(true); //El True es para validar que se actualicen los Porcentajes
  } else {
    return;
  }
}

const getRegistro = (id) => {
  //Obtiene la fecha del item antes de que se elimine
  return new Promise((resolve) => {
    var transaccion = bd.transaction(["tabIngresos"], "readwrite");
    var almacen = transaccion.objectStore("tabIngresos");
    almacen.get(id).onsuccess = (evento) => {
      itemElim = evento.target.result;
      fechaItem = null;
      idVal = itemElim.id;
      resolve((fechaItem = itemElim.timeStamp));
    };
  });
};

const eliminarRegistro = (id) => {
  //Elimina el item
  return new Promise((resolve, reject) => {
    var transaccion = bd.transaction(["tabIngresos"], "readwrite");
    var almacen = transaccion.objectStore("tabIngresos");
    almacen.delete(id).onsuccess = (evento) => {
      resolve();
    };
  });
};

function showModal(id) {
  //completada ok
  modalHTML = `<button  class="btn-form" id="btn-editar" onclick="editarIngreso(${id})">Editar</button>`;
  document.getElementById("div-btn").innerHTML = modalHTML;

  let fecha = document.querySelector(`#fe${id}`).innerHTML;
  let hora = document.querySelector(`#ho${id}`).innerHTML;
  let habitacion = document.querySelector(`#ha${id}`).innerHTML;
  let servicio = document.querySelector(`#se${id}`).innerHTML;
  let detalle = document.querySelector(`#de${id}`).innerHTML;
  let cantidad = document.querySelector(`#ca${id}`).innerHTML;
  let precio = document.querySelector(`#pr${id}`).innerHTML;
  let pago = document.querySelector(`#ti${id}`).innerHTML;
  let encargado = document.querySelector(`#en${id}`).innerHTML;
  let subtotal = document.querySelector(`#su${id}`).innerHTML;

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
  let fechaCad = fecha + "T00:00:00";
  fechaIng = Date.parse(fechaCad);

  document.addEventListener("keyup", (e) => {
    if (e.key == "Escape") {
      cerrarModal();
    }
  });
}

async function editarIngreso(id2) {
  //completada ok
  formu2 = document.getElementById("form-editar");
  formu2.onsubmit = (e) => e.preventDefault();
  validarForm(".validar-edit-i", 2, id2);
}

function validarForm(tag, fin, id2) {
  //completada ok == Valida los campos vacios
  idVal = id2;
  let inputs = document.querySelectorAll(tag);
  let validar = 0;
  inputs.forEach((element) => {
    validar += element.value.length == 0 ? 0 : 1;
  });
  if (validar < inputs.length) {
    alert("Debe diligenciar los campos vacíos");
  } else {
    if (tag == ".validar-nuevo-e") {
      nuevoEgreso(fin, id2);
    } else {
      nuevoIngreso(fin, id2);
    }
  }
}

function cerrarModal() {
  //completada ok
  document.getElementById("modal-dialog").classList.remove("animation");
  document.getElementById("modal1").classList.remove("isVisible");
  document.getElementById("modal-dialog").classList.add("noAnimation");
  document.getElementById("modal1").classList.add("noVisible");
}

function cerrarSesion() {
  //culta todas las secciones dentro de MAIN ?????????//
  for (let i = 0; i < arrMenu.length; i++) {
    document.getElementById(`${arrMenu[i]}id`).style.display = "none";
  }
  toggleElement("cerrar-sesion");
  document.getElementById("cerrar-sesion").classList.remove("active");
}

function toggleDark() {
  //completada ok == Cambia el tema de color
  return new Promise((resolve, reject) => {
    document.getElementById("sun").classList.toggle("active");
    document.getElementById("moon").classList.toggle("active");

    document.body.classList.toggle("dark-theme-variables");

    var transaccion = bd.transaction(["darkMode"], "readwrite");
    var almacen = transaccion.objectStore("darkMode");
    let id = 1;

    if (document.getElementById("moon").classList.contains("active")) {
      let theme = true;
      almacen.put({ id, theme });
    } else {
      let theme = false;
      almacen.put({ id, theme });
    }
    if (chartExiste) {
      // if (document.getElementById("a-dashboard").classList.contains("active")){
      updateColorCharts();
    }
    resolve();
  });
}

function moneda(valor) {
  //Convierte números enteros en cadena con formato de moneda hasta $99.999.999.999
  let cadena1, cadena2, cadena3, cadena4, cadena5, cadenaFinal;
  cadena1 = valor.toString();

  switch (cadena1.length) {
    case 4:
      cadena2 = cadena1.substring(0, 1);
      cadena3 = cadena1.substring(1, 4);
      return (cadenaFinal = `$${cadena2}.${cadena3}`);
    case 5:
      cadena2 = cadena1.substring(0, 2);
      cadena3 = cadena1.substring(2, 5);
      return (cadenaFinal = `$${cadena2}.${cadena3}`);
    case 6:
      cadena2 = cadena1.substring(0, 3);
      cadena3 = cadena1.substring(3, 6);
      return (cadenaFinal = `$${cadena2}.${cadena3}`);
    case 7:
      cadena2 = cadena1.substring(0, 1);
      cadena3 = cadena1.substring(1, 4);
      cadena4 = cadena1.substring(4, 7);
      return (cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`);
    case 8:
      cadena2 = cadena1.substring(0, 2);
      cadena3 = cadena1.substring(2, 5);
      cadena4 = cadena1.substring(5, 8);
      return (cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`);
    case 9:
      cadena2 = cadena1.substring(0, 3);
      cadena3 = cadena1.substring(3, 6);
      cadena4 = cadena1.substring(6, 9);
      return (cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}`);
    case 10:
      cadena2 = cadena1.substring(0, 1);
      cadena3 = cadena1.substring(1, 4);
      cadena4 = cadena1.substring(4, 7);
      cadena5 = cadena1.substring(7, 10);
      return (cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}.${cadena5}`);
    case 11:
      cadena2 = cadena1.substring(0, 2);
      cadena3 = cadena1.substring(2, 5);
      cadena4 = cadena1.substring(5, 8);
      cadena5 = cadena1.substring(8, 11);
      return (cadenaFinal = `$${cadena2}.${cadena3}.${cadena4}.${cadena5}`);

    default:
      return (cadenaFinal = `$${cadena1}`);
  }
}

function buscar(id) {
  //completada ok ==Busca dentro de la tabla Ingresos
  if (id == "buscar-i") {
    if (document.getElementById("searchBox").value.trim() !== "") {
      paginate.filter();
      document.getElementById("buscar-i").style.display = "none";
      document.getElementById("cerrar-buscar-i").style.display = "flex";
      document.getElementById("searchBox").addEventListener("keyup", (e) => {
        if (e.key == "Backspace" || e.key == "Delete") {
          buscarOff();
        } else {
          return;
        }
      });
    } else {
      return;
    }
  } else {
    document.getElementById("searchBox").value = "";
    buscarOff();
  }
}

function buscarOff() {
  //completada ok == Reestablece la tabla y el buscador
  if (document.getElementById("searchBox").value.trim() == "") {
    paginate.filter();
    document.getElementById("cerrar-buscar-i").style.display = "none";
    document.getElementById("buscar-i").style.display = "flex";
    document.getElementById("searchBox").value = "";
  }
}

function nuevoChart(datos) {
  //Filtra los datos y renderiza los charts
  let arrColorLight = ["#000920", "#d3d3d4"];
  let arrColorDark = ["#cddbff", "#414149"];
  let condicion = body.classList.contains("dark-theme-variables")
    ? true
    : false;
  let colorText = condicion ? arrColorDark[0] : arrColorLight[0];
  let colorLineas = condicion ? arrColorDark[1] : arrColorLight[1];
  Chart.defaults.color = colorText;
  Chart.defaults.borderColor = colorLineas;
  let colorBlue = "#4776f7be";
  let colorGreen = "#18a764be";
  let colorRed = "#fa6767";

  // let meses = [...new Set(datos.map((data) => data.nombreMes))];
  let meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  filtrado = meses.map(
    (mesActual) => datos.filter((data) => data.nombreMes === mesActual).length
  );
  let porMeses = meses.map((mesActual) =>
    datos.filter((data) => data.nombreMes === mesActual)
  );
  let arrSubTotal = porMeses.map((mes) => mes.map((dia) => dia.subTotal));
  let subTotalmes = arrSubTotal.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );

  let tipoPago = [...new Set(datos.map((data) => data.tipoPago))];
  // console.log(tipoPago);
  let porTipoPago = tipoPago.map((pagoActual) =>
    datos.filter((data) => data.tipoPago === pagoActual)
  );
  console.log(porTipoPago);
  let arrSubTotalTipoPago = porTipoPago.map((tipo) =>
    tipo.map((x) => x.subTotal)
  );
  // console.log(arrSubTotalTipoPago);
  let subTotalTipoPago = arrSubTotalTipoPago.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );

  let servicio = [...new Set(datos.map((data) => data.servicio))];
  let porServicio = servicio.map((item) =>
    datos.filter((data) => data.servicio === item)
  );
  let arrServicio = porServicio.map((item) => item.map((x) => x.subTotal));
  let subTotalServicio = arrServicio.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );
  console.log(porServicio);

  let turno = [...new Set(datos.map((data) => data.encargado))];
  let porTurno = turno.map((item) =>
    datos.filter((data) => data.encargado === item)
  );
  let arrTurno = porTurno.map((item) => item.map((x) => x.subTotal));
  let subTotalTurno = arrTurno.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );
  let turno1 = subTotalTurno[0];
  let turno2 = subTotalTurno[1];

  var ctx1 = document.getElementById("chartResumen").getContext("2d");
  new Chart(ctx1, {
    type: "line",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Ingresos",
          data: subTotalmes,
          backgroundColor: colorBlue,
          borderColor: colorBlue,
          borderWidth: 1.5,
          pointBorderWidth: 1,
          tension: 0.3,
        },
        {
          label: "Gastos",
          backgroundColor: colorRed,
          borderColor: colorRed,
          data: [-2, -1, -3, 0, -1, -3, -1, -2, 0, -3, -2, 0],
          borderColor: colorRed,
          borderWidth: 1.5,
          pointBorderWidth: 1,
          tension: 0.3,
        },
        {
          label: "Utilidad",
          backgroundColor: colorGreen,
          borderColor: colorGreen,
          data: [
            5000, 7000, 6000, 3000, 4000, 7000, 3000, 5000, 6000, 4000, 3000,
            5000,
          ],
          borderColor: colorGreen,
          borderWidth: 2,
          pointBorderWidth: 1,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      // scales: {
      //   y: {
      //     ticks: { color: '#00ff00', beginAtZero: true }
      //   },
      //   x: {
      //     ticks: { color: '#ff0000', beginAtZero: true }
      //   }
      // }
    },
  });

  var ctx = document.getElementById("chartInGastos").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Ingresos",
          backgroundColor: colorBlue,
          borderColor: "white",
          data: subTotalmes,
        },
        {
          label: "Gastos",
          backgroundColor: colorRed,
          borderColor: "yellow",
          data: [
            5000, 7000, 6000, 3000, 4000, 7000, 3000, 5000, 6000, 4000, 3000,
            5000,
          ],
        },
      ],
    },
    options: { responsive: true },
  });

  var ctx2 = document.getElementById("chartPago").getContext("2d");
  new Chart(ctx2, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: subTotalTipoPago,
          borderColor: colorsChart(),
          backgroundColor: colorsChart(95),
          label: "Comparacion de navegadores",
        },
      ],
      labels: tipoPago,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "left" },
      },
    },
  });

  var ctx4 = document.getElementById("chartServicio").getContext("2d");
  new Chart(ctx4, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: subTotalServicio,
          borderColor: colorsChart(),
          backgroundColor: colorsChart(95),
          label: "Comparacion de navegadores",
        },
      ],
      labels: servicio,
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "left" },
      },
    },
  });

  var ctx5 = document.getElementById("chartTurno").getContext("2d");
  new Chart(ctx5, {
    type: "bar",
    data: {
      labels: [turno[0], turno[1]],
      datasets: [
        {
          label: turno[0],
          borderColor: colorBlue,
          backgroundColor: [colorBlue, colorGreen],
          data: [turno1, turno2],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "top",
          display: false,
        },
      },
      indexAxis: "y",
      responsive: true,
    },
  });

  enableEventHandlers();
}

const enableEventHandlers = () => {
  //Escucha click segun año para Charts
  document.getElementById("lista-graf-i").onchange = () =>
    mostrarGrafico("update");
};

const colorsChart = (opacidad) => {
  //Colores para charts con opcion de opacidad
  const arrColores = [
    "#4775f7",
    "#18a764",
    "#fa6767",
    "#a65ff8",
    "#f573c9",
    "#3c6b5f",
  ];
  return arrColores.map((color) => (opacidad ? `${color}${opacidad}` : color));
};

function updateCharts(datos) {
  //Actualiza los datos del chart en tiempo real

  // let meses = [...new Set(datos.map((data) => data.nombreMes))];
  let meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  filtrado = meses.map(
    (mesActual) => datos.filter((data) => data.nombreMes === mesActual).length
  );
  let porMeses = meses.map((mesActual) =>
    datos.filter((data) => data.nombreMes === mesActual)
  );
  let arrSubTotal = porMeses.map((mes) => mes.map((dia) => dia.subTotal));
  let subTotalmes = arrSubTotal.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );

  let tipoPago = [...new Set(datos.map((data) => data.tipoPago))];
  // console.log(tipoPago);
  let porTipoPago = tipoPago.map((pagoActual) =>
    datos.filter((data) => data.tipoPago === pagoActual)
  );
  // console.log(porTipoPago);
  let arrSubTotalTipoPago = porTipoPago.map((tipo) =>
    tipo.map((x) => x.subTotal)
  );
  // console.log(arrSubTotalTipoPago);
  let subTotalTipoPago = arrSubTotalTipoPago.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );
  // console.log(subTotalTipoPago);

  let servicio = [...new Set(datos.map((data) => data.servicio))];
  let porServicio = servicio.map((item) =>
    datos.filter((data) => data.servicio === item)
  );
  let arrServicio = porServicio.map((item) => item.map((x) => x.subTotal));
  let subTotalServicio = arrServicio.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );

  let turno = [...new Set(datos.map((data) => data.encargado))];
  let porTurno = turno.map((item) =>
    datos.filter((data) => data.encargado === item)
  );
  let arrTurno = porTurno.map((item) => item.map((x) => x.subTotal));
  let subTotalTurno = arrTurno.map((item) =>
    item.reduce((acc, el) => acc + el, 0)
  );

  let datos2 = [
    30000, 65000, 40000, 30000, 40000, 70000, 30000, 50000, 60000, 40000, 30000,
    50000,
  ];
  let datos3 = [
    50000, 70000, 60000, 50000, 65000, 75000, 45000, 55000, 76000, 54000, 53000,
    65000,
  ];

  const chart1 = Chart.getChart("chartResumen");
  chart1.data.datasets[0].data = subTotalmes;
  chart1.data.datasets[1].data = datos2;
  chart1.data.datasets[2].data = datos3;
  chart1.update();

  const chart2 = Chart.getChart("chartInGastos");
  chart2.data.datasets[0].data = subTotalmes;
  chart2.data.datasets[1].data = datos2;
  chart2.update();

  const chart3 = Chart.getChart("chartPago");
  chart3.data.datasets[0].data = subTotalTipoPago;
  chart3.data.labels = tipoPago;
  chart3.update();

  const chart4 = Chart.getChart("chartServicio");
  chart4.data.datasets[0].data = subTotalServicio;
  chart4.update();

  const chart5 = Chart.getChart("chartTurno");
  chart5.data.datasets[0].data = subTotalTurno;
  chart5.update();
}

const updateColorCharts = () => {
  //Actualiza los colores de los Charts segun el tema de color
  let arrColorLight = ["#000920", "#d3d3d4"];
  let arrColorDark = ["#cddbff", "#414149"];
  let condicion = body.classList.contains("dark-theme-variables")
    ? true
    : false;
  let colorText = condicion ? arrColorDark[0] : arrColorLight[0];
  let colorLineas = condicion ? arrColorDark[1] : arrColorLight[1];

  const chart = Chart.getChart("chartResumen");
  chart.data.datasets[0].data = chart.data.datasets[0].data;
  chart.data.datasets[1].data = chart.data.datasets[1].data;
  chart.data.datasets[2].data = chart.data.datasets[2].data;
  chart.options.scales.x.grid.color = colorLineas;
  chart.options.scales.y.grid.color = colorLineas;
  chart.options.scales.x.grid.drawBorder = false;
  chart.options.scales.y.grid.drawBorder = false;
  chart.options.scales.x.ticks.color = colorText;
  chart.options.scales.y.ticks.color = colorText;
  chart.options.plugins.legend.labels.color = colorText;
  chart.update();

  const chart2 = Chart.getChart("chartInGastos");
  chart2.data.datasets[0].data = chart2.data.datasets[0].data;
  chart2.data.datasets[1].data = chart2.data.datasets[1].data;
  chart2.options.scales.x.grid.color = colorLineas;
  chart2.options.scales.y.grid.color = colorLineas;
  chart2.options.scales.x.grid.drawBorder = false;
  chart2.options.scales.y.grid.drawBorder = false;
  chart2.options.scales.x.ticks.color = colorText;
  chart2.options.scales.y.ticks.color = colorText;
  chart2.options.plugins.legend.labels.color = colorText;
  chart2.update();

  const chart3 = Chart.getChart("chartPago");
  chart3.data.datasets[0].data = chart3.data.datasets[0].data;
  chart3.options.plugins.legend.labels.color = colorText;
  chart3.update();

  const chart4 = Chart.getChart("chartServicio");
  chart4.data.datasets[0].data = chart4.data.datasets[0].data;
  chart4.options.plugins.legend.labels.color = colorText;
  chart4.update();

  const chart5 = Chart.getChart("chartTurno");
  chart5.data.datasets[0].data = chart5.data.datasets[0].data;
  chart5.options.scales.x.grid.color = colorLineas;
  chart5.options.scales.y.grid.color = colorLineas;
  chart5.options.scales.x.grid.drawBorder = false;
  chart5.options.scales.y.grid.drawBorder = false;
  chart5.options.scales.x.ticks.color = colorText;
  chart5.options.scales.y.ticks.color = colorText;
  chart5.options.plugins.legend.labels.color = colorText;
  chart5.update();
};

// ========PORCENTAJES CIRCULARES===============

function porcentajes(id, porcentaje, num) {
  //Graficos circulares - Ingresos del mes por tipo de pago
  let circulo = document.getElementById(id);
  let percentage = document.getElementById(`texto-${id}`);
  let cantidad = 0;
  let radio = 2 * Math.PI * circulo.r.baseVal.value;
  let descuento = radio / 100;
  let arrColor = [
    "var(--color-success)",
    "var(--primaryColor)",
    "var(--color-danger)",
  ];
  circulo.style.strokeDasharray = radio;
  circulo.style.stroke = arrColor[num - 1];

  let tiempo = setInterval(() => {
    cantidad += 1;
    let valores = Math.ceil((radio -= descuento));
    percentage.textContent = cantidad + "%";
    circulo.style.strokeDashoffset = valores;
    if (cantidad >= porcentaje) {
      clearInterval(tiempo);
      percentage.textContent = porcentaje + "%";
    }
  }, 10);
}

function datosMes(datos, year) {
  //Carga los datos para los porcentajes circulares

  if (!refreshPercent || datos.length == 0) {
    return; //Evita recargar los datos cuando no es necesario
  } else {
    let buscarYear = datos.filter((data) => data.year == year); //Devuelve un string por eso ==

    let meses = [...new Set(buscarYear.map((data) => data.nombreMes))];
    //Si aun no hay datos del mes actual, retorna
    if (fechasCadena().mesNombre != meses[0]) {
      console.log("Sin datos de este mes", fechasCadena().mesNombre, meses[0]);

      document.getElementById("total-mes").innerText = moneda(0);
      document.getElementById("i-cont-mes").innerText = moneda(0);
      document.getElementById("i-elec-mes").innerText = moneda(0);
      document.getElementById("i-cred-mes").innerText = moneda(0);
      return;
    }
    //Si ya hay daotos de el mes actual, procesa los porcentajes
    let porMeses = meses.map((mesActual) =>
      buscarYear.filter((data) => data.nombreMes === mesActual)
    );

    let mesActual = porMeses[0];
    console.log(buscarYear);
    let arrSubTotal = mesActual.map((x) => x.subTotal);
    let totalmes = arrSubTotal.reduce((acc, el) => acc + el, 0);

    let efectivo1 = mesActual.filter((x) => x.tipoPago === "Factura");
    let efectivo2 = mesActual.filter((x) => x.tipoPago === "Efectivo");
    let efectivo = efectivo1.concat(efectivo2);
    console.log(efectivo1, efectivo2);
    let arrEfectivo = efectivo.map((x) => x.subTotal);
    let totalEfectivo = arrEfectivo.reduce((acc, el) => acc + el, 0);

    let porcentaje1 = parseFloat(((totalEfectivo / totalmes) * 100).toFixed(1));

    let electronico = mesActual.filter(
      (x) => x.tipoPago === "Tarjeta" || x.tipoPago === "Transferencia"
    );
    let arrElectronico = electronico.map((x) => x.subTotal);
    console.log(electronico, arrElectronico);
    let totalElectronico = arrElectronico.reduce((acc, el) => acc + el, 0);

    let porcentaje2 = parseFloat(
      ((totalElectronico / totalmes) * 100).toFixed(1)
    );

    let credito = mesActual.filter((x) => x.tipoPago === "Crédito");
    let arrCredito = credito.map((x) => x.subTotal);
    let totalCredito = arrCredito.reduce((acc, el) => acc + el, 0);

    let porcentaje3 = parseFloat(((totalCredito / totalmes) * 100).toFixed(1));

    if (porcentaje1 + porcentaje2 + porcentaje3 > 100.0) {
      porcentaje3 = (porcentaje3 - 0.1).toFixed(1);
    } else if (porcentaje1 + porcentaje2 + porcentaje3 < 100.0) {
      porcentaje3 = (porcentaje3 + 0.1).toFixed(1);
    }

    if (porcentaje3 < 0.0) {
      porcentaje3 = 0;
      porcentaje2 = (porcentaje2 - 0.1).toFixed(1);
    }

    document.getElementById("total-mes").innerText = moneda(totalmes);
    document.getElementById("i-cont-mes").innerText = moneda(totalEfectivo);
    document.getElementById("i-elec-mes").innerText = moneda(totalElectronico);
    document.getElementById("i-cred-mes").innerText = moneda(totalCredito);

    porcentajes("prog-efectivo", porcentaje1, 1);
    porcentajes("prog-credito", porcentaje2, 2);
    porcentajes("prog-total", porcentaje3, 3);
  }
}

function showSnackbar() {
  //Completada ok
  var snackBar = document.getElementById("snackbar");
  // Dynamically Appending class
  // to HTML element
  snackBar.className = "show-bar";

  setTimeout(function () {
    snackBar.className = snackBar.className.replace("show-bar", "");
  }, 2000);
}

const setArrYears = () => {
  //Rellena el select con años para Graficos
  let miYear = fechasCadena().year;
  let yearsGraf = [];

  for (let i = 2010; i <= miYear; i++) {
    yearsGraf.unshift(i);
  }
  let menuGraf = document.getElementById("lista-graf-i");
  for (let i = 0; i < yearsGraf.length; i++) {
    menuGraf.options[i] = new Option(yearsGraf[i]);
  }
};
