// Punto de entrada: crea los objetos y arranca la app.
import { App } from "./App.js";
import { PARKINGS, ZONAS } from "./datos/catalogo.js";
import { RepositorioSupabase } from "./datos/RepositorioSupabase.js";

new App({ parkings: PARKINGS, zonas: ZONAS, repositorio: new RepositorioSupabase() }).iniciar();
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
