import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// You'll need to import these from your existing files
// import { colors, layout, layoutStyles } from '../path/to/your/styles';

const DownloadsScreen: React.FC = () => {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  // Placeholder data - replace with real data later
  const downloadedItems = [
    { id: '1', name: 'Custom Food Theme', type: 'theme', downloadDate: '2025-09-15' },
    { id: '2', name: 'Sports Questions Pack', type: 'questions', downloadDate: '2025-09-14' },
    { id: '3', name: 'Movie Chameleon Words', type: 'words', downloadDate: '2025-09-13' },
  ];

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'theme':
        return 'color-palette';
      case 'questions':
        return 'help-circle';
      case 'words':
        return 'text';
      default:
        return 'download';
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
        <Text style={styles.headerTitle}>My Downloads</Text>
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
            <Text style={styles.proStatusSubtitle}>Enjoy unlimited downloads!</Text>
          </View>
        </View>

        {/* Downloads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloaded Items</Text>
          
          {downloadedItems.length > 0 ? (
            <View style={styles.itemsList}>
              {downloadedItems.map((item) => (
                <View key={item.id} style={styles.downloadItem}>
                  <View style={styles.itemIconContainer}>
                    <Ionicons 
                      name={getItemIcon(item.type)} 
                      size={24} 
                      color="#6366F1" 
                    />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDate}>Downloaded on {item.downloadDate}</Text>
                  </View>
                  <TouchableOpacity style={styles.itemActionButton}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-download-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No Downloads Yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Downloaded themes, questions, and word packs will appear here
              </Text>
            </View>
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
            onPress={handleGoHome}
          >
            <Ionicons name="home" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Games</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="refresh" size={20} color="#6366F1" />
            <Text style={styles.secondaryButtonText}>Sync Downloads</Text>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  itemsList: {
    gap: 12,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemActionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6366F1',
  },
});

export default DownloadsScreen;