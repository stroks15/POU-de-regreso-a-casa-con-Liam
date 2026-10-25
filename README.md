# Pou de regreso a casa con Liam

Juego móvil vertical inspirado en plataformas de salto: guía a Pou con inclinación del teléfono o controles táctiles, rebota sobre plataformas y consigue la mayor puntuación posible.

## Desarrollo
- HTML5 Canvas y JavaScript Vanilla, sin framework de juego.
- Diseño portrait para teléfonos, físicas de gravedad/rebote, envoltura horizontal, partículas y reutilización de plataformas/partículas.
- Los controles táctiles aparecen automáticamente si el sensor de orientación no está disponible.
- Capacitor permite empaquetar el juego web como aplicación Android.
- La tabla opcional de récords usa Supabase. La app funciona sin configurarla y guarda récords localmente.

## Ejecutar localmente
Sirve la carpeta raíz con cualquier servidor estático o abre `www/index.html`. Para Android se usa Capacitor y la compilación automatizada de GitHub Actions.

## Supabase (opcional)
Crea la tabla `highscores` con la migración SQL de `supabase/migrations/202610250001_highscores.sql`. En Vercel configura `SUPABASE_URL` y `SUPABASE_ANON_KEY` (clave publicable/anon, nunca service_role). Para sitio estático, copia la configuración pública en `www/supabase-config.js`; no incluyas claves secretas. RLS permite solo insertar una puntuación no negativa con metadatos limitados y lectura pública de puntuaciones.

## APK Android
Cada push a `main) ejecuta el flujo `.github/workflows/compile-apk.yml`. Abre la pestaña Actions del repositorio y descarga el artifact `Pou-Regreso-A-Casa-Debug.apk` del workflow completado. El APK debug es de pruebas y no está firmado para distribución en Play Store.

### Guía de Instalación del APK en Android (Evitar Bloqueo de Play Protect)
1. Descarga `Pou-Regreso-A-Casa-Debug.apk` desde **Actions → ejecución completada → Artifacts**.
2. Transfiere el archivo al teléfono Android o ábrelo directamente desde el navegador/administrador de archivos.
3. Si Android bloquea la instalación por origen desconocido, entra en Ajustes desde el aviso y habilita **Permitir desde esta fuente** para la aplicación que abrió el APK.
4. Si Play Protect muestra una advertencia, lee el aviso y verifica que confías en el origen del archivo. No recomendamos desactivar Play Protect ni forzar la instalación de archivos no verificados. Si Android ofrece **Más detalles** y **Instalar de todos modos**, esa opción solo debe usarse si has comprobado el artefacto y aceptas el riesgo.
5. Vuelve al instalador y pulsa **Instalar**. Para evitar riesgos, instala únicamente el APK obtenido del artifact oficial de este repositorio.

## Publicación web
Vercel puede desplegar la raíz del repositorio como sitio estático. Los cambios en la rama de producción se publican automáticamente una vez vinculado el proyecto.
