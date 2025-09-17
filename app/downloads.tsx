import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import the actual services from your project
import { getBuiltInThemes, getUserCustomThemes, getWordsByThemeId } from '../lib/themeService';
import { getBuiltInPairs, getUserCustomPairs } from '../lib/wavelengthService';

// Mock data for basic themes from your project
const BASIC_THEMES = [
  'States', 'Civilizations', 'Transportation', 'School', 'Food', 
  'Drinks', 'Rooms', 'Sports', 'The Arts', 'Zoo', 'Geography', 
  'Hobbies', 'World Wonders', 'Phobias', 'Mythical Creatures', 
  'Jobs', 'US Presidents', 'Games', 'Inventions', 'Film Genres'
];

interface CustomItem {
  id: string;
  name: string;
  type: 'theme' | 'pairs';
  size: string;
  created_at: string;
  downloaded: boolean;
}

const DownloadsScreen: React.FC = () => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [basicThemesDownloaded, setBasicThemesDownloaded] = useState(false);
  const [basicPairsDownloaded, setBasicPairsDownloaded] = useState(false);
  const [customThemes, setCustomThemes] = useState<CustomItem[]>([]);
  const [customPairs, setCustomPairs] = useState<CustomItem[]>([]);
  const [themesDropdownOpen, setThemesDropdownOpen] = useState(false);
  const [pairsDropdownOpen, setPairsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomItems();
  }, []);

  const loadCustomItems = async () => {
    try {
      setLoading(true);
      
      // Load actual custom themes and pairs from your services
      const [customThemesData, customPairsData] = await Promise.all([
        getUserCustomThemes(),
        getUserCustomPairs()
      ]);

      // Transform themes to CustomItem format
      const transformedThemes: CustomItem[] = customThemesData.map(theme => ({
        id: theme.id,
        name: theme.name,
        type: 'theme' as const,
        size: '2.3 KB', // You could calculate actual size later
        created_at: theme.created_at || new Date().toISOString(),
        downloaded: false
      }));

      // Transform pairs to CustomItem format
      const transformedPairs: CustomItem[] = customPairsData.map(pair => ({
        id: pair.id,
        name: `${pair.term_0} ↔ ${pair.term_1}`,
        type: 'pairs' as const,
        size: '1.2 KB',
        created_at: pair.created_at || new Date().toISOString(),
        downloaded: false
      }));

      setCustomThemes(transformedThemes);
      setCustomPairs(transformedPairs);
    } catch (error) {
      console.error('Error loading custom items:', error);
      Alert.alert('Error', 'Failed to load custom content');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const handleDownloadBasicThemes = async () => {
    if (basicThemesDownloaded) return;
    
    setIsDownloading(true);
    try {
      // Get actual built-in themes from your service
      const builtInThemes = await getBuiltInThemes();
      
      // Get words for each theme
      const themesWithWords = await Promise.all(
        builtInThemes.map(async (theme) => {
          const words = await getWordsByThemeId(theme.id);
          return {
            id: theme.id,
            name: theme.name,
            words: words,
            is_premium: theme.is_premium,
            is_custom: theme.is_custom,
            created_at: theme.created_at
          };
        })
      );

      // Create downloadable content
      const downloadContent = {
        type: 'basic_themes',
        data: themesWithWords,
        metadata: {
          downloadDate: new Date().toISOString(),
          count: themesWithWords.length,
          version: '1.0',
          app: 'AmongYall',
          description: 'Built-in themes with all words'
        }
      };

      // For testing in Expo Go - just show an alert with the data
      console.log('Download content:', JSON.stringify(downloadContent, null, 2));
      
      // Try to save and share file
      try {
        const filename = `amongyall-basic-themes-${Date.now()}.json`;
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

        // Share file
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save Basic Themes'
        });

        setBasicThemesDownloaded(true);
        Alert.alert(
          'Download Complete!',
          `Successfully downloaded ${themesWithWords.length} basic themes with all their words!\n\nCheck the console for the JSON data.`
        );
      } catch (fileError) {
        // Fallback for testing - just show the data
        Alert.alert(
          'Data Retrieved Successfully!',
          `Found ${themesWithWords.length} themes. File sharing not available in Expo Go, but check console for JSON data.`
        );
        setBasicThemesDownloaded(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download basic themes. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBasicPairs = async () => {
    if (basicPairsDownloaded) return;
    
    setIsDownloading(true);
    try {
      // Get actual built-in pairs from your service
      const builtInPairs = await getBuiltInPairs();

      const downloadContent = {
        type: 'basic_pairs',
        data: builtInPairs.map(pair => ({
          id: pair.id,
          name: `${pair.term_0} ↔ ${pair.term_1}`,
          term_0: pair.term_0,
          term_1: pair.term_1,
          is_premium: pair.is_premium,
          is_custom: pair.is_custom,
          created_at: pair.created_at
        })),
        metadata: {
          downloadDate: new Date().toISOString(),
          count: builtInPairs.length,
          version: '1.0',
          app: 'AmongYall',
          description: 'Built-in word pairs for Wavelength game'
        }
      };

      const filename = `amongyall-basic-pairs-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Basic Pairs'
      });

      setBasicPairsDownloaded(true);
      Alert.alert(
        'Download Complete!',
        `Successfully downloaded ${builtInPairs.length} basic pair sets!`
      );
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download basic pairs. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCustomItem = async (item: CustomItem) => {
    if (item.downloaded) return;

    setIsDownloading(true);
    try {
      let itemData: any = {};
      
      if (item.type === 'theme') {
        // For themes, get the actual theme data with words
        const customThemesData = await getUserCustomThemes();
        const themeData = customThemesData.find(t => t.id === item.id);
        
        if (themeData) {
          const words = await getWordsByThemeId(themeData.id);
          itemData = {
            ...themeData,
            words: words
          };
        }
      } else {
        // For pairs, get the actual pair data
        const customPairsData = await getUserCustomPairs();
        const pairData = customPairsData.find(p => p.id === item.id);
        if (pairData) {
          itemData = pairData;
        }
      }

      const downloadContent = {
        type: `custom_${item.type}`,
        data: [itemData],
        metadata: {
          downloadDate: new Date().toISOString(),
          itemId: item.id,
          itemName: item.name,
          version: '1.0',
          app: 'AmongYall'
        }
      };

      const filename = `amongyall-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Save ${item.name}`
      });

      // Mark as downloaded
      if (item.type === 'theme') {
        setCustomThemes(prev => prev.map(theme => 
          theme.id === item.id ? { ...theme, downloaded: true } : theme
        ));
      } else {
        setCustomPairs(prev => prev.map(pair => 
          pair.id === item.id ? { ...pair, downloaded: true } : pair
        ));
      }

      Alert.alert('Download Complete!', `Successfully downloaded ${item.name}!`);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', `Unable to download ${item.name}. Please try again.`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllCustomThemes = async () => {
    const undownloadedThemes = customThemes.filter(theme => !theme.downloaded);
    if (undownloadedThemes.length === 0) return;

    setIsDownloading(true);
    try {
      // Get actual custom themes data with words
      const customThemesData = await getUserCustomThemes();
      const themesWithWords = await Promise.all(
        customThemesData
          .filter(theme => undownloadedThemes.some(ut => ut.id === theme.id))
          .map(async (theme) => {
            const words = await getWordsByThemeId(theme.id);
            return {
              ...theme,
              words: words
            };
          })
      );

      const downloadContent = {
        type: 'custom_themes_bulk',
        data: themesWithWords,
        metadata: {
          downloadDate: new Date().toISOString(),
          count: themesWithWords.length,
          version: '1.0',
          app: 'AmongYall',
          description: 'All custom themes with words'
        }
      };

      const filename = `amongyall-all-custom-themes-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save All Custom Themes'
      });

      // Mark all as downloaded
      setCustomThemes(prev => prev.map(theme => ({ ...theme, downloaded: true })));

      Alert.alert('Download Complete!', `Successfully downloaded ${themesWithWords.length} custom themes!`);
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download custom themes. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAllCustomPairs = async () => {
    const undownloadedPairs = customPairs.filter(pair => !pair.downloaded);
    if (undownloadedPairs.length === 0) return;

    setIsDownloading(true);
    try {
      // Get actual custom pairs data
      const customPairsData = await getUserCustomPairs();
      const filteredPairs = customPairsData.filter(pair => 
        undownloadedPairs.some(up => up.id === pair.id)
      );

      const downloadContent = {
        type: 'custom_pairs_bulk',
        data: filteredPairs,
        metadata: {
          downloadDate: new Date().toISOString(),
          count: filteredPairs.length,
          version: '1.0',
          app: 'AmongYall',
          description: 'All custom word pairs'
        }
      };

      const filename = `amongyall-all-custom-pairs-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save All Custom Pairs'
      });

      // Mark all as downloaded
      setCustomPairs(prev => prev.map(pair => ({ ...pair, downloaded: true })));

      Alert.alert('Download Complete!', `Successfully downloaded ${filteredPairs.length} custom pairs!`);
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download custom pairs. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Downloads</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading content...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#374151" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Downloads</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Pro Status Banner */}
        <View style={styles.proStatusBanner}>
          <View style={styles.proIconContainer}>
            <Ionicons name="diamond" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.proStatusTextContainer}>
            <Text style={styles.proStatusTitle}>AmongYall Pro Active</Text>
            <Text style={styles.proStatusSubtitle}>Download all content offline!</Text>
          </View>
        </View>

        {/* Basic Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Content</Text>
          
          {/* Download All Basic Themes */}
          <TouchableOpacity 
            style={[styles.basicDownloadButton, basicThemesDownloaded && styles.downloadedButton]} 
            onPress={handleDownloadBasicThemes}
            disabled={isDownloading || basicThemesDownloaded}
          >
            <View style={styles.downloadButtonContent}>
              <Text style={[styles.downloadButtonText, basicThemesDownloaded && styles.downloadedText]}>
                Download All Basic Themes ({BASIC_THEMES.length})
              </Text>
              <View style={styles.downloadButtonIcon}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : basicThemesDownloaded ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="download" size={24} color="#6366F1" />
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Download All Basic Pairs */}
          <TouchableOpacity 
            style={[styles.basicDownloadButton, basicPairsDownloaded && styles.downloadedButton]} 
            onPress={handleDownloadBasicPairs}
            disabled={isDownloading || basicPairsDownloaded}
          >
            <View style={styles.downloadButtonContent}>
              <Text style={[styles.downloadButtonText, basicPairsDownloaded && styles.downloadedText]}>
                Download All Basic Pairs
              </Text>
              <View style={styles.downloadButtonIcon}>
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#6366F1" />
                ) : basicPairsDownloaded ? (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="download" size={24} color="#6366F1" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom Content Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Content</Text>

          {/* Custom Themes Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownHeader}
              onPress={() => setThemesDropdownOpen(!themesDropdownOpen)}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons name="color-palette" size={20} color="#6366F1" />
                <Text style={styles.dropdownTitle}>Custom Themes ({customThemes.length})</Text>
              </View>
              <View style={styles.dropdownHeaderRight}>
                {customThemes.length > 0 && (
                  <TouchableOpacity 
                    style={styles.downloadAllButton}
                    onPress={handleDownloadAllCustomThemes}
                    disabled={isDownloading || customThemes.every(theme => theme.downloaded)}
                  >
                    <Text style={styles.downloadAllText}>Download All</Text>
                  </TouchableOpacity>
                )}
                <Ionicons 
                  name={themesDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6B7280" 
                />
              </View>
            </TouchableOpacity>

            {themesDropdownOpen && (
              <View style={styles.dropdownContent}>
                {customThemes.length > 0 ? (
                  customThemes.map((theme) => (
                    <TouchableOpacity
                      key={theme.id}
                      style={styles.dropdownItem}
                      onPress={() => handleDownloadCustomItem(theme)}
                      disabled={isDownloading || theme.downloaded}
                    >
                      <Text style={[styles.itemName, theme.downloaded && styles.downloadedItemText]}>
                        {theme.name}
                      </Text>
                      <View style={styles.itemAction}>
                        {isDownloading ? (
                          <ActivityIndicator size="small" color="#6366F1" />
                        ) : theme.downloaded ? (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        ) : (
                          <Ionicons name="download" size={20} color="#6366F1" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDropdown}>
                    <Text style={styles.emptyText}>No custom themes created yet</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Custom Pairs Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownHeader}
              onPress={() => setPairsDropdownOpen(!pairsDropdownOpen)}
            >
              <View style={styles.dropdownHeaderLeft}>
                <Ionicons name="link" size={20} color="#6366F1" />
                <Text style={styles.dropdownTitle}>Custom Pairs ({customPairs.length})</Text>
              </View>
              <View style={styles.dropdownHeaderRight}>
                {customPairs.length > 0 && (
                  <TouchableOpacity 
                    style={styles.downloadAllButton}
                    onPress={handleDownloadAllCustomPairs}
                    disabled={isDownloading || customPairs.every(pair => pair.downloaded)}
                  >
                    <Text style={styles.downloadAllText}>Download All</Text>
                  </TouchableOpacity>
                )}
                <Ionicons 
                  name={pairsDropdownOpen ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6B7280" 
                />
              </View>
            </TouchableOpacity>

            {pairsDropdownOpen && (
              <View style={styles.dropdownContent}>
                {customPairs.length > 0 ? (
                  customPairs.map((pair) => (
                    <TouchableOpacity
                      key={pair.id}
                      style={styles.dropdownItem}
                      onPress={() => handleDownloadCustomItem(pair)}
                      disabled={isDownloading || pair.downloaded}
                    >
                      <Text style={[styles.itemName, pair.downloaded && styles.downloadedItemText]}>
                        {pair.name}
                      </Text>
                      <View style={styles.itemAction}>
                        {isDownloading ? (
                          <ActivityIndicator size="small" color="#6366F1" />
                        ) : pair.downloaded ? (
                          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        ) : (
                          <Ionicons name="download" size={20} color="#6366F1" />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyDropdown}>
                    <Text style={styles.emptyText}>No custom pairs created yet</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

      </ScrollView>

        {/* Back Button */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGoBack}
          >
            <Ionicons name="home" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  proStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  proIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  proStatusTextContainer: {
    flex: 1,
  },
  proStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  proStatusSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  basicDownloadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  downloadedButton: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  downloadButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  downloadedText: {
    color: '#059669',
  },
  downloadButtonIcon: {
    marginLeft: 12,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  downloadAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  downloadAllText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#374151',
    flex: 1,
  },
  downloadedItemText: {
    color: '#059669',
  },
  itemAction: {
    marginLeft: 12,
  },
  emptyDropdown: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 16,

  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DownloadsScreen;