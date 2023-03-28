import {LatLng} from "leaflet";

export class Location{
    id: number;
    latitude: number;
    longitude: number;
}

export interface ILink {
    start: Location
    finish: Location
}

export const parseLocation = (location: Location): LatLng => {
    return new LatLng(location.latitude, location.longitude)
}