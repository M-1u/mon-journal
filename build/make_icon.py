#!/usr/bin/env python3
"""Génère le logo/icône de Mon Journal (carnet avec marque-page) à plusieurs tailles."""
from PIL import Image, ImageDraw, ImageFilter
import os

SS = 4          # suréchantillonnage
BASE = 1024     # taille finale de référence
S = BASE * SS

def rounded_mask(size, radius):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return m

def vgrad(size, top, bot):
    grad = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        grad.putpixel((0, y), tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3)))
    return grad.resize((size, size))

def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

# --- fond : carré arrondi, dégradé vert ---
GREEN_TOP = (0x4c, 0xc0, 0x74)
GREEN_BOT = (0x2c, 0x86, 0x4b)
bg = vgrad(S, GREEN_TOP, GREEN_BOT).convert("RGBA")
bg.putalpha(rounded_mask(S, int(0.235 * S)))
img.alpha_composite(bg)

d = ImageDraw.Draw(img)

# --- ombre douce du carnet ---
shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
cover = (int(0.285 * S), int(0.235 * S), int(0.735 * S), int(0.775 * S))  # x0,y0,x1,y1
sd.rounded_rectangle((cover[0], cover[1] + int(0.02 * S), cover[2], cover[3] + int(0.03 * S)),
                     radius=int(0.05 * S), fill=(0, 0, 0, 70))
shadow = shadow.filter(ImageFilter.GaussianBlur(int(0.02 * S)))
img.alpha_composite(shadow)

# --- couverture du carnet (blanc cassé) ---
WHITE = (0xfb, 0xfd, 0xfb, 255)
d.rounded_rectangle(cover, radius=int(0.05 * S), fill=WHITE)

# --- tranche/reliure à gauche (bande accent verte) ---
spine_w = int(0.11 * S)
spine = (cover[0], cover[1], cover[0] + spine_w, cover[3])
# bande avec coins gauches arrondis comme la couverture
band = Image.new("RGBA", (S, S), (0, 0, 0, 0))
bd = ImageDraw.Draw(band)
bd.rounded_rectangle(spine, radius=int(0.05 * S), fill=(0x35, 0x9a, 0x57, 255))
# couper le côté droit de la bande pour qu'elle reste plate contre la couverture
bd.rectangle((cover[0] + int(0.05 * S), cover[1], cover[0] + spine_w, cover[3]),
             fill=(0x35, 0x9a, 0x57, 255))
img.alpha_composite(band)

# anneaux de reliure (petits ovales blancs)
ring_x = cover[0] + spine_w // 2
n = 5
for i in range(n):
    cy = cover[1] + int((i + 0.5) / n * (cover[3] - cover[1]))
    rw, rh = int(0.026 * S), int(0.016 * S)
    d.ellipse((ring_x - rw, cy - rh, ring_x + rw, cy + rh), fill=(0xfb, 0xfd, 0xfb, 235))

# --- lignes d'écriture sur la couverture ---
text_x0 = cover[0] + spine_w + int(0.045 * S)
text_x1 = cover[2] - int(0.05 * S)
line_color = (0xbf, 0xe3, 0xcc, 255)
widths = [1.0, 1.0, 0.72]
for i, w in enumerate(widths):
    ly = cover[1] + int((0.30 + i * 0.18) * (cover[3] - cover[1]))
    x1 = text_x0 + (text_x1 - text_x0) * w
    lh = int(0.022 * S)
    d.rounded_rectangle((text_x0, ly - lh, x1, ly + lh), radius=lh, fill=line_color)

# --- petit cœur/point d'humeur (accent) sous les lignes ---
hx = text_x0 + int(0.02 * S)
hy = cover[1] + int(0.80 * (cover[3] - cover[1]))
hr = int(0.032 * S)
heart_col = (0x3d, 0xa3, 0x5d, 255)
d.ellipse((hx - hr, hy - hr, hx, hy), fill=heart_col)
d.ellipse((hx, hy - hr, hx + hr, hy), fill=heart_col)
d.polygon([(hx - hr, hy - hr * 0.35), (hx + hr, hy - hr * 0.35), (hx, hy + hr)], fill=heart_col)

# --- marque-page (ruban ambre) qui dépasse en haut ---
bm_cx = cover[2] - int(0.12 * S)
bm_w = int(0.06 * S)
bm_top = cover[1] - int(0.055 * S)
bm_bot = cover[1] + int(0.17 * S)
AMBER = (0xf0, 0xb4, 0x29, 255)
d.rectangle((bm_cx - bm_w // 2, bm_top, bm_cx + bm_w // 2, bm_bot), fill=AMBER)
# encoche en V en bas du ruban
d.polygon([(bm_cx - bm_w // 2, bm_bot), (bm_cx + bm_w // 2, bm_bot),
           (bm_cx, bm_bot - int(0.035 * S))], fill=(0, 0, 0, 0))
# recomposer le fond dans l'encoche (transparent -> laisser voir la couverture)
# (le trou created par polygon transparent ne fonctionne pas en dessin direct ;
#  on redessine plutôt deux triangles couleur couverture)
d.polygon([(bm_cx - bm_w // 2, bm_bot + 2), (bm_cx, bm_bot - int(0.035 * S)),
           (bm_cx - bm_w // 2, bm_bot - int(0.035 * S))], fill=WHITE)
d.polygon([(bm_cx + bm_w // 2, bm_bot + 2), (bm_cx, bm_bot - int(0.035 * S)),
           (bm_cx + bm_w // 2, bm_bot - int(0.035 * S))], fill=WHITE)

# --- downscale + export ---
final = img.resize((BASE, BASE), Image.LANCZOS)
outdir = os.path.dirname(os.path.abspath(__file__))
final.save(os.path.join(outdir, "icon.png"))                    # 1024 pour electron-builder
# aperçu 512 à la racine build
final.resize((512, 512), Image.LANCZOS).save(os.path.join(outdir, "icon-512.png"))

# tailles pour le thème d'icônes
home = os.path.expanduser("~")
for sz in (256, 128, 64, 48, 32):
    p = os.path.join(home, ".local/share/icons/hicolor/%dx%d/apps" % (sz, sz))
    os.makedirs(p, exist_ok=True)
    final.resize((sz, sz), Image.LANCZOS).save(os.path.join(p, "mon-journal.png"))

print("logo généré : build/icon.png (1024) + tailles hicolor 256..32")
