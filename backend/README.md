# GuessSong Backend API

Node.js/Express backend API for managing songs in the GuessSong Backoffice application.

## Features

- RESTful API for CRUD operations on songs
- Automatic JSON file persistence
- CORS enabled for frontend integration
- Health check endpoint

## Prerequisites

- Node.js 20.x or higher
- npm

## Installation

```bash
cd backend
npm install
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on **http://localhost:3001**

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status

### Get All Songs
```
GET /api/songs
```
Returns array of all songs

### Get Single Song
```
GET /api/songs/:id
```
Returns a single song by ID

### Create New Song
```
POST /api/songs
Content-Type: application/json

{
  "songTitle": "Artist - Song Name",
  "releaseDate": "2024",
  "views": "1M",
  "difficulty": 2,
  "media": {
    "youtubeId": "youtube_id",
    "spotifyId": "spotify_id"
  }
}
```

### Update Song
```
PUT /api/songs/:id
Content-Type: application/json

{
  "songTitle": "Updated Title",
  "releaseDate": "2024",
  "views": "2M",
  "difficulty": 3,
  "media": {
    "youtubeId": "new_youtube_id",
    "spotifyId": "new_spotify_id"
  }
}
```

### Delete Song
```
DELETE /api/songs/:id
```

## Data Storage

Songs are stored in `songs.json` file in the backend directory. All changes are automatically persisted to this file.

## CORS

CORS is enabled for all origins. In production, update the CORS configuration in `server.js` to allow only your frontend domain.

## Port Configuration

Default port: **3001**

To change the port, edit the `PORT` constant in `server.js`

## Troubleshooting

### Port already in use
If port 3001 is in use, either:
1. Stop the process using port 3001
2. Change the PORT in server.js to another port (e.g., 3002)

### Cannot connect from frontend
1. Make sure the backend server is running
2. Check that the frontend's `songsAPI.js` has the correct API_BASE_URL
3. Verify CORS is enabled
