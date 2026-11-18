// Funciones de apoyo sin estado, compartidas por todas las clases.
export const $ = (id) => document.getElementById(id);
export const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export const color = (nivel) => cssVar("--" + nivel);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export function hace(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  return m < 1 ? "hace un momento" : m < 60 ? "hace " + m + " min" : "hace " + Math.floor(m / 60) + " h";
}
export function formatoHora(h) {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}
export function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
