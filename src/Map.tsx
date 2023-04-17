import React, {useEffect, useState} from 'react';
import Leaflet, {LatLng, LatLngBounds, LeafletMouseEvent} from 'leaflet';
import {MapContainer, TileLayer, Rectangle, Polyline, useMapEvents} from "react-leaflet";
import CSS from "csstype";
import 'leaflet/dist/leaflet.css';
// import useWebSocket from "react-use-websocket";

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import axios, {AxiosError, AxiosResponse} from "axios";
import {Location, ILink, parseLocation} from "./Location";
import CustomMarker from "./CustomMarker";

let DefaultIcon = Leaflet.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});

Leaflet.Marker.prototype.options.icon = DefaultIcon;

const api: String | undefined = process.env.REACT_APP_API_URL

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
    const [exactWayDefault, setExactWayDefault] = useState<Array<ILink>>([])
    const [exactWaySafeSpace, setExactWaySafeSpace] = useState<Array<ILink>>([])
    const [start, setStart] = useState<string>("")
    const [finish, setFinish] = useState<string>("")
    const [markers, setMarkers] = useState<Array<[Location, string]>>([])

    // useWebSocket("ws://localhost:8080/socket", {
    //     onOpen: () => console.log('opened'),
    //     onClose: () => console.log('closed'),
    //     onMessage(e: MessageEvent<string>) { console.log(e.data) },
    //     retryOnError: true
    // })

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
        axios.get(api + "/graph/route/" + start + "/" + finish + "/a-star/default")
            .then((firstResponse: AxiosResponse) => {
                console.log(firstResponse.data)
                setExactWayDefault(firstResponse.data)
                setStart("")
                setFinish("")
                setMarkers([])
                axios.get(api + "/graph/route/" + start + "/" + finish + "/a-star/safe-space")
                    .then((secondResponse: AxiosResponse) => {
                        console.log(secondResponse.data)
                        setExactWaySafeSpace(secondResponse.data)
                    }).catch((error: AxiosError) => {
                    console.log(error)
                })
            }).catch((error: AxiosError) => {
            console.log(error)
        })
    }

    useEffect(() => {
        if (start !== "" && finish !== "") {
            GetRoute()
        }
    }, [start, finish])

    useEffect( () => {
        axios.get(api + "/graph/build")
            .then((response: AxiosResponse) => {
                console.log(response.data)
                setRequestResponse(response.data)
                GetGraph()
            }).catch((error: AxiosError) => {
            console.log(error)
        })
    }, [])

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
                setMarkers(current => [...current, [point.point, ""]])
            }
        })

        return null
    }


    return (
        <div>
            <MapContainer ref={setMap} center={position} zoom={16} minZoom={14.5} style={mapStyle} maxBounds={ maxBounds }>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
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
                    exactWayDefault.map(roadway => {
                        return (
                            <Polyline
                                color = {"red"}
                                weight = {5}
                                key = {roadway.start.id.toString() + roadway.finish.id.toString()}
                                positions = { [parseLocation(roadway.start), parseLocation(roadway.finish)] }
                            />
                        )
                    })
                }
                {
                    exactWaySafeSpace.map(roadway => {
                        return (
                            <Polyline
                                color = {"green"}
                                weight = {5}
                                key = {roadway.start.id.toString() + roadway.finish.id.toString()}
                                positions = { [parseLocation(roadway.start), parseLocation(roadway.finish)] }
                            />
                        )
                    })
                }
                <Clicks></Clicks>
                {
                    markers.map( (marker, index) => {
                        const pickedLocation = marker[0]
                        return (
                            <CustomMarker map={map!!} position = {pickedLocation} key={pickedLocation.id + index} isActive>
                                <button onClick={(e) => {
                                    setStart(pickedLocation.id.toString())
                                }}>
                                    From
                                </button>
                                <button onClick={(e) => {
                                    setFinish(pickedLocation.id.toString())
                                }}>
                                    To
                                </button>
                            </CustomMarker>
                        )
                    })
                }
            </MapContainer>
        </div>
    );
}

export default Map;
