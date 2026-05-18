import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceFile = path.join(root, "public", "countries.geojson");
const outFile = path.join(root, "public", "countries-light.geojson");
const TOLERANCE = 0.035;
const PRECISION = 3;
const PRESERVE_DETAIL = new Set(["SG", "MC", "VA", "SM", "MT"]);

function squareDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function squareSegmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDouglasPeucker(points, squaredTolerance) {
  const last = points.length - 1;
  const simplified = [points[0]];
  const markers = new Uint8Array(points.length);
  const stack = [[0, last]];
  markers[0] = 1;
  markers[last] = 1;

  while (stack.length) {
    const [first, end] = stack.pop();
    let maxDistance = 0;
    let index = 0;

    for (let i = first + 1; i < end; i += 1) {
      const distance = squareSegmentDistance(points[i], points[first], points[end]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }

    if (maxDistance > squaredTolerance) {
      markers[index] = 1;
      stack.push([first, index], [index, end]);
    }
  }

  for (let i = 1; i < last; i += 1) {
    if (markers[i]) simplified.push(points[i]);
  }
  simplified.push(points[last]);
  return simplified;
}

function roundPoint(point) {
  return point.map((value) => Number(value.toFixed(PRECISION)));
}

function simplifyRing(ring, tolerance, preserveDetail) {
  if (ring.length <= 5) return ring.map(roundPoint);
  const closed =
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1];
  const points = closed ? ring.slice(0, -1) : ring;
  const effectiveTolerance = preserveDetail ? tolerance / 5 : tolerance;
  const simplified = simplifyDouglasPeucker(points, effectiveTolerance * effectiveTolerance).map(roundPoint);
  const next = simplified.length >= 3 ? simplified : points.map(roundPoint);
  if (closed) next.push([...next[0]]);
  return next;
}

function simplifyGeometry(geometry, preserveDetail) {
  if (!geometry) return geometry;
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, TOLERANCE, preserveDetail)),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring) => simplifyRing(ring, TOLERANCE, preserveDetail)),
      ),
    };
  }
  return geometry;
}

const geojson = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const light = {
  ...geojson,
  features: geojson.features.map((feature) => {
    const code = feature.properties?.ISO_A2;
    return {
      ...feature,
      geometry: simplifyGeometry(feature.geometry, PRESERVE_DETAIL.has(code)),
    };
  }),
};

fs.writeFileSync(outFile, `${JSON.stringify(light)}\n`);
console.log(`Wrote ${light.features.length} countries to ${outFile}`);
