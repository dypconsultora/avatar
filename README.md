# Avatar Informática — Landing

Rediseño de [avatarinformatica.com](https://avatarinformatica.com/) como landing page de una sola página, con el mismo contenido del sitio actual (home, equipo, servicios, soluciones, Odoo ERP, blog y contacto).

Sitio estático: HTML + CSS + JavaScript, sin paso de build.

```
index.html
assets/css/styles.css   tokens de diseño, modo día/noche, layout
assets/js/main.js       animaciones (GSAP 3.15 desde jsDelivr)
assets/img/favicon.svg
```

## Ver en local

```bash
python3 -m http.server 5173
```

Abrir http://localhost:5173

## Animaciones

GSAP con ScrollSmoother, ScrollTrigger, SplitText, ScrambleText y DrawSVG: preloader tipo terminal, circuito animado en el hero, editor de código que se tipea solo, marquee que reacciona a la velocidad del scroll, tarjetas apiladas, servicios con scroll horizontal, bento con spotlight y tilt, checklist que se tilda al scrollear, cursor custom y botones magnéticos.

Respeta `prefers-reduced-motion` (sin smooth scroll ni animaciones pesadas).

## Modo día / noche

Toggle en la píldora de navegación. Arranca en modo noche y recuerda la elección del visitante (`localStorage`). La transición usa View Transitions donde el navegador lo soporta.

## Formulario de contacto

Al enviar, valida los campos y abre el cliente de correo del visitante con la consulta dirigida a info@avatarinformatica.com.ar. Para recibir envíos directos (y adjuntos como CVs) hace falta conectar un backend o servicio de formularios.
