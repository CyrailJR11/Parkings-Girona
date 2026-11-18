// Fuentes de disponibilidad (abstracción + polimorfismo).
// El ServicioDisponibilidad las consulta en orden y se queda con la primera que responde.
import { DisponibilidadReal, DisponibilidadAviso, DisponibilidadPrevision, DisponibilidadDesconocida } from "../modelo/Disponibilidad.js";

export class FuenteDisponibilidad {
  constructor() { if (new.target === FuenteDisponibilidad) throw new TypeError("FuenteDisponibilidad es abstracta"); }
  /** Devuelve una Disponibilidad o null si esta fuente no sabe nada del parking. */
  obtener(_parking, _contexto) { throw new Error("obtener() no implementado"); }
}

/** Plazas libres que el operador publica (hoy, Saba vía Supabase). */
export class FuenteOperadorEnVivo extends FuenteDisponibilidad {
  static VIGENCIA = 20 * 60 * 1000;
  constructor(repositorio, nombre = "Saba") { super(); this.repo = repositorio; this.nombre = nombre; }
  obtener(parking, ctx) {
    if (!ctx.esAhora || !parking.enVivo) return null;
    const d = this.repo.datoEnVivo(parking.id);
    if (!d || !d.ok || d.libres == null || Date.now() - d.actualizado > FuenteOperadorEnVivo.VIGENCIA) return null;
    return new DisponibilidadReal({ libres: d.libres, total: d.total ?? parking.plazas, actualizado: d.actualizado, fuente: this.nombre });
  }
}

/** Avisos de conductores de los últimos 45 minutos. */
export class FuenteAvisos extends FuenteDisponibilidad {
  constructor(repositorio) { super(); this.repo = repositorio; }
  obtener(parking, ctx) {
    if (!ctx.esAhora) return null;
    const a = this.repo.ultimoAviso(parking.id);
    return a ? new DisponibilidadAviso({ nivel: a.estado, actualizado: a.ts, pista: ctx.prevision(parking) }) : null;
  }
}

/** Para otra hora: solo previsión orientativa. */
export class FuentePrevision extends FuenteDisponibilidad {
  obtener(parking, ctx) { return ctx.esAhora ? null : new DisponibilidadPrevision({ nivel: ctx.prevision(parking) }); }
}

/** Último recurso: siempre responde "desconocida". */
export class FuenteDesconocida extends FuenteDisponibilidad {
  obtener(parking, ctx) { return new DisponibilidadDesconocida({ pista: ctx.prevision(parking) }); }
}

export class ServicioDisponibilidad {
  #fuentes;
  constructor(fuentes) { this.#fuentes = fuentes; }
  resolver(parking, contexto) {
    for (const f of this.#fuentes) { const d = f.obtener(parking, contexto); if (d) return d; }
    return new DisponibilidadDesconocida();
  }
}
