import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllQuestionSets } from './questionService';
import { getAllThemes, getWordsByThemeId } from './themeService';
import { getAllWavelengthPairs } from './wavelengthService';

export interface DownloadableContent {
  themes: any[];
  questions: any[];
  pairs: any[];
  metadata: {
    downloadDate: string;
    version: string;
    totalSize: string;
  };
}

class DownloadService {
  private async createDownloadableFile(content: any, filename: string): Promise<string> {
    const fileUri = FileSystem.documentDirectory + filename;
    const jsonContent = JSON.stringify(content, null, 2);
    
    await FileSystem.writeAsStringAsync(fileUri, jsonContent);
    return fileUri;
  }

  async downloadBasicThemes(): Promise<void> {
    try {
      // Get all basic themes
      const themes = await getAllThemes();
      
      // Get words for each theme
      const themesWithWords = await Promise.all(
        themes.map(async (theme) => {
          const words = await getWordsByThemeId(theme.id);
          return {
            ...theme,
            words
          };
        })
      );

      const downloadContent = {
        type: 'basic_themes',
        data: themesWithWords,
        metadata: {
          downloadDate: new Date().toISOString(),
          count: themesWithWords.length,
          version: '1.0'
        }
      };

      const fileUri = await this.createDownloadableFile(
        downloadContent, 
        `amongyall-basic-themes-${Date.now()}.json`
      );

      // Share the file so user can save it
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Basic Themes'
      });

    } catch (error) {
      console.error('Error downloading basic themes:', error);
      throw error;
    }
  }

  async downloadBasicPairs(): Promise<void> {
    try {
      // You'll need to implement getAllPairs() in your pairsService
      const pairs = await getAllWavelengthPairs();

      const downloadContent = {
        type: 'basic_pairs',
        data: pairs,
        metadata: {
          downloadDate: new Date().toISOString(),
          count: pairs.length,
          version: '1.0'
        }
      };

      const fileUri = await this.createDownloadableFile(
        downloadContent, 
        `amongyall-basic-pairs-${Date.now()}.json`
      );

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Basic Pairs'
      });

    } catch (error) {
      console.error('Error downloading basic pairs:', error);
      throw error;
    }
  }

  async downloadCustomItems(selectedItems: string[]): Promise<void> {
    try {
      const downloadContent = {
        type: 'custom_content',
        data: {
          themes: [],
          questions: [],
          pairs: []
        },
        metadata: {
          downloadDate: new Date().toISOString(),
          selectedItemCount: selectedItems.length,
          version: '1.0'
        }
      };

      // Fetch selected items based on their IDs
      // You'll need to determine the type of each item and fetch accordingly
      for (const itemId of selectedItems) {
        // This is where you'd fetch each item by ID and add to appropriate array
        // Example: 
        // const item = await getItemById(itemId);
        // if (item.type === 'theme') downloadContent.data.themes.push(item);
        // etc.
      }

      const fileUri = await this.createDownloadableFile(
        downloadContent, 
        `amongyall-custom-content-${Date.now()}.json`
      );

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Custom Content'
      });

    } catch (error) {
      console.error('Error downloading custom items:', error);
      throw error;
    }
  }

  async downloadAllContent(): Promise<void> {
    try {
      const [themes, questions, pairs] = await Promise.all([
        getAllThemes(),
        getAllQuestionSets(), // You'll need to implement this
        getAllWavelengthPairs() // You'll need to implement this
      ]);

      const downloadContent: DownloadableContent = {
        themes,
        questions,
        pairs,
        metadata: {
          downloadDate: new Date().toISOString(),
          version: '1.0',
          totalSize: this.calculateSize(themes, questions, pairs)
        }
      };

      const fileUri = await this.createDownloadableFile(
        downloadContent, 
        `amongyall-complete-backup-${Date.now()}.json`
      );

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Complete Content Backup'
      });

    } catch (error) {
      console.error('Error downloading all content:', error);
      throw error;
    }
  }

  private calculateSize(themes: any[], questions: any[], pairs: any[]): string {
    const totalItems = themes.length + questions.length + pairs.length;
    const estimatedKB = totalItems * 0.5; // Rough estimate
    
    if (estimatedKB < 1024) {
      return `${estimatedKB.toFixed(1)} KB`;
    } else {
      return `${(estimatedKB / 1024).toFixed(1)} MB`;
    }
  }
}

export const downloadService = new DownloadService();