"""Genera las páginas internas (legales + mapa del sitio) con el header y el footer de index.html.

Uso (desde la raíz del repo):  python3 tools/generar-paginas.py
Volver a correrlo después de cambiar el nav, el menú mobile o el footer de index.html.
"""
import re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "index.html")).read()

def between(a, b, inclusive_b=False):
    i = src.index(a); j = src.index(b, i)
    return src[i:j + (len(b) if inclusive_b else 0)]

head = src[:src.index("</head>")]
sprite = between("  <!-- ============ SVG SPRITE", "  <!-- ============ PRELOADER")
cursor = between("  <!-- ============ CURSOR + GRAIN", "  <!-- ============ NAV")
nav = between("  <!-- ============ NAV", "  <!-- ============ MENÚ MOBILE")
menu = between("  <!-- ============ MENÚ MOBILE", '  <div id="smooth-wrapper">')
footer = between("      <!-- ================= FOOTER", "</footer>", True)
scripts = src[src.index('  <script src="https://cdn.jsdelivr.net/npm/gsap'):src.index("</body>")]

PAGES = {
    "aviso-legal.html": "Aviso legal",
    "politica-de-privacidad.html": "Política de privacidad",
    "politica-de-cookies.html": "Política de cookies",
    "mapa-del-sitio.html": "Mapa del sitio",
}
OLD_URLS = {
    "https://avatarinformatica.com/condiciones-legales-de-navegacion/": "aviso-legal.html",
    "https://avatarinformatica.com/politicas-de-privacidad/": "politica-de-privacidad.html",
    "https://avatarinformatica.com/politicas-de-cookies/": "politica-de-cookies.html",
    "https://avatarinformatica.com/sitemap_index.xml": "mapa-del-sitio.html",
}

def chrome(html, current):
    html = html.replace('href="#top" class="nav__logo" data-scroll-link', 'href="index.html" class="nav__logo"')
    html = re.sub(r'href="#(equipo|servicios|soluciones|odoo|blog|contacto)"', r'href="index.html#\1"', html)
    html = html.replace(" data-scroll-link", "")
    html = re.sub(r' data-nav="\w+"', "", html)
    for old, new in OLD_URLS.items():
        html = html.replace(f'href="{old}" target="_blank" rel="noopener"', f'href="{new}"')
        html = html.replace(f'href="{old}"', f'href="{new}"')
    if current:
        html = html.replace(f'<a href="{current}">', f'<a href="{current}" aria-current="page">')
    return html

ARROW = '<span class="btn__icon"><svg class="i"><use href="#i-arrow-ur"/></svg><svg class="i i--next"><use href="#i-arrow-ur"/></svg></span>'
MAIL = '<a href="mailto:info@avatarinformatica.com.ar">info@avatarinformatica.com.ar</a>'

def hero(crumb, eyebrow, title, lead, meta):
    meta_html = "".join(f"<span>{m}</span>" for m in meta)
    return f'''        <section class="lhero" id="top">
          <div class="hero__bg" aria-hidden="true"><div class="hero__grid"></div><div class="hero__glow lhero__glow"></div></div>
          <div class="wrap">
            <nav class="crumbs mono" aria-label="Ruta" data-reveal><a href="index.html">Inicio</a><span>/</span>{crumb}</nav>
            <span class="eyebrow mono" data-scramble>{eyebrow}</span>
            <h1 class="lhero__title" data-split>{title}</h1>
            <p class="lead" data-reveal>{lead}</p>
            <div class="lhero__meta mono" data-reveal>{meta_html}</div>
          </div>
        </section>
'''

def legal_body(intro, sections):
    toc = "\n".join(
        f'                    <li><a href="#s{i}" data-scroll-link><span class="mono">{i:02d}</span>{t}</a></li>'
        for i, (t, _) in enumerate(sections, 1))
    secs = "\n".join(
        f'''              <section class="legal__sec" id="s{i}" data-scroll-pos="top 100px">
                <span class="legal__num mono">{i:02d} / {len(sections):02d}</span>
                <h2>{t}</h2>
{body}
              </section>''' for i, (t, body) in enumerate(sections, 1))
    intro_html = f'              <p class="legal__intro">{intro}</p>\n' if intro else ""
    return f'''        <section class="legal">
          <div class="wrap legal__grid">
            <aside class="legal__toc">
              <nav class="bezel toc" aria-label="Contenido del documento">
                <div class="bezel__core toc__core">
                  <p class="toc__title mono"><span>Contenido</span><span>{len(sections):02d}</span></p>
                  <ol id="toc">
{toc}
                  </ol>
                  <div class="toc__bar"><span id="toc-bar"></span></div>
                </div>
              </nav>
              <div class="bezel toc-help">
                <div class="bezel__core">
                  <span class="mono t-dim">Consultas</span>
                  <p>Escribinos a {MAIL}</p>
                </div>
              </div>
            </aside>
            <article class="legal__body prose">
{intro_html}{secs}
            </article>
          </div>
        </section>
'''

DOCS = {
    "aviso-legal.html": ("Legal — 01", "Aviso legal", "Condiciones legales de navegación, derechos de autor y uso del contenido."),
    "politica-de-privacidad.html": ("Legal — 02", "Política de privacidad", "Qué información recolectamos y cómo la manejamos, usamos y protegemos."),
    "politica-de-cookies.html": ("Legal — 03", "Política de cookies", "Qué cookies utiliza el sitio y cómo desactivarlas o eliminarlas."),
    "mapa-del-sitio.html": ("Navegación", "Mapa del sitio", "Todas las secciones y documentos del sitio en un solo lugar."),
}

def more(current):
    cards = "\n".join(f'''              <a class="bezel doc-card" href="{href}">
                <div class="bezel__core">
                  <div class="doc-card__top"><span class="mono">{tag}</span><span class="tile__arrow" aria-hidden="true"><svg class="i"><use href="#i-arrow-ur"/></svg></span></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </a>''' for href, (tag, title, desc) in DOCS.items() if href != current)
    return f'''        <section class="legal-more">
          <div class="wrap">
            <div class="legal-more__head">
              <span class="eyebrow mono" data-scramble>Otros documentos</span>
              <a href="index.html" class="btn btn--ghost magnetic"><span class="btn__label">Volver al inicio</span>{ARROW}</a>
            </div>
            <div class="legal-more__grid" data-reveal-group>
{cards}
            </div>
          </div>
        </section>
'''

def p(*paras):
    return "\n".join(f"                <p>{x}</p>" for x in paras)

# ---------- Contenido (textual del sitio actual) ----------
AVISO = [
    ("Copyright y uso del contenido",
     p("Los derechos de autor y otros derechos sobre el contenido de este sitio web son propiedad de Avatar Informática S.R.L. y/o sus filiales en todo el mundo, por lo tanto tú estas autorizado a consultar, descargar y reproducir el contenido de este sitio web solamente si cumples con las siguientes condiciones:") + '''
                <ol class="conds">
                  <li>conservar toda la información contenida en el documento original.</li>
                  <li>utilizar únicamente las imágenes con el texto que las acompaña.</li>
                  <li>incluir la siguiente mención relativa a los derechos de autor: <strong>© Avatar Informática 2022. Todos los derechos reservados.</strong></li>
                </ol>'''),
    ("Otros derechos de propiedad intelectual",
     p("Ten en cuenta que cualquier producto, proceso o tecnología descrito en los materiales del sitio web pueden estar sujetos a otros derechos de propiedad intelectual reservados por Avatar Informática S.R.L. y no están cubiertos por la presente licencia. La mayoría de los nombres de softwares en el sitio web son marcas registradas globales o marcas propiedad de Avatar Informática S.R.L. por lo tanto no los reutilices.")),
    ("Envío de información a Avatar Informática",
     p(f"Al transmitir información a Avatar Informática S.R.L. por medio de este sitio web o por otro medio electrónico sin tener un acuerdo por escrito sobre su envío, comprendes y aceptas que Avatar Informática S.R.L. podría usar dicha información para cualquier propósito sin asumir obligación alguna contigo. Si quisieras recibir información sobre cómo enviar una idea o propuesta a Avatar Informática S.R.L. solicita asesoramiento escribiendo a {MAIL}") +
     '\n                <p class="quote">Consulta nuestra <a href="politica-de-privacidad.html">Política de Privacidad</a> para obtener información adicional a la detallada en las condiciones legales de navegación.</p>'),
    ("Enlaces externos",
     p("No se podrá hacer ningún otro tipo de publicación ni uso comercial del contenido y productos contenidos en este sitio web sin la expresa autorización por escrito de Avatar Informática S.R.L. En consecuencia, no podrás poner ninguna sección de esta web a disposición o como parte de otro sitio web, ya sea por el encuadre del hipervínculo en internet o de cualquier otro modo. Este sitio web y su contenido no se podrá utilizar para crear una base de datos de ningún tipo, ni se lo podrá almacenar (en su totalidad o en parte) en bases de datos para que tu o terceros accedan a él, ni para distribuir cualquier base de datos que contenga la totalidad o parte de este sitio web y su contenido.")),
    ("La utilización de este sitio web",
     p("Ni Avatar Informática S.R.L. ni ningún tercero involucrado en la creación, producción o publicación de este sitio web se responsabiliza por los daños directos, indirectos, fortuitos, derivados o punitivos que surjan de tu acceso o de tu navegación. Esto incluye daños a tu computadora o a cualquier otra propiedad, o que surjan de cualquier virus que pueda infectar tu computadora.",
       "Asimismo, está prohibida la alteración, el daño, el deterioro y el agregado de material no autorizado a este sitio web.",
       "Avatar Informática S.R.L. no se responsabiliza por los contenidos de las páginas de ningún sitio que se encuentre vinculado a este sitio web. En consecuencia, tu acceso a cualquier página de un sitio fuera de nuestro sitio web lo realizas bajo tu propio riesgo por lo que te recomendamos leer las condiciones legales de navegación y las políticas de confidencialidad del sitio externo, las cuales pueden diferir de las aquí detalladas.")),
    ("Modificaciones y actualizaciones",
     p("Avatar Informática S.R.L. se reserva el derecho a cambiar o eliminar en cualquier momento el contenido y las condiciones legales de navegación establecidas en este sitio web; por lo tanto, te recomendamos visitar esta página periódicamente para revisar las actualizaciones realizadas que regularan la utilización del sitio y del contenido alojado en él.")),
]

def defs(cols, items):
    cards = "\n".join(f'''                  <div class="bezel def">
                    <div class="bezel__core">
                      <span class="def__tag mono">{tag}</span>
                      <h3>{t}</h3>
                      <p>{d}</p>
                    </div>
                  </div>''' for tag, t, d in items)
    return f'                <div class="defs defs--{cols}">\n{cards}\n                </div>'

PRIV_INTRO = "En Avatar Informática S.R.L. nos comprometemos a proteger tu privacidad, por lo tanto el propósito de este documento es aclarar qué información se obtiene de los usuarios de nuestro sitio www.avatarinformatica.com y cómo esta información es manejada y usada. Notificamos que, si no estás de acuerdo con el contenido de estas políticas de privacidad no te recomendamos utilizar los servicios del sitio web."
PRIV = [
    ("Recolección de datos",
     p("En nuestro sitio web, la información se obtiene de la siguiente manera:") + "\n" + defs(2, [
        ("01", "Información proporcionada por el usuario", "Recolectamos información de identificación personal como tu nombre, teléfono y correo electrónico a través de nuestros formularios de contacto y de suscripción."),
        ("02", "Información de navegación en el sitio web", "Cuando tú visitas nuestro sitio, se inserta una cookie en tu navegador a través de un software que sirve para identificar el número de veces que regresas a nuestra dirección virtual. Se recoge de forma anónima, información como: la dirección IP, ubicación geográfica, fuente de referencia, tipo de navegador, la duración de tu visita y las páginas visitadas."),
     ])),
    ("Uso de su información personal",
     p("El correo electrónico se utiliza para la operación de envío del material o información que solicites al completar un formulario. También se puede utilizar para el envío de boletines de noticias, siempre con temas relacionados con nuestros productos y servicios.",
       "Por último, el correo seguirá siendo utilizado para comunicar el lanzamiento de nuevos materiales o nuevos productos de Avatar Informática S.R.L. No obstante, el usuario puede cancelar la suscripción en cualquier momento.")),
    ("Acceso a su información personal",
     p("Tu información personal sólo podrá ser vista por el personal de Avatar Informática S.R.L. y sus asociados. Ninguna información personal referida a tu persona podrá ser revelada públicamente.",
       "Avatar Informática S.R.L. también se compromete a no vender, alquilar o transmitir tu información personal a terceros, a excepción de que se requiera ante un tribunal de justicia.")),
    ("Contenido compartido en redes sociales",
     p("Al hacer clic en los botones de compartir en las redes sociales aquellos contenidos presentes en las páginas de Avatar Informática S.R.L., el usuario estará publicando el contenido a través de su perfil en la red seleccionada.",
       "Avatar Informática S.R.L. no tiene acceso al nombre de usuario y contraseña de los usuarios de estas redes y no publicará contenidos en nombre del usuario.")),
    ("Cancelación o modificación de suscripciones",
     p("Tu podrás optar por no recibir ningún correo electrónico de Avatar Informática S.R.L., eliminando tu información personal de nuestras bases ya que todos los correos que enviamos poseen un enlace en el pie de página para darse de baja. Al hacer clic en este enlace será cancelada automáticamente tu suscripción de la lista.",
       "Es importante mencionar que, al completar cualquier formulario de contacto, nuevamente se reintegrará tu correo electrónico a la lista. Por lo tanto, la solicitud de cancelación debe hacerse de nuevo si es de tu interés.",
       f"Para cambiar tu información personal o incluso excluirlos de nuestra base de datos, por favor, envíanos un correo electrónico a {MAIL}")),
    ("Cambios en las políticas de privacidad",
     p("Estas políticas de privacidad pueden ser actualizadas. Por lo tanto, te recomendamos visitar periódicamente esta página para estar al tanto de cualquier cambio.",
       "Antes de utilizar tus datos para fines distintos de los definidos en estas políticas de privacidad, solicitaremos tu autorización.")),
    ("Contacto para consultas",
     p(f"Cualquier pregunta relacionada con nuestras políticas de privacidad puedes hacerla llegar enviándonos un correo electrónico a {MAIL}")),
]

def browsers(rows):
    out = []
    for name, path, sup in rows:
        segs = '<i>›</i>'.join(f"<span>{s}</span>" for s in path)
        out.append(f'''                  <div class="browser">
                    <b>{name}</b>
                    <div class="path mono">{segs}</div>
                    <small>Para más información, puedes consultar el soporte de {sup} o la Ayuda del navegador.</small>
                  </div>''')
    return '                <div class="browsers">\n' + "\n".join(out) + "\n                </div>"

COOK = [
    ("Términos de uso de cookies en Avatar Informática",
     p("Una cookie es un fichero que se descarga en el ordenador del usuario cuando éste accede a una página web y su objetivo es almacenar y recuperar información sobre la navegación que se efectúa desde dicho equipo. Por lo tanto, la página web de Avatar Informática S.R.L utiliza cookies para guardar información relacionada a tus accesos, almacenando información de carácter técnico como preferencias y estadísticas de uso con el objetivo de mejorar y adaptar el contenido de nuestra web a tu perfil y necesidades de navegación.",
       "En este sitio podrás tomar conocimiento acerca de toda la información sobre las cookies que utilizamos, los datos que almacenan, cómo eliminarlas o desactivarlas.",
       "Siguiendo los estándares de protección y privacidad de datos procedemos a detallar el uso de cookies que hace esta web:")),
    ("Tipos de cookies utilizadas",
     defs(3, [
        ("Sesión", "Cookies de Sesión", "Utilizadas para verificar la validez e identificación del dispositivo desde donde se está ingresando, evitando así que tu cuenta este siendo utilizada desde equipos desconocidos o no autorizados."),
        ("Navegación", "Cookies de Navegación", "Este tipo de cookies almacena datos para elaborar estadísticas sobre el tráfico y volumen de visitas de esta web. Al utilizar este sitio web Usted estás consintiendo el tratamiento de ésta información por parte de Avatar Informática S.R.L. Por lo tanto, el ejercicio de cualquier derecho en este sentido deberás hacerlo comunicándote directamente con Avatar Informática S.R.L."),
        ("Analíticas", "Cookies de Analíticas", "En el caso de las cookies analíticas, las mismas se almacenan en servidores ubicados en Asunción, Paraguay; Avatar Informática S.R.L se compromete a no compartirla con terceros, excepto en los casos en los que sea necesario para el funcionamiento del sistema o cuando la ley obligue a tal efecto."),
     ])),
    ("Desactivación o eliminación de cookies",
     p("En cualquier momento podrás ejercer tu derecho de desactivación o eliminación de cookies de este sitio web. Estas acciones se realizan de forma diferente en función del navegador que estés usando. A continuación te dejamos una guía rápida para los navegadores más populares:") + "\n" +
     browsers([
        ("Chrome", ["Configuración", "Mostrar opciones avanzadas", "Privacidad", "Configuración de contenido"], "Google"),
        ("Firefox", ["Herramientas", "Opciones", "Privacidad", "Historial", "Configuración Personalizada"], "Mozilla"),
        ("Bing", ["Herramientas", "Opciones de Internet", "Privacidad", "Configuración"], "Microsoft"),
        ("Safari", ["Preferencias", "Seguridad"], "Apple"),
     ]) + "\n" +
     '                <p class="quote"><strong>Aspectos Generales:</strong> Los navegadores web son las herramientas encargadas de almacenar las cookies y desde este lugar debe efectuar su derecho a eliminación o desactivación de las mismas. Ni esta web ni sus representantes legales pueden garantizar la correcta o incorrecta manipulación de las cookies por parte de los mencionados navegadores. En algunos casos es necesario instalar cookies para que el navegador no olvide su decisión de no aceptación de las mismas.</p>\n' +
     p(f"Para cualquier duda o consulta acerca de estas políticas de cookies no dudes en comunicarte con nosotros a través de nuestro correo {MAIL}")),
    ("Actualización de políticas de cookies",
     p("Es posible que actualicemos las Políticas de Cookies de nuestro Sitio Web, por ello le recomendamos revisar esta política cada vez que accedas a nuestro sitio con el objetivo de estar adecuadamente informado/a sobre cómo y para qué usamos las cookies. Las política de cookies se actualizó por última vez a fecha 29/01/2022.")),
]

def tree_item(href, label, path, children=None, top=False):
    dot = '<span class="dot"></span>' if top else ""
    kids = ""
    if children:
        kids = "<ul>" + "".join(f'<li><a href="{h}">{l}</a></li>' for h, l in children) + "</ul>"
    return f'<li><a href="{href}">{dot}{label}<span class="mono">{path}</span></a>{kids}</li>'

H = "index.html"
SMAP = f'''        <section class="smap">
          <div class="wrap smap__grid">
            <div class="smap__col">
              <div class="bezel smap__card" data-reveal>
                <div class="bezel__core">
                  <div class="smap__head"><h2>Landing</h2><span class="mono t-dim">index.html</span></div>
                  <ul class="tree">
                    {tree_item(H, "Inicio", "/", top=True)}
                    {tree_item(H + "#equipo", "Equipo", "#equipo", [(H + "#equipo", "Nuestra empresa"), (H + "#equipo", "Misión"), (H + "#equipo", "Visión"), (H + "#equipo", "Políticas de calidad")], True)}
                    {tree_item(H + "#servicios", "Servicios", "#servicios", [(H + "#servicios", "Fábrica de Software"), (H + "#servicios", "Staffing IT"), (H + "#servicios", "Consultoría IT"), (H + "#servicios", "Testing y QA")], True)}
                    {tree_item(H + "#soluciones", "Soluciones", "#soluciones", [(H + "#odoo", "Odoo ERP"), (H + "#soluciones", "Siebel CRM"), (H + "#soluciones", "Oracle ERP"), (H + "#soluciones", "BI, Big Data y tableros de control"), (H + "#soluciones", "GIS"), (H + "#soluciones", "Factura electrónica en Paraguay"), (H + "#soluciones", "Automatizaciones y autogestión"), (H + "#soluciones", "Gestión técnica de infraestructura")], True)}
                    {tree_item(H + "#odoo", "Odoo ERP", "#odoo", [(H + "#odoo", "Escenarios"), (H + "#odoo", "Consultoría sin inversión inicial"), (H + "#odoo", "Proceso de trabajo")], True)}
                    {tree_item(H + "#blog", "Blog", "#blog", None, True)}
                    {tree_item(H + "#contacto", "Contacto", "#contacto", None, True)}
                  </ul>
                </div>
              </div>
            </div>
            <div class="smap__col">
              <div class="bezel smap__card" data-reveal>
                <div class="bezel__core">
                  <div class="smap__head"><h2>Legal</h2><span class="mono t-dim">4 documentos</span></div>
                  <ul class="tree">
                    {tree_item("aviso-legal.html", "Aviso legal", "aviso-legal", top=True)}
                    {tree_item("politica-de-privacidad.html", "Política de privacidad", "privacidad", top=True)}
                    {tree_item("politica-de-cookies.html", "Política de cookies", "cookies", top=True)}
                    {tree_item("mapa-del-sitio.html", "Mapa del sitio", "mapa", top=True)}
                  </ul>
                </div>
              </div>
              <div class="bezel smap__card" data-reveal>
                <div class="bezel__core">
                  <div class="smap__head"><h2>Blog</h2><span class="mono t-dim">publicaciones</span></div>
                  <ul class="tree">
                    <li><a href="https://avatarinformatica.com/geomarketing-para-el-desarrollo-comercial/" target="_blank" rel="noopener"><span class="dot"></span>Geomarketing aplicado al análisis y planificación comercial</a></li>
                    <li><a href="https://avatarinformatica.com/que-es-un-crm/" target="_blank" rel="noopener"><span class="dot"></span>¿Qué es un CRM y por qué es tan importante para tu empresa?</a></li>
                    <li><a href="https://avatarinformatica.com/blog/" target="_blank" rel="noopener"><span class="dot"></span>Todas las publicaciones<span class="mono">blog</span></a></li>
                  </ul>
                </div>
              </div>
              <div class="bezel smap__card" data-reveal>
                <div class="bezel__core">
                  <div class="smap__head"><h2>Contacto</h2><span class="mono t-dim">AR / PY</span></div>
                  <ul class="tree">
                    <li><a href="mailto:info@avatarinformatica.com.ar"><span class="dot"></span>info@avatarinformatica.com.ar</a></li>
                    <li><a href="tel:+595983111901"><span class="dot"></span>(+595) 983 111-901</a></li>
                    <li><a href="https://wa.me/595983111901" target="_blank" rel="noopener"><span class="dot"></span>WhatsApp</a></li>
                    <li><a href="https://www.linkedin.com/company/avatarinformatica/" target="_blank" rel="noopener"><span class="dot"></span>LinkedIn</a></li>
                    <li><a href="https://www.facebook.com/avatar.informatica.ok" target="_blank" rel="noopener"><span class="dot"></span>Facebook</a></li>
                    <li><a href="https://www.instagram.com/avatar_informatica_ok/" target="_blank" rel="noopener"><span class="dot"></span>Instagram</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
'''

CONTENT = {
    "aviso-legal.html": dict(
        desc="Aviso legal y condiciones legales de navegación del sitio de Avatar Informática S.R.L.",
        hero=hero('<span>Legal</span><span>/</span><span aria-current="page">Aviso legal</span>', "Legal — 01", "Aviso <em>legal</em>",
                  "Antes de usar este sitio Web, lee detenidamente las condiciones legales de navegación.",
                  ["Avatar Informática S.R.L.", "<b>06</b> secciones"]),
        body=legal_body(None, AVISO)),
    "politica-de-privacidad.html": dict(
        desc="Política de privacidad de Avatar Informática S.R.L.: qué información se obtiene de los usuarios del sitio y cómo se maneja y usa.",
        hero=hero('<span>Legal</span><span>/</span><span aria-current="page">Política de privacidad</span>', "Legal — 02", "Política de <em>privacidad</em>",
                  "Qué información obtenemos de los usuarios de nuestro sitio y cómo la manejamos y usamos.",
                  ["Avatar Informática S.R.L.", "<b>07</b> secciones"]),
        body=legal_body(PRIV_INTRO, PRIV)),
    "politica-de-cookies.html": dict(
        desc="Política de cookies de Avatar Informática S.R.L.: qué cookies utiliza el sitio y cómo desactivarlas o eliminarlas.",
        hero=hero('<span>Legal</span><span>/</span><span aria-current="page">Política de cookies</span>', "Legal — 03", "Política de <em>cookies</em>",
                  "Detallamos aquí nuestras políticas de cookies, por favor lee atentamente los apartados que se detallan a continuación.",
                  ["Avatar Informática S.R.L.", "<b>04</b> secciones", "Actualizada el <b>29/01/2022</b>"]),
        body=legal_body(None, COOK)),
    "mapa-del-sitio.html": dict(
        desc="Mapa del sitio de Avatar Informática: todas las secciones, documentos legales, publicaciones y canales de contacto.",
        hero=hero('<span aria-current="page">Mapa del sitio</span>', "Navegación", "Mapa del <em>sitio</em>",
                  "Todas las secciones y documentos de Avatar Informática en un solo lugar.",
                  ["<b>07</b> secciones", "<b>04</b> documentos legales", "<b>02</b> publicaciones"]),
        body=SMAP),
}

for fname, title in PAGES.items():
    c = CONTENT[fname]
    h = head
    h = re.sub(r"<title>.*?</title>", f"<title>{title} — Avatar Informática</title>", h)
    h = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{c["desc"]}">', h)
    h = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{title} — Avatar Informática">', h)
    h = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{c["desc"]}">', h)
    h = h.replace('<meta property="og:url" content="https://avatarinformatica.com/">', f'<meta property="og:url" content="https://avatarinformatica.com/{fname}">')
    page = f'''{h}</head>
<body data-page="interna">
  <a class="skip" href="#main">Saltar al contenido</a>

{sprite}{cursor}{chrome(nav, fname)}{chrome(menu, fname)}  <div id="smooth-wrapper">
    <div id="smooth-content">
      <main id="main">

{c["hero"]}
{c["body"]}
{more(fname)}
      </main>

{chrome(footer, fname)}
    </div>
  </div>

{scripts}</body>
</html>
'''
    open(os.path.join(ROOT, fname), "w").write(page)
    print("ok", fname, len(page))
