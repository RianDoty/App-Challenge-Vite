import { Renderable, Scene, GraphNode, NodeGroup, NodeRepulsion, Force, Connection } from "../classes";
import { Atom, Hydrogen, LoneElectron, OrbitalRepulsion } from "./chemclasses";
import { subscribe, unsubscribe } from "../minpubsub"
import { Mouse } from '../Mouse'
import { Vector2 } from "../Vector2";

export enum EditorAction {
    None,
    Drag,
    AddElectrons,
    RemoveElectrons,
    AddAtom,
    RemoveAtom,
    EditConnections
}

// A normal Scene, but with certain forces baked into the add functions
// so that it plays nicely with an editor.
export class EditorScene extends Scene {
    orbitalRepulsion: OrbitalRepulsion
    nodeRepulsion: NodeRepulsion

    constructor(ctx?: CanvasRenderingContext2D) {
        super(ctx)

        this.orbitalRepulsion = new OrbitalRepulsion({});
        this.nodeRepulsion = new NodeRepulsion({})
        this.addForce(this.orbitalRepulsion, this.nodeRepulsion)
    }

    hitNode(pos: Vector2): Atom | null {
        return super.hitNode(pos) as Atom | null
    }

    onHeirarchyChange(): void {
        super.onHeirarchyChange()
        this.checkForNewAtoms()
    }

    // For all Atoms in this Scene,
    // check if the molecule they are a part of
    // matches one that we have an explanation for.
    checkForNewAtoms() {
        const atoms = this.getAllOfType(Atom)
        const seen = new Set<Atom>()

        for(const atom of atoms) {
        
        }
    }
}

// Repulsion that forces atoms back into the defined box.
// Unimplemented.
export class BoxRepulsion extends Force {

}

export class NodeEditor extends Renderable {
    actionHandler?: ActionHandler;
    scene: EditorScene;
    currentAction: EditorAction
    nodes: Set<GraphNode>;
    z = 0;

    constructor(scene: EditorScene) {
        super()
        this.scene = scene;
        this.nodes = new Set();
        this.currentAction = EditorAction.None
    }

    addNodes(nodes: GraphNode[]) {
        nodes.forEach(n => this.nodes.add(n));
    }

    actionCallback(actionName: EditorAction, parameter: number) {
        return () => this.setAction(actionName, parameter);
    }

    setAction(actionName: EditorAction, parameter: number) {
        if (this.actionHandler) {
            const oldAction = this.actionHandler
            oldAction.destroy()
            this.deleteChild(oldAction)
        }

        let newAction;
        this.currentAction = actionName
        switch (actionName) {
            case EditorAction.None:
                break;

            case EditorAction.Drag:
                newAction = new DragHandler();
                break;

            case EditorAction.AddAtom:
                newAction = new AddHandler(this, parameter)
                break;

            case EditorAction.RemoveAtom:
                newAction = new DeleteAtomHandler()
                break;

            case EditorAction.EditConnections:
                newAction = new ConnectionHandler()
                break;

            default:
                throw Error('Invalid action enum: ' + actionName)
        }

        if (newAction) {
            console.log('Adding newAction as child...')
            this.addChild(newAction)
        }
        newAction?.setup();
        this.actionHandler = newAction
    }
}

class ActionHandler extends Renderable {
    declare scene: Scene
    declare parent: NodeEditor
    z = 0

    get editor() {
        if (!this.parent) {
            console.error('ActionHandler not initialized with a parent!')
        }
        return this.parent
    }
}

export class DragHandler extends ActionHandler {
    groups: Set<NodeGroup>;
    z = 0;

    constructor() {
        super()
        this.groups = new Set();
    }

    setup() {
        this.makeGroups();
    }

    destroy() {
        this.destroyGroups();
    }

    makeGroups() {
        for (const node of this.editor.nodes) {
            // Make a single-node nodeGroup for every single node.
            // Abysmal practice, but i don't wanna do dragging logic again :(
            // (i'll have to anyways, ahhahaa)
            const group = new NodeGroup([node], true);
            this.scene.add([group]);
            this.groups.add(group);
        }
    }

    destroyGroups() {
        for (const group of this.groups) {
            group.destroy();
            this.scene.delete([group]);
        }
    }
}

const atomMap: {[key: number]: typeof Atom} = {
    1: Hydrogen
}

// Makes lone electrons on the focused atom attract/be attracted by
// lone electrons on all other atoms.
// BUG: This SHOULD keep up with new atoms being added (in theory),
// but it's part of the process of adding new atoms, so that bug should never happen.
export class AutomaticConnectionForce extends Force {

}

export class AddHandler extends ActionHandler {
    z = 0;
    heldAtom: Atom
    atomType: typeof Atom
    clickHandle: any

    constructor(editor: NodeEditor, atom: keyof typeof atomMap) {
        super()
        // Get the atom type from atomMap, and make a new atom of that type.
        this.atomType = atomMap[atom]
        console.log('Adding:')
        console.log(this.atomType)
        this.heldAtom = this.newHeldAtom()

        // Click handler. Binding it to mouse/up is a bit odd,
        // but it works when you want both click and drag->release actions to work.
        this.clickHandle = subscribe('mouse/up', () => this.onClick())
    }

    newHeldAtom(): Atom  {
        const mousePos = Mouse.getScenePos()
        const held = new this.atomType(mousePos.x, mousePos.y)
        this.addChild(held)
        held.tick(1) // Prevents any orbitals from "teleporting" on their first frame
        return held
    }

    onClick() {
        this.place()
    }

    place() {
        // Not a ton to be done (yet.) Just get a new atom.
        // TODO: Auto-add connections according to lewis structure rules
        this.scene.add([this.heldAtom])
        this.editor.addNodes([this.heldAtom])
        this.deleteChild(this.heldAtom)
        this.heldAtom = this.newHeldAtom()
    }

    setup() {
        
    }

    destroy() {
        this.scene.delete([this.heldAtom])
        this.deleteChild(this.heldAtom)
        unsubscribe(this.clickHandle)
    }

    tick(ms: number) {
        super.tick(ms)
        this.heldAtom.setPosition(Mouse.getScenePos()) 
    }

    render(ctx: CanvasRenderingContext2D) {
        this.heldAtom.render(ctx)
    }
}


export class DeleteAtomHandler extends ActionHandler {
    clickHandle: any

    constructor() {
        super()
        this.clickHandle = subscribe('mouse/up', () => this.onClick())
    }

    setup() {}

    destroy(): void {
        unsubscribe(this.clickHandle)
    }

    onClick() {
        // Ok actually trying this time.
        // Iterate over ALL atoms (don't care abt z bcuz lazy)
        // Get the first atom whose position lines up, and kill it.
        const mousePos = Mouse.getScenePos()
        const hit = this.scene.hitNode(mousePos)
        if (hit) {
            this.scene.delete([hit])
        }
    }
}

// This one's weird, because it's doing two things at once.
// If you click on an atom, your next click either makes a connection with a different atom or resets state.
// If you click outside of an atom, until you release the mouse, you'll start cutting connections.
enum ConnectionHandlerState {
    Idle,
    MakingConnection,
    CuttingConnections
}
export class ConnectionHandler extends ActionHandler {
    state: ConnectionHandlerState = ConnectionHandlerState.Idle
    mouseDownHandle: any
    mouseUpHandle: any
    mouseMoveHandle: any
    selectedAtom?: Atom

    setup() {
        this.mouseDownHandle = subscribe('mouse/down', () => this.onMouseDown())
        this.mouseUpHandle = subscribe('mouse/up', () => this.onMouseUp())
        this.mouseMoveHandle = subscribe('mouse/move', () => this.onMouseMove())
    }

    onMouseDown() {
        // If idle, look for a hit. If hit, transition to making a connection.
        // If making a connection, look for a hit. If hit, complete the connection.
        // Otherwise, do nothing.
        if (this.state === ConnectionHandlerState.Idle) {
            // Find a node we might have clicked on
            const hit = this.scene.hitNode(Mouse.getScenePos()) as Atom | null;
            if (hit) {
                // Select the hit atom, and start creating a connection.
                this.state = ConnectionHandlerState.MakingConnection
                this.selectedAtom = hit
            }
             

        } else if (this.state === ConnectionHandlerState.MakingConnection) {
            // No matter what, on the 2nd click we reset.
            this.state = ConnectionHandlerState.Idle

            const hit = this.scene.hitNode(Mouse.getScenePos());
            if (hit && this.selectedAtom && hit != this.selectedAtom) {
                
                
                const a1 = this.selectedAtom
                const a2 = hit

                // Remove a lone electron from both atoms, if found.
                const lone1 = a1.getFirstChildOfType(LoneElectron)
                const lone2 = a2.getFirstChildOfType(LoneElectron)

                if (lone1) {
                    lone1.destroy()
                    a1.deleteChild(lone1)
                }

                if (lone2) {
                    lone2.destroy()
                    a2.deleteChild(lone2)
                }

                const conn = new Connection(a1, a2)
                this.scene.add([conn], -1)
            }
        }

        console.log(this.state)
    }

    onMouseUp() {
        console.warn('unimplemented')
    }

    onMouseMove() {
        console.warn('unimplemented')
    }

    destroy(): void {
        unsubscribe(this.mouseDownHandle)
        unsubscribe(this.mouseUpHandle)
        unsubscribe(this.mouseMoveHandle)
    }
}