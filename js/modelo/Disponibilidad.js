// Jerarquía de "disponibilidad": cada subclase sabe cómo mostrarse (polimorfismo),
// así la interfaz nunca pregunta "¿de qué tipo eres?".
import { color, hace } from "../util.js";

export const ETIQUETA = { free: "Hay sitio", few: "Pocas plazas", full: "Lleno" };
export const PISTA = { free: "suele haber sitio", few: "suele haber pocas plazas", full: "suele estar casi lleno" };

/** Clase abstracta: no se puede instanciar directamente. */
export class Disponibilidad {
  // Encapsulamiento: estado privado e inmutable; solo se lee con getters.
  #nivel; #actualizado; #pista;
  constructor({ nivel = null, actualizado = null, pista = null } = {}) {
    if (new.target === Disponibilidad) throw new TypeError("Disponibilidad es abstracta");
    if (nivel !== null && !(nivel in ETIQUETA)) throw new RangeError("Nivel no válido: " + nivel);
    this.#nivel = nivel;
    this.#actualizado = actualizado;
    this.#pista = pista;
  }
  /** "free" | "few" | "full" | null */
  get nivel() { return this.#nivel; }
  /** Marca de tiempo (ms) del dato, o null. */
  get actualizado() { return this.#actualizado; }
  /** Previsión orientativa que se enseña como ayuda, o null. */
  get pista() { return this.#pista; }
  /** Orden en la lista: menor = más arriba. */
  get orden() { return 2; }
  /** Color de fondo del marcador y la insignia. */
  get color() { return color(this.nivel ?? "unk"); }
  /** Color de la línea de estado en la lista. */
  get colorTexto() { return this.color; }
  /** ¿Se puede aparcar sin abono? Los de solo abonados van al final de la lista. */
  get admiteRotacion() { return true; }
  /** Texto dentro del marcador del mapa. */
  textoMarcador() { throw new Error("textoMarcador() no implementado"); }
  /** Texto pequeño bajo el número de la insignia. */
  textoInsignia() { throw new Error("textoInsignia() no implementado"); }
  /** Línea de estado (HTML) en la lista y la ficha. */
  estadoHtml() { throw new Error("estadoHtml() no implementado"); }
  /** ¿Se pueden enviar avisos desde la ficha? */
  get admiteAvisos() { return true; }
  /** ¿El marcador va con borde discontinuo (previsión)? */
  get esPrevision() { return false; }
  /** Plazas libres/ocupadas si se conocen. */
  plazasLibres() { return null; }
  insigniaHtml() {
    const cls = this.esPrevision ? "badge dashed" : "badge";
    const estilo = this.esPrevision ? `color:${this.color}` : `background:${this.color}`;
    return `<div class="${cls}" style="${estilo}">${this.textoMarcador()}<small>${this.textoInsignia()}</small></div>`;
  }
  pistaHtml() { return this.pista ? `<p class="hint">Pista, no es un dato real: a esta hora ${PISTA[this.pista]}.</p>` : ""; }
  actualizadoTexto() { return this.actualizado ? hace(this.actualizado) : "—"; }
}

/** Dato real publicado por el operador. */
export class DisponibilidadReal extends Disponibilidad {
  #libres; #total; #fuente;
  constructor({ libres, total, actualizado, fuente }) {
    super({ nivel: DisponibilidadReal.nivelPara(libres, total), actualizado });
    this.#libres = libres; this.#total = total; this.#fuente = fuente;
  }
  get libres() { return this.#libres; }
  get total() { return this.#total; }
  get fuente() { return this.#fuente; }
  static nivelPara(libres, total) {
    if (libres <= 0) return "full";
    return libres / Math.max(1, total) > 0.15 && libres > 20 ? "free" : "few";
  }
  get orden() { return 0; }
  textoMarcador() { return String(this.libres); }
  textoInsignia() { return "libres"; }
  estadoHtml() { return `<span style="color:${this.color}">${this.libres} plazas libres</span> · dato de ${this.fuente}, ${hace(this.actualizado)}`; }
  plazasLibres() { return { libres: this.libres, ocupadas: Math.max(0, this.total - this.libres), total: this.total }; }
}

/** Aviso reciente de un conductor. */
export class DisponibilidadAviso extends Disponibilidad {
  get orden() { return 1; }
  textoMarcador() { return "!"; }
  textoInsignia() { return "aviso"; }
  estadoHtml() { return `<span style="color:${this.color}">${ETIQUETA[this.nivel]}</span> · aviso de un conductor ${hace(this.actualizado)}`; }
}

/** Previsión orientativa para otra hora: nunca muestra un número. */
export class DisponibilidadPrevision extends Disponibilidad {
  get orden() { return 1; }
  get esPrevision() { return true; }
  get admiteAvisos() { return false; }
  textoMarcador() { return "~"; }
  textoInsignia() { return "previsión"; }
  estadoHtml() { return `Previsión orientativa: ${PISTA[this.nivel]}`; }
  pistaHtml() { return ""; }
}

/** No hay dato real ni aviso. */
export class DisponibilidadDesconocida extends Disponibilidad {
  get orden() { return 2; }
  textoMarcador() { return "?"; }
  get colorTexto() { return color("muted"); }
  textoInsignia() { return "sin dato"; }
  estadoHtml() { return "Disponibilidad desconocida"; }
}

/** Parking solo para abonados. */
export class SoloAbonados extends Disponibilidad {
  get orden() { return 3; }
  get color() { return color("sub"); }
  get colorTexto() { return color("muted"); }
  get admiteAvisos() { return false; }
  get admiteRotacion() { return false; }
  textoMarcador() { return "A"; }
  textoInsignia() { return "abonados"; }
  estadoHtml() { return "Solo abonados, no admite rotación"; }
}
