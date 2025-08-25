import { net } from 'electron';
import settingsStore from './settings';
import itemsDatabase from './items';

export interface WebSyncData {
  gameMode: string;
  grailType: string;
  includeRunes: boolean;
  includeRunewords: boolean;
  items: Record<string, any>;
  ethItems: Record<string, any>;
  runes: Record<string, any>;
  runewords: Record<string, any>;
  stats: {
    total: number;
    found: number;
    percentage: number;
  };
  detailedStats: {
    armor: { owned: number; exists: number; percent: number };
    weapons: { owned: number; exists: number; percent: number };
    other: { owned: number; exists: number; percent: number };
    sets: { owned: number; exists: number; percent: number };
    ethArmor: { owned: number; exists: number; percent: number };
    ethWeapons: { owned: number; exists: number; percent: number };
    ethOther: { owned: number; exists: number; percent: number };
    runes: { owned: number; exists: number; percent: number };
    runewords: { owned: number; exists: number; percent: number };
  };
}

export class WebSyncManager {
  private syncInProgress = false;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5000; // 5 seconds between syncs

  async syncProgress(): Promise<boolean> {
    const settings = settingsStore.getSettings();
    
    if (!settings.webSyncEnabled || !settings.webSyncApiKey || !settings.webSyncUrl) {
      console.log('Web sync disabled or not configured');
      return false;
    }

    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return false;
    }

    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      console.log('Sync cooldown active');
      return false;
    }

    try {
      this.syncInProgress = true;
      this.lastSyncTime = now;

      const syncData = this.prepareData();
      const result = await this.sendData(syncData);
      
      if (result.success) {
        console.log('✅ Progress synced to web tracker');
      } else {
        console.error(`❌ Failed to sync progress: ${result.message}`);
      }
      
      return result.success;
    } catch (error) {
      console.error('Web sync error:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const settings = settingsStore.getSettings();
    
    if (!settings.webSyncApiKey || !settings.webSyncUrl) {
      return {
        success: false,
        message: 'API key and URL must be configured'
      };
    }

    if (!settings.webSyncApiKey.startsWith('hg_')) {
      return {
        success: false,
        message: 'Invalid API key format (should start with hg_)'
      };
    }

    try {
      const url = `${settings.webSyncUrl.replace(/\/$/, '')}/api/auth/test`;
      
      const response = await this.makeRequest(url, 'GET');
      
      if (response.status === 200) {
        return {
          success: true,
          message: `Connected successfully as ${response.data?.user?.username || 'user'}`,
          details: response.data
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Invalid API key - please check your key is correct'
        };
      } else {
        return {
          success: false,
          message: `Connection failed (HTTP ${response.status})`
        };
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private prepareData(): WebSyncData {
    const settings = settingsStore.getSettings();
    const currentData = itemsDatabase.getItems();
    
    // Import the correct stats calculation function
    const { getHolyGrailSeedData } = require('./holyGrailSeedData');
    const { computeStats } = require('../../src/utils/objects');
    
    // Get the proper grail data templates
    const holyGrailSeedData = getHolyGrailSeedData(settings, false);
    const ethGrailSeedData = getHolyGrailSeedData(settings, true);
    
    // Calculate the actual stats using the same logic as the desktop app
    const holyGrailStats = computeStats(
      currentData.items || {},
      currentData.ethItems || {},
      holyGrailSeedData,
      ethGrailSeedData,
      settings
    );

    // Extract runewords from items (they have type: "runeword")
    const availableRunewords: Record<string, any> = {};
    Object.entries(currentData.items || {}).forEach(([itemId, item]) => {
      if (itemId.startsWith('runeword') || (item as any).type === 'runeword') {
        availableRunewords[itemId] = item;
      }
    });

    // Calculate the grand total based on settings (same logic as Stats component)
    const grandOwned = holyGrailStats.normal.total.owned + holyGrailStats.ethereal.total.owned
      + (settings.grailRunes ? holyGrailStats.runes.owned : 0)
      + (settings.grailRunewords ? holyGrailStats.runewords.owned : 0);
    const grandExists = holyGrailStats.normal.total.exists + holyGrailStats.ethereal.total.exists
      + (settings.grailRunes ? holyGrailStats.runes.exists : 0)
      + (settings.grailRunewords ? holyGrailStats.runewords.exists : 0);
    const grandPercent = grandExists > 0 ? (grandOwned / grandExists) * 100 : 0;

    return {
      gameMode: settings.gameMode.toString(),
      grailType: settings.grailType.toString(),
      includeRunes: settings.grailRunes,
      includeRunewords: settings.grailRunewords,
      items: currentData.items || {},
      ethItems: currentData.ethItems || {},
      runes: currentData.availableRunes || {},
      runewords: availableRunewords,
      stats: {
        total: grandExists,
        found: grandOwned,
        percentage: Math.min(grandPercent, 100)
      },
      detailedStats: {
        armor: holyGrailStats.normal.armor,
        weapons: holyGrailStats.normal.weapon,
        other: holyGrailStats.normal.other,
        sets: holyGrailStats.normal.sets,
        ethArmor: holyGrailStats.ethereal.armor,
        ethWeapons: holyGrailStats.ethereal.weapon,
        ethOther: holyGrailStats.ethereal.other,
        runes: holyGrailStats.runes,
        runewords: holyGrailStats.runewords,
      }
    };
  }

  private async sendData(data: WebSyncData): Promise<{ success: boolean; message?: string }> {
    const settings = settingsStore.getSettings();
    const url = `${settings.webSyncUrl.replace(/\/$/, '')}/api/progress/sync`;
    
    try {
      const response = await this.makeRequest(url, 'POST', data);
      
      if (response.status === 200) {
        return { success: true };
      } else if (response.status === 401) {
        return { 
          success: false, 
          message: 'Invalid API key - please check your authentication' 
        };
      } else {
        return { 
          success: false, 
          message: `Sync failed (HTTP ${response.status}): ${response.data?.error || 'Unknown error'}` 
        };
      }
    } catch (error) {
      console.error('Send data error:', error);
      return { 
        success: false, 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async makeRequest(url: string, method: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const settings = settingsStore.getSettings();
      
      const request = net.request({
        method,
        url,
      });

      // Set headers
      request.setHeader('Content-Type', 'application/json');
      request.setHeader('Authorization', `Bearer ${settings.webSyncApiKey}`);
      request.setHeader('User-Agent', 'HolyGrail-Desktop/1.0.0');

      let responseData = '';

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk;
        });

        response.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              status: response.statusCode,
              data: parsedData
            });
          } catch (error) {
            resolve({
              status: response.statusCode,
              data: responseData
            });
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      if (data) {
        request.write(JSON.stringify(data));
      }

      request.end();
    });
  }
}

// Singleton instance
export const webSyncManager = new WebSyncManager();