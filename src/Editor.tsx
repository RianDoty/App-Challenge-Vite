import "./App.css";
import React, { ReactNode, useEffect, useState } from "react";
import { EditorAction, NodeEditor } from "./chemistry/editor";

import pointingHandIcon from '/assets/DragIcon.svg'
import makeConnectionIcon from "/assets/MakeConnectionIcon.svg"
import TrashCanIcon from "/assets/TrashCanIcon.svg"
import magnifyingGlass from '/assets/magnifyingGlass.png'

function EditorButton({
  onClick,
  img,
  selected,
  children
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>,
  img?: string,
  selected?: boolean,
  children?: ReactNode
}) {
  return (
    <button className={`button-4 editor-button ${selected? 'button-4-clicked-haha' : ''}`} onMouseDown={onClick} style={{backgroundImage: `url(${img})`}}>
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

export function Editor({editor}: {editor: NodeEditor}) {
  const [action, setAction] =  useState<EditorAction>(0)

  useEffect(() => {
    const cb = (a: number) => setAction(a)
    editor.bindActionChange(cb)
    return () => editor.unbindActionChange(cb)
  }, [editor]) 

  return (
    <div className="editor">
      <EditorButton selected={action == EditorAction.Drag} onClick={editor.actionCallback(EditorAction.Drag, 0)} img={pointingHandIcon}/>
      <EditorButton selected={action == EditorAction.RemoveAtom} onClick={editor.actionCallback(EditorAction.RemoveAtom, 0)} img={TrashCanIcon}/>
      <EditorButton selected={action == EditorAction.EditConnections} onClick={editor.actionCallback(EditorAction.EditConnections, 0)} img={makeConnectionIcon}/>
      <EditorButton selected={action == EditorAction.Inspect} onClick={editor.actionCallback(EditorAction.Inspect, 0)} img={magnifyingGlass}/>
      <EditorButton onClick={() => debugFunc(editor)}/>
    </div>
  );
}

export function AtomSelectionButton({
  onClick,
  img,
  children
}: {
  onClick: React.MouseEventHandler<HTMLButtonElement>,
  img?: string,
  selected?: boolean,
  children?: ReactNode
}) {
  return (
    <button className={`button-4 atom-selection-button`} onMouseDown={onClick} style={{backgroundImage: `url(${img})`}}>
      {children}
    </button>
  );
}

export function AtomSelector({editor}: {editor: NodeEditor}) {
  return (
    <div className="atom-selector">
      <AtomSelectionButton onClick={editor.actionCallback(EditorAction.AddAtom, 1)}>H</AtomSelectionButton>
      <AtomSelectionButton onClick={editor.actionCallback(EditorAction.AddAtom, 6)}>C</AtomSelectionButton>
      <AtomSelectionButton onClick={editor.actionCallback(EditorAction.AddAtom, 7)}>N</AtomSelectionButton>
      <AtomSelectionButton onClick={editor.actionCallback(EditorAction.AddAtom, 8)}>O</AtomSelectionButton>
    </div>
  )
}
