import React from "react";


export default function AtomInfo({Page}: {Page: () => React.JSX.Element}) {
    return (
        <>
            <Page/>
        </>
    )
}