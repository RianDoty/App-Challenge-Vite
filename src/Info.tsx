// The info tab that pops up to the right whenever a new molecule is made.
// If the window is wide enough, this tab is always out.
// Otherwise, the tab is normally stuck into the right, and can be opened
// by clicking on it.

import { useEffect, useState } from "react";
import { NodeEditor } from "./chemistry/editor";
import magnifyingGlassIcon from '/assets/magnifyingGlass.png'
import AtomInfo from "./chemistry/atomInfo/AtomInfo";
import * as atomPages from './chemistry/atomInfo/allAtoms'

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
    const  [inspectedAtomId, setInspectedId] = useState<string | null>(null)

    useEffect(() => {
        const cb = (id:string) => setInspectedId(id)
        editor.bindInspected(cb)
        return () => editor.unbindInspected(cb)
    }, [editor])

    const atomPage = Object.values(atomPages).find(p => p.id === inspectedAtomId)?.Info

    return (
        <div className='sidebar' style={{right: out? "0px" : "-500px"}}>
            <ExpandRetractButton onClick={() => setOut(!out)}/>
            {inspectedAtomId? 
                (<>
                    <AtomInfo Page={atomPage!}/>
                </>) :
                (<>
                    <img src={magnifyingGlassIcon} style={{ width: "200px", height: "200px"}}/>
                    <p>You haven't inspected a valid molecule yet. Keep experimenting to make one!</p>
                </>)}
        </div>
    )
}