import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Google Drive API client
 */
function getDriveClient() {
  try {
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
    
    if (!credentialsPath) {
      console.warn('⚠️ GOOGLE_DRIVE_CREDENTIALS_PATH not set in .env');
      return null;
    }

    // Resolve relative path from backend directory
    const fullPath = path.resolve(__dirname, '..', credentialsPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Google Drive credentials file not found: ${fullPath}`);
      return null;
    }

    // Read credentials
    const credentials = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    // Return drive client
    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive client:', error.message);
    return null;
  }
}

/**
 * Upload CSV file to Google Drive
 * @param {string} csvContent - The CSV content as a string
 * @param {string} filename - Name of the file to create in Google Drive
 * @param {string} folderId - Google Drive folder ID (optional)
 * @returns {Promise<{success: boolean, fileId?: string, webViewLink?: string, error?: string}>}
 */
export async function uploadCSVToDrive(csvContent, filename, folderId = null) {
  try {
    const drive = getDriveClient();
    
    if (!drive) {
      return {
        success: false,
        error: 'Google Drive client not initialized (check credentials)',
      };
    }

    const actualFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!actualFolderId) {
      return {
        success: false,
        error: 'GOOGLE_DRIVE_FOLDER_ID not set in .env',
      };
    }

    // Create file metadata
    const fileMetadata = {
      name: filename,
      parents: [actualFolderId],
    };

    // Create media (file content)
    const media = {
      mimeType: 'text/csv',
      body: csvContent,
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,  // Required for Shared Drives
      supportsTeamDrives: true, // Legacy support
    });

    console.log(`✅ CSV uploaded to Google Drive: ${filename}`);
    console.log(`   File ID: ${response.data.id}`);
    console.log(`   View: ${response.data.webViewLink || 'N/A'}`);

    return {
      success: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('❌ Failed to upload CSV to Google Drive:', error.message);
    
    // Provide helpful error messages
    if (error.code === 404) {
      return {
        success: false,
        error: 'Folder not found. Make sure GOOGLE_DRIVE_FOLDER_ID is correct and the service account has access.',
      };
    } else if (error.code === 403) {
      return {
        success: false,
        error: 'Permission denied. Make sure you shared the Drive folder with the service account email.',
      };
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Upload a file (from path) to Google Drive
 * @param {string} filePath - Path to the file on disk
 * @param {string} filename - Name of the file to create in Google Drive
 * @param {string} mimeType - MIME type of the file
 * @param {string} folderId - Google Drive folder ID (optional)
 * @returns {Promise<{success: boolean, fileId?: string, webViewLink?: string, error?: string}>}
 */
export async function uploadFileToDrive(filePath, filename, mimeType, folderId = null) {
  try {
    const drive = getDriveClient();
    
    if (!drive) {
      return {
        success: false,
        error: 'Google Drive client not initialized (check credentials)',
      };
    }

    const actualFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!actualFolderId) {
      return {
        success: false,
        error: 'GOOGLE_DRIVE_FOLDER_ID not set in .env',
      };
    }

    // Create file metadata
    const fileMetadata = {
      name: filename,
      parents: [actualFolderId],
    };

    // Create media (file content)
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,  // Required for Shared Drives
      supportsTeamDrives: true, // Legacy support
    });

    console.log(`✅ File uploaded to Google Drive: ${filename}`);
    console.log(`   File ID: ${response.data.id}`);
    console.log(`   View: ${response.data.webViewLink || 'N/A'}`);

    return {
      success: true,
      fileId: response.data.id,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('❌ Failed to upload file to Google Drive:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if Google Drive is configured
 * @returns {boolean}
 */
export function isGoogleDriveConfigured() {
  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const attendanceFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_ATTENDANCE;
  const worklogFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID_WORKLOG;
  
  if (!credentialsPath) {
    return false;
  }

  // At least one folder ID should be configured
  if (!folderId && !attendanceFolderId && !worklogFolderId) {
    return false;
  }

  const fullPath = path.resolve(__dirname, '..', credentialsPath);
  return fs.existsSync(fullPath);
}
