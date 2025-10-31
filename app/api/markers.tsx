import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
const FILE_PATH = "markers.json";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
        const data = fs.existsSync(FILE_PATH)
            ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
            : [];
        res.status(200).json(data);
    } else if (req.method === "POST") {
        const newMarker = req.body;
        const data = fs.existsSync(FILE_PATH)
            ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
            : [];
        data.push(newMarker);
        fs.writeFileSync(FILE_PATH, JSON.stringify(data));
        res.status(201).json(newMarker);
    } else {
        res.status(405).end();
    }
}
