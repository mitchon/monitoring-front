import React, {useEffect, useRef, useState} from 'react';
import Leaflet, {LatLng, LatLngBounds} from 'leaflet';
import {MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap} from "react-leaflet";
import CSS from "csstype";
import 'leaflet/dist/leaflet.css';
import useWebSocket from "react-use-websocket";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import axios, {AxiosResponse} from "axios";

let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

Leaflet.Marker.prototype.options.icon = DefaultIcon;

function Markers() {
    const [markers, setMarkers] = useState<LatLng[]>([])

    useMapEvents({
        click(e) {
            setMarkers(markers.concat([e.latlng]))
        }
    })

    return (
        <div>
            {markers.map( marker =>
                <Marker position={marker}>
                    <Popup>New marker in ({marker.lat},{marker.lng})</Popup>
                </Marker>
            )}
        </div>
    )
}

const api: String | undefined = process.env.REACT_APP_API_URL

function Map() {

    const position = new Leaflet.LatLng(55.752, 37.617)
    const mapStyle: CSS.Properties = {width: '100%', height: '90vh' }
    const [map, setMap] = useState<Leaflet.Map | null>(null)

    useWebSocket("ws://localhost:8080/socket", {
        onOpen: () => console.log('opened'),
        onClose: () => console.log('closed'),
        onMessage(e: MessageEvent<string>) { console.log(e.data) },
        retryOnError: true
    })

    const GetGeom = () => {
        let newBounds = map ? map.getBounds() : null
        console.log(newBounds)
        console.log(process.env)
        if (newBounds !== null) {
            axios.get(api + "/graph/geom", {
                params: {bounds: btoa(JSON.stringify(newBounds))}
            }).then((response: AxiosResponse) => {
                console.log(response.data)
            })
        }
    }

    return (
        <div>
            <button
                onClick={GetGeom}
            >
                Get Route Graph!
            </button>
            <MapContainer ref={setMap} center={position} zoom={13} style={mapStyle}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>Kremlin</Popup>
                </Marker>
                <Markers/>
            </MapContainer>
        </div>
    );
}

export default Map;
