



export const WaterSpec = {
    id: 'water',
    moleculeJSON: '{"O":{"m":[[0,1,1]],"width":3,"height":1},"H":{"m":[[1,0,0],[1,0,0]],"width":3,"height":2}}',
    Info() {
        return (
            <>
            <h2>You Found:</h2>
            <h1> Water! (H2O) </h1>
            <p> 
                Almost all of the Earth's water is undrinkable ocean water, at a whopping <i>97%.</i> <br/>
                Almost all of Earth's energy is generated by steam in one way or another. Oil,
                coal, and even nuclear plants all just generate power by heating water to make
                steam that goes through a turbine.
            </p>
            <a href="https://en.wikipedia.org/wiki/Water">Wikipedia</a>
            </>
        )
    }
}