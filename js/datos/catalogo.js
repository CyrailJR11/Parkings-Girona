// Datos estáticos (fuentes: Ajuntament de Girona, TMG, Saba). Aquí se crean los objetos.
import { ParkingRotacion, ParkingAbonados, ZonaAzul, ZonaVerde } from "../modelo/Aparcamiento.js";

const TMG = "https://web2.girona.cat/tmg/cat/aparcaments_fitxa.php?id=";
const AJ = "https://web.girona.cat/mobilitat/aparcaments-municipals";
const SABA = "https://www.saba.es/ca/parking-girona/";
const TMG_HORARIO = "24 h (atención L–V 6:30–21:30)";

export const PARKINGS = Object.freeze([
  new ParkingRotacion({ id: "emili-grahit", nombre: "Emili Grahit", plazas: 326, operador: "TMG", direccion: "C. d'Emili Grahit, 4", horario: TMG_HORARIO, telefono: "972 486 682", urlTarifas: TMG + "eg", lat: 41.97565, lng: 2.81703, zona: "eixample" }),
  new ParkingRotacion({ id: "miquel-palol", nombre: "Pl. Miquel de Palol", plazas: 218, operador: "TMG", direccion: "Pl. de Miquel de Palol, 72", horario: TMG_HORARIO, telefono: "972 223 382", urlTarifas: TMG + "mp", lat: 41.9819, lng: 2.81443, zona: "eixample" }),
  new ParkingAbonados({ id: "pallol", nombre: "Pl. del Pallol", plazas: 40, operador: "TMG", direccion: "Pl. del Pallol", urlTarifas: AJ, lat: 41.98288, lng: 2.82574, zona: "centre" }),
  new ParkingRotacion({ id: "calvet", nombre: "Pl. Calvet i Rubalcaba", plazas: 380, operador: "Parking Pl. Catalunya", direccion: "Pl. de Francesc Calvet i Rubalcaba", telefono: "972 212 120", urlTarifas: AJ, lat: 41.97984, lng: 2.82261, zona: "centre" }),
  new ParkingRotacion({ id: "vista-alegre", nombre: "Parc de Vista Alegre", plazas: 90, operador: "Guimerà Nou", direccion: "Parc de Vista Alegre", urlTarifas: AJ, lat: 41.97685, lng: 2.82651, zona: "periferia" }),
  new ParkingRotacion({ id: "u-octubre", nombre: "Pl. U d'Octubre / Josep Pla", plazas: 407, operador: "Parking Pl. Constitució", direccion: "Pl. de l'U d'Octubre de 2017", urlTarifas: AJ, lat: 41.9835, lng: 2.8208, zona: "eixample" }),
  new ParkingRotacion({ id: "pompeu-fabra", nombre: "Saba Santa Caterina (Generalitat)", plazas: 444, operador: "SABA", direccion: "Pl. de l'Hospital", urlTarifas: SABA + "parking-saba-santa-caterina", enVivo: true, lat: 41.98133, lng: 2.82082, zona: "centre" }),
  new ParkingRotacion({ id: "berenguer", nombre: "Saba Berenguer Carnisser", plazas: 427, operador: "SABA", direccion: "C. de Berenguer Carnicer (Nous Jutjats)", urlTarifas: SABA + "parking-saba-berenguer-i-carnicer", enVivo: true, lat: 41.98866, lng: 2.82289, zona: "centre" }),
  new ParkingRotacion({ id: "santa-eugenia", nombre: "Pl. Santa Eugènia", plazas: 345, operador: "EMPARK (Telpark)", direccion: "Pl. de Santa Eugènia", urlTarifas: "https://www.telpark.com/en/cities/girona/", lat: 41.9763, lng: 2.80306, zona: "periferia" }),
  new ParkingRotacion({ id: "trueta", nombre: "Hospital Josep Trueta", plazas: 122, operador: "Tadifi", direccion: "Av. de França (Hospital Trueta)", urlTarifas: AJ, lat: 41.99843, lng: 2.81838, zona: "hospital" }),
  new ParkingAbonados({ id: "marva", nombre: "Pl. General Marvà", plazas: 39, operador: "Projectes i Disseny", direccion: "Pl. del General Marvà", urlTarifas: AJ, lat: 41.98103, lng: 2.8241, zona: "centre" }),
  new ParkingAbonados({ id: "pou-rodo", nombre: "Pl. Pou Rodó", plazas: 40, operador: "Rubau Tarrés", direccion: "C. del Pou Rodó", urlTarifas: AJ, lat: 41.98868, lng: 2.825, zona: "centre" }),
  new ParkingRotacion({ id: "saba-estacio", nombre: "Saba Estació Tren", plazas: 358, operador: "SABA", direccion: "C. de Pierre Vilar, 2", urlTarifas: SABA + "parking-saba-estacio-tren-girona", enVivo: true, lat: 41.97849, lng: 2.81674, zona: "estacio" }),
]);

export const ZONAS = Object.freeze([
  new ZonaAzul({
    id: "zona-azul", nombre: "Zona azul",
    horarios: [
      { titulo: "Horario", texto: "lunes a sábado laborables, 9:30–13 h y 16–20 h. En Sant Narcís: L–V 9:30–13 h y 17–20 h, sábados 9:30–13 h. Fuera de horario es gratis." },
    ],
    tarifas: ["1,20 € la hora, máximo 2 horas (2,40 €). Mínimo 0,35 €."],
    notas: ["<b>Anular denuncia:</b> 6,85 € antes de 24 h."],
  }),
  new ZonaVerde({
    id: "zona-verde", nombre: "Zona verde",
    horarios: [
      { titulo: "Horario Güell-Devesa", texto: "lunes a sábado laborables, 8–20 h." },
      { titulo: "Horario Pedreres-Vista Alegre", texto: "L–V 9:30–13 h y 17–20 h, sábados 9:30–13 h." },
    ],
    tarifas: [
      "No residentes en Girona: 1,20 €/h, máximo 2 h.",
      "Residentes en Girona (fuera de la zona): 0,65 €/h, máximo 6 h.",
      "Residentes de la zona: 0,35 € al día.",
      "Riu Güell (entre rotondas del Rellotge y la Devesa): 2 h gratis martes y sábados de mercado, 8–14 h.",
    ],
  }),
]);
