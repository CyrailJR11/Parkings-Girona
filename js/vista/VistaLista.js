// Lista de parkings bajo el mapa.
export class VistaLista {
  #ul;
  constructor(ul, alSeleccionar) { this.#ul = ul; this.alSeleccionar = alSeleccionar; }

  /** filas: [{parking, disp, distancia}] ya ordenadas */
  pintar(filas, seleccionado) {
    this.#ul.innerHTML = "";
    for (const { parking, disp, distancia } of filas) {
      const li = document.createElement("li");
      li.className = "item" + (seleccionado === parking.id ? " sel" : "");
      li.tabIndex = 0; li.dataset.id = parking.id;
      const d = distancia == null ? "" : distancia < 1000 ? Math.round(distancia / 10) * 10 + " m · " : (distancia / 1000).toFixed(1) + " km · ";
      li.innerHTML = `${disp.insigniaHtml()}<div style="min-width:0"><div class="name"></div>
        <div class="src" style="color:${disp.colorTexto}">${disp.estadoHtml().replace(/<[^>]+>/g, "")}</div>
        <div class="meta">${d}${disp.plazasLibres()?.total ?? parking.plazas} plazas · </div></div>`;
      li.querySelector(".name").textContent = parking.nombre;
      li.querySelector(".meta").append(parking.operador);
      li.addEventListener("click", () => this.alSeleccionar(parking.id, true));
      li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.alSeleccionar(parking.id, true); } });
      this.#ul.appendChild(li);
    }
  }
  marcar(id) { for (const li of this.#ul.children) li.classList.toggle("sel", li.dataset.id === id); }
}
