
import { Vector2 } from "./Vector2";

// X and Y point to center of node
export class Renderable {
  parent?: Renderable
  scene?: Scene
  readonly children: Set<Renderable>
  z = 0;

  constructor() {
    this.children = new Set()
  }

  /// Parent-Child Heirarchy
  // Each parent knows all of its children, and each child knows its parent.
  // If a child is destroyed, the parent must notice and remove it from its set of children.
  // If a parent is destroyed, all children must also be destroyed.
  // Destruction will happen inside of a Scene, so those behaviors will be handled there.
  addChild(...child: Renderable[]) {
    child.forEach(c => {
      if (c.parent) console.error('Child already has parent!', c)

      this.children.add(c)
      c.parent = this
      c.scene = this.scene
    })
    this.setHeirarchyChange()
  }

  deleteChild(...child: Renderable[]) {
    child.forEach(c => {
      if (!this.children.has(c)) console.error('Removed object is not a child of this!', this, c)

      this.children.delete(c)
      c.parent = undefined
      c.scene = undefined
    })
    this.setHeirarchyChange()
  }

  getFirstChildOfType<T extends new (...args: any[]) => Renderable>(type: T): InstanceType<T> | null {
    for (const c of this.children) {
      if (c instanceof type) {
        return c as unknown as InstanceType<T>
      }
    }
    return null
  }

  // To be called whenever children are added or removed.
  setHeirarchyChange() {
    this.scene?.onHeirarchyChange()
  }

  getChildren() {
    return this.children
  }

  getDescendants() {
    let out: Renderable[] = [this];
    this.children.forEach(c => {out = [...out, ...c.getDescendants()]})
    return out
  }

  addParent(parent: Renderable) {
    this.parent = parent
  }

  render(_ctx: CanvasRenderingContext2D) {}
  tick (_ms: number) {};
  destroy() {}
}

export class Scene {
  ctx?: CanvasRenderingContext2D;
  renderables: Set<Renderable>;
  forces: Set<Force>

  constructor(ctx?: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.renderables = new Set();
    this.forces = new Set()
  }

  getAllOfType<T extends new (...args: any[]) => Renderable>(type: T): InstanceType<T>[] {
    return this.getDescendants().filter(r => r instanceof type) as InstanceType<T>[]
  }

  getDescendants() {
    let out: Renderable[] = [];
    this.renderables.forEach(r => {out = [...out, ...r.getDescendants()]})
    return out
  }

  addForce(...toAdd: Force[]) {
    this.add(toAdd) // Add normally.
    
    toAdd.forEach(f => {
      this.forces.add(f)
      this._populateForce(f)
    })
  }

  deleteForce(...toDelete: Force[]) {
    this.delete(toDelete) // Delete normally.
  }

  onHeirarchyChange() {
    this._updateForces()
  }


  // Replaces (yes, replaces!) every single Force's toApply set
  // with a freshly filtered set of all objects of their actedType.
  private _updateForces() {
    this.forces.forEach(f => this._populateForce(f))
  }

  private _populateForce(f: Force) {
    if (!f.actedType) return;

    const ofType = this.getAllOfType(f.actedType)
    f.toApply = new Set(ofType)
  }

  add(toAdd: Renderable[], z = 0) {
    // Place the renderable object in the correct spot of the renderables
    // array based on z value
    toAdd.forEach(r => {
      r.z = z
      this.renderables.add(r)
    })
    this.onHeirarchyChange()
  }

  delete(toDelete: Renderable[]) {
    toDelete.forEach(r => {
      r.destroy()
      this.renderables.delete(r)
    })

    this.onHeirarchyChange()
  }

  // Returns the graphNode at that position, if any.
  // If multiple, an arbitrary node is chosen.
  hitNode(pos: Vector2): GraphNode | null {
    const nodes = this.getAllOfType(GraphNode)
    for (const n of nodes) {
      if (Vector2.mag(Vector2.sub(pos, n.position)) < n.size) {
        // Hit! the position is within the node's radius.
        return n
      }
    }
    return null
  }

  sortedRenderables() {
    // Step 1: Get every single descendant of this node by

    return Array.from(this.renderables.values()).sort((a,b) => a.z - b.z)
  }

  // To be called at a fixed TickRate
  tick(ms: number) {
    // Tick everything in the renderables, lowest z values first.

    function tickRecursive(r: Renderable) {
      r.tick(ms)
      r.children.forEach(tickRecursive)
    }

    this.sortedRenderables().forEach(tickRecursive);
  }

  // To be called once per frame
  render() {
    if (!this.hasContext()) {
      console.warn("This Scene doesn't have a context to render to!");
      return;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    function renderRecursive(r: Renderable) {
      r.render(ctx)
      r.children.forEach(renderRecursive)
    }

    this.sortedRenderables().forEach(renderRecursive);
  }

  hasContext(): this is { ctx: CanvasRenderingContext2D } {
    // Return if this.ctx is truthy.
    // if so, assume it's a context.
    return !!this.ctx;
  }

  setContext(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
}

export class NodeStructure {}

export class GraphNode extends Renderable {
  position: Vector2;
  velocity: Vector2;
  size: number;
  label: string;
  z: number;
  connectedTo: Set<GraphNode>;

  constructor(x = 0, y = 0, size = 20, label = "?") {
    super()
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.size = size;
    this.z = 0;
    this.label = label;
    this.connectedTo = new Set();
  }

  getPosition(): Vector2 {
    return Vector2.copy(this.position)
  }

  setPosition(p: Vector2) {
    this.position = Vector2.copy(p)
  }

  destroy() {}

  tick(ms: number) {

    // Damping = (dampingConstant)% m/s^2
    const dampingConstant = 10
    const damping = Vector2.scale(this.velocity, -1 * dampingConstant * ms / 1000)
    this.velocity = Vector2.add(this.velocity, damping)

    const delta = Vector2.scale(this.velocity, ms / 1000);
    this.position = Vector2.add(this.position, delta);
  }

  render(ctx: CanvasRenderingContext2D) {
    const canvasPos = Vector2.toCanvasSpace(this.position);

    // Styling
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black"; // Change to "white" for no outline

    // Canvas path
    ctx.beginPath();

    // Circle
    ctx.fillStyle = "white";
    ctx.arc(canvasPos.x, canvasPos.y, this.size, 0, 2 * Math.PI);
    ctx.fill();

    // Label
    ctx.fillStyle = "black";
    ctx.font = "24px arial";
    ctx.fillText(
      this.label,
      canvasPos.x - this.size / 2,
      canvasPos.y + this.size / 2
    );

    ctx.stroke();

    // Reset stroke style for later
    ctx.strokeStyle = "black";
  }

  addOutgoingConnection(node: GraphNode) {
    this.connectedTo.add(node);
  }

  removeOutgoingConnection(node: GraphNode) {
    this.connectedTo.delete(node);
  }
}

export class Connection extends Renderable {
  from: GraphNode;
  to: GraphNode;
  target: number;
  dashed: boolean;
  z = -999;

  constructor(
    from: GraphNode,
    to: GraphNode,
    { target = 100, dashed = false } = {}
  ) {
    super()
    this.from = from;
    this.to = to;
    this.target = target;
    this.dashed = dashed;
    from.addOutgoingConnection(to)
    to.addOutgoingConnection(from)
  }

  destroy() {
    this.from.removeOutgoingConnection(this.to)
    this.to.removeOutgoingConnection(this.from)
  }

  tick(ms: number) {
    //Each connection is a spring that pulls on both nodes
    const from = this.from;
    const to = this.to;
    const offset = Vector2.sub(to.position, from.position);
    const distance = this.target - Vector2.mag(offset);

    const force = Vector2.scale(
      Vector2.unit(offset),
      distance * Vector2.mag(offset)
    );
    const acceleration1 = Vector2.scale(force, (-1 * ms) / 1000);
    const acceleration2 = Vector2.scale(force, ms / 1000);

    from.velocity = Vector2.add(from.velocity, acceleration1);
    to.velocity = Vector2.add(to.velocity, acceleration2);
  }

  render(ctx: CanvasRenderingContext2D) {
    const fromP = Vector2.toCanvasSpace(this.from.position);
    const toP = Vector2.toCanvasSpace(this.to.position);
    ctx.beginPath();
    ctx.moveTo(fromP.x, fromP.y);
    ctx.lineTo(toP.x, toP.y);
    ctx.stroke();
  }
}

export class Force extends Renderable {
  toApply: Set<Renderable>
  actedType?: new (...args: any[]) => Renderable
  
  constructor() {
    super()
    this.toApply = new Set()
  }

  add(...renderables: Renderable[]) {
    renderables.forEach(r => this.toApply.add(r))
  }

  delete(...renderables: Renderable[]) {
    renderables.forEach(r => this.toApply.delete(r))
  }

  destroy() {
    this.toApply = new Set()
  }
}

// A connection that only "activates" when close enough to its target length
export class DesiredConnection extends Renderable {
  dashed = true;
  from: GraphNode;
  to: GraphNode;
  opacity: number;
  target: number;
  strength: number;

  constructor(from: GraphNode, to: GraphNode) {
    super()
    this.from = from;
    this.to = to;
    this.opacity = 0;
    this.target = 50;
    this.strength = 1;
  }

  tick(ms: number) {
    //Each connection is a spring that pulls on both nodes
    const from = this.from;
    const to = this.to;
    const offset = Vector2.sub(to.position, from.position);
    // "distance" is the gap between the desired and current distances.
    const distance = this.target - Vector2.mag(offset);


    const activationRadius = this.target * 3
    const activation = Math.exp(-1 * (distance / activationRadius) ** 20)
    const scalar =
      -1 *
      this.strength *
      distance *
      activation *
      Vector2.mag(offset);
    this.opacity = Math.max(1 - Math.abs(distance) / 200, 0);
    const force = Vector2.scale(Vector2.unit(offset), scalar);

    const acceleration1 = Vector2.scale(force, ms / 1000);
    const acceleration2 = Vector2.scale(force, (-1 * ms) / 1000);

    from.velocity = Vector2.add(from.velocity, acceleration1);
    to.velocity = Vector2.add(to.velocity, acceleration2);
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    const fromP = Vector2.toCanvasSpace(this.from.position);
    const toP = Vector2.toCanvasSpace(this.to.position);
    ctx.beginPath();
    ctx.moveTo(fromP.x, fromP.y);
    ctx.lineTo(toP.x, toP.y);
    ctx.setLineDash([5, 15]);

    ctx.strokeStyle = `rgb(${255 * (1 - this.opacity)},${
      255 * (1 - this.opacity)
    },${255 * (1 - this.opacity)})`;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgb(0,0,0)";
  }
}

// Makes nodes added to it want to move towards its center
// not actually gravity, more like a spring
export class GravityWell extends Force {
  position: Vector2;
  declare toApply: Set<GraphNode>
  actedType = GraphNode;
  strength: number;
  z: number;

  constructor(x: number, y: number, strength = 0.05) {
    super()
    this.position = { x, y };
    this.strength = strength;
    this.z = 0;
  }

  add(...nodes: GraphNode[]) {
    super.add(...nodes)
  }

  delete(...nodes: GraphNode[]) {
    super.delete(...nodes)
  }

  tick(ms: number) {
    this.toApply.forEach((node) => {
      let offset = Vector2.sub(node.position, this.position);
      const distance = Vector2.mag(offset);

      const acc = Vector2.scale(
        Vector2.unit(offset),
        -1 * this.strength * distance
      );

      node.velocity = Vector2.add(
        node.velocity,
        Vector2.scale(acc, ms / 1000)
      );
    });
  }

  render() {}
}

// Makes connections between nodes not want to cross (unfinished)
export class CrossRepulsion extends Force {
  declare toApply: Set<Connection>;
  actedType = Connection;
  strength: number;
  maxForce: number;
  z: 0 = 0;

  constructor({
    strength = 0.0005,
    maxForce = 10,
  }: {
    strength?: number;
    maxForce?: number;
  }) {
    super()
    this.strength = strength;
    this.maxForce = maxForce;
  }

  add(...connections: Connection[]) {
    // Add each connection
    connections.forEach((c) => this.toApply.add(c));
  }

  remove(...connections: Connection[]) {
    connections.forEach((c) => this.toApply.delete(c));
  }

  // tick(ms: number) {
  //   // Iterate over each pair of connections,
  //   // applying the force if the two lines cross.
  //   const connectionsArray = Array.from(this.toApply.values());
  //   connectionsArray.forEach((p) => {
  //     connectionsArray.forEach((q) => {
  //       if (p === q) return;

  //       // Get the four points describing the connection;
  //       const nodeP1 = p.from;
  //       const nodeP2 = p.to;
  //       const nodeQ1 = q.from;
  //       const nodeQ2 = q.to;

  //       const p1 = nodeP1.position;
  //       const p2 = nodeP2.position;
  //       const q1 = nodeQ1.position;
  //       const q2 = nodeQ2.position;

  //       if (Vector2.doIntersect(p1, q1, p2, q2)) {
  //         // Apply a force to
  //       }
  //     });
  //   });
  // }
}

// Makes all nodes want to stay away from each other
export class NodeRepulsion extends Force {
  declare toApply: Set<GraphNode>;
  actedType = GraphNode
  strength: number;
  maxForce: number;
  z: 0 = 0;

  constructor({
    strength = 0.0005,
    maxForce = 10,
  }: {
    strength?: number;
    maxForce?: number;
  }) {
    super()
    this.strength = strength;
    this.maxForce = maxForce;
  }

  add(...nodes: GraphNode[]) {
    super.add(...nodes)
  }

  delete(...nodes: GraphNode[]) {
    super.delete(...nodes)
  }

  tick(ms: number) {
    this.toApply.forEach((node) => {
      this.toApply.forEach((other) => {
        // Don't apply on the same node
        if (node === other) return;
        
        // Coulomb's force - every node repulses one another
        // proportional to 1/d^2
        const offset = Vector2.sub(node.position, other.position);
        const distance = Vector2.mag(offset);
        if (distance === 0) return;

        // this code works better for a clean sim, but is mathematically a mess
        //const force = Math.min(this.strength * Math.max(1 - distance**0.75/minDistance**0.75, 0), this.maxForce)

        const force = this.strength / distance ** 2;
        const acceleration = Vector2.scale(offset, force * (ms / 1000));

        node.velocity = Vector2.add(node.velocity, acceleration);
      });
    });
  }

  render() {}
}

// Draggable div placed over the bounding box of a group of nodes
export class NodeGroup extends Renderable {
  nodes: GraphNode[];
  draggable: boolean;
  dragDiv: HTMLDivElement;
  p1: Vector2;
  p2: Vector2;
  mouse: { oldPos: Vector2; delta: Vector2 };
  offsets: Vector2[];

  constructor(nodes: GraphNode[] = [], draggable: boolean, label = "") {
    super()
    this.nodes = [...nodes];
    this.draggable = draggable;
    this.p1 = { x: 0, y: 0 };
    this.p2 = { x: 0, y: 0 };
    this.mouse = { oldPos: { x: 0, y: 0 }, delta: { x: 0, y: 0 } };
    this.dragDiv = document.createElement("div");
    this.offsets = [];
    document.body.appendChild(this.dragDiv);

    this.dragDiv.className = "draggable";
    this.dragDiv.innerText = label;
    this.setupDrag();
  }

  private setupDrag() {
    this.dragDiv.onmousedown = (e) => this.onDragDown(e);
  }

  private onDragDown(e: MouseEvent) {
    e.preventDefault()
    this.mouse.oldPos = { x: e.clientX, y: e.clientY };
    document.onmouseup = () => this.closeDrag();
    document.onmousemove = (e) => this.drag(e);

    this.offsets = this.nodes.map((n) =>
      Vector2.sub(n.position, this.mouse.oldPos)
    );
  }

  private drag(e: MouseEvent) {
    e.preventDefault();

    this.mouse.delta = Vector2.sub(
      { x: e.clientX, y: e.clientY },
      this.mouse.oldPos
    );
    this.mouse.oldPos = { x: e.clientX, y: e.clientY };

    //Shift the entire group
    this.nodes.forEach((n) => {
      n.position = Vector2.add(n.position, this.mouse.delta);
      n.velocity = Vector2.copy(this.mouse.delta);
    });
  }

  private closeDrag() {
    document.onmouseup = null;
    document.onmousemove = null;
  }

  private setDivStyle() {
    const pc1 = Vector2.toCanvasSpace(this.p1);
    const pc2 = Vector2.toCanvasSpace(this.p2);

    // Make the div a box drawn with opposit corners
    // at p1 to p2
    this.dragDiv.style.left = `${pc1.x}px`;
    this.dragDiv.style.top = `${pc1.y}px`;
    this.dragDiv.style.width = `${pc2.x - pc1.x}px`;
    this.dragDiv.style.height = `${pc2.y - pc1.y}px`;
  }

  // Destroys the div associated with this.
  // NodeGroups don't have access to their Scene,
  // so removal from the scene must be done from elsewhere.
  destroy() {
    this.dragDiv.remove()
    this.closeDrag()
  }

  tick() {
    // Get the bounding box of the group

    /// Start with some position
    this.p1 = Vector2.copy(this.nodes[0].position);
    this.p2 = Vector2.copy(this.nodes[0].position);

    /// Get the farthest north-west and
    /// farthest south-east points
    for (const node of this.nodes) {
      const r = node.size;
      const pos = node.position;
      // north-west
      if (pos.x - r < this.p1.x) this.p1.x = pos.x - r;
      if (pos.y - r < this.p1.y) this.p1.y = pos.y - r;
      // south-east
      if (pos.x + r > this.p2.x) this.p2.x = pos.x + r;
      if (pos.y + r > this.p2.y) this.p2.y = pos.y + r;
    }
    this.setDivStyle();
  }

  render() {}
}