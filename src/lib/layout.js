import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  forceCollide,
} from 'd3-force'

const NODE_SEP = 240
const COLLIDE_RADIUS = 110

export function applyLayout(nodes, edges) {
  const indexById = Object.fromEntries(nodes.map((n, i) => [n.id, i]))

  const simNodes = nodes.map((n, i) => ({ id: n.id, x: i * NODE_SEP, y: 0 }))
  const simEdges = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }))

  const sim = forceSimulation(simNodes)
    .force(
      'link',
      forceLink(simEdges)
        .id((d) => d.id)
        .distance(NODE_SEP)
        .strength(1),
    )
    .force('charge', forceManyBody().strength(-500))
    .force(
      'x',
      forceX((d) => indexById[d.id] * NODE_SEP).strength(0.8),
    )
    .force('y', forceY(0).strength(0.3))
    .force('collide', forceCollide(COLLIDE_RADIUS))
    .stop()

  sim.tick(400)

  const posById = Object.fromEntries(simNodes.map((n) => [n.id, { x: n.x, y: n.y }]))

  return nodes.map((n) => ({
    ...n,
    position: posById[n.id],
  }))
}
