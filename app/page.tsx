"use client";
import { useState } from "react";
import {
    APIProvider,
    Map,
    AdvancedMarker,
    InfoWindow,
} from "@vis.gl/react-google-maps";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

export default function Home() {
    const [markers, setMarkers] = useState<
        { lat: number; lng: number; title: string; description: string }[]
    >([]);
    const [newMarker, setNewMarker] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const [formData, setFormData] = useState({ title: "", description: "" });
    const [selectedMarker, setSelectedMarker] = useState<number | null>(null);

    if (!apiKey) {
        return (
            <div style={{ padding: 20 }}>
                <h2>Missing Google Maps API key</h2>
                <p>
                    Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in your
                    <code>.env</code> and restart the dev server.
                </p>
            </div>
        );
    }

    const handleMapClick = (event: any) => {
        const coord = event.detail.latLng;
        if (!coord) return;

        const lat = coord.lat;
        const lng = coord.lng;

        setNewMarker({ lat, lng });
        console.log("New marker:", lat, lng);
    };

    const addMarker = () => {
        if (!formData.title) {
            alert("Please select a species!");
            return;
        }
        if (newMarker) {
            setMarkers([...markers, { ...newMarker, ...formData }]);
            setNewMarker(null);
            setFormData({ title: "", description: "" });
        }
    };

    return (
        <APIProvider apiKey={apiKey}>
            <Map
                mapId="10bf5ced29a53cc6356c8409"
                style={{ width: "90vw", height: "100vh" }}
                defaultCenter={{ lat: 22.0594, lng: -159.4995 }}
                defaultZoom={11}
                gestureHandling="greedy"
                disableDefaultUI
                onClick={handleMapClick}
            >
                {markers.map((marker, idx) => (
                    <AdvancedMarker
                        key={idx}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        onClick={() => setSelectedMarker(idx)}
                    />
                ))}

                {selectedMarker !== null && (
                    <InfoWindow
                        position={{
                            lat: markers[selectedMarker].lat,
                            lng: markers[selectedMarker].lng,
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div>
                            <h3>{markers[selectedMarker].title}</h3>
                            <p>{markers[selectedMarker].description}</p>
                        </div>
                    </InfoWindow>
                )}
            </Map>

            {newMarker && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        backgroundColor: "white",
                        padding: "10px",
                        zIndex: 1000,
                        border: "1px solid black",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        minWidth: "250px",
                    }}
                >
                    <select
                        value={formData.title}
                        onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                        }
                        required
                    >
                        <option value="">Select an invasive species</option>
                        <option value="Coconut Rhinoceros Beetle">
                            Coconut Rhinoceros Beetle
                        </option>
                        <option value="Coffee Berry Borer (CBB)/ Coffee Leaf Rust (CLR)">
                            Coffee Berry Borer (CBB)/ Coffee Leaf Rust (CLR)
                        </option>
                        <option value="Coqui">Coqui</option>
                        <option value="Jackson's Chameleon">
                            Jackson's Chameleon
                        </option>
                        <option value="Little Fire Ant">Little Fire Ant</option>
                        <option value="Mongoose">Mongoose</option>
                        <option value="Naio Thrips">Naio Thrips</option>
                        <option value="Rose-ringed Parakeet">
                            Rose-ringed Parakeet
                        </option>
                        <option value="Rapid ʻŌhiʻa Death (ROD)">
                            Rapid ʻŌhiʻa Death (ROD)
                        </option>
                        <option value="Barbados Gooseberry">
                            Barbados Gooseberry
                        </option>
                        <option value="Bingabing">Bingabing</option>
                        <option value="Common Rush">Common Rush</option>
                    </select>
                    <input
                        placeholder="Description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                description: e.target.value,
                            })
                        }
                    />
                    <button onClick={addMarker}>Add Marker</button>
                    <button onClick={() => setNewMarker(null)}>Cancel</button>
                </div>
            )}
        </APIProvider>
    );
}
