import "./App.css";
import React, { ReactNode } from "react";
import { EditorAction, NodeEditor } from "./chemistry/editor";

import hydrogenIcon from './assets/HydrogenIcon.svg'
import pointingHandIcon from './assets/DragIcon.svg'
import makeConnectionIcon from "./assets/MakeConnectionIcon.svg"
import TrashCanIcon from "./assets/TrashCanIcon.svg"

function EditorButton({
  onClick,
  img,
  children
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>,
  img?: string,
  children?: ReactNode
}) {
  return (
    <button className="button-4 editor-button" onMouseDown={onClick} style={{backgroundImage: `url(${img})`}}>
      {children}
    </button>
  );
}

function debugFunc(editor: NodeEditor) {
  const all = Array.from(editor.scene.renderables)
  console.log('Scene renderables: ', all)
}

// TODO:
// dampen connections
// add lower atom selection
// test for graph isomorphism with example molecules
// if a match is found, pull up that match's page.
// add phone support?

export default function Editor({editor}: {editor: NodeEditor}) {
  return (
    <div className="editor">
      <EditorButton onClick={editor.actionCallback(EditorAction.AddAtom, 1)} img={hydrogenIcon}/> 
      <EditorButton onClick={editor.actionCallback(EditorAction.Drag, 0)} img={pointingHandIcon}/>
      <EditorButton onClick={editor.actionCallback(EditorAction.RemoveAtom, 0)} img={TrashCanIcon}/>
      <EditorButton onClick={editor.actionCallback(EditorAction.EditConnections, 0)} img={makeConnectionIcon}/>
      <EditorButton onClick={() => debugFunc(editor)}/>
    </div>
  );
}
