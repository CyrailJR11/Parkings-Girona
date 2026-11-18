# Aparca Girona

Web para el móvil que muestra las plazas libres de los aparcamientos públicos de Girona.

- **Mapa** (Leaflet + OpenStreetMap) con los 11 aparcamientos municipales y Saba Estació. Capacidades oficiales del [Ajuntament de Girona](https://web.girona.cat/mobilitat/aparcaments-municipals).
- **Plazas libres reales** de los parkings de Saba: una Edge Function de Supabase (`saba-live`) lee cada 3 minutos el dato que Saba publica en su web y lo guarda en `parking_live`. Se lanza con `pg_cron`.
- **Avisos de los conductores** («Hay sitio / Pocas / Lleno») guardados en `parking_reports` y enviados al instante con Supabase Realtime.
- **«Disponibilidad desconocida»** cuando no hay dato real ni aviso reciente. La previsión por hora solo aparece como pista, nunca como número.
- **Ficha por parking**: plazas totales, ocupadas (si hay dato), dirección, horario, operador y enlace a las tarifas oficiales.
- **Zona azul y verde**: horarios y tarifas oficiales (no hay datos de ocupación en la calle).
- **Cerca de mí**: ordena los parkings por distancia.
- **Instalable** en el móvil (PWA) y abre sin conexión mostrando la estimación.

## Coste: 0 €

- Alojamiento: GitHub Pages.
- Base de datos de avisos: Supabase, plan gratuito (tabla `parking_reports`, con RLS: cualquiera puede leer los avisos de las últimas 2 horas y añadir avisos; nadie puede modificarlos ni borrarlos).

La clave que aparece en `index.html` es la clave pública (*publishable*) de Supabase, pensada para ir en el navegador.

## Publicar

Settings → Pages → Source: «Deploy from a branch», rama `main`, carpeta `/ (root)`.

## Ideas siguientes

- Leer las plazas que Saba publica en su web con una GitHub Action programada (mínimo cada 5 min) y mostrarlas como dato real.
- Ajustar la estimación con los avisos acumulados.
- Pedir al Ajuntament de Girona o a TMG los datos de ocupación de sus aparcamientos.
