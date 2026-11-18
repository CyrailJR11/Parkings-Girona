// Jerarquía de lugares donde aparcar.
//   Aparcamiento (abstracta)
//   ├── ParkingCerrado (abstracta: barrera, plazas, operador, posición en el mapa)
//   │   ├── ParkingRotacion  → pide su disponibilidad a las fuentes
//   │   └── ParkingAbonados  → siempre "solo abonados"
//   └── ZonaCalle (abstracta: zona de pago en la calle, sin datos de ocupación)
//       ├── ZonaAzul
//       └── ZonaVerde
import { SoloAbonados } from "./Disponibilidad.js";
import { esc } from "../util.js";

export class Aparcamiento {
  constructor({ id, nombre }) {
    if (new.target === Aparcamiento) throw new TypeError("Aparcamiento es abstracta");
    this.id = id; this.nombre = nombre;
  }
  /** Cada subclase decide cómo se describe su precio. */
  tarifaHtml() { throw new Error("tarifaHtml() no implementado"); }
}

export class ParkingCerrado extends Aparcamiento {
  constructor({ id, nombre, plazas, operador, direccion, horario = null, telefono = null, urlTarifas, lat, lng, zona, enVivo = false }) {
    super({ id, nombre });
    if (new.target === ParkingCerrado) throw new TypeError("ParkingCerrado es abstracta");
    Object.assign(this, { plazas, operador, direccion, horario, telefono, urlTarifas, lat, lng, zona, enVivo });
  }
  /** Polimorfismo: cada tipo de parking resuelve su disponibilidad a su manera. */
  disponibilidad(_servicio, _contexto) { throw new Error("disponibilidad() no implementado"); }
  tarifaHtml() { return `<a href="${this.urlTarifas}" target="_blank" rel="noopener">Tarifas oficiales</a>`; }
  fichaHtml(disp, puedeAvisar) {
    const p = disp.plazasLibres();
    let h = `<div class="pp"><h3>${esc(this.nombre)}</h3><div class="status">${disp.estadoHtml()}</div><dl>`;
    h += `<dt>Plazas totales</dt><dd>${p?.total ?? this.plazas}</dd>`;
    if (p) h += `<dt>Ocupadas</dt><dd>${p.ocupadas}</dd>`;
    h += `<dt>Dirección</dt><dd>${esc(this.direccion)}</dd>`;
    h += `<dt>Horario</dt><dd>${esc(this.horario ?? "Sin dato")}</dd>`;
    h += `<dt>Gestión</dt><dd>${esc(this.operador)}${this.telefono ? " · " + this.telefono : ""}</dd>`;
    h += `<dt>Precio</dt><dd>${this.tarifaHtml()}</dd>`;
    h += `<dt>Actualizado</dt><dd>${disp.actualizadoTexto()}</dd></dl>`;
    h += disp.pistaHtml();
    if (puedeAvisar && disp.admiteAvisos) h += ParkingCerrado.#botonesAviso(this.id);
    return h + "</div>";
  }
  static #botonesAviso(id) {
    return `<div class="rep" data-id="${id}">
      <button type="button" data-s="free" style="background:var(--free)">Hay sitio</button>
      <button type="button" data-s="few" style="background:var(--few)">Pocas</button>
      <button type="button" data-s="full" style="background:var(--full)">Lleno</button></div>
      <p class="note">¿Estás aquí? Avisa a los demás.</p>`;
  }
}

export class ParkingRotacion extends ParkingCerrado {
  disponibilidad(servicio, contexto) { return servicio.resolver(this, contexto); }
}

export class ParkingAbonados extends ParkingCerrado {
  disponibilidad() { return new SoloAbonados(); }
}

export class ZonaCalle extends Aparcamiento {
  constructor({ id, nombre, horarios, tarifas, notas = [] }) {
    super({ id, nombre });
    if (new.target === ZonaCalle) throw new TypeError("ZonaCalle es abstracta");
    Object.assign(this, { horarios, tarifas, notas });
  }
  /** Cada zona tiene su color en la tarjeta. */
  get colorVariable() { throw new Error("colorVariable no implementado"); }
  tarifaHtml() { return this.tarifas.length > 1 ? `<ul>${this.tarifas.map((t) => `<li>${t}</li>`).join("")}</ul>` : `<p><b>Tarifa:</b> ${this.tarifas[0]}</p>`; }
  tarjetaHtml() {
    return `<div class="zone"><h2><i style="background:var(${this.colorVariable})"></i>${esc(this.nombre)}</h2>
      ${this.horarios.map((h) => `<p><b>${h.titulo}:</b> ${h.texto}</p>`).join("")}
      ${this.tarifaHtml()}
      ${this.notas.map((n) => `<p>${n}</p>`).join("")}</div>`;
  }
}
export class ZonaAzul extends ZonaCalle { get colorVariable() { return "--zblue"; } }
export class ZonaVerde extends ZonaCalle { get colorVariable() { return "--zgreen"; } }
