import { Atom } from "./chemistry/chemclasses"

export class Counter {
    c: {[key: string]: number}

    constructor(iter?: Iterable<number>) {
        this.c = {}

        if (iter) {
            for (const n of iter) {
                this.add(n)
            }
        }
    }

    add(n: number) {
        if (this.c[n]) {
            this.c[n] += 1
        } else {
            this.c[n] = 1
        }
    }

    delete(n: number) {
        if (this.c[n]) {
            this.c[n] -= 1
        }
    }

    static equal(c1: Counter, c2: Counter) {
        // For every entry of c1, ensure that c2 has a matching entry.
        for (const [key, count] of Object.entries(c1.c)) {
            if (!c2.c[key] || c2.c[key] != count) {
                return false
            }
        }
        return true
    }
}

// Matrix is an array of rows, so is indexed m[y][x].
export class Matrix {
    m: number[][]
    width: number
    height: number

    constructor(width: number, height: number, m?: number[][]) {
        this.width = Math.floor(width)
        this.height = Math.floor(height)

        if (m) {
            this.m = m
        } else {
            this.m = new Array(this.height)
            for (let y = 0; y < this.height; y++) {
                const row = new Array(this.width).fill(0)
                this.m[y] = row
            }
        }
    }

    // ASSUMES m is of the correct format.
    static fromData(m: number[][]) {
        const height = m.length
        const width = m[0].length
        return new Matrix(width, height, m)
    }

    // Here because the whole reverse-indexing thing is weird.
    at(x: number, y: number) {
        return this.m[y][x]
    }

    // This one's easy because we can directly iterate over rows.
    sumRows(): Counter {
        return new Counter(this.m.map(row => row.reduce((sum, n) => sum + n)))
    }

    // Iterate over rows, increasing the sum at each index
    sumColumns(): Counter {
        const sums = new Array(this.width).fill(0)

        for (const row of this.m) {
            for (let x = 0; x < this.width; x++) {
                sums[x] += row[x]
            }
        }

        return new Counter()
    }

    static areTransposable(m1: Matrix, m2: Matrix) {
        const rows1 = m1.sumRows()
        const rows2 = m2.sumRows()
        const col1 = m1.sumColumns()
        const col2 = m2.sumColumns()

        return  Counter.equal(rows1, rows2) && Counter.equal(col1, col2)
    }
}

export class MoleculeComparisonMatrix {
    matrices: {[key: string]: Matrix}

    constructor() {
        this.matrices = {}
    }

    static fromMolecule(m: Set<Atom>): MoleculeComparisonMatrix {
        const width = m.size

        // Split up the molecule into sets of each label.
        const byLabel: {[label: string]: Set<Atom>} = {}
        m.forEach(a => {
            if (byLabel[a.label]) {
                byLabel[a.label].add(a)
            } else {
                byLabel[a.label] = new Set([a])
            }
        })

        // Make a map from each atom to their columns in the table, to keep things consistent.
        const columnMap = new Map<Atom, number>()
        let i = 0;
        m.forEach(a => {
            columnMap.set(a, i)
            i++;
        })

        const out = new MoleculeComparisonMatrix()
        
        // For each label, add a new matrix in the comparison matrix.
        Object.entries(byLabel).forEach(([label, atoms]) => {
            const labelMatrix = new Matrix(width, atoms.size)
            out.matrices[label] = labelMatrix

            // for each atom in the atoms set
            for (const [y, a1] of Array.from(atoms).entries()) {
                // For each atom in the column map, if this atom is connected to that atom, write a 1.
                // otherwise, write a 0.
                for (const [a2, x] of columnMap.entries()) {
                    if (a1.connectedTo.has(a2)) {
                        labelMatrix.m[y][x] = 1
                    } else {
                        labelMatrix.m[y][x] = 0
                    }
                }
            }
        })

        // We're done!
        return out
    }

    matrix(label:string) {
        return this.matrices[label]
    }

    has(label: string) {
        return !!this.matrices[label]
    }

    static compare(mcm1: MoleculeComparisonMatrix, mcm2: MoleculeComparisonMatrix) {
        // Get the row and column sums from each comparison matrix.
        for (const [label, matrix] of Object.entries(mcm1.matrices)) {
            if (!mcm2.has(label)) return false;

            // We know both comparison matrices have this label. Test for transposability between them.
            if (!Matrix.areTransposable(matrix, mcm2.matrix(label))) return false;
        }

        for (const [label, matrix] of Object.entries(mcm2.matrices)) {
            if (!mcm1.has(label)) return false;

            // We know both comparison matrices have this label. Test for transposability between them.
            if (!Matrix.areTransposable(matrix, mcm1.matrix(label))) return false;
        }
        return true
    }

    toJSON() {
        return JSON.stringify(this.matrices)
    }

    static fromJSON(json: string) {
        const out = new MoleculeComparisonMatrix()
        const m = JSON.parse(json) as {[label: string]: Matrix}
        // Revive baby!
        for (const [label, matrix] of Object.entries(m)) {
            m[label] = new Matrix(matrix.width, matrix.height, matrix.m)
        }
        out.matrices = m
        return out
    }
}