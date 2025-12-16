import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { googleSheetsService } from './services/googleSheetsService.js';

const app = express();
const PORT = 3001;

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || 'YOUR_SPREADSHEET_ID';
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Sheets on startup
let sheetsInitialized = false;

async function initializeSheets() {
  try {
    await googleSheetsService.initialize(SPREADSHEET_ID, SHEET_NAME);
    sheetsInitialized = true;
    console.log(`📊 Connected to Google Sheet: ${SPREADSHEET_ID}`);
  } catch (error) {
    console.error('⚠️ Failed to initialize Google Sheets:', error.message);
    console.log('📝 Make sure to:');
    console.log('   1. Place your credentials.json in backend/private/');
    console.log('   2. Set GOOGLE_SPREADSHEET_ID environment variable');
    console.log('   3. Share the spreadsheet with the service account email');
  }
}

// Middleware to check if sheets is initialized
function requireSheets(req, res, next) {
  if (!sheetsInitialized) {
    return res.status(503).json({
      error: 'Google Sheets not initialized',
      message: 'Please check server configuration'
    });
  }
  next();
}

// GET all songs
app.get('/api/songs', requireSheets, async (req, res) => {
  try {
    const songs = await googleSheetsService.getAllSongs();
    res.json(songs);
  } catch (error) {
    console.error('Error getting songs:', error);
    res.status(500).json({ error: 'Failed to read songs from Google Sheets' });
  }
});

// GET single song by ID
app.get('/api/songs/:id', requireSheets, async (req, res) => {
  try {
    const song = await googleSheetsService.getSongById(req.params.id);

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(song);
  } catch (error) {
    console.error('Error getting song:', error);
    res.status(500).json({ error: 'Failed to read song from Google Sheets' });
  }
});

// POST create new song
app.post('/api/songs', requireSheets, async (req, res) => {
  try {
    const newSong = {
      ...req.body,
      songId: req.body.songId || crypto.randomUUID(),
      uuid: req.body.uuid || crypto.randomUUID()
    };

    await googleSheetsService.addSong(newSong);
    res.status(201).json(newSong);
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ error: 'Failed to create song in Google Sheets' });
  }
});

// PUT update existing song
app.put('/api/songs/:id', requireSheets, async (req, res) => {
  try {
    const updatedSong = await googleSheetsService.updateSong(req.params.id, req.body);

    if (!updatedSong) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json(updatedSong);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: 'Failed to update song in Google Sheets' });
  }
});

// DELETE song
app.delete('/api/songs/:id', requireSheets, async (req, res) => {
  try {
    const deleted = await googleSheetsService.deleteSong(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song from Google Sheets' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'GuessSong API is running',
    sheetsConnected: sheetsInitialized
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🎵 GuessSong Backend API running on http://localhost:${PORT}`);
  await initializeSheets();
});
