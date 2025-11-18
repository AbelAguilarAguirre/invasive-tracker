# Invasive Tracker

A community-driven web app for mapping sightings of invasive pests. Users can add, view, and comment on map markers to help track and manage invasive species in local areas.

## Features
- Interactive map with clustered markers
- Add new sighting markers with species, date, photos, and notes
- Edit or remove markers (based on permissions)
- Search and filter by species, date range, and location
- Location privacy options (blur or offset coordinates)
- Basic moderation workflow for reviewing user submissions
- Export sightings as GeoJSON or CSV

## Quick start

Requirements
- Node.js (14+)
- A modern browser
- Optional: API key for map provider (Mapbox, Google Maps, or OpenStreetMap tile server)

Running locally
1. Clone the repo and install dependencies:
    - git clone <repo-url>
    - npm install
2. Create a .env file with required keys (map provider, DB connection, etc.)
3. Start the app:
    - npm run dev
4. Open http://localhost:3000

Production
- Build and serve (example):
  - npm run build
  - npm start
- Recommended hosting: static CDN for frontend + managed backend (serverless functions or small Node service) and a managed database.

## Usage
- Click the map to add a sighting
- Provide species name, approximate date, optional photos, and notes.
- Use filters to focus on particular species or time windows.
- Moderators can approve, flag, or remove entries.

## Data model (high level)
- Sighting: { id, species, dateObserved, coordinates, accuracy, photos[], notes, reporterId, status, createdAt }
- User: { id, name, email, role }
- Comment: { id, sightingId, userId, text, createdAt }

## Privacy & ethics
- Do not share precise locations for threatened or sensitive species when disclosure may cause harm.
- Provide options to obscure exact coordinates and to opt out of public listing.
- Store minimal personal data and follow local data-protection regulations.

## Contributing
- Open to bug reports, feature requests, and code contributions.
- Submit issues and PRs with clear descriptions and tests where applicable.
- Follow the existing code style and include concise commit messages.

## Testing & CI
- Run unit and integration tests:
  - npm test
- Configure linting and CI to run tests on PRs.

## License
- Specify project license (e.g., MIT). Update LICENSE file accordingly.

## Contact
- Provide project maintainer contact or links to issue tracker and discussion forum.
