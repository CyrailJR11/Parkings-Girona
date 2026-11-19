// Acceso a datos en Supabase (plan gratuito): avisos de conductores y plazas en vivo.
const URL_BASE = "https://wclytpnajprfqgvcnttl.supabase.co";
const CLAVE = "sb_publishable_s4vXjVuOfY0r7pva-mfRuQ_EFQZIL92"; // clave pública: solo lectura y añadir avisos

export class RepositorioSupabase {
  static VIDA_AVISO = 45 * 60 * 1000;
  #avisos = new Map();   // parkingId -> [{id, estado, ts}]
  #enVivo = new Map();   // parkingId -> {libres, total, ok, actualizado}
  #oyentes = new Set();
  #sondeo = null;
  #cabeceras = { apikey: CLAVE, Authorization: "Bearer " + CLAVE };

  alCambiar(fn) { this.#oyentes.add(fn); }
  #avisar() { this.#oyentes.forEach((fn) => fn()); }

  ultimoAviso(parkingId) {
    const lista = (this.#avisos.get(parkingId) ?? []).filter((a) => Date.now() - a.ts < RepositorioSupabase.VIDA_AVISO);
    return lista.sort((a, b) => b.ts - a.ts)[0] ?? null;
  }
  datoEnVivo(parkingId) { return this.#enVivo.get(parkingId) ?? null; }
  ultimaLecturaEnVivo() {
    const ts = [...this.#enVivo.values()].filter((d) => d.ok).map((d) => d.actualizado);
    return ts.length ? Math.max(...ts) : 0;
  }

  #guardarAviso(fila) {
    const lista = this.#avisos.get(fila.parking_id) ?? [];
    if (fila.id && lista.some((a) => a.id === fila.id)) return;
    lista.push({ id: fila.id, estado: fila.status, ts: Date.parse(fila.created_at) || Date.now() });
    this.#avisos.set(fila.parking_id, lista);
  }
  #guardarEnVivo(fila) {
    this.#enVivo.set(fila.parking_id, {
      libres: fila.free, total: fila.total, ok: fila.ok, actualizado: Date.parse(fila.fetched_at) || 0,
      igualDesde: Date.parse(fila.free_since) || null, // desde cuándo publica el mismo número
    });
  }

  async cargar() {
    const desde = new Date(Date.now() - RepositorioSupabase.VIDA_AVISO).toISOString();
    const [r1, r2] = await Promise.all([
      fetch(`${URL_BASE}/rest/v1/parking_reports?select=id,parking_id,status,created_at&created_at=gt.${encodeURIComponent(desde)}&order=created_at.desc&limit=500`, { headers: this.#cabeceras, cache: "no-store" }),
      fetch(`${URL_BASE}/rest/v1/parking_live?select=parking_id,free,total,ok,fetched_at,free_since`, { headers: this.#cabeceras, cache: "no-store" }),
    ]);
    if (!r1.ok || !r2.ok) throw new Error("Supabase " + r1.status + "/" + r2.status);
    this.#avisos.clear();
    (await r1.json()).forEach((f) => this.#guardarAviso(f));
    (await r2.json()).forEach((f) => this.#guardarEnVivo(f));
    this.#avisar();
  }

  async enviarAviso(parkingId, estado, dispositivo) {
    const r = await fetch(`${URL_BASE}/rest/v1/parking_reports`, {
      method: "POST",
      headers: { ...this.#cabeceras, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ parking_id: parkingId, status: estado, device: dispositivo }),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    (await r.json()).forEach((f) => this.#guardarAviso(f));
    this.#avisar();
  }

  /** Tiempo real con Supabase Realtime; si falla, consulta cada 30 s. */
  conectarTiempoReal() {
    this.#programarSondeo(30000);
    if (!window.supabase) return;
    try {
      const cliente = window.supabase.createClient(URL_BASE, CLAVE);
      cliente.channel("aparca")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "parking_reports" }, (p) => { this.#guardarAviso(p.new); this.#avisar(); })
        .on("postgres_changes", { event: "*", schema: "public", table: "parking_live" }, (p) => { if (p.new?.parking_id) { this.#guardarEnVivo(p.new); this.#avisar(); } })
        .subscribe((estado) => { if (estado === "SUBSCRIBED") this.#programarSondeo(120000); });
    } catch { /* se queda el sondeo */ }
  }
  #programarSondeo(ms) {
    clearInterval(this.#sondeo);
    this.#sondeo = setInterval(() => this.cargar().catch(() => {}), ms);
  }
}
