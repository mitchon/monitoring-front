import React, {useEffect, useRef, useState} from 'react';
import Leaflet, {LatLng, LatLngBounds} from 'leaflet';
import {MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Rectangle, Polyline} from "react-leaflet";
import CSS from "csstype";
import 'leaflet/dist/leaflet.css';
import useWebSocket from "react-use-websocket";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import axios, {AxiosError, AxiosHeaders, AxiosResponse} from "axios";

let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

Leaflet.Marker.prototype.options.icon = DefaultIcon;

const api: String | undefined = process.env.REACT_APP_API_URL

class Node{
    id: number;
    latitude: number;
    longitude: number;
}

interface IWay {
    id: number;
    nodes: Array<Node>
}


function Map() {

    const position = new Leaflet.LatLng(54.7585694, 38.8818137)
    const southEastBound = new Leaflet.LatLng(position.lat - 0.07 / 2, position.lng - 0.07)
    const northWestBound = new Leaflet.LatLng(position.lat + 0.07 / 2, position.lng + 0.07)
    const maxBounds = new Leaflet.LatLngBounds(southEastBound, northWestBound)
    const mapStyle: CSS.Properties = {width: '100%', height: '90vh' }
    const [map, setMap] = useState<Leaflet.Map | null>(null)
    const [roadways, setRoadways] = useState<Array<IWay>>([])

    // useWebSocket("ws://localhost:8080/socket", {
    //     onOpen: () => console.log('opened'),
    //     onClose: () => console.log('closed'),
    //     onMessage(e: MessageEvent<string>) { console.log(e.data) },
    //     retryOnError: true
    // })

    const GetGeom = () => {
        axios.get(api + "/graph/geom")
            .then((response: AxiosResponse) => {
                console.log(response.data)
                setRoadways(response.data)
            }).catch((error: AxiosError) => {
                console.log(error)
            })
    }

    function parseNodes (nodes: Array<Node>): Array<Leaflet.LatLng> {
        let result: Array<Leaflet.LatLng> = []
        for (let node of nodes) {
            result.push(new Leaflet.LatLng(node.latitude, node.longitude))
        }
        return result
    }

    return (
        <div>
            <button
                onClick={GetGeom}
            >
                Get Route Graph!
            </button>
            <MapContainer ref={setMap} center={position} zoom={16} minZoom={15} style={mapStyle} maxBounds={ maxBounds }>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Rectangle bounds={ maxBounds } fillOpacity={ 0 } color={ "red" } />
                {
                    roadways.map(roadway => {
                        return (<Polyline positions= { parseNodes(roadway.nodes) }/>)
                    })
                }
            </MapContainer>
        </div>
    );
}

export default Map;
