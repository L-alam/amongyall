import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
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

// Mock data for basic themes from your project
const BASIC_THEMES = [
  'States', 'Civilizations', 'Transportation', 'School', 'Food', 
  'Drinks', 'Rooms', 'Sports', 'The Arts', 'Zoo', 'Geography', 
  'Hobbies', 'World Wonders', 'Phobias', 'Mythical Creatures', 
  'Jobs', 'US Presidents', 'Games', 'Inventions', 'Film Genres'
];

const BASIC_PAIRS = [
  'Common Pairs', 'Rhyming Words', 'Opposites', 'Synonyms', 'Related Items'
];

interface CustomItem {
  id: string;
  name: string;
  type: 'theme' | 'questions' | 'pairs';
  size: string;
  created_at: string;
}

const DownloadsScreen: React.FC = () => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedCustomItems, setSelectedCustomItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);

  useEffect(() => {
    loadCustomItems();
  }, []);

  const loadCustomItems = async () => {
    try {
      // Mock custom items - replace with actual API calls to your Supabase
      const mockCustomItems: CustomItem[] = [
        { id: '1', name: 'Custom Food Theme', type: 'theme', size: '2.3 KB', created_at: '2025-09-15' },
        { id: '2', name: 'Sports Questions Pack', type: 'questions', size: '15.2 KB', created_at: '2025-09-14' },
        { id: '3', name: 'Movie Word Pairs', type: 'pairs', size: '5.1 KB', created_at: '2025-09-13' },
        { id: '4', name: 'Geography Custom Theme', type: 'theme', size: '3.7 KB', created_at: '2025-09-12' },
        { id: '5', name: 'Trivia Questions Set', type: 'questions', size: '22.5 KB', created_at: '2025-09-11' },
        { id: '6', name: 'Animal Pairs', type: 'pairs', size: '4.8 KB', created_at: '2025-09-10' },
      ];
      setCustomItems(mockCustomItems);
    } catch (error) {
      console.error('Error loading custom items:', error);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  const handleDownloadBasicThemes = async () => {
    setIsDownloading(true);
    try {
      // Create downloadable content
      const downloadContent = {
        type: 'basic_themes',
        data: BASIC_THEMES.map((theme, index) => ({
          id: `theme_${index}`,
          name: theme,
          words: [`word1_${theme}`, `word2_${theme}`, `word3_${theme}`], // Mock words
          is_premium: false,
          is_custom: false,
        })),
        metadata: {
          downloadDate: new Date().toISOString(),
          count: BASIC_THEMES.length,
          version: '1.0',
          app: 'AmongYall'
        }
      };

      // Save to file
      const filename = `amongyall-basic-themes-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Basic Themes'
      });

      Alert.alert(
        'Download Complete!',
        `Successfully downloaded ${BASIC_THEMES.length} basic themes. File saved and ready to share!`
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download basic themes. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBasicPairs = async () => {
    setIsDownloading(true);
    try {
      const downloadContent = {
        type: 'basic_pairs',
        data: BASIC_PAIRS.map((pairSet, index) => ({
          id: `pairs_${index}`,
          name: pairSet,
          pairs: [
            [`pair1_${pairSet}`, `match1_${pairSet}`],
            [`pair2_${pairSet}`, `match2_${pairSet}`],
            [`pair3_${pairSet}`, `match3_${pairSet}`]
          ], // Mock pairs
          is_premium: false,
          is_custom: false,
        })),
        metadata: {
          downloadDate: new Date().toISOString(),
          count: BASIC_PAIRS.length,
          version: '1.0',
          app: 'AmongYall'
        }
      };

      const filename = `amongyall-basic-pairs-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Basic Pairs'
      });

      Alert.alert(
        'Download Complete!',
        `Successfully downloaded ${BASIC_PAIRS.length} basic pair sets!`
      );
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download basic pairs. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCustomItems = async () => {
    if (selectedCustomItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select custom items to download.');
      return;
    }

    setIsDownloading(true);
    try {
      const selectedItems = customItems.filter(item => selectedCustomItems.includes(item.id));
      
      const downloadContent = {
        type: 'custom_content',
        data: {
          themes: selectedItems.filter(item => item.type === 'theme'),
          questions: selectedItems.filter(item => item.type === 'questions'),
          pairs: selectedItems.filter(item => item.type === 'pairs')
        },
        metadata: {
          downloadDate: new Date().toISOString(),
          selectedItemCount: selectedCustomItems.length,
          version: '1.0',
          app: 'AmongYall'
        }
      };

      const filename = `amongyall-custom-content-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(downloadContent, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Custom Content'
      });

      Alert.alert(
        'Download Complete!',
        `Successfully downloaded ${selectedCustomItems.length} custom items!`
      );
      setSelectedCustomItems([]);
    } catch (error) {
      Alert.alert('Download Failed', 'Unable to download custom items. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleCustomItemSelection = (itemId: string) => {
    setSelectedCustomItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllCustomItems = () => {
    setSelectedCustomItems(customItems.map(item => item.id));
  };

  const deselectAllCustomItems = () => {
    setSelectedCustomItems([]);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'theme':
        return 'color-palette';
      case 'questions':
        return 'help-circle';
      case 'pairs':
        return 'link';
      default:
        return 'document';
    }
  };

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
          <Text style={styles.sectionDescription}>
            Download our built-in themes and pairs for offline play
          </Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]} 
              onPress={handleDownloadBasicThemes}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.downloadButtonText}>
                Download All Basic Themes ({BASIC_THEMES.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]} 
              onPress={handleDownloadBasicPairs}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.downloadButtonText}>
                Download All Basic Pairs ({BASIC_PAIRS.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Content Section */}
        <View style={styles.section}>
          <View style={styles.customHeader}>
            <Text style={styles.sectionTitle}>Custom Content</Text>
            <View style={styles.selectionActions}>
              <TouchableOpacity 
                style={styles.selectionButton} 
                onPress={selectAllCustomItems}
              >
                <Text style={styles.selectionButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.selectionButton} 
                onPress={deselectAllCustomItems}
              >
                <Text style={styles.selectionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.sectionDescription}>
            Select your custom themes, questions, and pairs to download
          </Text>

          {customItems.length > 0 ? (
            <View style={styles.customItemsList}>
              {customItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.customItem,
                    selectedCustomItems.includes(item.id) && styles.customItemSelected
                  ]}
                  onPress={() => toggleCustomItemSelection(item.id)}
                >
                  <View style={styles.itemInfo}>
                    <View style={styles.itemIconContainer}>
                      <Ionicons 
                        name={getItemIcon(item.type)} 
                        size={24} 
                        color="#6366F1" 
                      />
                    </View>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.size}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    selectedCustomItems.includes(item.id) && styles.checkboxSelected
                  ]}>
                    {selectedCustomItems.includes(item.id) && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="create-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Custom Content</Text>
              <Text style={styles.emptyStateSubtitle}>
                Create custom themes, questions, or pairs to see them here
              </Text>
            </View>
          )}

          {customItems.length > 0 && (
            <TouchableOpacity 
              style={[
                styles.downloadCustomButton,
                (selectedCustomItems.length === 0 || isDownloading) && styles.downloadButtonDisabled
              ]} 
              onPress={handleDownloadCustomItems}
              disabled={selectedCustomItems.length === 0 || isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.downloadButtonText}>
                Download Selected Items ({selectedCustomItems.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Storage Info */}
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Ionicons name="folder" size={20} color="#6366F1" />
              <Text style={styles.storageTitle}>Local Storage</Text>
            </View>
            <Text style={styles.storageUsage}>2.4 MB used • Unlimited available</Text>
            <View style={styles.storageBar}>
              <View style={styles.storageBarFill} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGoBack}
          >
            <Ionicons name="home" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    marginLeft: -32,
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  buttonRow: {
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  customItemsList: {
    gap: 8,
    marginBottom: 16,
  },
  customItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  customItemSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  downloadCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  storageSection: {
    marginBottom: 32,
  },
  storageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  storageUsage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  storageBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    width: '15%',
    backgroundColor: '#6366F1',
  },
  actionsSection: {
    gap: 12,
    marginBottom: 32,
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