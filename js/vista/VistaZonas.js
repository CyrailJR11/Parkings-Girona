// Pestaña de zonas azul y verde: cada zona sabe pintar su tarjeta (polimorfismo).
export class VistaZonas {
  #contenedor;
  constructor(contenedor) { this.#contenedor = contenedor; }
  pintar(zonas) { this.#contenedor.innerHTML = zonas.map((z) => z.tarjetaHtml()).join(""); }
}
