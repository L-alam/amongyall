import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, ActivityIndicator, TextInput } from 'react-native';
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
  WavelengthPair,
  WordPairs
} from '../../lib/wavelengthService';

const { width: screenWidth } = Dimensions.get('window');

export default function WavelengthPairs() {
  // Get players and first player from the previous screen
  const params = useLocalSearchParams();
  const players = JSON.parse(params.players as string || '[]') as string[];
  const firstPlayer = params.firstPlayer as string || '';
  
  const [selectedCategory, setSelectedCategory] = useState<'builtin' | 'custom' | 'mixed'>('builtin');
  const [builtInPairs, setBuiltInPairs] = useState<WavelengthPair[]>([]);
  const [customPairs, setCustomPairs] = useState<WavelengthPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<'builtin' | 'custom' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom pair creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPairTerm0, setNewPairTerm0] = useState('');
  const [newPairTerm1, setNewPairTerm1] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPairs();
  }, []);

  const loadPairs = async () => {
    try {
      setLoading(true);
      
      const [builtIn, custom] = await Promise.all([
        getBuiltInPairs(),
        getCustomPairs()
      ]);
      
      setBuiltInPairs(builtIn);
      setCustomPairs(custom);
      
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
    // Navigate to game screen
    router.push({
      pathname: '/wavelength/wavelength-gamestart',
      params: {
        players: JSON.stringify(players),
        firstPlayer: firstPlayer,
        pairCategory: selectedCategory,
        playerScores: JSON.stringify([]), // Start with empty scores
      }
    });
  };

  const handleCreateCustomPair = async () => {
    if (!newPairTerm0.trim() || !newPairTerm1.trim()) {
      Alert.alert('Error', 'Please enter both terms for the pair.');
      return;
    }

    setCreating(true);

    try {
      await createCustomPair(newPairTerm0.trim(), newPairTerm1.trim());
      
      // Reset form
      setNewPairTerm0('');
      setNewPairTerm1('');
      setShowCreateForm(false);
      
      // Reload pairs to show the new one
      await loadPairs();
      
      Alert.alert('Success', 'Custom pair created successfully!');
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
  const filterPairs = (pairs: WavelengthPair[]): WavelengthPair[] => {
    if (!searchQuery.trim()) return pairs;
    
    return pairs.filter(pair => 
      pair.term_0.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.term_1.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredBuiltInPairs = filterPairs(builtInPairs);
  const filteredCustomPairs = filterPairs(customPairs);

  // Pair Item Component
  const PairItem = ({ pair, isCustom = false }: { pair: WavelengthPair; isCustom?: boolean }) => (
    <View style={styles.pairItem}>
      <View style={styles.pairContent}>
        <View style={styles.pairTermsContainer}>
          <Text style={styles.pairTerm}>{pair.term_0}</Text>
          <Ionicons name="swap-horizontal" size={16} color={colors.gray400} />
          <Text style={styles.pairTerm}>{pair.term_1}</Text>
        </View>
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
      </View>
    </View>
  );

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
    <View style={layoutStyles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
        
        <Text style={textStyles.h2}>Wavelength</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Fixed Category Selection */}
      <View style={styles.categoryContainer}>
        <Text style={textStyles.h4}>Choose Word Pairs</Text>
        
        <View style={styles.categoryButtons}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'builtin' && styles.categoryButtonSelected
            ]}
            onPress={() => setSelectedCategory('builtin')}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'builtin' && styles.categoryButtonTextSelected
            ]}>
              Built-in ({builtInPairs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'custom' && styles.categoryButtonSelected
            ]}
            onPress={() => setSelectedCategory('custom')}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'custom' && styles.categoryButtonTextSelected
            ]}>
              Custom ({customPairs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'mixed' && styles.categoryButtonSelected
            ]}
            onPress={() => setSelectedCategory('mixed')}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === 'mixed' && styles.categoryButtonTextSelected
            ]}>
              Mixed ({builtInPairs.length + customPairs.length})
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.firstPlayerInfo}>
          First player: <Text style={styles.firstPlayerName}>{firstPlayer}</Text>
        </Text>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView 
        style={styles.scrollableContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Built-in Pairs Section */}
        {(selectedCategory === 'builtin' || selectedCategory === 'mixed') && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSection(expandedSection === 'builtin' ? null : 'builtin')}
            >
              <Text style={styles.sectionTitle}>
                Built-in Pairs ({filteredBuiltInPairs.length})
              </Text>
              <Ionicons 
                name={expandedSection === 'builtin' ? "chevron-down-outline" : "chevron-forward-outline"}
                size={layout.iconSize.sm} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {expandedSection === 'builtin' && (
              <View style={styles.pairsList}>
                {filteredBuiltInPairs.slice(0, 20).map((pair) => (
                  <PairItem key={pair.id} pair={pair} />
                ))}
                {filteredBuiltInPairs.length > 20 && (
                  <Text style={styles.moreItemsText}>
                    ... and {filteredBuiltInPairs.length - 20} more pairs
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Custom Pairs Section */}
        {(selectedCategory === 'custom' || selectedCategory === 'mixed') && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setExpandedSection(expandedSection === 'custom' ? null : 'custom')}
            >
              <Text style={styles.sectionTitle}>
                Custom Pairs ({filteredCustomPairs.length})
              </Text>
              <Ionicons 
                name={expandedSection === 'custom' ? "chevron-down-outline" : "chevron-forward-outline"}
                size={layout.iconSize.sm} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {expandedSection === 'custom' && (
              <View style={styles.pairsList}>
                {/* Create New Pair Form */}
                {showCreateForm ? (
                  <View style={styles.createForm}>
                    <Text style={styles.createFormTitle}>Create New Pair</Text>
                    <View style={styles.createFormInputs}>
                      <TextInput
                        style={styles.createInput}
                        placeholder="First term (e.g. Hot)"
                        placeholderTextColor={colors.gray400}
                        value={newPairTerm0}
                        onChangeText={setNewPairTerm0}
                        autoCapitalize="words"
                      />
                      <Ionicons name="swap-horizontal" size={16} color={colors.gray400} />
                      <TextInput
                        style={styles.createInput}
                        placeholder="Second term (e.g. Cold)"
                        placeholderTextColor={colors.gray400}
                        value={newPairTerm1}
                        onChangeText={setNewPairTerm1}
                        autoCapitalize="words"
                      />
                    </View>
                    <View style={styles.createFormButtons}>
                      <Button
                        title="Cancel"
                        variant="outline"
                        size="sm"
                        onPress={() => {
                          setShowCreateForm(false);
                          setNewPairTerm0('');
                          setNewPairTerm1('');
                        }}
                        style={styles.createFormButton}
                      />
                      <Button
                        title={creating ? "Creating..." : "Create"}
                        variant="primary"
                        size="sm"
                        onPress={handleCreateCustomPair}
                        disabled={creating || !newPairTerm0.trim() || !newPairTerm1.trim()}
                        loading={creating}
                        style={styles.createFormButton}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.createNewButton}
                    onPress={() => setShowCreateForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={layout.iconSize.md} color={colors.secondary} />
                    <Text style={styles.createNewButtonText}>Create New Pair</Text>
                  </TouchableOpacity>
                )}

                {filteredCustomPairs.map((pair) => (
                  <PairItem key={pair.id} pair={pair} isCustom={true} />
                ))}

                {filteredCustomPairs.length === 0 && !showCreateForm && (
                  <Text style={styles.noPairsText}>
                    No custom pairs yet. Create your first pair!
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* No Results Message */}
        {searchQuery.length > 0 && 
         filteredBuiltInPairs.length === 0 && 
         filteredCustomPairs.length === 0 && (
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

        {/* Category Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            {selectedCategory === 'builtin' && 
              `Playing with ${builtInPairs.length} built-in word pairs. These are curated pairs that work well for Wavelength.`}
            {selectedCategory === 'custom' && 
              `Playing with ${customPairs.length} custom word pairs. These are pairs you've created.`}
            {selectedCategory === 'mixed' && 
              `Playing with all ${builtInPairs.length + customPairs.length} word pairs (${builtInPairs.length} built-in + ${customPairs.length} custom).`}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <Button
          title="START GAME"
          variant="primary"
          size="lg"
          onPress={handleStartGame}
          style={styles.bottomButton}
        />
      </View>
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
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  
  headerButton: {
    padding: spacing.sm,
  },

  // Fixed Category Selection
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },

  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  categoryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },

  categoryButtonSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  },

  categoryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    textAlign: 'center',
  },

  categoryButtonTextSelected: {
    color: colors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },

  firstPlayerInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
  },

  firstPlayerName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary,
  },

  // Scrollable Content
  scrollableContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Search Field
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
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

  // Sections
  section: {
    marginBottom: spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },

  pairsList: {
    gap: spacing.sm,
  },

  // Pair Items
  pairItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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

  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  moreItemsText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.md,
  },

  // Create New Pair
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    backgroundColor: colors.secondary + '05',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  createNewButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.secondary,
  },

  // Create Form
  createForm: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },

  createFormTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  createFormInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  createInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.base,
    color: colors.gray800,
  },

  createFormButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  createFormButton: {
    flex: 1,
  },

  // No Results/Empty States
  noPairsText: {
    fontSize: typography.fontSize.base,
    color: colors.gray500,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: spacing.xl,
  },

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

  // Description
  descriptionContainer: {
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  descriptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.4,
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