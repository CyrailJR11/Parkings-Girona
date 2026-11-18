// Curvas de ocupación típicas por hora. Solo se usan como pista, nunca como dato.
const LABORABLE = [.18,.15,.13,.12,.12,.15,.25,.45,.68,.82,.88,.92,.93,.86,.74,.72,.80,.88,.92,.88,.74,.52,.36,.24];
const SABADO    = [.25,.20,.16,.14,.13,.13,.16,.24,.38,.58,.78,.90,.94,.88,.72,.66,.74,.86,.92,.90,.82,.70,.52,.36];
const DOMINGO   = [.24,.20,.16,.14,.13,.12,.13,.16,.22,.32,.44,.56,.62,.58,.46,.40,.42,.48,.52,.48,.40,.32,.26,.22];
const ZONA = { centre: [1.05, 1.08, 1.10], eixample: [1, .92, .85], periferia: [.88, .8, .75], hospital: [1.08, .9, .9], estacio: [1.02, .8, .78] };

export class ModeloPrevision {
  /** Devuelve "free" | "few" | "full" para un parking en un día (0=domingo) y hora decimal. */
  nivel(parking, dia, hora) {
    const curva = dia === 0 ? DOMINGO : dia === 6 ? SABADO : LABORABLE;
    const f = ZONA[parking.zona] ?? [1, 1, 1];
    const k = dia === 0 ? f[2] : dia === 6 ? f[1] : f[0];
    const ocupacion = this.#interpolar(curva, hora) * k;
    return ocupacion < .75 ? "free" : ocupacion < .92 ? "few" : "full";
  }
  #interpolar(curva, h) {
    const i = Math.floor(h) % 24, j = (i + 1) % 24, t = h - Math.floor(h);
    return curva[i] * (1 - t) + curva[j] * t;
  }
}
