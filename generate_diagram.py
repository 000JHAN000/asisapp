from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

# Dimensiones
W, H = 1400, 950
img = Image.new('RGB', (W, H), '#ffffff')
draw = ImageDraw.Draw(img)

# Fuentes
try:
    font_title = ImageFont.truetype('arialbd.ttf', 22)
    font_box = ImageFont.truetype('arial.ttf', 16)
    font_small = ImageFont.truetype('arial.ttf', 13)
except Exception:
    font_title = ImageFont.load_default()
    font_box = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Colores
c_backend = '#e8f4fd'
c_guard = '#fff3cd'
c_db_master = '#d4edda'
c_db_tenant = '#f8d7da'
c_border = '#333333'


def draw_box(x, y, w, h, text, fill, font=font_box, subtext=None):
    draw.rectangle([x, y, x + w, y + h], fill=fill, outline=c_border, width=2)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x + (w - tw) // 2, y + (h - th) // 2 - (10 if subtext else 0)), text, fill=c_border, font=font)
    if subtext:
        bbox2 = draw.textbbox((0, 0), subtext, font=font_small)
        tw2, th2 = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]
        draw.text((x + (w - tw2) // 2, y + (h - th2) // 2 + 12), subtext, fill='#555555', font=font_small)


def draw_arrow(x1, y1, x2, y2, label=None, font=font_small):
    draw.line([(x1, y1), (x2, y2)], fill='#555555', width=2)
    # punta
    if x1 == x2:
        draw.polygon([(x2, y2), (x2 - 5, y2 - 8), (x2 + 5, y2 - 8)], fill='#555555')
    elif y1 == y2:
        direction = 1 if x2 > x1 else -1
        draw.polygon([(x2, y2), (x2 - 8 * direction, y2 - 5), (x2 - 8 * direction, y2 + 5)], fill='#555555')
    if label:
        mx, my = (x1 + x2) // 2, (y1 + y2) // 2
        bbox = draw.textbbox((0, 0), label, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.rectangle([mx - tw // 2 - 3, my - th // 2 - 2, mx + tw // 2 + 3, my + th // 2 + 2], fill='white', outline='white')
        draw.text((mx - tw // 2, my - th // 2), label, fill='#333333', font=font)


# Título
draw.text((50, 30), 'Arquitectura multitenancy — Chronogest', fill=c_border, font=font_title)

# Cliente
draw_box(600, 90, 200, 60, 'Cliente / Navegador', '#f0f0f0')

# Backend grande
draw.rectangle([450, 200, 950, 520], fill=c_backend, outline=c_border, width=2)
draw.text((470, 215), 'NestJS Backend (instancia compartida)', fill=c_border, font=font_box)

# Guards / middleware
draw_box(490, 260, 160, 60, 'JwtGuard', c_guard, subtext='valida JWT')
draw_box(670, 260, 160, 60, 'TenantMatchGuard', c_guard, subtext='tenant vs header')
draw_box(490, 340, 160, 60, 'RbacGuard', c_guard, subtext='roles')
draw_box(670, 340, 160, 60, 'TenantGuard', c_guard, subtext='resuelve tenant')

draw_box(580, 430, 240, 60, 'TenantConnectionManager', '#e2e3f3', subtext='getTenantRepository()')

# Bases de datos
# Maestro
draw_box(80, 620, 320, 250, 'sena_db (maestro)', c_db_master)
draw_box(100, 680, 280, 40, 'tabla tenants', '#ffffff')
draw_box(100, 730, 280, 40, 'cg_usuarios (identidad)', '#ffffff')
draw_box(100, 780, 280, 40, 'catálogos legacy', '#ffffff')
draw_box(100, 830, 280, 40, 'cg_* históricos', '#ffffff')

# Tenants
draw_box(540, 620, 360, 250, '', c_db_tenant)
draw.text((560, 640), 'Bases de datos por tenant', fill=c_border, font=font_box)
draw_box(560, 680, 150, 80, 'tenant_caldas', '#ffffff', subtext='negocio Caldas')
draw_box(730, 680, 150, 80, 'tenant_palmira', '#ffffff', subtext='negocio Palmira')
draw_box(560, 780, 320, 70, 'Esquema ChronoGest + asistencia facial', '#ffffff', font=font_small)

# Flechas cliente -> backend
draw_arrow(700, 150, 700, 200, 'Authorization + x-tenant-id')

# Flechas guards
draw_arrow(570, 320, 570, 340, '')  # JwtGuard -> RbacGuard (simplificado)
draw_arrow(750, 320, 750, 340, '')
draw_arrow(570, 400, 650, 430, '')
draw_arrow(750, 400, 670, 430, '')

# Backend -> maestro
draw_arrow(490, 460, 320, 620, 'resolver tenant / autenticar')

# Backend -> tenants
draw_arrow(760, 490, 760, 620, 'consultas de negocio')
draw_arrow(760, 490, 635, 620, '')

# Leyenda
draw.text((1000, 620), 'Leyenda', fill=c_border, font=font_box)
draw.rectangle([1000, 650, 1030, 675], fill=c_guard, outline=c_border)
draw.text((1040, 655), 'Guards / middleware', fill=c_border, font=font_small)
draw.rectangle([1000, 685, 1030, 710], fill=c_db_master, outline=c_border)
draw.text((1040, 690), 'Base maestra', fill=c_border, font=font_small)
draw.rectangle([1000, 720, 1030, 745], fill=c_db_tenant, outline=c_border)
draw.text((1040, 725), 'Base tenant', fill=c_border, font=font_small)

# Guardar PNG
out_dir = Path('docs')
out_dir.mkdir(exist_ok=True)
img.save(out_dir / 'diagrama_arquitectura.png')
print(f'PNG generado: {out_dir / "diagrama_arquitectura.png"}')

# Guardar SVG simple
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50" y="50" font-family="Arial" font-size="22" font-weight="bold" fill="#333">Arquitectura multitenancy — Chronogest</text>

  <!-- Cliente -->
  <rect x="600" y="90" width="200" height="60" fill="#f0f0f0" stroke="#333" stroke-width="2"/>
  <text x="700" y="125" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">Cliente / Navegador</text>

  <!-- Backend -->
  <rect x="450" y="200" width="500" height="320" fill="#e8f4fd" stroke="#333" stroke-width="2"/>
  <text x="470" y="230" font-family="Arial" font-size="16" fill="#333">NestJS Backend (instancia compartida)</text>

  <!-- Guards -->
  <rect x="490" y="260" width="160" height="60" fill="#fff3cd" stroke="#333" stroke-width="2"/>
  <text x="570" y="285" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">JwtGuard</text>
  <text x="570" y="305" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">valida JWT</text>

  <rect x="670" y="260" width="160" height="60" fill="#fff3cd" stroke="#333" stroke-width="2"/>
  <text x="750" y="285" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">TenantMatchGuard</text>
  <text x="750" y="305" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">tenant vs header</text>

  <rect x="490" y="340" width="160" height="60" fill="#fff3cd" stroke="#333" stroke-width="2"/>
  <text x="570" y="365" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">RbacGuard</text>
  <text x="570" y="385" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">roles</text>

  <rect x="670" y="340" width="160" height="60" fill="#fff3cd" stroke="#333" stroke-width="2"/>
  <text x="750" y="365" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">TenantGuard</text>
  <text x="750" y="385" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">resuelve tenant</text>

  <rect x="580" y="430" width="240" height="60" fill="#e2e3f3" stroke="#333" stroke-width="2"/>
  <text x="700" y="455" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">TenantConnectionManager</text>
  <text x="700" y="475" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">getTenantRepository()</text>

  <!-- Maestro -->
  <rect x="80" y="620" width="320" height="250" fill="#d4edda" stroke="#333" stroke-width="2"/>
  <text x="240" y="650" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">sena_db (maestro)</text>
  <rect x="100" y="680" width="280" height="40" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="240" y="705" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">tabla tenants</text>
  <rect x="100" y="730" width="280" height="40" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="240" y="755" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">cg_usuarios (identidad)</text>
  <rect x="100" y="780" width="280" height="40" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="240" y="805" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">catálogos legacy</text>
  <rect x="100" y="830" width="280" height="40" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="240" y="855" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">cg_* históricos</text>

  <!-- Tenants -->
  <rect x="540" y="620" width="360" height="250" fill="#f8d7da" stroke="#333" stroke-width="2"/>
  <text x="720" y="650" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">Bases de datos por tenant</text>
  <rect x="560" y="680" width="150" height="80" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="635" y="710" text-anchor="middle" font-family="Arial" font-size="15" fill="#333">tenant_caldas</text>
  <text x="635" y="735" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">negocio Caldas</text>
  <rect x="730" y="680" width="150" height="80" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="805" y="710" text-anchor="middle" font-family="Arial" font-size="15" fill="#333">tenant_palmira</text>
  <text x="805" y="735" text-anchor="middle" font-family="Arial" font-size="12" fill="#555">negocio Palmira</text>
  <rect x="560" y="780" width="320" height="70" fill="#fff" stroke="#333" stroke-width="1"/>
  <text x="720" y="820" text-anchor="middle" font-family="Arial" font-size="13" fill="#333">Esquema ChronoGest + asistencia facial</text>

  <!-- Flechas -->
  <line x1="700" y1="150" x2="700" y2="200" stroke="#555" stroke-width="2"/>
  <polygon points="700,200 692,188 708,188" fill="#555"/>
  <text x="710" y="175" font-family="Arial" font-size="12" fill="#333">Authorization + x-tenant-id</text>

  <line x1="490" y1="460" x2="320" y2="620" stroke="#555" stroke-width="2"/>
  <polygon points="320,620 322,606 336,614" fill="#555"/>
  <text x="360" y="530" font-family="Arial" font-size="12" fill="#333">resolver tenant / autenticar</text>

  <line x1="760" y1="490" x2="760" y2="620" stroke="#555" stroke-width="2"/>
  <polygon points="760,620 752,608 768,608" fill="#555"/>
  <text x="770" y="560" font-family="Arial" font-size="12" fill="#333">consultas de negocio</text>

  <line x1="760" y1="490" x2="635" y2="620" stroke="#555" stroke-width="2"/>
  <polygon points="635,620 640,606 652,616" fill="#555"/>

  <!-- Leyenda -->
  <text x="1000" y="620" font-family="Arial" font-size="16" fill="#333">Leyenda</text>
  <rect x="1000" y="650" width="30" height="25" fill="#fff3cd" stroke="#333"/>
  <text x="1040" y="667" font-family="Arial" font-size="13" fill="#333">Guards / middleware</text>
  <rect x="1000" y="685" width="30" height="25" fill="#d4edda" stroke="#333"/>
  <text x="1040" y="702" font-family="Arial" font-size="13" fill="#333">Base maestra</text>
  <rect x="1000" y="720" width="30" height="25" fill="#f8d7da" stroke="#333"/>
  <text x="1040" y="737" font-family="Arial" font-size="13" fill="#333">Base tenant</text>
</svg>'''
(out_dir / 'diagrama_arquitectura.svg').write_text(svg, encoding='utf-8')
print(f'SVG generado: {out_dir / "diagrama_arquitectura.svg"}')
