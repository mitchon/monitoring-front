import React, {ReactNode, useEffect, useRef, useState} from "react";
import {Marker, Popup} from "react-leaflet";
import {Location, parseLocation} from "./Location";
import Leaflet from "leaflet";

type Props = {
    map: Leaflet.Map,
    position: Location,
    children: ReactNode,
    isActive: boolean
}

function CustomMarker({map, position, children, isActive}: Props) {
    const ref = useRef<Leaflet.Popup | null>(null)
    const [refReady, setRefReady] = useState(false);

    useEffect(() => {
        if (refReady && isActive) ref.current?.openOn(map)
    }, [map, refReady, isActive]);

    return (
        <Marker position = {parseLocation(position)}>
            <Popup ref={(r) => {
                ref.current = r
                setRefReady(true)
            }
            }>
                {children}
            </Popup>
        </Marker>
    )
}

export default CustomMarker;