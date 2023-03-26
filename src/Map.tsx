import React, {useState} from 'react';
import Leaflet, {LatLng, LatLngBounds} from 'leaflet';
import {MapContainer, TileLayer, Popup, Rectangle, Polyline} from "react-leaflet";
import CSS from "csstype";
import 'leaflet/dist/leaflet.css';
import useWebSocket from "react-use-websocket";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import axios, {AxiosError, AxiosResponse} from "axios";

let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

Leaflet.Marker.prototype.options.icon = DefaultIcon;

const api: String | undefined = process.env.REACT_APP_API_URL

class Location{
    id: number;
    latitude: number;
    longitude: number;
}

interface ILink {
    start: Location
    finish: Location
}

class RequestResponse {
    requestId: String
}


function Map() {

    const position = new LatLng(54.7585694, 38.8818137)
    const southEastBound = new LatLng(position.lat - 0.07 / 2, position.lng - 0.07)
    const northWestBound = new LatLng(position.lat + 0.07 / 2, position.lng + 0.07)
    const maxBounds = new LatLngBounds(southEastBound, northWestBound)
    const mapStyle: CSS.Properties = {width: '100%', height: '90vh' }
    const [map, setMap] = useState<Leaflet.Map | null>(null)
    const [requestResponse, setRequestResponse] = useState<RequestResponse | undefined>(undefined)
    const [roadways, setRoadways] = useState<Array<ILink>>([])
    const [start, setStart] = useState<string>("")
    const [finish, setFinish] = useState<string>("")

    // useWebSocket("ws://localhost:8080/socket", {
    //     onOpen: () => console.log('opened'),
    //     onClose: () => console.log('closed'),
    //     onMessage(e: MessageEvent<string>) { console.log(e.data) },
    //     retryOnError: true
    // })

    const Rebuild = () => {
        axios.get(api + "/graph/build")
            .then((response: AxiosResponse) => {
                console.log(response.data)
                setRequestResponse(response.data)
                GetGraph()
            }).catch((error: AxiosError) => {
            console.log(error)
        })
    }

    const GetGraph = () => {
        axios.get(api + "/graph/graph")
            .then((response: AxiosResponse) => {
                console.log(response.data)
                setRoadways(response.data)
            }).catch((error: AxiosError) => {
                console.log(error)
            })
    }

    const GetRoute = () => {
        axios.get(api + "/graph/dijkstra/" + start + "/" + finish)
            .then((response: AxiosResponse) => {
                console.log(response.data)
                setRoadways(response.data)
            }).catch((error: AxiosError) => {
            console.log(error)
        })
    }

    function parseLocation (location: Location): LatLng {
        return new LatLng(location.latitude, location.longitude)
    }

    return (
        <div>
            <button
                onClick={Rebuild}
            >
                Rebuild!
            </button>
            <button
                onClick={GetGraph}
            >
                Get Full Graph!
            </button>
            <input
                type="number"
                value={start}
                onChange={e => setStart(e.target.value)}
            />
            <input
                type="number"
                value={finish}
                onChange={e => setFinish(e.target.value)}
            />
            <button
                onClick={GetRoute}
            >
                Get Route!
            </button>
            <MapContainer ref={setMap} center={position} zoom={16} minZoom={15} style={mapStyle} maxBounds={ maxBounds }>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Rectangle bounds={ maxBounds } fillOpacity={ 0 } color={ "red" } />
                {
                    roadways.map(roadway => {
                        return (
                            <Polyline
                                key = {roadway.start.id.toString() + roadway.finish.id.toString()}
                                positions = { [parseLocation(roadway.start), parseLocation(roadway.finish)] }
                            >
                                <Popup>
                                    {roadway.start.id.toString() + ", " + roadway.finish.id.toString()}
                                </Popup>
                            </Polyline>)
                    })
                }
            </MapContainer>
        </div>
    );
}

export default Map;
