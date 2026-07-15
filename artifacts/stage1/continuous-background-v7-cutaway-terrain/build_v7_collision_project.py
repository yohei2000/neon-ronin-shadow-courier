from __future__ import annotations

import base64
import hashlib
import json
import shutil
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "stage1-master-layout.png"
BACKGROUND_MANIFEST = ROOT / "stage1-continuous-background-manifest.json"
OUTPUT = ROOT / "collision-authoring"
IMAGES = OUTPUT / "images"
OVERLAY_SLICES = OUTPUT / "surface-review-slices"
BACKGROUND_FILE = "stage1-v7-continuous-background.png"
PREVIEW_FILE = "stage1-v7-continuous-background.editor-preview.jpg"
PROJECT_FILE = "stage1-v7-collision-builder-project.json"
EXTERNAL_PROJECT_FILE = "stage1-v7-collision-builder-project.external-image.json"
COMPACT_FILE = "stage1-v7-collision-candidate.json"
VALIDATION_FILE = "stage1-v7-collision-validation.json"
PLATE_ID = "plate-stage1-v7-cutaway-master"
WORLD_WIDTH = 10050
WORLD_HEIGHT = 900


def surface(
    identifier: str,
    surface_type: str,
    points: list[list[float]],
    *,
    thickness: float = 20,
    one_way: bool = False,
    notes: str,
) -> dict:
    return {
        "id": identifier,
        "plateId": PLATE_ID,
        "type": surface_type,
        "points": points,
        "thickness": thickness,
        "collisionMode": "one-way" if one_way else "solid",
        "oneWay": one_way,
        "notes": notes,
        "visualOffsetX": 0,
        "visualOffsetY": 0,
    }


SURFACES = [
    surface(
        "v7-ground-rain-lantern-start",
        "ground",
        [[0, 570], [560, 570]],
        thickness=28,
        notes="Front edge of the wet stone street and retaining wall.",
    ),
    surface(
        "v7-slope-rain-bank-rise",
        "slope",
        [[560, 570], [720, 510]],
        thickness=20,
        notes="Broad supported stone rise between the opening street terraces.",
    ),
    surface(
        "v7-ground-lantern-run",
        "ground",
        [[720, 510], [1710, 510]],
        thickness=28,
        notes="Continuous wet stone coping before the tall sign stair.",
    ),
    surface(
        "v7-slope-sign-tower-stair",
        "slope",
        [[1710, 510], [2210, 210]],
        thickness=20,
        notes="Visible monumental stone stair climbing to the sign tower crown.",
    ),
    surface(
        "v7-ground-sign-tower-crown",
        "ground",
        [[2210, 210], [2760, 210]],
        thickness=28,
        notes="Upper stone terrace carried by two deep masonry arches.",
    ),
    surface(
        "v7-oneway-market-entry",
        "oneWay",
        [[2760, 390], [3150, 390]],
        thickness=20,
        one_way=True,
        notes="Drop landing at the supported market-entry stone gallery.",
    ),
    surface(
        "v7-oneway-market-upper-gallery",
        "oneWay",
        [[3000, 360], [3200, 360], [3350, 350], [3600, 370], [3900, 370], [4150, 390], [4450, 390], [4680, 390]],
        thickness=18,
        one_way=True,
        notes="Upper market route across connected timber galleries and roof fascia.",
    ),
    surface(
        "v7-slope-market-cross-stair",
        "slope",
        [[3190, 360], [3560, 570], [3840, 750]],
        thickness=18,
        notes="Visible diagonal stair linking the market's upper, middle, and lower floors.",
    ),
    surface(
        "v7-oneway-market-middle-floor",
        "oneWay",
        [[3500, 570], [4680, 570]],
        thickness=18,
        one_way=True,
        notes="Middle market floor with continuous beams, posts, and rooms beneath.",
    ),
    surface(
        "v7-oneway-market-lower-floor",
        "oneWay",
        [[3900, 800], [4700, 800]],
        thickness=18,
        one_way=True,
        notes="Optional lower market landing above the cutaway foundation level.",
    ),
    surface(
        "v7-ground-drain-approach",
        "ground",
        [[4680, 390], [4970, 390]],
        thickness=26,
        notes="Stone roof terrace immediately before the drainage descent.",
    ),
    surface(
        "v7-slope-drain-descent",
        "slope",
        [[4970, 390], [5280, 490]],
        thickness=20,
        notes="Masonry stair descending from the market to the canal bank.",
    ),
    surface(
        "v7-ground-drain-bank",
        "ground",
        [[5280, 490], [6200, 490]],
        thickness=28,
        notes="Continuous drainage-bank top carried by deep stone arches.",
    ),
    surface(
        "v7-oneway-thorn-floor-01",
        "oneWay",
        [[6270, 700], [6490, 700]],
        thickness=18,
        one_way=True,
        notes="Lowest visible timber floor inside the cutaway climb tower.",
    ),
    surface(
        "v7-oneway-thorn-floor-02",
        "oneWay",
        [[6300, 600], [6600, 600]],
        thickness=18,
        one_way=True,
        notes="Lower-mid timber landing inside the cutaway climb tower.",
    ),
    surface(
        "v7-oneway-thorn-floor-03",
        "oneWay",
        [[6280, 480], [6600, 480]],
        thickness=18,
        one_way=True,
        notes="Middle landing aligned to the drain-bank entrance.",
    ),
    surface(
        "v7-oneway-thorn-floor-04",
        "oneWay",
        [[6330, 320], [6610, 320]],
        thickness=18,
        one_way=True,
        notes="Upper-mid timber landing in the cutaway tower.",
    ),
    surface(
        "v7-oneway-thorn-floor-05",
        "oneWay",
        [[6270, 180], [6600, 180]],
        thickness=18,
        one_way=True,
        notes="Top tower room floor before the supported high gallery.",
    ),
    surface(
        "v7-wall-thorn-tower-left",
        "wall",
        [[6230, 380], [6230, 175]],
        thickness=24,
        notes="Upper left masonry wall of the vertical cutaway climb, leaving a playable entry below.",
    ),
    surface(
        "v7-wall-thorn-tower-right",
        "wall",
        [[6640, 300], [6640, 700]],
        thickness=24,
        notes="Lower right masonry wall of the vertical cutaway climb, leaving a playable exit to the high gallery.",
    ),
    surface(
        "v7-oneway-high-approach-gallery",
        "oneWay",
        [[6660, 260], [7650, 260]],
        thickness=20,
        one_way=True,
        notes="High covered gallery floor supported by large arches and piers.",
    ),
    surface(
        "v7-slope-gate-descent-upper",
        "slope",
        [[7650, 260], [8050, 350]],
        thickness=20,
        notes="Upper supported gate-approach stair.",
    ),
    surface(
        "v7-slope-gate-descent-lower",
        "slope",
        [[8050, 350], [8500, 570]],
        thickness=20,
        notes="Lower broad stair descending into the Warden forecourt.",
    ),
    surface(
        "v7-ground-warden-forecourt",
        "ground",
        [[8500, 645], [10050, 645]],
        thickness=30,
        notes="Front physical edge of the wet-stone Warden arena and Moon Gate threshold.",
    ),
]

COLORS = {
    "ground": (76, 226, 240, 235),
    "slope": (112, 244, 189, 235),
    "oneWay": (244, 190, 92, 235),
    "wall": (235, 94, 169, 235),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/seguisb.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def image_data_url(master: Image.Image) -> tuple[str, bytes]:
    buffer = BytesIO()
    master.save(buffer, format="JPEG", quality=76, optimize=True, progressive=True)
    preview_bytes = buffer.getvalue()
    return f"data:image/jpeg;base64,{base64.b64encode(preview_bytes).decode('ascii')}", preview_bytes


def make_project(preview_data_url: str, include_data_url: bool) -> dict:
    plate = {
        "id": PLATE_ID,
        "name": "Stage1 v7 continuous cutaway master",
        "imageName": PREVIEW_FILE if include_data_url else BACKGROUND_FILE,
        "imageRef": f"images/{BACKGROUND_FILE}",
        "worldX": 0,
        "worldY": 0,
        "scale": 1,
        "width": WORLD_WIDTH,
        "height": WORLD_HEIGHT,
        "opacity": 1,
        "locked": True,
        "visible": True,
    }
    if include_data_url:
        plate["imageDataUrl"] = preview_data_url
    return {
        "version": 1,
        "projectName": "Neon Ronin Stage 1 v7 - Cutaway Collision Candidate",
        "world": {"unit": "px", "gravity": 1420},
        "playerProfile": {
            "bodyWidth": 42,
            "bodyHeight": 72,
            "footOffsetY": 0,
            "jumpHeight": 110,
            "maxRunSpeed": 183,
        },
        "plates": [plate],
        "surfaces": SURFACES,
        "objects": [],
        "playerProbe": {"id": "probe-v7-start-foot", "x": 96, "y": 570, "enabled": True},
    }


def draw_surface_review(master: Image.Image) -> None:
    overlay = Image.new("RGBA", master.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    for entry in SURFACES:
        color = COLORS[entry["type"]]
        points = [(round(x), round(y)) for x, y in entry["points"]]
        draw.line(points, fill=color, width=7, joint="curve")
        for x, y in points:
            draw.ellipse((x - 5, y - 5, x + 5, y + 5), fill=color)
        x, y = points[0]
        label = entry["id"].removeprefix("v7-")
        text_width = max(78, round(draw.textlength(label, font=font(13, True))) + 10)
        label_y = max(2, y - 24)
        draw.rectangle((x + 4, label_y, x + 4 + text_width, label_y + 20), fill=(3, 9, 12, 215))
        draw.text((x + 9, label_y + 2), label, fill=color, font=font(13, True))
    review = Image.alpha_composite(master.convert("RGBA"), overlay).convert("RGB")
    review.save(OUTPUT / "stage1-v7-collision-surface-review.png", optimize=True)

    OVERLAY_SLICES.mkdir(parents=True, exist_ok=True)
    contact = Image.new("RGB", (1500, 1845), "#071018")
    contact_draw = ImageDraw.Draw(contact)
    starts = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9050]
    for index, start in enumerate(starts):
        end = min(WORLD_WIDTH, start + 1000)
        start = end - 1000
        crop = review.crop((start, 0, end, WORLD_HEIGHT))
        crop.save(OVERLAY_SLICES / f"slice-{index + 1:02d}-x{start}-{end}.png", optimize=True)
        tile = crop.resize((500, 450), Image.Resampling.LANCZOS)
        x = (index % 3) * 500
        y = (index // 3) * 460
        contact.paste(tile, (x, y + 10))
        contact_draw.rectangle((x, y, x + 500, y + 18), fill="#071018")
        contact_draw.text((x + 7, y + 1), f"worldX {start}-{end}", fill="#dce8ee", font=font(12, True))
    contact.save(OUTPUT / "stage1-v7-collision-surface-contact-sheet.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    IMAGES.mkdir(parents=True, exist_ok=True)
    with Image.open(MASTER) as image:
        master = image.convert("RGB")
    if master.size != (WORLD_WIDTH, WORLD_HEIGHT):
        raise ValueError(f"Unexpected v7 master size: {master.size}")

    with BACKGROUND_MANIFEST.open("r", encoding="utf-8") as handle:
        background_manifest = json.load(handle)
    if sha256(MASTER) != background_manifest["master"]["sha256"]:
        raise ValueError("v7 master hash does not match its background manifest")

    shutil.copyfile(MASTER, IMAGES / BACKGROUND_FILE)
    preview_data_url, preview_bytes = image_data_url(master)
    (IMAGES / PREVIEW_FILE).write_bytes(preview_bytes)

    embedded_project = make_project(preview_data_url, include_data_url=True)
    external_project = make_project(preview_data_url, include_data_url=False)
    with (OUTPUT / PROJECT_FILE).open("w", encoding="utf-8") as handle:
        json.dump(embedded_project, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    with (OUTPUT / EXTERNAL_PROJECT_FILE).open("w", encoding="utf-8") as handle:
        json.dump(external_project, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    compact = {
        "version": 1,
        "enabled": True,
        "status": "approved-runtime-source",
        "source": {
            "fileName": PROJECT_FILE,
            "projectName": embedded_project["projectName"],
            "backgroundMaster": "../stage1-master-layout.png",
            "backgroundMasterSha256": sha256(MASTER),
        },
        "plate": {"width": WORLD_WIDTH, "height": WORLD_HEIGHT},
        "coverageRange": {"start": 0, "end": WORLD_WIDTH},
        "surfaces": [
            {
                key: value
                for key, value in entry.items()
                if key in {"id", "type", "points", "thickness", "collisionMode", "oneWay", "notes"}
            }
            for entry in SURFACES
        ],
    }
    with (OUTPUT / COMPACT_FILE).open("w", encoding="utf-8") as handle:
        json.dump(compact, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    draw_surface_review(master)

    allowed_types = {"ground", "wall", "ceiling", "oneWay", "slope", "hazard", "trigger"}
    points_in_bounds = all(
        0 <= x <= WORLD_WIDTH and 0 <= y <= WORLD_HEIGHT
        for entry in SURFACES
        for x, y in entry["points"]
    )
    checks = [
        {"id": "background-manifest-hash", "passed": sha256(MASTER) == background_manifest["master"]["sha256"]},
        {"id": "master-dimensions", "passed": master.size == (WORLD_WIDTH, WORLD_HEIGHT)},
        {"id": "single-continuous-plate", "passed": len(embedded_project["plates"]) == 1},
        {"id": "surface-count", "passed": len(SURFACES) >= 20, "detail": str(len(SURFACES))},
        {"id": "surface-types", "passed": all(entry["type"] in allowed_types for entry in SURFACES)},
        {"id": "surface-points", "passed": all(len(entry["points"]) >= 2 for entry in SURFACES)},
        {"id": "points-in-world", "passed": points_in_bounds},
        {"id": "full-width-primary-ground", "passed": SURFACES[0]["points"][0][0] == 0 and SURFACES[-1]["points"][-1][0] == WORLD_WIDTH},
        {"id": "embedded-preview", "passed": embedded_project["plates"][0]["imageDataUrl"].startswith("data:image/jpeg;base64,")},
        {"id": "browser-storage-friendly", "passed": (OUTPUT / PROJECT_FILE).stat().st_size < 4_000_000, "detail": f"{(OUTPUT / PROJECT_FILE).stat().st_size} bytes"},
        {"id": "runtime-enabled", "passed": compact["enabled"] is True},
    ]
    validation = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "approved-runtime-source",
        "passed": all(check["passed"] for check in checks),
        "counts": {
            "surfaces": len(SURFACES),
            "ground": sum(entry["type"] == "ground" for entry in SURFACES),
            "slope": sum(entry["type"] == "slope" for entry in SURFACES),
            "oneWay": sum(entry["type"] == "oneWay" for entry in SURFACES),
            "wall": sum(entry["type"] == "wall" for entry in SURFACES),
        },
        "checks": checks,
    }
    with (OUTPUT / VALIDATION_FILE).open("w", encoding="utf-8") as handle:
        json.dump(validation, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    if not validation["passed"]:
        failed = ", ".join(check["id"] for check in checks if not check["passed"])
        raise RuntimeError(f"v7 collision project validation failed: {failed}")
    print(json.dumps(validation, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
