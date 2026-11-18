# Aparca Girona

Web para el móvil que muestra las plazas libres de los aparcamientos públicos de Girona.

- **Mapa** (Leaflet + OpenStreetMap) con los 11 aparcamientos municipales y Saba Estació. Capacidades oficiales del [Ajuntament de Girona](https://web.girona.cat/mobilitat/aparcaments-municipals).
- **Estimación de ocupación** según el día y la hora, con selector «¿Cuándo llegas?».
- **Avisos de los conductores** («Hay sitio / Pocas / Lleno») guardados en Supabase y enviados al instante a todos con Supabase Realtime. Un aviso de los últimos 45 minutos tiene prioridad sobre la estimación.
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
