import React, {useEffect, useRef, useState} from 'react';
import Leaflet, {LatLng, LatLngBounds, LeafletMouseEvent} from 'leaflet';
import {MapContainer, TileLayer, Popup, Rectangle, Polyline, useMapEvents, Marker, MarkerProps} from "react-leaflet";
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
    const [exactWay, setExactWay] = useState<Array<ILink>>([])
    const [start, setStart] = useState<string>("")
    const [finish, setFinish] = useState<string>("")
    const [pickedLocation, setPickedLocation] = useState<Location | null>(null)

    const [refReady, setRefReady] = useState(false);
    let popupRef = useRef<Leaflet.Popup | null>(null);

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
                setExactWay(response.data)
            }).catch((error: AxiosError) => {
            console.log(error)
            setStart("")
            setFinish("")
        })
    }

    const parseLocation = (location: Location): LatLng => {
        return new LatLng(location.latitude, location.longitude)
    }

    useEffect(() => {
        setPickedLocation(null)
        if (start !== "" && finish !== "") {
            GetRoute()
            setStart("")
            setFinish("")
        }
    }, [start, finish])

    function Clicks() {
        useMapEvents({
            click(e: LeafletMouseEvent) {
                const point = roadways.map( (link: ILink): {distance: number; point: Location} => {
                    const point = parseLocation(link.start)
                    return {
                        distance: e.latlng.distanceTo(point),
                        point: link.start
                    }
                }).sort((a: { distance: number; point: Location; }, b: { distance: number; point: Location; }): number => {
                    if (a.distance > b.distance)
                        return 1
                    if (b.distance > a.distance)
                        return -1
                    return 0
                })[0]
                setPickedLocation(point.point)
            }
        })

        return null
    }

    useEffect(() => {
        if (refReady && map) {
            popupRef.current?.openOn(map);
        }
    }, [refReady, map]);


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
            <MapContainer ref={setMap} center={position} zoom={16} minZoom={14.5} style={mapStyle} maxBounds={ maxBounds }>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Rectangle bounds={ maxBounds } fillOpacity={ 0 } color={ "red" } />
                {
                    roadways.map(roadway => {
                        return (
                            <Polyline
                                opacity = {0.3}
                                key = {roadway.start.id.toString() + roadway.finish.id.toString()}
                                positions = { [parseLocation(roadway.start), parseLocation(roadway.finish)] }
                             />
                        )
                    })
                }
                {
                    exactWay.map(roadway => {
                        return (
                            <Polyline
                                color = {"red"}
                                key = {roadway.start.id.toString() + roadway.finish.id.toString()}
                                positions = { [parseLocation(roadway.start), parseLocation(roadway.finish)] }
                            />
                        )
                    })
                }
                <Clicks></Clicks>
                { pickedLocation ?
                    <Marker position = {parseLocation(pickedLocation)}>
                        <Popup
                            ref={(r) => {
                                popupRef.current = r;
                                setRefReady(true);
                            }}
                        >
                            <button onClick={(e) => {
                                setStart(pickedLocation.id.toString())
                                setRefReady(false)
                            }}>
                                From
                            </button>
                            <button onClick={(e) => {
                                setFinish(pickedLocation.id.toString())
                                setRefReady(false)
                            }}>
                                To
                            </button>
                        </Popup>
                    </Marker>
                    : null
                }
            </MapContainer>
        </div>
    );
}

export default Map;
