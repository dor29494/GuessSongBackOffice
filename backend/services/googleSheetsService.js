import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to service account credentials
const CREDENTIALS_PATH = path.join(__dirname, '..', 'private', 'credentials.json');

// Column mapping based on your sheet structure
const COLUMN_MAP = {
  releaseDate: 0,      // A
  songTitle: 1,        // B
  songId: 2,           // C
  views: 3,            // D
  difficulty: 4,       // E
  youtubeId: 5,        // F - media__youtubeId
  spotifyId: 6,        // G - media__spotifyId
  spotifyUrl: 7,       // H - spotify_url
  youtubeUrl: 8,       // I - youtube_url
  startCut: 9,         // J
  stopCut: 10,         // K
  uuid: 11,            // L
  insideOf120: 12,     // M
  top30: 13,           // N
  tag: 14              // O - תגית
};

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = null;
    this.sheetName = 'Sheet1'; // Default sheet name, can be configured
  }

  async initialize(spreadsheetId, sheetName = 'Sheet1') {
    try {
      console.log('🔧 Initializing Google Sheets service...');
      console.log('   Spreadsheet ID:', spreadsheetId);
      console.log('   Sheet Name:', sheetName);
      console.log('   Credentials Path:', CREDENTIALS_PATH);

      const auth = new google.auth.GoogleAuth({
        keyFile: CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const authClient = await auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      this.spreadsheetId = spreadsheetId;
      this.sheetName = sheetName;

      // List available sheets to help debug
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      console.log('📑 Available sheets in this spreadsheet:');
      spreadsheet.data.sheets.forEach((sheet, i) => {
        console.log(`   ${i + 1}. "${sheet.properties.title}"`);
      });

      console.log('✅ Google Sheets service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Sheets:', error.message);
      throw error;
    }
  }

  // Convert row array to song object
  rowToSong(row, rowIndex) {
    return {
      releaseDate: row[COLUMN_MAP.releaseDate] || '',
      songTitle: row[COLUMN_MAP.songTitle] || '',
      songId: row[COLUMN_MAP.songId] || '',
      views: row[COLUMN_MAP.views] || '',
      difficulty: row[COLUMN_MAP.difficulty] || '',
      media: {
        youtubeId: row[COLUMN_MAP.youtubeId] || '',
        spotifyId: row[COLUMN_MAP.spotifyId] || ''
      },
      spotifyUrl: row[COLUMN_MAP.spotifyUrl] || '',
      youtubeUrl: row[COLUMN_MAP.youtubeUrl] || '',
      startCut: row[COLUMN_MAP.startCut] || '',
      stopCut: row[COLUMN_MAP.stopCut] || '',
      uuid: row[COLUMN_MAP.uuid] || '',
      insideOf120: row[COLUMN_MAP.insideOf120] || '',
      top30: row[COLUMN_MAP.top30] || '',
      tag: row[COLUMN_MAP.tag] || '',
      _rowIndex: rowIndex + 2 // +2 because: 1-indexed and skip header row
    };
  }

  // Convert song object to row array
  songToRow(song) {
    return [
      song.releaseDate || '',
      song.songTitle || '',
      song.songId || '',
      song.views || '',
      song.difficulty || '',
      song.media?.youtubeId || song.youtubeId || '',
      song.media?.spotifyId || song.spotifyId || '',
      song.spotifyUrl || '',
      song.youtubeUrl || '',
      song.startCut || '',
      song.stopCut || '',
      song.uuid || '',
      song.insideOf120 || '',
      song.top30 || '',
      song.tag || ''
    ];
  }

  // Get all songs from the sheet
  async getAllSongs() {
    try {
      const range = `${this.sheetName}!A2:O`;
      console.log('📋 getAllSongs() - Fetching songs...');
      console.log('   Range:', range);

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });

      const rows = response.data.values || [];
      console.log(`   ✅ Retrieved ${rows.length} rows`);
      return rows.map((row, index) => this.rowToSong(row, index));
    } catch (error) {
      console.error('❌ Error reading songs from Google Sheets:', error.message);
      throw error;
    }
  }

  // Get a single song by songId
  async getSongById(songId) {
    const songs = await this.getAllSongs();
    return songs.find(song => song.songId === songId);
  }

  // Add a new song (append to the sheet)
  async addSong(songData) {
    try {
      const row = this.songToRow(songData);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:O`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row]
        }
      });

      return songData;
    } catch (error) {
      console.error('Error adding song to Google Sheets:', error.message);
      throw error;
    }
  }

  // Update an existing song by songId
  async updateSong(songId, songData) {
    try {
      const songs = await this.getAllSongs();
      const existingSong = songs.find(s => s.songId === songId);

      if (!existingSong) {
        return null;
      }

      const row = this.songToRow({ ...existingSong, ...songData, songId });
      const rowIndex = existingSong._rowIndex;

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A${rowIndex}:O${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row]
        }
      });

      return { ...existingSong, ...songData, songId };
    } catch (error) {
      console.error('Error updating song in Google Sheets:', error.message);
      throw error;
    }
  }

  // Delete a song by songId (clear the row)
  async deleteSong(songId) {
    try {
      const songs = await this.getAllSongs();
      const song = songs.find(s => s.songId === songId);

      if (!song) {
        return false;
      }

      // Get sheet ID for delete request
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheet = spreadsheet.data.sheets.find(
        s => s.properties.title === this.sheetName
      );

      if (!sheet) {
        throw new Error(`Sheet "${this.sheetName}" not found`);
      }

      // Delete the row
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: song._rowIndex - 1, // 0-indexed
                endIndex: song._rowIndex
              }
            }
          }]
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting song from Google Sheets:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
