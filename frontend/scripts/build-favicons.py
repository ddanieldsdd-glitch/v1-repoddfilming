#!/usr/bin/env python3
"""
Genera los favicons a partir del logo «DD» vectorial (misma geometría que
src/components/LogoMark.jsx, calcada del PNG original de Cloudinary).

  python3 scripts/build-favicons.py      (necesita Pillow)

Salidas en public/:
  favicon.svg                 se adapta al tema: trazo oscuro en claro, blanco en oscuro
  favicon-light-{32,192}.png  trazo oscuro, fondo transparente (tema claro)
  favicon-dark-{32,192}.png    trazo blanco, fondo transparente (tema oscuro)
  favicon.ico                 16/32/48, blanco sobre cuadrado negro (se ve en ambos)
  apple-touch-icon.png        180, blanco sobre negro (iOS no admite transparencia)
"""
import os
import re
from PIL import Image, ImageDraw

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "public")

CIRCLE = (511, 480.5, 309)
D1 = "M383.5 321.5L447.8 321.5C454.7 321.6 461.8 321.2 468.7 321.9C475.6 322.7 482.7 324.2 489.4 326.2C496.2 328.3 503.0 330.9 509.2 334.3C515.4 337.7 521.3 342.1 526.6 346.8C532.0 351.4 537.1 356.6 541.4 362.1C545.8 367.7 549.7 373.8 552.9 380.0C556.1 386.3 558.7 392.9 560.8 399.6C562.9 406.3 564.6 413.1 565.7 420.0C566.8 426.8 567.2 433.8 567.5 440.8C567.8 447.7 568.2 454.9 567.3 461.8C566.5 468.8 564.6 475.7 562.7 482.6C560.8 489.5 558.8 496.6 555.9 503.2C553.0 509.8 549.4 516.5 545.1 522.4C540.8 528.4 535.6 534.0 530.0 538.7C524.3 543.5 518.0 547.7 511.4 550.9C504.8 554.2 497.5 556.4 490.5 558.1C483.4 559.8 476.1 560.8 469.0 561.2C461.9 561.6 454.8 560.6 447.8 560.5L383.5 560.5Z"
D2 = "M463.5 447.4L532.2 447.4C538.8 447.5 545.4 447.1 551.9 447.9C558.4 448.6 565.1 449.8 571.4 451.7C577.7 453.6 584.1 456.2 589.9 459.5C595.6 462.8 601.0 467.0 606.0 471.3C611.0 475.7 615.7 480.6 619.8 485.8C623.9 491.0 627.4 496.7 630.5 502.5C633.7 508.3 636.4 514.4 638.6 520.6C640.7 526.7 642.5 533.2 643.6 539.6C644.7 546.1 645.1 552.7 645.2 559.2C645.3 565.8 645.1 572.5 644.2 579.0C643.3 585.5 641.8 592.1 639.8 598.4C637.8 604.7 635.5 611.1 632.4 617.1C629.4 623.0 625.8 628.9 621.6 634.2C617.4 639.5 612.5 644.4 607.4 648.8C602.2 653.1 596.5 657.0 590.5 660.2C584.6 663.4 578.2 665.8 571.8 667.8C565.4 669.8 558.7 671.2 552.1 672.0C545.5 672.7 538.9 672.2 532.2 672.3L463.5 672.3Z"

# Trazo más grueso que en la web: a 16–32 px el original desaparece.
ICON_STROKE = 30
VIEW = (511 - 330, 480.5 - 330, 660)  # x, y, lado (círculo + trazo + margen)

DARK = (17, 17, 17, 255)
WHITE = (255, 255, 255, 255)


def flatten(d, steps=12):
    """Convierte un path M/L/C/Z en una lista de puntos."""
    tokens = re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", d)
    pts, i, cmd = [], 0, None
    while i < len(tokens):
        t = tokens[i]
        if t in "MLCZ":
            cmd = t
            i += 1
            if cmd == "Z":
                pts.append(pts[0])
            continue
        if cmd in ("M", "L"):
            pts.append((float(tokens[i]), float(tokens[i + 1])))
            i += 2
        elif cmd == "C":
            x0, y0 = pts[-1]
            c = [float(v) for v in tokens[i:i + 6]]
            for s in range(1, steps + 1):
                u = s / steps
                a, b, cc, dd = (1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3
                pts.append((a * x0 + b * c[0] + cc * c[2] + dd * c[4],
                            a * y0 + b * c[1] + cc * c[3] + dd * c[5]))
            i += 6
    return pts


def render(size, color, bg=None, stroke=ICON_STROKE, pad=0.0):
    ss = 8  # supermuestreo para bordes suaves
    big = size * ss
    im = Image.new("RGBA", (big, big), bg or (0, 0, 0, 0))
    dr = ImageDraw.Draw(im)
    vx, vy, side = VIEW
    side_p = side * (1 + 2 * pad)
    vx -= side * pad
    vy -= side * pad
    k = big / side_p
    tx = lambda p: ((p[0] - vx) * k, (p[1] - vy) * k)
    w = max(1, round(stroke * k))
    cx, cy, r = CIRCLE
    h = stroke / 2
    dr.ellipse([tx((cx - r - h, cy - r - h)), tx((cx + r + h, cy + r + h))], outline=color, width=w)
    # Las líneas anchas de Pillow salen dentadas en curvas: se "pinta" el trazo
    # con discos a lo largo del path densamente muestreado.
    rad = w / 2
    for d in (D1, D2):
        pts = [tx(p) for p in flatten(d, steps=24)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 / (rad / 3)))
            for j in range(n + 1):
                x, y = x0 + (x1 - x0) * j / n, y0 + (y1 - y0) * j / n
                dr.ellipse([x - rad, y - rad, x + rad, y + rad], fill=color)
    return im.resize((size, size), Image.LANCZOS)


def svg():
    vx, vy, side = VIEW
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vx:g} {vy:g} {side} {side}">
  <style>
    g {{ stroke: #111111; }}
    @media (prefers-color-scheme: dark) {{ g {{ stroke: #ffffff; }} }}
  </style>
  <g fill="none" stroke-width="{ICON_STROKE}" stroke-linejoin="round">
    <circle cx="{CIRCLE[0]}" cy="{CIRCLE[1]}" r="{CIRCLE[2]}"/>
    <path d="{D1}"/>
    <path d="{D2}"/>
  </g>
</svg>
"""


def main():
    with open(os.path.join(PUBLIC, "favicon.svg"), "w") as f:
        f.write(svg())
    for size in (32, 192):
        render(size, DARK).save(os.path.join(PUBLIC, f"favicon-light-{size}.png"))
        render(size, WHITE).save(os.path.join(PUBLIC, f"favicon-dark-{size}.png"))
    ico = render(48, WHITE, bg=(0, 0, 0, 255), pad=0.06)
    ico.save(os.path.join(PUBLIC, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    render(180, WHITE, bg=(0, 0, 0, 255), pad=0.12).save(os.path.join(PUBLIC, "apple-touch-icon.png"))
    print("favicons listos en", os.path.abspath(PUBLIC))


if __name__ == "__main__":
    main()
