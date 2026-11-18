// Controlador: une el modelo, las fuentes de datos y las vistas.
import { $, formatoHora, hace, toast } from "./util.js";
import { ModeloPrevision } from "./modelo/ModeloPrevision.js";
import { ServicioDisponibilidad, FuenteOperadorEnVivo, FuenteAvisos, FuentePrevision, FuenteDesconocida } from "./fuentes/FuenteDisponibilidad.js";
import { VistaMapa } from "./vista/VistaMapa.js";
import { VistaLista } from "./vista/VistaLista.js";
import { VistaZonas } from "./vista/VistaZonas.js";

export class App {
  static ESPERA_AVISO = 2 * 60 * 1000;
  #parkings; #repo; #prevision; #servicio; #mapa; #lista;
  #seleccionado = null; #esAhora = true; #posicion = null;
  #ultimoEnvio = new Map();
  #dispositivo = App.#idDispositivo();

  constructor({ parkings, zonas, repositorio }) {
    this.#parkings = parkings; this.#repo = repositorio;
    this.#prevision = new ModeloPrevision();
    // El orden de la cadena es la prioridad: dato real > aviso > previsión > desconocido.
    this.#servicio = new ServicioDisponibilidad([
      new FuenteOperadorEnVivo(repositorio, "Saba"),
      new FuenteAvisos(repositorio),
      new FuentePrevision(),
      new FuenteDesconocida(),
    ]);
    this.#mapa = new VistaMapa("map", { alSeleccionar: (id, d) => this.seleccionar(id, d), alAvisar: (id, e) => this.avisar(id, e) });
    this.#lista = new VistaLista($("list"), (id, d) => this.seleccionar(id, d));
    new VistaZonas($("zonas-lista")).pintar(zonas);
    this.#repo.alCambiar(() => this.pintar());
  }

  iniciar() {
    this.#conectarControles();
    this.#ponerAhora();
    this.pintar();
    setInterval(() => { if (this.#esAhora) { this.#ponerAhora(); this.pintar(); } }, 60000);
    this.#cargar();
    this.#repo.conectarTiempoReal();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (this.#esAhora) this.#ponerAhora(); this.#cargar(); } });
  }

  #contexto() {
    const dia = +$("day").value, hora = +$("hour").value;
    return { esAhora: this.#esAhora, prevision: (p) => this.#prevision.nivel(p, dia, hora) };
  }

  pintar() {
    $("hourlbl").textContent = formatoHora(+$("hour").value);
    $("fcbanner").hidden = this.#esAhora;
    const ctx = this.#contexto();
    const filas = this.#parkings.map((parking) => {
      const disp = parking.disponibilidad(this.#servicio, ctx); // polimorfismo: rotación o abonados
      return { parking, disp, distancia: this.#posicion ? this.#mapa.distancia(parking, this.#posicion) : null };
    });
    filas.sort((a, b) => {
      if (this.#posicion) {
        if (a.disp.admiteRotacion !== b.disp.admiteRotacion) return a.disp.admiteRotacion ? -1 : 1;
        return a.distancia - b.distancia;
      }
      if (a.disp.orden !== b.disp.orden) return a.disp.orden - b.disp.orden;
      const la = a.disp.plazasLibres(), lb = b.disp.plazasLibres();
      if (la && lb) return lb.libres - la.libres;
      return a.parking.nombre.localeCompare(b.parking.nombre);
    });
    this.#lista.pintar(filas, this.#seleccionado);
    for (const { parking, disp } of filas) this.#mapa.pintar(parking, disp, parking.fichaHtml(disp, this.#esAhora));
    const ultimo = this.#repo.ultimaLecturaEnVivo();
    $("status").textContent = (ultimo ? "Plazas de Saba actualizadas " + hace(ultimo) + ". " : "Sin datos de Saba ahora mismo. ") + "Avisos de conductores en directo.";
  }

  seleccionar(id, desdeLista) {
    this.#seleccionado = id;
    this.#lista.marcar(id);
    if (!desdeLista) return;
    this.#mapa.enfocar(this.#parkings.find((p) => p.id === id));
    if (window.innerWidth <= 760) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async avisar(id, estado) {
    const ultimo = this.#ultimoEnvio.get(id);
    if (ultimo && Date.now() - ultimo < App.ESPERA_AVISO) { toast("Ya has avisado de este parking hace poco."); this.#mapa.cerrarFicha(); return; }
    try {
      await this.#repo.enviarAviso(id, estado, this.#dispositivo);
      this.#ultimoEnvio.set(id, Date.now());
      toast("Aviso enviado. Gracias.");
    } catch { toast("No se pudo enviar el aviso. Revisa la conexión e inténtalo otra vez."); }
    this.#mapa.cerrarFicha();
  }

  async #cargar() {
    try { await this.#repo.cargar(); }
    catch { $("status").textContent = "Sin conexión: no se pueden mostrar datos en directo."; }
  }

  #ponerAhora() {
    const d = new Date();
    $("day").value = String(d.getDay());
    $("hour").value = String(Math.round((d.getHours() + d.getMinutes() / 60) * 2) / 2);
    this.#esAhora = true;
  }

  #conectarControles() {
    const pestana = (zonas) => {
      $("tab-p").setAttribute("aria-selected", String(!zonas)); $("tab-z").setAttribute("aria-selected", String(zonas));
      $("list").hidden = zonas; $("pctrl").hidden = zonas; $("zones").hidden = !zonas;
    };
    $("tab-p").addEventListener("click", () => pestana(false));
    $("tab-z").addEventListener("click", () => pestana(true));
    $("day").addEventListener("change", () => { this.#esAhora = false; this.pintar(); });
    $("hour").addEventListener("input", () => { this.#esAhora = false; this.pintar(); });
    $("now").addEventListener("click", () => { this.#ponerAhora(); this.pintar(); });
    $("locate").addEventListener("click", () => {
      if (!navigator.geolocation) { toast("Tu navegador no permite la ubicación."); return; }
      navigator.geolocation.getCurrentPosition((pos) => {
        this.#posicion = [pos.coords.latitude, pos.coords.longitude];
        this.#mapa.mostrarYo(this.#posicion);
        this.pintar();
      }, () => toast("No se pudo obtener tu ubicación."), { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  static #idDispositivo() {
    const nuevo = () => "d" + Math.random().toString(36).slice(2, 12);
    try { const id = localStorage.getItem("ag-device") || nuevo(); localStorage.setItem("ag-device", id); return id; }
    catch { return nuevo(); }
  }
}
