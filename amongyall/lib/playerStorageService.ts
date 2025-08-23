import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYERS_STORAGE_KEY = 'savedPlayers';

export interface SavedPlayer {
  name: string;
  createdAt: string;
  lastUsed: string;
}

class PlayerStorageService {
  
  // Load saved players from AsyncStorage
  async getSavedPlayers(): Promise<string[]> {
    try {
      const savedData = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
      if (savedData) {
        const players: SavedPlayer[] = JSON.parse(savedData);
        // Sort by most recently used
        players.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
        return players.map(p => p.name);
      }
      return []; // Return empty array instead of preset names
    } catch (error) {
      console.error('Error loading saved players:', error);
      return [];
    }
  }

  // Save players after a game session
  async savePlayers(playerNames: string[]): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
      let savedPlayers: SavedPlayer[] = existingData ? JSON.parse(existingData) : [];
      
      const now = new Date().toISOString();
      
      // Update existing players or create new ones
      const updatedPlayers = [...savedPlayers];
      
      playerNames.forEach(playerName => {
        const existingIndex = updatedPlayers.findIndex(p => 
          p.name.toUpperCase() === playerName.toUpperCase()
        );
        
        if (existingIndex >= 0) {
          // Update existing player's last used time
          updatedPlayers[existingIndex].lastUsed = now;
        } else {
          // Add new player
          updatedPlayers.push({
            name: playerName.toUpperCase(),
            createdAt: now,
            lastUsed: now
          });
        }
      });
      
      await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(updatedPlayers));
    } catch (error) {
      console.error('Error saving players:', error);
    }
  }

  // Remove a specific player
  async removePlayer(playerName: string): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(PLAYERS_STORAGE_KEY);
      if (existingData) {
        let savedPlayers: SavedPlayer[] = JSON.parse(existingData);
        savedPlayers = savedPlayers.filter(p => 
          p.name.toUpperCase() !== playerName.toUpperCase()
        );
        await AsyncStorage.setItem(PLAYERS_STORAGE_KEY, JSON.stringify(savedPlayers));
      }
    } catch (error) {
      console.error('Error removing player:', error);
    }
  }

  // Clear all saved players (for testing or reset purposes)
  async clearAllPlayers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PLAYERS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing players:', error);
    }
  }

  // Get recently used players (limit to most recent N players)
  async getRecentPlayers(limit: number = 8): Promise<string[]> {
    const allPlayers = await this.getSavedPlayers();
    return allPlayers.slice(0, limit);
  }
}

export const playerStorageService = new PlayerStorageService();