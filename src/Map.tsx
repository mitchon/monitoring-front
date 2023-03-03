import React, {useEffect, useRef, useState} from 'react';
import Leaflet, {LatLng} from 'leaflet';
import {MapContainer, TileLayer, Marker, Popup, useMapEvents} from "react-leaflet";
import CSS from "csstype";
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

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

function Map() {

    const position = new Leaflet.LatLng(55.752, 37.617)
    const mapStyle: CSS.Properties = {width: '100%', height: '90vh' }
    return (
        <div>
            <MapContainer center={position} zoom={13} style={mapStyle}>
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
