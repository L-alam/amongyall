import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors, layout, spacing, typography } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import {
  WavelengthPair,
  WordPairs,
  checkAnonymousPairLimit,
  createCustomPair,
  deleteCustomPair,
  getAllWavelengthPairs,
  getCustomPairs,
  getRandomPair
} from '../../lib/wavelengthService';
import {
  layoutStyles
} from '../../utils/styles';

const { width: screenWidth } = Dimensions.get('window');

export default function WavelengthPairs() {
  const { isAuthenticated, signInWithGoogle } = useAuth();
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]') as string[];
  const firstPlayer = params.firstPlayer as string || '';
  
  const existingScores = JSON.parse(params.playerScores as string || '[]');
  const existingHistory = JSON.parse(params.playerHistory as string || '[]');
  
  const [allPairs, setAllPairs] = useState<WavelengthPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<WavelengthPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPairTerm0, setNewPairTerm0] = useState('');
  const [newPairTerm1, setNewPairTerm1] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [customPairs, setCustomPairs] = useState<WavelengthPair[]>([]);
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);

  useEffect(() => {
    loadPairs();
  }, []);

  const loadPairs = async () => {
    try {
      setLoading(true);
      
      const [allPairsData, customPairsData] = await Promise.all([
        getAllWavelengthPairs(),
        getCustomPairs()
      ]);
      
      setAllPairs(allPairsData);
      setCustomPairs(customPairsData);
      
    } catch (error) {
      console.error('Error loading pairs:', error);
      Alert.alert(
        'Error', 
        'Failed to load word pairs. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    router.push('/');
  };

  const handleRandomPair = async () => {
    try {
      const randomPair = await getRandomPair();
      if (!randomPair) {
        Alert.alert('Error', 'No pairs available for random selection.');
        return;
      }

      console.log('Random pair selected:', randomPair); // Debug log

      // Navigate directly to game start with random pair
      router.push({
        pathname: '/wavelength/wavelength-gamestart',
        params: {
          players: JSON.stringify(players),
          firstPlayer,
          selectedPair: JSON.stringify(randomPair), // randomPair is already WordPairs format
          playerScores: JSON.stringify(existingScores),
          playerHistory: JSON.stringify(existingHistory),
        }
      });
    } catch (error) {
      console.error('Error getting random pair:', error);
      Alert.alert('Error', 'Failed to get random pair. Please try again.');
    }
  };

  const handleSelectPair = () => {
    if (!selectedPair) {
      Alert.alert('No Pair Selected', 'Please select a word pair to continue.');
      return;
    }

    const wordPairs: WordPairs = {
      positive: selectedPair.term_0,
      negative: selectedPair.term_1
    };

    router.push({
      pathname: '/wavelength/wavelength-gamestart',
      params: {
        players: JSON.stringify(players),
        firstPlayer,
        selectedPair: JSON.stringify(wordPairs),
        playerScores: JSON.stringify(existingScores),
        playerHistory: JSON.stringify(existingHistory),
      }
    });
  };

  const handleCreateCustomPair = async () => {
    if (!newPairTerm0.trim() || !newPairTerm1.trim()) {
      Alert.alert('Invalid Input', 'Please enter both terms for the pair.');
      return;
    }

    if (newPairTerm0.trim().toLowerCase() === newPairTerm1.trim().toLowerCase()) {
      Alert.alert('Invalid Input', 'The two terms cannot be the same.');
      return;
    }

    if (!isAuthenticated) {
      try {
        const canCreate = await checkAnonymousPairLimit();
        if (!canCreate) {
          Alert.alert(
            'Limit Reached',
            'You can create up to 5 custom pairs without an account. Sign in to create unlimited pairs.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign In', onPress: signInWithGoogle }
            ]
          );
          return;
        }
      } catch (error) {
        console.error('Error checking anonymous limit:', error);
        Alert.alert('Error', 'Failed to create pair. Please try again.');
        return;
      }
    }

    try {
      setCreating(true);
      
      const newPair = await createCustomPair(
        newPairTerm0.trim(),
        newPairTerm1.trim()
      );
      
      await loadPairs();
      setSelectedPair(newPair);
      
      setNewPairTerm0('');
      setNewPairTerm1('');
      setShowCreateForm(false);
      
      Alert.alert('Success', 'Custom pair created successfully!');
      
    } catch (error) {
      console.error('Error creating custom pair:', error);
      if (error instanceof Error && error.message.includes('duplicate')) {
        Alert.alert('Duplicate Pair', 'This pair already exists. Please choose different terms.');
      } else {
        Alert.alert('Error', 'Failed to create custom pair. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCustomPair = async (pair: WavelengthPair) => {
    Alert.alert(
      'Delete Pair',
      `Are you sure you want to delete "${pair.term_0}" ↔ "${pair.term_1}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomPair(pair.id);
              await loadPairs();
              if (selectedPair?.id === pair.id) {
                setSelectedPair(null);
              }
            } catch (error) {
              console.error('Error deleting custom pair:', error);
              Alert.alert('Error', 'Failed to delete pair. Please try again.');
            }
          }
        }
      ]
    );
  };

  const filteredPairs = allPairs.filter(pair => {
    if (!searchQuery.trim()) return true;
    
    return pair.term_0.toLowerCase().includes(searchQuery.toLowerCase()) ||
           pair.term_1.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const PairItem = ({ pair }: { pair: WavelengthPair }) => {
    const isSelected = selectedPair?.id === pair.id;
    const isCustom = pair.is_custom;

    return (
      <TouchableOpacity
        style={[
          styles.pairItem,
          isSelected && styles.pairItemSelected
        ]}
        onPress={() => setSelectedPair(pair)}
        activeOpacity={0.7}
      >
        <View style={styles.pairContent}>
          <View style={styles.pairTermsContainer}>
            <Text style={[
              styles.pairTerm,
              isSelected && styles.pairTermSelected
            ]}>
              {pair.term_0}
            </Text>
            <Ionicons 
              name="swap-horizontal" 
              size={16} 
              color={isSelected ? colors.secondary : colors.gray400} 
            />
            <Text style={[
              styles.pairTerm,
              isSelected && styles.pairTermSelected
            ]}>
              {pair.term_1}
            </Text>
          </View>
          
          <View style={styles.pairActions}>
            {isCustom && (
              <>
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCustomPair(pair)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="trash-outline" 
                    size={layout.iconSize.sm} 
                    color={colors.error} 
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[layoutStyles.container, layoutStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading word pairs...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Fixed Slim Player Banner */}
      <View style={styles.playerBanner}>
        <Text style={styles.playerBannerText}>
          Player: <Text style={styles.playerName}>{firstPlayer}</Text>
        </Text>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Pairs Dropdown */}
        <View style={styles.customDropdownContainer}>
          <TouchableOpacity
            style={styles.customDropdownHeader}
            onPress={() => setShowCustomDropdown(!showCustomDropdown)}
          >
            <Text style={styles.customDropdownTitle}>
              Your Custom Pairs ({customPairs.length})
            </Text>
            <Ionicons 
              name={showCustomDropdown ? "chevron-up-outline" : "chevron-down-outline"}
              size={layout.iconSize.sm} 
              color={colors.gray600} 
            />
          </TouchableOpacity>

          {showCustomDropdown && (
            <View style={styles.customDropdownContent}>
              {customPairs.length > 0 ? (
                <ScrollView 
                  style={styles.customDropdownScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {customPairs.map((pair) => (
                    <TouchableOpacity
                      key={pair.id}
                      style={[
                        styles.customDropdownItem,
                        selectedPair?.id === pair.id && styles.customDropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedPair(pair);
                        setShowCustomDropdown(false);
                      }}
                    >
                      <View style={styles.customDropdownItemContent}>
                        <Text style={styles.customDropdownItemText} numberOfLines={2}>
                          {pair.term_0} ↔ {pair.term_1}
                        </Text>
                        <TouchableOpacity 
                          style={styles.customDropdownDeleteButton}
                          onPress={() => handleDeleteCustomPair(pair)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons 
                            name="trash-outline" 
                            size={layout.iconSize.sm} 
                            color={colors.error} 
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.noCustomPairsText}>
                  No custom pairs yet. Create your first one!
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Search Field */}
        <View style={styles.searchContainer}>
          <Ionicons 
            name="search" 
            size={layout.iconSize.sm} 
            color={colors.gray400} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search word pairs..."
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons 
                name="close-circle" 
                size={layout.iconSize.sm} 
                color={colors.gray400} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Gallery Title */}
        <Text style={styles.galleryTitle}>
          Choose a word pair ({filteredPairs.length} available)
        </Text>

        {/* Pairs List */}
        {filteredPairs.length > 0 ? (
          <View style={styles.pairsList}>
            {filteredPairs.map((pair) => (
              <PairItem key={pair.id} pair={pair} />
            ))}
          </View>
        ) : (
          <View style={styles.noResultsContainer}>
            <Ionicons 
              name="search" 
              size={48} 
              color={colors.gray400} 
            />
            <Text style={styles.noResultsText}>No pairs found</Text>
            <Text style={styles.noResultsSubtext}>
              {searchQuery ? 'Try adjusting your search terms' : 'No word pairs available'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View style={styles.bottomContainer}>
        {/* Action Buttons Row */}
        <View style={styles.actionButtonsContainer}>
          <Button
            title="Random"
            variant="outline"
            size="md"
            icon="shuffle-outline"
            onPress={handleRandomPair}
            style={styles.actionButton}
          />
          
          <Button
            title="Custom"
            variant="outline"
            size="md"
            icon="add-outline"
            onPress={() => setShowCreateForm(true)}
            style={styles.actionButton}
          />
        </View>

        {/* Select Button */}
        <Button
          title="Next"
          variant="primary"
          size="lg"
          onPress={handleSelectPair}
          style={styles.selectButton}
          disabled={!selectedPair}
        />
      </View>

      {/* Create Form Modal */}
      {showCreateForm && (
        <View style={styles.createFormOverlay}>
          <View style={styles.createFormContainer}>
            <View style={styles.createFormHeader}>
              <Text style={styles.createFormTitle}>Create Custom Pair</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowCreateForm(false);
                  setNewPairTerm0('');
                  setNewPairTerm1('');
                }}
              >
                <Ionicons name="close" size={layout.iconSize.sm} color={colors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.createFormInputs}>
              <TextInput
                style={styles.createInputFull}
                placeholder="First term (e.g., Light)"
                placeholderTextColor={colors.gray500}
                value={newPairTerm0}
                onChangeText={setNewPairTerm0}
                autoCapitalize="words"
                autoCorrect={true}
              />

              <View style={styles.swapIconContainer}>
                <Ionicons 
                  name="swap-horizontal" 
                  size={layout.iconSize.md} 
                  color={colors.gray400} 
                />
              </View>

              <TextInput
                style={styles.createInputFull}
                placeholder="Second term (e.g., Dark)"
                placeholderTextColor={colors.gray500}
                value={newPairTerm1}
                onChangeText={setNewPairTerm1}
                autoCapitalize="words"
                autoCorrect={true}
              />
            </View>

            <Button
              title={creating ? "Creating..." : "Save Pair"}
              variant="primary"
              size="lg"
              onPress={handleCreateCustomPair}
              style={styles.saveButton}
              disabled={creating || !newPairTerm0.trim() || !newPairTerm1.trim()}
              loading={creating}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },

  headerButton: {
    padding: spacing.sm,
    borderRadius: 8,
  },

  // Slim Player Banner
  playerBanner: {
    backgroundColor: colors.gray100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },

  playerBannerText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    textAlign: 'center',
  },

  playerName: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

  // Scrollable Content
  scrollableContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingBottom: spacing.xl,
  },

  // Custom Pairs Dropdown
  customDropdownContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  customDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },

  customDropdownTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
  },

  customDropdownContent: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    maxHeight: 200,
  },

  customDropdownScrollView: {
    maxHeight: 180,
  },

  customDropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    minHeight: 44,
  },

  customDropdownItemSelected: {
    backgroundColor: colors.secondary + '10',
  },

  customDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },

  customDropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    flex: 1,
    marginRight: spacing.sm,
  },

  customDropdownDeleteButton: {
    padding: spacing.xs,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noCustomPairsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  // Search Field - matching word-theme.tsx styling
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },

  searchIcon: {
    marginRight: spacing.sm,
  },

  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
  },

  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  galleryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.md,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },

  // Pairs List
  pairsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  pairItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  pairItemSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
    shadowColor: colors.secondary,
    shadowOpacity: 0.15,
    elevation: 3,
  },

  pairContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pairTermsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },

  pairTerm: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray700,
    flex: 1,
    textAlign: 'center',
  },

  pairTermSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },

  pairActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  customBadge: {
    backgroundColor: colors.warning + '20',
    borderRadius: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },

  customBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },

  deleteButton: {
    padding: spacing.xs,
  },

  // No Results
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },

  noResultsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  noResultsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
  },

  // Fixed Bottom Container - matching word-theme.tsx style
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },

  actionButton: {
    flex: 1,
    minHeight: 44,
  },

  selectButton: {
    width: '100%',
  },

  // Create Form Modal
  createFormOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  createFormContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    width: screenWidth - (spacing.lg * 2),
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  createFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  createFormTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.gray200,
  },

  createFormInputs: {
    marginBottom: spacing.xl,
  },

  createInputFull: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.base,
    color: colors.gray800,
    marginBottom: spacing.md,
    minHeight: 50,
  },

  swapIconContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  saveButton: {
    width: '100%',
    minHeight: 50,
  },

  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.gray600,
  },
});