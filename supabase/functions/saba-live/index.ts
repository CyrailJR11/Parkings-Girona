// Lee las plazas disponibles que publican los operadores de parkings de Girona
// y las guarda en public.parking_live. Lo lanza pg_cron cada 3 minutos.
//
//   FuenteOperador (abstracta): método plantilla consultar() → fila para parking_live
//   └── SabaWeb: lee la ficha pública de cada parking en saba.es
// Para añadir otro operador basta con una subclase nueva que implemente leer().
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type Lectura = { total: number | null; free: number | null };
type Fila = {
  parking_id: string; source: string; source_url: string; ok: boolean; error: string | null;
  total: number | null; free: number | null; fetched_at: string; free_since?: string | null;
};
type Previa = { parking_id: string; free: number | null; free_since: string | null };

abstract class FuenteOperador {
  constructor(readonly parkingId: string, readonly url: string) {}
  /** Nombre corto que se guarda en la columna source. */
  abstract get origen(): string;
  /** Cada operador sabe cómo leer sus plazas. */
  protected abstract leer(): Promise<Lectura | null>;

  /** Igual para todos: nunca lanza error; si no hay dato, ok = false y free = null. */
  async consultar(ahora: string): Promise<Fila> {
    const base = { parking_id: this.parkingId, source: this.origen, source_url: this.url, fetched_at: ahora };
    try {
      const l = await this.leer();
      if (!l || l.free == null) return { ...base, ok: false, error: "sin dato de plazas", total: l?.total ?? null, free: null };
      return { ...base, ok: true, error: null, total: l.total, free: l.free };
    } catch (e) {
      return { ...base, ok: false, error: String(e).slice(0, 200), total: null, free: null };
    }
  }
}

class SabaWeb extends FuenteOperador {
  get origen() { return "saba-web"; }
  protected async leer(): Promise<Lectura | null> {
    const r = await fetch(this.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AparcaGirona/1.0)", "Accept-Language": "ca,es;q=0.8" },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return SabaWeb.analizar(await r.text());
  }
  /** La ficha muestra <strong>total</strong> … <strong>libres</strong> dentro de .available-places */
  static analizar(html: string): Lectura | null {
    const bloque = html.match(/class="available-places"[^>]*>([\s\S]{0,400}?)<\/div>/i);
    if (!bloque) return null;
    const nums = [...bloque[1].matchAll(/<strong>\s*(\d+)\s*<\/strong>/gi)].map((m) => parseInt(m[1], 10));
    if (nums.length === 0) return null;
    return { total: nums[0] ?? null, free: nums.length > 1 ? nums[1] : null };
  }
}

const SABA = "https://www.saba.es/ca/parking-girona/";
const FUENTES: FuenteOperador[] = [
  new SabaWeb("saba-estacio", SABA + "parking-saba-estacio-tren-girona"),
  new SabaWeb("berenguer", SABA + "parking-saba-berenguer-i-carnicer"),
  new SabaWeb("pompeu-fabra", SABA + "parking-saba-santa-caterina"),
];

/** Guarda desde cuándo se repite el mismo número: así la web detecta datos congelados. */
function marcarDesde(fila: Fila, previa: Previa | undefined, ahora: string): Fila {
  // Si esta lectura falla, se conserva el último número (con ok = false, la web no lo usa)
  // para que un fallo suelto no reinicie la cuenta de «sin cambios».
  if (fila.free == null) return { ...fila, free: previa?.free ?? null, free_since: previa?.free_since ?? null };
  const igual = previa && previa.free === fila.free && previa.free_since;
  return { ...fila, free_since: igual ? previa!.free_since : ahora };
}

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ahora = new Date().toISOString();
  const { data: previas } = await sb.from("parking_live").select("parking_id,free,free_since");
  const porId = new Map((previas ?? []).map((p: Previa) => [p.parking_id, p]));
  const filas = (await Promise.all(FUENTES.map((f) => f.consultar(ahora)))) // polimorfismo
    .map((f) => marcarDesde(f, porId.get(f.parking_id), ahora));
  const { error } = await sb.from("parking_live").upsert(filas);
  return new Response(JSON.stringify({ rows: filas, error: error?.message ?? null }), { headers: { "Content-Type": "application/json" } });
});
