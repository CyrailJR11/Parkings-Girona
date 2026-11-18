// Lee las plazas disponibles que Saba publica en la ficha de cada parking de Girona
// y las guarda en public.parking_live. Lo lanza pg_cron cada pocos minutos.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOURCES = [
  { id: "saba-estacio", url: "https://www.saba.es/ca/parking-girona/parking-saba-estacio-tren-girona" },
  { id: "berenguer", url: "https://www.saba.es/ca/parking-girona/parking-saba-berenguer-i-carnicer" },
  { id: "pompeu-fabra", url: "https://www.saba.es/ca/parking-girona/parking-saba-santa-caterina" },
];

function parse(html: string) {
  const block = html.match(/class="available-places"[^>]*>([\s\S]{0,400}?)<\/div>/i);
  if (!block) return null;
  const nums = [...block[1].matchAll(/<strong>\s*(\d+)\s*<\/strong>/gi)].map((m) => parseInt(m[1], 10));
  if (nums.length === 0) return null;
  return { total: nums[0] ?? null, free: nums.length > 1 ? nums[1] : null };
}

Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const now = new Date().toISOString();
  const rows = await Promise.all(SOURCES.map(async (s) => {
    try {
      const r = await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AparcaGirona/1.0)", "Accept-Language": "ca,es;q=0.8" },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const p = parse(await r.text());
      if (!p || p.free == null) {
        return { parking_id: s.id, source: "saba-web", source_url: s.url, ok: false, error: "sin dato de plazas", total: p?.total ?? null, free: null, fetched_at: now };
      }
      return { parking_id: s.id, source: "saba-web", source_url: s.url, ok: true, error: null, total: p.total, free: p.free, fetched_at: now };
    } catch (e) {
      return { parking_id: s.id, source: "saba-web", source_url: s.url, ok: false, error: String(e).slice(0, 200), total: null, free: null, fetched_at: now };
    }
  }));
  const { error } = await sb.from("parking_live").upsert(rows);
  return new Response(JSON.stringify({ rows, error: error?.message ?? null }), { headers: { "Content-Type": "application/json" } });
});
