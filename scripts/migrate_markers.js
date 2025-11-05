/*
  Migration script: reads markers.json, uploads any local images in public/uploads,
  and inserts rows into Supabase `markers` table.

  Usage (set env vars first):
    setx NEXT_PUBLIC_SUPABASE_URL "https://..."    (Windows) or export on *nix
    setx NEXT_PUBLIC_SUPABASE_ANON_KEY "your_anon_key"
    node scripts/migrate_markers.js

  Or create a .env.local and run with `node -r dotenv/config scripts/migrate_markers.js`
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const markersPath = path.join(process.cwd(), 'markers.json');
if (!fs.existsSync(markersPath)) {
    console.error('markers.json not found in project root');
    process.exit(1);
}

async function run() {
    const raw = JSON.parse(fs.readFileSync(markersPath, 'utf8'));
    for (const m of raw) {
        try {
            let image_path = null;
            if (m.imageUrl) {
                // expected local path like /uploads/<filename>
                const filename = path.basename(m.imageUrl);
                const localPath = path.join(process.cwd(), 'public', 'uploads', filename);
                if (fs.existsSync(localPath)) {
                    console.log('Uploading', filename);
                    const fileStream = fs.createReadStream(localPath);
                    const { error: upErr } = await supabase.storage.from('uploads').upload(filename, fileStream, { upsert: true });
                    if (upErr) {
                        console.error('Upload error for', filename, upErr.message || upErr);
                    } else {
                        image_path = filename;
                    }
                } else {
                    console.warn('Local image not found:', localPath);
                }
            }

            const insertObj = {
                lat: m.lat,
                lng: m.lng,
                title: m.title || null,
                description: m.description || null,
                image_path,
            };

            const { data, error } = await supabase.from('markers').insert([insertObj]).select().single();
            if (error) {
                console.error('Insert error for marker', m, error.message || error);
            } else {
                console.log('Inserted marker id=', data.id);
            }
        } catch (e) {
            console.error('Error migrating marker', m, e.message || e);
        }
    }
    console.log('Migration complete');
}

run();
