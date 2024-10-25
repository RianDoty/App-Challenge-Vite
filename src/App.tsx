import "./styles.css";
import "./canvas";
import { AtomSelector, Editor } from "./Editor";
import { useEffect, useRef, useState } from "react";
import { setupCanvas } from "./canvas";
import { Hydrogen } from "./chemistry/chemclasses";
import { EditorAction, EditorScene, NodeEditor } from "./chemistry/editor";
import { InfoTab } from "./Info";
import { GravityWell, NodeRepulsion } from "./classes";


const atomScene = new EditorScene();
const atom = new Hydrogen();
const editor = new NodeEditor(atomScene);
const repulsion = new NodeRepulsion({strength: 50000})
const centerWell = new GravityWell(0, 0, 10)

atomScene.addForce(centerWell, repulsion)
editor.addNodes([atom])
editor.setAction(EditorAction.Drag, 0)
atomScene.add([atom, editor])


export default function App() {
  const [sidebarOut, setOut] = useState(true)
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      const IDHolder = setupCanvas(ref.current, atomScene);
      return () => cancelAnimationFrame(IDHolder.renderID);
    }
  }, [ref.current]);

  return (
    <div className="fillscreen">
      <div className={`fillscreen atom-selector-shift${sidebarOut? ' sidebar-shift': ''}`}>
        <canvas id="game" ref={ref}></canvas>
        <div className="editor-container">
          <Editor editor={editor}></Editor>
        </div>
      </div>
      <div className={`fillscreen ${sidebarOut? 'sidebar-shift' : ''}`}>
        <AtomSelector editor={editor}/>
      </div>
      <InfoTab editor={editor} out={sidebarOut} setOut={setOut} />
    </div>
  );
}
