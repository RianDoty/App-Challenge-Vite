





export const HydrogenGasSpec = {
    id: 'hydrogen gas',
    moleculeJSON: '{"H":{"m":[[0,1],[1,0]],"width":2,"height":2}}',
    Info() {
        return (
            <>
            <h2>You found:</h2>
            <h1> Hydrogen Gas! (H2) </h1>
            <p> Hydrogen gas is a colorless, odorless, non-toxic, but still highly flammable gas.
                Hydrogen gas is used as an ingredient in rocket fuel, and can potentially power
                eco-friendly cars (in the future.)
            </p>
            <a href="https://en.wikipedia.org/wiki/Hydrogen">Wikipedia</a>
            </>
        )
    }
}