import { Vector2 } from "./Vector2";
import { Connection, GraphNode, NodeGroup } from "./classes";

interface NodesData {
  nodes: { label: number; center: Vector2 }[];
  edges: { source: number; target: number }[];
}

export const enzymeData = {
  nodes: [
    { label: 0, center: { x: 240.9, y: 220.2 } },
    { label: 1, center: { x: 141.9, y: 169.4 } },
    { label: 2, center: { x: 194.7, y: 284.2 } },
    { label: 3, center: { x: 124.8, y: 279.9 } },
    { label: 4, center: { x: 170.4, y: 225.7 } },
    { label: 5, center: { x: 203.6, y: 163.5 } },
    { label: 6, center: { x: 84.9, y: 141.4 } },
    { label: 7, center: { x: 268.2, y: 159.9 } },
    { label: 8, center: { x: 337.2, y: 152.7 } },
    { label: 9, center: { x: 309.5, y: 216.3 } },
    { label: 10, center: { x: 309.5, y: 283.6 } },
    { label: 11, center: { x: 249.1, y: 336.9 } },
    { label: 12, center: { x: 253.2, y: 274.3 } },
    { label: 13, center: { x: 96.1, y: 217.3 } },
    { label: 14, center: { x: 162.1, y: 342.3 } },
    { label: 15, center: { x: 152.3, y: 103.7 } },
    { label: 16, center: { x: 222.5, y: 101.8 } },
    { label: 17, center: { x: 292.5, y: 95.8 } },
  ],
  edges: [
    { source: 0, target: 2 },
    { source: 0, target: 4 },
    { source: 0, target: 5 },
    { source: 1, target: 4 },
    { source: 1, target: 5 },
    { source: 2, target: 3 },
    { source: 2, target: 4 },
    { source: 4, target: 5 },
    { source: 2, target: 11 },
    { source: 11, target: 12 },
    { source: 12, target: 2 },
    { source: 2, target: 12 },
    { source: 12, target: 0 },
    { source: 0, target: 12 },
    { source: 12, target: 10 },
    { source: 10, target: 11 },
    { source: 10, target: 0 },
    { source: 0, target: 9 },
    { source: 9, target: 10 },
    { source: 7, target: 5 },
    { source: 5, target: 7 },
    { source: 7, target: 9 },
    { source: 9, target: 8 },
    { source: 8, target: 7 },
    { source: 6, target: 13 },
    { source: 13, target: 1 },
    { source: 1, target: 6 },
    { source: 13, target: 4 },
    { source: 2, target: 14 },
    { source: 14, target: 3 },
    { source: 3, target: 4 },
    { source: 1, target: 15 },
    { source: 15, target: 6 },
    { source: 7, target: 16 },
    { source: 16, target: 17 },
    { source: 17, target: 7 },
    { source: 7, target: 17 },
    { source: 17, target: 8 },
  ],
};

export const activatorData: NodesData = {
  nodes: [
    { label: 0, center: { x: -220.7, y: 250.8 } },
    { label: 1, center: { x: -208, y: 170.3 } },
    { label: 2, center: { x: -272.9, y: 201.2 } },
    { label: 3, center: { x: -155.8, y: 219.8 } },
  ],
  edges: [
    { source: 0, target: 2 },
    { source: 2, target: 1 },
    { source: 1, target: 3 },
    { source: 0, target: 3 },
    { source: 0, target: 1 },
  ],
};

export function parseData(data: NodesData) {
  const nodes = data.nodes.map((d) => new GraphNode(d.center.x, d.center.y));
  const edges = data.edges.map(
    (d) => new Connection(nodes[d.source], nodes[d.target])
  );
  return { nodes, edges };
}
