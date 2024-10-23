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

    constructor(width: number, height: number, m: number[][]) {
        this.width = Math.floor(width)
        this.height = Math.floor(height)

        if (m) {
            this.m = m
        } else {
            this.m = new Array(this.height)
            for (let y = 0; y < this.height; y++) {
                const row = new Array(this.width)
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

    static fromMolecule(root: Atom) {
        const molec = root.getMolecule()

        
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