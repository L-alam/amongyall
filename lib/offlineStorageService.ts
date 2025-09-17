// lib/offlineStorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from './themeService';
import { WavelengthPair } from './wavelengthService';

const STORAGE_KEYS = {
  BASIC_THEMES: '@amongyall_basic_themes',
  BASIC_PAIRS: '@amongyall_basic_pairs',
  CUSTOM_THEMES: '@amongyall_custom_themes',
  CUSTOM_PAIRS: '@amongyall_custom_pairs',
  DOWNLOAD_STATUS: '@amongyall_download_status',
};

export interface OfflineTheme extends Theme {
  words: string[];
  downloadDate: string;
}

export interface OfflinePair extends WavelengthPair {
  downloadDate: string;
}

export interface DownloadStatus {
  basicThemesDownloaded: boolean;
  basicPairsDownloaded: boolean;
  downloadDate?: string;
}

class OfflineStorageService {
  async saveBasicThemes(themes: OfflineTheme[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BASIC_THEMES, JSON.stringify(themes));
      await this.updateDownloadStatus({ basicThemesDownloaded: true });
      console.log(`Saved ${themes.length} basic themes to offline storage`);
    } catch (error) {
      console.error('Error saving basic themes:', error);
      throw error;
    }
  }

  async saveBasicPairs(pairs: OfflinePair[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BASIC_PAIRS, JSON.stringify(pairs));
      await this.updateDownloadStatus({ basicPairsDownloaded: true });
      console.log(`Saved ${pairs.length} basic pairs to offline storage`);
    } catch (error) {
      console.error('Error saving basic pairs:', error);
      throw error;
    }
  }

  async saveCustomThemes(themes: OfflineTheme[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_THEMES, JSON.stringify(themes));
      console.log(`Saved ${themes.length} custom themes to offline storage`);
    } catch (error) {
      console.error('Error saving custom themes:', error);
      throw error;
    }
  }

  async saveCustomPairs(pairs: OfflinePair[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_PAIRS, JSON.stringify(pairs));
      console.log(`Saved ${pairs.length} custom pairs to offline storage`);
    } catch (error) {
      console.error('Error saving custom pairs:', error);
      throw error;
    }
  }

  async getBasicThemes(): Promise<OfflineTheme[]> {
    try {
      const themesJson = await AsyncStorage.getItem(STORAGE_KEYS.BASIC_THEMES);
      return themesJson ? JSON.parse(themesJson) : [];
    } catch (error) {
      console.error('Error getting basic themes:', error);
      return [];
    }
  }

  async getBasicPairs(): Promise<OfflinePair[]> {
    try {
      const pairsJson = await AsyncStorage.getItem(STORAGE_KEYS.BASIC_PAIRS);
      return pairsJson ? JSON.parse(pairsJson) : [];
    } catch (error) {
      console.error('Error getting basic pairs:', error);
      return [];
    }
  }

  async getCustomThemes(): Promise<OfflineTheme[]> {
    try {
      const themesJson = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_THEMES);
      return themesJson ? JSON.parse(themesJson) : [];
    } catch (error) {
      console.error('Error getting custom themes:', error);
      return [];
    }
  }

  async getCustomPairs(): Promise<OfflinePair[]> {
    try {
      const pairsJson = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_PAIRS);
      return pairsJson ? JSON.parse(pairsJson) : [];
    } catch (error) {
      console.error('Error getting custom pairs:', error);
      return [];
    }
  }

  async updateDownloadStatus(status: Partial<DownloadStatus>): Promise<void> {
    try {
      const currentStatus = await this.getDownloadStatus();
      const updatedStatus = {
        ...currentStatus,
        ...status,
        downloadDate: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOAD_STATUS, JSON.stringify(updatedStatus));
    } catch (error) {
      console.error('Error updating download status:', error);
    }
  }

  async getDownloadStatus(): Promise<DownloadStatus> {
    try {
      const statusJson = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_STATUS);
      return statusJson ? JSON.parse(statusJson) : {
        basicThemesDownloaded: false,
        basicPairsDownloaded: false,
      };
    } catch (error) {
      console.error('Error getting download status:', error);
      return {
        basicThemesDownloaded: false,
        basicPairsDownloaded: false,
      };
    }
  }

  async clearAllOfflineData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.BASIC_THEMES),
        AsyncStorage.removeItem(STORAGE_KEYS.BASIC_PAIRS),
        AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_THEMES),
        AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_PAIRS),
        AsyncStorage.removeItem(STORAGE_KEYS.DOWNLOAD_STATUS),
      ]);
      console.log('Cleared all offline data');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  async getStorageSize(): Promise<string> {
    try {
      const [themes, pairs, customThemes, customPairs] = await Promise.all([
        this.getBasicThemes(),
        this.getBasicPairs(),
        this.getCustomThemes(),
        this.getCustomPairs(),
      ]);

      const totalItems = themes.length + pairs.length + customThemes.length + customPairs.length;
      const estimatedKB = totalItems * 0.5;
      
      if (estimatedKB < 1024) {
        return `${estimatedKB.toFixed(1)} KB`;
      } else {
        return `${(estimatedKB / 1024).toFixed(1)} MB`;
      }
    } catch (error) {
      return '0 KB';
    }
  }
}

export const offlineStorageService = new OfflineStorageService();