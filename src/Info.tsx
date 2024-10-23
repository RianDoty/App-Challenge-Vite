// The info tab that pops up to the right whenever a new molecule is made.
// If the window is wide enough, this tab is always out.
// Otherwise, the tab is normally stuck into the right, and can be opened
// by clicking on it.

import { useState } from "react";
import { NodeEditor } from "./chemistry/editor";
import magnifyingGlassIcon from './assets/magnifyingGlass.png'

function ExpandRetractButton({onClick}: {onClick: any}) {
    return (
        <div style={{position: "absolute", left: "-100px"}}>
            <button className="button-4" onClick={onClick}>
                Expand/ <br/>
                Retract <br/>
                Molecule
            </button>
        </div>
    )
}

export function InfoTab({editor, out, setOut}: {editor: NodeEditor, out: boolean, setOut: (a1:any)=>void}) {
    const  [inspectedAtomId, setIndspectedId] = useState<string | null>(null)

    return (
        <div className='sidebar' style={{right: out? "0px" : "-500px"}}>
            <ExpandRetractButton onClick={() => setOut(!out)}/>
            {inspectedAtomId? 
                (<>
                    
                </>) :
                (<>
                    <img src={magnifyingGlassIcon} style={{ width: "400px", height: "400px"}}/>
                    <p>You haven't inspected a valid molecule yet. Keep experimenting to make one!</p>
                </>)}
        </div>
    )
}