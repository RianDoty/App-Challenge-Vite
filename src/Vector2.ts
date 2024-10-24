import { origin } from "./canvas";

export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static add(v1: Vector2, v2: Vector2): Vector2 {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }

  static sub(v1: Vector2, v2: Vector2): Vector2 {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  }

  // Multiplies a vector's length
  static scale(v: Vector2, num: number): Vector2 {
    return new Vector2(v.x * num, v.y * num);
  }

  // 2D Dot Product
  static dot(v1: Vector2, v2: Vector2): number {
    return v1.x * v2.x + v1.y * v2.y
  }

  // 2D Cross Product
  static cross(v1: Vector2, v2: Vector2): number {
    return v1.x * v2.y - v2.x * v1.y
  }

  // Magnitude
  static mag(v: Vector2): number {
    return Math.sqrt(v.x ** 2 + v.y ** 2);
  }

  // Makes a new vector in the same direction as the given vector,
  // but at the given magnitude.
  static atMagnitude(v: Vector2, mag: number): Vector2 {
    return Vector2.scale(Vector2.unit(v), mag)
  }

  static unit(v: Vector2): Vector2 {
    const magnitude = Vector2.mag(v);
    if (magnitude === 0) {
      return new Vector2(0, 0)
    }
    return { x: v.x / magnitude, y: v.y / magnitude };
  }

  static copy(v: Vector2): Vector2 {
    return { x: v.x, y: v.y };
  }

  // Rotates a vector clockwise by theta radians.
  static rotate(v: Vector2, theta: number): Vector2 {
    return new Vector2(
      Math.cos(theta) * v.x - Math.sin(theta) * v.y, 
      Math.sin(theta)*v.x + Math.cos(theta) * v.y
    )
  }

  // BUG: This only works if the upper-left corner of the canvas is the same as the upper-left corner of the window (mostly.)
  static toCanvasSpace(v: Vector2): Vector2 {
    return Vector2.add(v, origin);
  }

  static fromCanvasSpace(v: Vector2): Vector2 {
    return Vector2.sub(v, origin);
  }

  // Given three collinear points p, q, r, the function checks if
  // point q lies on line segment 'pr'
  static onSegment(p: Vector2, q: Vector2, r: Vector2) {
    if (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    )
      return true;

    return false;
  }

  // To find orientation of ordered triplet (p, q, r).
  // The function returns following values
  // 0 --> p, q and r are collinear
  // 1 --> Clockwise
  // 2 --> Counterclockwise
  static orientation(p: Vector2, q: Vector2, r: Vector2) {
    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
    // for details of below formula.
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

    if (val == 0) return 0; // collinear

    return val > 0 ? 1 : 2; // clock or counterclock wise
  }

  // The main function that returns true if line segment 'p1q1'
  // and 'p2q2' intersect.
  static doIntersect(p1: Vector2, q1: Vector2, p2: Vector2, q2: Vector2) {
    // Find the four orientations needed for general and
    // special cases
    let o1 = Vector2.orientation(p1, q1, p2);
    let o2 = Vector2.orientation(p1, q1, q2);
    let o3 = Vector2.orientation(p2, q2, p1);
    let o4 = Vector2.orientation(p2, q2, q1);

    // General case
    if (o1 != o2 && o3 != o4) return true;

    // Special Cases
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 == 0 && Vector2.onSegment(p1, p2, q1)) return true;

    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 == 0 && Vector2.onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 == 0 && Vector2.onSegment(p2, p1, q2)) return true;

    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 == 0 && Vector2.onSegment(p2, q1, q2)) return true;

    return false; // Doesn't fall in any of the above cases
  }
}
