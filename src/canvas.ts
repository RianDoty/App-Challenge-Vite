import { Vector2 } from "./Vector2";
import "./index.css";
import {
  Scene,
  GravityWell,
  NodeGroup,
  NodeRepulsion,
  DesiredConnection,
} from "./classes";
import { enzymeData, activatorData, parseData } from "./molecules";

export const origin: Vector2 = { x: 0, y: 0 };

// Setup the scene
export const myScene = new Scene();
const centerWell = new GravityWell(0, 0, 0.01);
const sideWell = new GravityWell(-100, -100, 0.01);
const repulsion = new NodeRepulsion({ strength: 100000 });

const enzyme = parseData(enzymeData);
const activator = parseData(activatorData);

//Allow the enzyme and activator to bond
const desired = [
  [1, 13],
  [3, 4],
  [0, 3],
].map(
  ([from, to]) => new DesiredConnection(activator.nodes[from], enzyme.nodes[to])
);

centerWell.add(...enzyme.nodes);
sideWell.add(...activator.nodes);
repulsion.add(...enzyme.nodes, ...activator.nodes);
myScene.add([repulsion, centerWell, sideWell], 0); // Forces
myScene.add([...enzyme.edges, ...activator.edges], -1); // Edges
myScene.add([...desired], -2); // Desired edges
myScene.add([...enzyme.nodes, ...activator.nodes], 1); // Nodes
myScene.add(
  [new NodeGroup(enzyme.nodes, true), new NodeGroup(activator.nodes, true)],
  0
); // Groups

export function setupCanvas(canvas: HTMLCanvasElement, scene: Scene) {
  /// Setup the canvas
  if (canvas !== null) {
    console.log("Canvas exists!");
  } else {
    console.error("Canvas does not exist");
  }

  // Set the dimensions of the canvas to fit the window whenever resized
  const parent = canvas.parentElement!
  function setCanvasDimensions() {
    const w = parent.clientWidth
    const h = parent.clientHeight
    canvas.width = w;
    canvas.height = h;
    origin.x = w / 2;
    origin.y = h / 2;
    scene.tick(1)
    scene.render()
  }
  setCanvasDimensions();
  const observer = new ResizeObserver(setCanvasDimensions)
  observer.observe(parent)

  // Setup context
  const ctx = canvas.getContext("2d")!;
  scene.setContext(ctx);

  // Setup rendering
  let last = 0;
  const tickRate = (1 / 60) * 1000;
  let timeToSimulate = 0;

  const renderIDHolder = { renderID: 0 };
  function render(time: number) {
    const ms = time - last;
    last = time;

    //Run at a constant tick rate. Also prevents "jumps" when the animation is paused and unpaused, or a lag spike occurs
    timeToSimulate += ms;
    let ticks = 0;
    while (timeToSimulate > tickRate && ticks < 10000) {
      scene.tick(tickRate);
      timeToSimulate -= tickRate;
      ticks = ticks + 1;
    }

    scene.render();
    renderIDHolder.renderID = requestAnimationFrame(render);
  }

  render(0);

  return renderIDHolder;
}
