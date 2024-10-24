import { Force, GraphNode, Renderable } from "../classes";
import { Vector2 } from "../Vector2";
import { EditorScene } from "./editor";

export class OrbitalRepulsion extends Force {
    declare toApply: Set<Orbital>;
    strength: number;
    maxForce: number;
    actedType = Orbital;
    z: 0 = 0;
  
    constructor({
      strength = 1000,
      maxForce = 10,
    }: {
      strength?: number;
      maxForce?: number;
    }) {
      super()
      this.strength = strength;
      this.maxForce = maxForce;
    }
  
    add(...orbitals: Orbital[]) {
      orbitals.forEach(o => this.toApply.add(o));
    }

    delete(...orbitals: Orbital[]) {
        orbitals.forEach(o => this.toApply.delete(o))
    }
  
    tick(ms: number) {
      this.toApply.forEach((orbital) => {
        const otherNodes = Array.from(this.toApply).filter((n) => n !== orbital);
  
        otherNodes.forEach((other) => {
          // Coulomb's force - every node repulses one another
          // proportional to 1/d^2
          const offset = Vector2.sub(orbital.position, other.position);
          const distance = Vector2.mag(offset);
          if (distance === 0) return;
  
          // this code works better for a clean sim, but is mathematically a mess
          //const force = Math.min(this.strength * Math.max(1 - distance**0.75/minDistance**0.75, 0), this.maxForce)
  
          const force = this.strength / distance ** 2;


          const acceleration = Vector2.scale(offset, force * (ms / 1000));
  
          orbital.velocity = Vector2.add(orbital.velocity, acceleration);
        });
      });
    }
  
    render() {}
}

// Honestly, this class doesn't have anything really special anymore.
// I would say here for legacy, but this project's been a thing for 3 days :P
export class Atom extends GraphNode {
    declare connectedTo: Set<Atom>;

    // Gets an array of all molecules connected to this.
    getMolecule(): Set<Atom> {
        function getMoleculeRecursive(atom: Atom, seen: Set<Atom>) {
            seen.add(atom)
            for (const a of atom.connectedTo) {
                if (seen.has(a)) continue
                seen.add(a)
                getMoleculeRecursive(a, seen)
            }
            return seen
        }

        return getMoleculeRecursive(this, new Set<Atom>())
    }

    // Adds a LoneElectron, or combines two into a PairedElectron (if this has at least 4 electrons.)
    addElectron() {
        const electrons = Array.from(this.children).filter(r => r instanceof LoneElectron)
        if (electrons.length < 4) {
            // Less than 4; we're not pairing yet, so just add.
            const newElectron = new LoneElectron()
            this.addChild(newElectron)
        } else {
            // More than 4; we start pairing.
            // this is a jank as hell condition; if i had the energy to change it i would
            const toPair = electrons.find(e => (e instanceof LoneElectron) && !(e instanceof ElectronPair))
            if (toPair) {
                const newPair = new ElectronPair()
                newPair.position = Vector2.copy(toPair.position)

                this.deleteChild(toPair)
                this.addChild(newPair)
            } else {
                // no pair, so just add.
                const newElectron = new LoneElectron()
                this.addChild(newElectron)
            }
        }
    }

    tick(ms: number) {
        super.tick(ms)
        this.children.forEach(c => {
            if (c instanceof Orbital) {
                this.children.forEach(c2 => {
                    if (c2 instanceof Orbital && c != c2) {
                        // If the positions are the same, randomize.
                        if (c.position.x == c2.position.x && c.position.y == c2.position.y) {
                            c.position = Vector2.add(c.position, new Vector2(1, 1))
                        }
                    }
                })
            }
        })
    }

    // Try to remove a single first, if not, split up a double.
    removeElectron() {
        const electrons = Array.from(this.children).filter(r => r instanceof LoneElectron)
        const singleElectron = electrons.find(r => !(r instanceof ElectronPair))
        const pairedElectron = electrons.find(r => r instanceof ElectronPair)

        if (singleElectron) {
            this.deleteChild(singleElectron)
        } else if (pairedElectron) {
            const newSingle = new LoneElectron()
            newSingle.position = Vector2.copy(pairedElectron.position)
            newSingle.velocity = Vector2.copy(pairedElectron.velocity)
            this.deleteChild(pairedElectron)
            this.addChild(newSingle)
        }
    }
}

// An Orbital floats around a GraphNode.
export class Orbital extends Renderable {
    position: Vector2;
    velocity: Vector2;
    distance: number;
    dragConstant: number;
    maxVelocity: number;
    z: number;
    declare parent?: GraphNode

    constructor() {
        super()
        this.position = new Vector2(0,0);
        this.velocity = new Vector2(0,0);
        this.distance = 20;
        this.dragConstant = 0.8; // In % of current velocity per second
        this.z = 0;
        this.maxVelocity = 500;
    }

    tick (ms:number) {
        // Basic movement
        let velocity = Vector2.copy(this.velocity)
        let position = Vector2.copy(this.position)

        {
            // Apply maximum velocity
            if (Vector2.mag(velocity) > this.maxVelocity) {
                // Set the velocity's magnitude to be the same as MaxVelocity
                velocity = Vector2.atMagnitude(velocity, this.maxVelocity)
            }

            // Move based on velocity
            velocity = Vector2.scale(velocity, (1 - this.dragConstant)**(ms / 1000))
            const delta = Vector2.scale(velocity, ms / 1000)
            position = Vector2.add(position, delta)

            /// Position around parent
            if (!this.parent) return;

            const oldPos = Vector2.copy(position)
            const parent = this.parent
            const offset = Vector2.sub(position, parent.position)
            const direction = Vector2.unit(offset)

            // Snap the position to be the radius away
            if (Vector2.mag(offset) === 0) {
                // Fall back to the right of the atom if the orbital is directly on the center somehow
                position = Vector2.add(parent.position, Vector2.rotate(new Vector2(this.distance,0), Math.random() * 2 * Math.PI));
            } else {
                
                const offset_at_circle = Vector2.scale(direction, this.distance)
                position = Vector2.add(parent.position, offset_at_circle);
            }
            const circleAlignmentDelta = Vector2.scale(Vector2.sub(position, oldPos), 1 / (ms / 1000));
            velocity = Vector2.add(velocity, circleAlignmentDelta)
        }

        this.velocity = velocity
        this.position = position
    }
}

export class LoneElectron extends Orbital {
    size: number;

    constructor() {
        super()
        this.size = 5;
    }

    render (ctx: CanvasRenderingContext2D) {
        const canvasPos = Vector2.toCanvasSpace(this.position)

        // BLack dot
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(canvasPos.x, canvasPos.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke()
        ctx.closePath()

        /// DEBUG ///
        const debug = 0;
        if (!debug) return;
        // Show velocity as a line
        ctx.beginPath();
        ctx.moveTo(canvasPos.x,canvasPos.y);
        ctx.lineTo(canvasPos.x + this.velocity.x, canvasPos.y + this.velocity.y);
        ctx.stroke()
        ctx.closePath();

        // Show perpendicular direction as a line
        // Snap the velocity to be tangent to the circle
        if (!this.parent) return;
        const offset = Vector2.sub(this.position, this.parent.position)
        const direction = Vector2.unit(offset)
        let perpendicularDirection: Vector2; // perpendicular CW
        const cross = Vector2.cross(direction, this.velocity);
        if (cross > 0) {
            // The velocity is CW
            perpendicularDirection = new Vector2(-direction.y, direction.x)
        } else {
            // The velocity is CCW
            perpendicularDirection = new Vector2(direction.y, -direction.x);
        }
        ctx.beginPath();
        ctx.moveTo(canvasPos.x,canvasPos.y);
        ctx.lineTo(canvasPos.x + perpendicularDirection.x * 10, canvasPos.y + perpendicularDirection.y * 10);
        ctx.stroke()
        ctx.closePath();
    }
}

// LoneElectron, but with different rendering.
export class ElectronPair extends LoneElectron {
    render(ctx: CanvasRenderingContext2D) {
        const canvasPos = Vector2.toCanvasSpace(this.position)

        // Not gonna deal with having a "default rendering mode" if there's no parent.
        // you get nothing, good day sire.
        if (!this.parent) return;

        const parentPos = Vector2.toCanvasSpace(this.parent.position);
        const offset = Vector2.sub(canvasPos, parentPos)
        const off1 = Vector2.rotate(offset, Math.PI / 12)
        const off2 = Vector2.rotate(offset, -Math.PI / 12)
        const pos1 = Vector2.add(parentPos, off1)
        const pos2 = Vector2.add(parentPos, off2)

        // Two black dots
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(pos1.x, pos1.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke()
        ctx.closePath()

        // Two black dots
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(pos2.x, pos2.y, this.size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke()
        ctx.closePath()
    }
}


/// Atom templates
// All of these are essentially just regular Atoms with certain things baked in,
// like electron counts and sizes(?).

// "H". Starts with one lone electron orbiting it.
export class Hydrogen extends Atom {
    constructor(x?:number, y?:number, size?:number) {
        super(x,y,size,'H')

        const e = new LoneElectron();
        this.addChild(e)
    }
}

// "O". Starts with two lone electrons and two pairs.
export class Oxygen extends Atom {
    constructor(x?:number, y?:number, size?:number) {
        super(x,y,size,'O')

        const orbitals = [new LoneElectron(), new LoneElectron(), new ElectronPair(), new ElectronPair()];
        orbitals.forEach(o => this.addChild(o));
    }
}

// "C".
export class Carbon extends Atom {
    constructor(x?:number, y?:number, size?:number) {
        super(x,y,size,'C')

        const orbitals = [new LoneElectron(), new LoneElectron(), new LoneElectron(), new LoneElectron()];
        orbitals.forEach(o => this.addChild(o));
    }
}

//"N"
export class Nitrogen extends Atom {
    constructor(x?:number, y?:number, size?:number) {
        super(x,y,size,'N')

        const orbitals = [new LoneElectron(), new LoneElectron(), new LoneElectron(), new ElectronPair()];
        orbitals.forEach(o => this.addChild(o));
    }
}

export const atomMap: { [key: number]: typeof Atom; } = {
    1: Hydrogen,
    6: Carbon,
    7: Nitrogen,
    8: Oxygen
};
