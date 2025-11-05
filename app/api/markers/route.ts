import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "markers.json");

export async function GET() {
    try {
        const data = fs.existsSync(FILE_PATH)
            ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
            : [];

        // Ensure every marker has an id for future operations
        let changed = false;
        const normalized = (data as any[]).map((m) => {
            if (!m.id) {
                m.id = `${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;
                changed = true;
            }
            return m;
        });
        if (changed) {
            fs.writeFileSync(FILE_PATH, JSON.stringify(normalized, null, 2));
        }
        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to read markers" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const newMarker = await req.json();

        // Assign a unique id
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        newMarker.id = id;

        // If image data (data URL) is provided, save it to public/uploads
        if (newMarker.imageData) {
            try {
                const match = /^data:(image\/[^;]+);base64,(.+)$/.exec(
                    newMarker.imageData
                );
                if (match) {
                    const mime = match[1];
                    const base64 = match[2];
                    const ext =
                        mime.split("/")[1] === "jpeg"
                            ? "jpg"
                            : mime.split("/")[1];
                    const uploadsDir = path.join(
                        process.cwd(),
                        "public",
                        "uploads"
                    );
                    if (!fs.existsSync(uploadsDir))
                        fs.mkdirSync(uploadsDir, { recursive: true });
                    const filename = `${id}.${ext}`;
                    const filePath = path.join(uploadsDir, filename);
                    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
                    // store a web-accessible path
                    newMarker.imageUrl = `/uploads/${filename}`;
                }
            } catch (e) {
                console.error("Failed to save image:", e);
            }
            // remove large imageData before saving to JSON
            delete newMarker.imageData;
        }

        const data = fs.existsSync(FILE_PATH)
            ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
            : [];
        data.push(newMarker);
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
        return NextResponse.json(newMarker, { status: 201 });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to save marker" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        const id = body?.id;
        if (!id)
            return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const data = fs.existsSync(FILE_PATH)
            ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
            : [];

        const idx = (data as any[]).findIndex((m) => m.id === id);
        if (idx === -1)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        const [removed] = data.splice(idx, 1);

        // remove associated image file if exists
        if (removed && removed.imageUrl) {
            const rel = removed.imageUrl.replace(/^\/+/, "");
            const filePath = path.join(process.cwd(), "public", rel);
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) {
                console.error("Failed to delete image file", e);
            }
        }

        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: "Failed to delete marker" },
            { status: 500 }
        );
    }
}
