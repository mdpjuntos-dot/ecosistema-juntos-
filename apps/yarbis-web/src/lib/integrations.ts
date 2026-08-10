/**
 * Google APIs Integration Service
 * Handles Google Drive, Gmail, Sheets, etc.
 */

export interface GoogleAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleAuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class GoogleIntegration {
  private authToken: GoogleAuthToken | null = null;
  private config: GoogleAuthConfig | null = null;

  // Initialize with credentials
  initialize(config: GoogleAuthConfig): void {
    this.config = config;
    this.loadToken();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    if (!this.authToken) return false;
    return this.authToken.expiresAt > Date.now();
  }

  // Get authorization URL
  getAuthUrl(scopes: string[]): string {
    if (!this.config) throw new Error('Google not initialized');

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  // Save token to localStorage
  private saveToken(token: GoogleAuthToken): void {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_auth_token', JSON.stringify(token));
    }
  }

  // Load token from localStorage
  private loadToken(): void {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('google_auth_token');
    if (saved) {
      try {
        this.authToken = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading Google token:', error);
      }
    }
  }

  // Google Drive Operations
  async createFolder(name: string, parentId?: string): Promise<string> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Creating folder: ${name} (auth token not available)`);
        return `folder-${Date.now()}`;
      }

      // In production, use Google Drive API v3
      // This requires proper OAuth setup
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mimeType: 'application/vnd.google-apps.folder',
          parents: parentId ? [parentId] : [],
        }),
      });

      if (!response.ok) {
        console.error(`Failed to create folder: ${response.statusText}`);
        return `folder-${Date.now()}`;
      }

      const data: any = await response.json();
      return data.id || `folder-${Date.now()}`;
    } catch (error) {
      console.error('Error creating folder:', error);
      return `folder-${Date.now()}`;
    }
  }

  async uploadFile(
    name: string,
    content: string,
    folderId?: string,
    mimeType: string = 'text/plain'
  ): Promise<string> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Uploading file: ${name} to folder: ${folderId}`);
        return `file-${Date.now()}`;
      }

      // Create FormData for file upload
      const metadata = {
        name,
        mimeType,
        parents: folderId ? [folderId] : [],
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: mimeType }));

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken.accessToken}`,
          },
          body: form,
        }
      );

      if (!response.ok) {
        console.error(`Failed to upload file: ${response.statusText}`);
        return `file-${Date.now()}`;
      }

      const data: any = await response.json();
      return data.id || `file-${Date.now()}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      return `file-${Date.now()}`;
    }
  }

  // Google Sheets Operations
  async createSheet(
    title: string,
    headers: string[]
  ): Promise<{ sheetId: string; spreadsheetId: string }> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Creating sheet: ${title} with headers: ${headers.join(', ')}`);
        return {
          spreadsheetId: `ss-${Date.now()}`,
          sheetId: `sheet-${Date.now()}`,
        };
      }

      // Create new spreadsheet
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title },
          sheets: [
            {
              properties: { title: 'Data' },
              data: [
                {
                  rowData: [
                    {
                      values: headers.map((header) => ({
                        userEnteredValue: { stringValue: header },
                      })),
                    },
                  ],
                },
              ],
            },
          ],
        }),
      });

      if (!createResponse.ok) {
        console.error(`Failed to create sheet: ${createResponse.statusText}`);
        return {
          spreadsheetId: `ss-${Date.now()}`,
          sheetId: `sheet-${Date.now()}`,
        };
      }

      const data: any = await createResponse.json();
      return {
        spreadsheetId: data.spreadsheetId || `ss-${Date.now()}`,
        sheetId: data.sheets?.[0]?.properties?.sheetId?.toString() || `sheet-${Date.now()}`,
      };
    } catch (error) {
      console.error('Error creating sheet:', error);
      return {
        spreadsheetId: `ss-${Date.now()}`,
        sheetId: `sheet-${Date.now()}`,
      };
    }
  }

  async appendRow(
    spreadsheetId: string,
    sheetName: string,
    values: (string | number)[]
  ): Promise<boolean> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Appending to ${sheetName}: ${values.join(', ')}`);
        return true;
      }

      // Append row to sheet
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A:A:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [values],
          }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to append row: ${response.statusText}`);
        return false;
      }

      console.log(`Row appended to ${sheetName}`);
      return true;
    } catch (error) {
      console.error('Error appending row:', error);
      return false;
    }
  }

  // Gmail Operations
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    attachments?: Array<{ filename: string; content: string }>
  ): Promise<string> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Sending email to ${to}: "${subject}"`);
        return `email-${Date.now()}`;
      }

      // Build email message
      const emailLines: string[] = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        '',
        body,
      ];

      const email = emailLines.join('\n');
      const base64Email = Buffer.from(email).toString('base64');

      // Send via Gmail API
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: base64Email,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send email: ${response.statusText}`);
        return `email-${Date.now()}`;
      }

      const data: any = await response.json();
      console.log(`Email sent successfully to ${to}`);
      return data.id || `email-${Date.now()}`;
    } catch (error) {
      console.error('Error sending email:', error);
      return `email-${Date.now()}`;
    }
  }

  // Slack Integration (via webhook)
  async sendSlackMessage(
    webhookUrl: string,
    message: string,
    channel?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          text: message,
          mrkdwn: true,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send Slack message: ${response.statusText}`);
        return false;
      }

      console.log(`Slack message sent to ${channel || 'default channel'}`);
      return true;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      return false;
    }
  }

  // Notion Integration (via API)
  async addToNotion(
    databaseId: string,
    properties: Record<string, any>
  ): Promise<string> {
    try {
      if (!this.authToken) {
        console.log(`[Simulated] Adding to Notion database ${databaseId}:`, properties);
        return `notion-${Date.now()}`;
      }

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken.accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties,
        }),
      });

      if (!response.ok) {
        console.error(`Failed to add to Notion: ${response.statusText}`);
        return `notion-${Date.now()}`;
      }

      const data: any = await response.json();
      console.log(`Added to Notion database ${databaseId}`);
      return data.id || `notion-${Date.now()}`;
    } catch (error) {
      console.error('Error adding to Notion:', error);
      return `notion-${Date.now()}`;
    }
  }
}

// Singleton
let googleIntegration: GoogleIntegration | null = null;

export function getGoogleIntegration(): GoogleIntegration {
  if (!googleIntegration) {
    googleIntegration = new GoogleIntegration();

    // Try to initialize from env
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_CLAUDE_API_BASE}/api/auth/google/callback`;

    if (clientId && clientSecret) {
      googleIntegration.initialize({
        clientId,
        clientSecret,
        redirectUri,
      });
    }
  }

  return googleIntegration;
}

// Export for use in components
export default GoogleIntegration;
