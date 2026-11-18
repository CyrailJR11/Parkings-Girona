// Mapa de Leaflet: un marcador por parking y su ficha emergente.
import { cssVar } from "../util.js";

export class VistaMapa {
  #mapa; #marcadores = new Map(); #yo = null; #alSeleccionar;
  constructor(idContenedor, { alSeleccionar, alAvisar }) {
    this.#mapa = L.map(idContenedor).setView([41.983, 2.8195], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(this.#mapa);
    this.#alSeleccionar = alSeleccionar;
    // Un solo oyente para los botones de aviso: la ficha se redibuja y perdería los suyos.
    document.getElementById(idContenedor).addEventListener("click", (ev) => {
      const b = ev.target.closest(".rep button");
      if (b) alAvisar(b.parentElement.dataset.id, b.dataset.s);
    });
  }
  distancia(parking, pos) { return pos ? this.#mapa.distance(pos, [parking.lat, parking.lng]) : 0; }

  pintar(parking, disp, fichaHtml) {
    const cls = disp.esPrevision ? "pin fc" : "pin";
    const icono = L.divIcon({ className: "", iconSize: [38, 38], iconAnchor: [19, 19], html: `<div class="${cls}" style="background:${disp.color}">${disp.textoMarcador()}</div>` });
    let m = this.#marcadores.get(parking.id);
    if (!m) {
      m = L.marker([parking.lat, parking.lng], { icon: icono }).addTo(this.#mapa);
      m.on("click", () => this.#alSeleccionar(parking.id, false));
      this.#marcadores.set(parking.id, m);
    } else m.setIcon(icono);
    const pop = m.getPopup();
    if (pop && pop.isOpen()) pop.setContent(fichaHtml); else m.bindPopup(fichaHtml);
  }
  enfocar(parking) { this.#mapa.setView([parking.lat, parking.lng], 16); this.#marcadores.get(parking.id)?.openPopup(); }
  cerrarFicha() { this.#mapa.closePopup(); }
  mostrarYo(pos) {
    if (!this.#yo) this.#yo = L.circleMarker(pos, { radius: 8, color: "#fff", weight: 3, fillColor: cssVar("--sign"), fillOpacity: 1 }).addTo(this.#mapa);
    else this.#yo.setLatLng(pos);
    this.#mapa.setView(pos, 15);
  }
}
