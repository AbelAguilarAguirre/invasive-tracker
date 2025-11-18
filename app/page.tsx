"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
    APIProvider,
    Map,
    Marker,
    InfoWindow,
} from "@vis.gl/react-google-maps";
import Image from "next/image";

const mapStyles = [
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
    },
];

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as
    | string
    | undefined;

export default function Home() {
    const [markers, setMarkers] = useState<
        {
            id?: string;
            lat: number;
            lng: number;
            title: string;
            description: string;
            observed_date?: string;
            imageUrl?: string;
            image_path?: string;
        }[]
    >([]);
    const [newMarker, setNewMarker] = useState<{
        lat: number;
        lng: number;
    } | null>(null);
    const today = new Date().toISOString().slice(0, 10);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        observed_date?: string | null;
        imageData?: string | null;
        imageName?: string | null;
    }>({
        title: "",
        description: "",
        observed_date: today,
        imageData: null,
        imageName: null,
    });
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

    useEffect(() => {
        (async () => {
            try {
                if (supabase) {
                    const { data, error } = await supabase
                        .from("markers")
                        .select("*")
                        .order("created_at", { ascending: true });
                    if (error) {
                        console.error("Supabase fetch error:", error);
                    } else if (data) {
                        const mapped = data.map((r: any) => ({
                            id: r.id,
                            lat: r.lat,
                            lng: r.lng,
                            title: r.title,
                            description: r.description,
                            observed_date: r.observed_date,
                            image_path: r.image_path,
                            imageUrl:
                                r.image_path && supabase
                                    ? supabase.storage
                                          .from("uploads")
                                          .getPublicUrl(r.image_path).data
                                          ?.publicUrl
                                    : undefined,
                        }));
                        setMarkers(mapped);
                    }
                } else {
                    const res = await fetch("/api/markers");
                    if (res.ok) {
                        const data = await res.json();
                        setMarkers(data);
                    } else {
                        console.error("Failed to fetch markers");
                    }
                }
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    const handleMapClick = (event: any) => {
        const coord = event.detail?.latLng;
        if (!coord) return;

        const lat = coord.lat;
        const lng = coord.lng;

        setNewMarker({ lat, lng });
    };

    const addMarker = async () => {
        if (!formData.title) {
            alert("Please select a species!");
            return;
        }
        if (!newMarker) return;

        const markerToSave = { ...newMarker, ...formData };

        try {
            if (supabase) {
                // upload image if provided
                let image_path: string | null = null;
                if (formData.imageData) {
                    const resp = await fetch(formData.imageData);
                    const blob = await resp.blob();
                    const filename = `${Date.now()}_${
                        formData.imageName ?? "image"
                    }`;
                    const { error: upErr } = await supabase.storage
                        .from("uploads")
                        .upload(filename, blob as any);
                    if (upErr) {
                        console.error("Upload error:", upErr);
                    } else {
                        image_path = filename;
                    }
                }

                const { data, error } = await supabase
                    .from("markers")
                    .insert([
                        {
                            lat: markerToSave.lat,
                            lng: markerToSave.lng,
                            title: markerToSave.title,
                            description: markerToSave.description,
                            observed_date: markerToSave.observed_date,
                            image_path,
                        },
                    ])
                    .select()
                    .single();

                if (error) {
                    console.error("Supabase insert error:", error);
                    alert("Failed to save marker");
                    return;
                }

                const imageUrl = data.image_path
                    ? supabase.storage
                          .from("uploads")
                          .getPublicUrl(data.image_path).data?.publicUrl
                    : undefined;

                setMarkers((prev) => [
                    ...prev,
                    {
                        id: data.id,
                        lat: data.lat,
                        lng: data.lng,
                        title: data.title,
                        description: data.description,
                        observed_date: data.observed_date,
                        imageUrl,
                        image_path: data.image_path,
                    },
                ]);

                setNewMarker(null);
                setFormData({
                    title: "",
                    description: "",
                    observed_date: today,
                    imageData: null,
                    imageName: null,
                });
            } else {
                const res = await fetch("/api/markers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(markerToSave),
                });

                if (res.ok) {
                    const saved = await res.json();
                    setMarkers((prev) => [...prev, saved]);
                    setNewMarker(null);
                    setFormData({
                        title: "",
                        description: "",
                        observed_date: today,
                        imageData: null,
                        imageName: null,
                    });
                } else {
                    alert("Failed to save marker");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save marker");
        }
    };

    const deleteMarker = async (id?: string, image_path?: string) => {
        if (!id) return;
        try {
            if (supabase) {
                const { error } = await supabase
                    .from("markers")
                    .delete()
                    .eq("id", id);
                if (error) {
                    console.error("Supabase delete error:", error);
                    alert("Failed to delete marker");
                    return;
                }
                if (image_path) {
                    await supabase.storage.from("uploads").remove([image_path]);
                }
                setMarkers((prev) => prev.filter((m) => m.id !== id));
                setSelectedMarker(null);
            } else {
                const res = await fetch("/api/markers", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id }),
                });
                if (res.ok) {
                    setMarkers((prev) => prev.filter((m) => m.id !== id));
                    setSelectedMarker(null);
                } else {
                    alert("Failed to delete marker");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Failed to delete marker");
        }
    };

    return (
        <div>
            <a href="https://www.kauaiisc.org/" rel="noopener noreferrer">
                <Image
                    src="/logo.png"
                    alt="Invasive Species Tracker"
                    width={100}
                    height={100}
                    objectFit="cover"
                    style={{
                        position: "absolute",
                        top: "0px",
                        left: "0px",
                        zIndex: 1000,
                    }}
                />
            </a>
            <APIProvider apiKey={apiKey}>
                <Map
                    style={{ width: "100vw", height: "100vh" }}
                    defaultCenter={{ lat: 22.0594, lng: -159.4995 }}
                    defaultZoom={11}
                    gestureHandling="greedy"
                    disableDefaultUI
                    onClick={handleMapClick}
                    styles={mapStyles}
                >
                    {markers.map((marker, idx) => (
                        <Marker
                            key={marker.id ?? idx}
                            position={{ lat: marker.lat, lng: marker.lng }}
                            onClick={() => setSelectedMarker(idx)}
                        />
                    ))}

                    {selectedMarker !== null && markers[selectedMarker] && (
                        <InfoWindow
                            position={{
                                lat: markers[selectedMarker].lat,
                                lng: markers[selectedMarker].lng,
                            }}
                            onCloseClick={() => setSelectedMarker(null)}
                        >
                            <div style={{ color: "black" }}>
                                <h3 style={{ margin: "0 0 8px 0" }}>
                                    {markers[selectedMarker].title}
                                </h3>
                                <p style={{ margin: "0 0 12px 0" }}>
                                    {markers[selectedMarker].description}
                                </p>
                                {markers[selectedMarker].observed_date && (
                                    <p
                                        style={{
                                            margin: "0 0 12px 0",
                                            fontStyle: "italic",
                                        }}
                                    >
                                        Observed:{" "}
                                        {new Date(
                                            markers[
                                                selectedMarker
                                            ].observed_date
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                                {markers[selectedMarker].imageUrl && (
                                    <img
                                        src={markers[selectedMarker].imageUrl}
                                        alt={markers[selectedMarker].title}
                                        style={{
                                            maxWidth: 200,
                                            display: "block",
                                            marginTop: 8,
                                            borderRadius: "4px",
                                        }}
                                    />
                                )}
                                <div style={{ marginTop: 12 }}>
                                    <button
                                        onClick={() =>
                                            deleteMarker(
                                                markers[selectedMarker].id,
                                                markers[selectedMarker]
                                                    .image_path
                                            )
                                        }
                                        style={{
                                            backgroundColor: "#f44336",
                                            color: "white",
                                            padding: "8px 16px",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </Map>

                {newMarker && (
                    <div
                        style={{
                            position: "absolute",
                            top: "0px",
                            left: "0px",
                            backgroundColor: "white",
                            padding: "10px",
                            zIndex: 1000,
                            border: "1px solid black",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            maxWidth: "450px",
                            width: "100vw",
                            color: "black",
                        }}
                    >
                        <select
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            required
                            style={{
                                backgroundColor: "white",
                                color: "black",
                                padding: "8px",
                                border: "1px solid #000000ff",
                                borderRadius: "4px",
                            }}
                        >
                            <option value="">
                                Select an invasive species:
                            </option>
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
                            <option value="Little Fire Ant">
                                Little Fire Ant
                            </option>
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
                            style={{
                                backgroundColor: "white",
                                color: "black",
                                padding: "8px",
                                border: "1px solid #000000ff",
                                borderRadius: "4px",
                            }}
                        />
                        <label style={{ display: "block" }}>
                            Observed date:
                            <input
                                type="date"
                                value={formData.observed_date ?? ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        observed_date: e.target.value,
                                    })
                                }
                                style={{
                                    backgroundColor: "white",
                                    color: "black",
                                    padding: "8px",
                                    border: "1px solid #000000ff",
                                    borderRadius: "4px",
                                    marginTop: 4,
                                }}
                            />
                        </label>

                        <input
                            type="file"
                            accept="image/*"
                            style={{
                                color: "black",
                            }}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        imageData: reader.result as string,
                                        imageName: file.name,
                                    }));
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                        <button
                            onClick={addMarker}
                            style={{
                                backgroundColor: "#4caf4fc2",
                                color: "black",
                                padding: "10px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Add Marker
                        </button>
                        <button
                            onClick={() => setNewMarker(null)}
                            style={{
                                backgroundColor: "#fa5f54e1",
                                color: "black",
                                padding: "10px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </APIProvider>
        </div>
    );
}
