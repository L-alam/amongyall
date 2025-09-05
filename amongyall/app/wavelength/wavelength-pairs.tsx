import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { 
  getAllWavelengthPairs, 
  getBuiltInPairs, 
  getCustomPairs, 
  createCustomPair, 
  deleteCustomPair, 
  getRandomPair,
  WavelengthPair,
  WordPairs
} from '../../lib/wavelengthService';

const { width: screenWidth } = Dimensions.get('window');

export default function WavelengthPairs() {
  // Get players and first player from the previous screen
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]') as string[];
  const firstPlayer = params.firstPlayer as string || '';
  
  // Get existing scores and player history if this is a subsequent round
  const existingScores = JSON.parse(params.playerScores as string || '[]');
  const existingHistory = JSON.parse(params.playerHistory as string || '[]');
  
  const [allPairs, setAllPairs] = useState<WavelengthPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<WavelengthPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom pair creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPairTerm0, setNewPairTerm0] = useState('');
  const [newPairTerm1, setNewPairTerm1] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Custom pairs dropdown state
  const [customPairs, setCustomPairs] = useState<WavelengthPair[]>([]);
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);

  useEffect(() => {
    loadPairs();
  }, []);

  const loadPairs = async () => {
    try {
      setLoading(true);
      
      // Load all pairs (built-in + custom)
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
        'Failed to load word pairs. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: loadPairs
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleStartGame = () => {
    if (!selectedPair) {
      Alert.alert('No Pair Selected', 'Please select a word pair to continue.');
      return;
    }

    const wordPair: WordPairs = {
      positive: selectedPair.term_0,
      negative: selectedPair.term_1
    };

    // Navigate to game screen with selected pair
    router.push({
      pathname: '/wavelength/wavelength-gamestart',
      params: {
        players: JSON.stringify(players),
        firstPlayer: firstPlayer,
        selectedPair: JSON.stringify(wordPair),
        playerScores: JSON.stringify(existingScores), // Pass existing scores
        playerHistory: JSON.stringify(existingHistory), // Pass player history
      }
    });
  };

  const handleRandomPair = async () => {
    try {
      const randomWordPair = await getRandomPair();
      if (!randomWordPair) {
        Alert.alert('Error', 'No pairs available for random selection.');
        return;
      }

      // Navigate directly to game with random pair
      router.push({
        pathname: '/wavelength/wavelength-gamestart',
        params: {
          players: JSON.stringify(players),
          firstPlayer: firstPlayer,
          selectedPair: JSON.stringify(randomWordPair),
          playerScores: JSON.stringify(existingScores), // Pass existing scores
          playerHistory: JSON.stringify(existingHistory), // Pass player history
        }
      });
    } catch (error) {
      console.error('Error getting random pair:', error);
      Alert.alert('Error', 'Failed to get random pair. Please try again.');
    }
  };

  const handleCreateCustomPair = async () => {
    if (!newPairTerm0.trim() || !newPairTerm1.trim()) {
      Alert.alert('Error', 'Please enter both terms for the pair.');
      return;
    }

    setCreating(true);

    try {
      const newPair = await createCustomPair(newPairTerm0.trim(), newPairTerm1.trim());
      
      // Reset form
      setNewPairTerm0('');
      setNewPairTerm1('');
      setShowCreateForm(false);
      
      // Reload pairs to show the new one
      await loadPairs();
      
      Alert.alert('Success', 'Custom pair saved successfully!');
    } catch (error) {
      console.error('Error creating custom pair:', error);
      
      if (error instanceof Error && error.message.includes('already exists')) {
        Alert.alert('Pair Already Exists', 'This word pair already exists. Please choose different terms.');
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
              await loadPairs(); // Reload to update the list
              // If deleted pair was selected, clear selection
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

  // Filter pairs based on search query
  const filteredPairs = allPairs.filter(pair => {
    if (!searchQuery.trim()) return true;
    
    return pair.term_0.toLowerCase().includes(searchQuery.toLowerCase()) ||
           pair.term_1.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pair Item Component
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
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
            {isCustom && (
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
            )}
            {isSelected && (
              <Ionicons 
                name="checkmark-circle" 
                size={layout.iconSize.md} 
                color={colors.secondary} 
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={combineStyles(layoutStyles.container, layoutStyles.centered)}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={combineStyles(textStyles.body, styles.loadingText)}>
          Loading word pairs...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={layoutStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* First Player Display */}
      <View style={styles.firstPlayerContainer}>
        <Text style={styles.firstPlayerText}>
          Player: <Text style={styles.firstPlayerName}>{firstPlayer}</Text>
        </Text>
        
      </View>

      {/* Action Buttons */}
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
              customPairs.map((pair) => (
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
                    <Text style={styles.customDropdownItemText}>
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
              ))
            ) : (
              <Text style={styles.noCustomPairsText}>
                No custom pairs yet. Create your first one!
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Create Custom Pair Form */}
      {showCreateForm && (
        <View style={styles.createFormContainer}>
          <ScrollView 
            style={styles.createFormScrollView}
            contentContainerStyle={styles.createFormScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.createForm}>
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
                  <Ionicons name="close" size={layout.iconSize.md} color={colors.gray600} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.createFormInputs}>
                <TextInput
                  style={styles.createInputFull}
                  placeholder="First term (e.g. Hot)"
                  placeholderTextColor={colors.gray400}
                  value={newPairTerm0}
                  onChangeText={setNewPairTerm0}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // Focus the second input when done with first
                    // You could add a ref here if needed for better UX
                  }}
                />
                <View style={styles.swapIconContainer}>
                  <Ionicons name="swap-vertical" size={20} color={colors.gray400} />
                </View>
                <TextInput
                  style={styles.createInputFull}
                  placeholder="Second term (e.g. Cold)"
                  placeholderTextColor={colors.gray400}
                  value={newPairTerm1}
                  onChangeText={setNewPairTerm1}
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleCreateCustomPair}
                />
              </View>
              
              <Button
                title={creating ? "Saving..." : "Save Pair"}
                variant="primary"
                size="md"
                icon="save-outline"
                onPress={handleCreateCustomPair}
                disabled={creating || !newPairTerm0.trim() || !newPairTerm1.trim()}
                loading={creating}
                style={styles.saveButton}
              />
            </View>
          </ScrollView>
        </View>
      )}

      {/* Search Field - only show when create form is not open */}
      {!showCreateForm && (
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
      )}

      {/* Pairs Gallery - only show when create form is not open */}
      {!showCreateForm && (
        <ScrollView 
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.galleryTitle}>
            Choose a word pair ({filteredPairs.length} available)
          </Text>

          <View style={styles.pairsList}>
            {filteredPairs.map((pair) => (
              <PairItem key={pair.id} pair={pair} />
            ))}
          </View>

          {filteredPairs.length === 0 && searchQuery.length > 0 && (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={48} color={colors.gray400} />
              <Text style={styles.noResultsText}>
                No pairs found for "{searchQuery}"
              </Text>
              <Text style={styles.noResultsSubtext}>
                Try a different search term or create a custom pair
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Fixed Bottom Button - only show when create form is not open */}
      {!showCreateForm && (
        <View style={styles.bottomButtonContainer}>
          <Button
            title={selectedPair ? `Play: ${selectedPair.term_0} ↔ ${selectedPair.term_1}` : "Select a Pair"}
            variant="primary"
            size="lg"
            onPress={handleStartGame}
            disabled={!selectedPair}
            style={styles.bottomButton}
          />
        </View>
      )}
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  // First Player Display
  firstPlayerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray100,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center',
  },

  firstPlayerText: {
    fontSize: typography.fontSize.base,
    color: colors.gray600,
    textAlign: 'center',
  },

  firstPlayerName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary,
  },

  roundIndicatorText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.xs,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.white,
  },

  actionButton: {
    maxHeight: 50,
    flex: 1,
  },

  // Create Form
  createFormContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
  },

  createFormScrollView: {
    flex: 1,
  },

  createFormScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  createForm: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginVertical: spacing.lg,
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

  // Custom Pairs Dropdown
  customDropdownContainer: {
    marginHorizontal: spacing.lg,
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

  customDropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },

  customDropdownItemSelected: {
    backgroundColor: colors.secondary + '10',
  },

  customDropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  customDropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray700,
    flex: 1,
  },

  customDropdownDeleteButton: {
    padding: spacing.xs,
  },

  noCustomPairsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },

  // Search Field
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
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
    color: colors.gray800,
  },

  clearSearchButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  // Scrollable Content
  scrollableContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  galleryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray700,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  // Pairs List
  pairsList: {
    gap: spacing.sm,
  },

  // Pair Items
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

  // No Results/Empty States
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

  // Fixed Bottom Button
  bottomButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },

  bottomButton: {
    width: '100%',
  },

  // Loading State
  loadingText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.gray600,
  },
});