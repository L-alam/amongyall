import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playerStorageService } from '../../lib/playerStorageService';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles 
} from '../../utils/styles';
import { Button } from '../../components/Button';

// Try to import gesture handler - with fallback
let PanGestureHandler, State;
try {
  const gestureHandler = require('react-native-gesture-handler');
  PanGestureHandler = gestureHandler.PanGestureHandler;
  State = gestureHandler.State;
} catch (error) {
  console.log('react-native-gesture-handler not available');
  PanGestureHandler = null;
  State = null;
}

// Individual Player Pill Component with Optimized Swipe-to-Delete
const PlayerPill = React.memo(({ player, index, onRemove, isSmallScreen }) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  // If gesture handler is not available, render simple version
  if (!PanGestureHandler || !State) {
    return (
      <View style={[styles.playerPillContainer, isSmallScreen && styles.playerPillContainerSmall]}>
        <View style={[styles.playerPill, isSmallScreen && styles.playerPillSmall]}>
          <View style={styles.playerPillContent}>
            <Ionicons 
              name="person-circle" 
              size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
              color={colors.primary} 
            />
            <Text style={[styles.playerName, isSmallScreen && styles.playerNameSmall]}>
              {player}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons 
              name="close-circle" 
              size={layout.iconSize.md} 
              color={colors.gray300} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // OPTIMIZATION: Pre-calculate animated styles to reduce re-renders
  const animatedStyles = React.useMemo(() => {
    const pillOpacity = translateX.interpolate({
      inputRange: [-200, -100, 0],
      outputRange: [0.4, 0.8, 1],
      extrapolate: 'clamp',
    });

    const redBackgroundOpacity = translateX.interpolate({
      inputRange: [-150, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: 'clamp',
    });

    return { pillOpacity, redBackgroundOpacity };
  }, [translateX]);

  // OPTIMIZATION: Use native driver and optimize gesture event
  const onGestureEvent = React.useMemo(
    () => Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { 
        useNativeDriver: true,
        listener: null
      }
    ),
    [translateX]
  );

  // OPTIMIZATION: Memoize and optimize handler state change
  const onHandlerStateChange = React.useCallback((event) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -100) {
        setIsDeleting(true);
        
        Animated.timing(translateX, {
          toValue: -400,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          onRemove(index);
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [translateX, onRemove, index]);

  return (
    <View style={[styles.playerPillContainer, isSmallScreen && styles.playerPillContainerSmall]}>
      <Animated.View 
        style={[
          styles.deleteBackground,
          { opacity: animatedStyles.redBackgroundOpacity }
        ]} 
      >
        <Ionicons name="trash" size={layout.iconSize.md} color={colors.white} />
      </Animated.View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={-8}
        failOffsetX={8}
        shouldCancelWhenOutside={false}
        simultaneousHandlers={[]}
      >
        <Animated.View
          style={[
            styles.playerPill,
            isSmallScreen && styles.playerPillSmall,
            {
              transform: [{ translateX }],
              opacity: animatedStyles.pillOpacity,
            }
          ]}
        >
          <View style={styles.playerPillContent}>
            <Ionicons 
              name="person-circle" 
              size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
              color={colors.primary} 
            />
            <Text style={[styles.playerName, isSmallScreen && styles.playerNameSmall]}>
              {player}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Ionicons 
              name="close-circle" 
              size={layout.iconSize.md} 
              color={colors.gray300} 
            />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
});

export default function QuestionSetup() {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [gameQuestions, setGameQuestions] = useState(["How old is your best friend?", "How many bones have you broken?"]);

  // Get screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;

  useEffect(() => {
    loadSavedPlayers();
  }, []);

  // Go back to the home screen
  const handleBack = () => {
    router.back();
  };

  const handleSet = async () => {
    // Validate minimum players
    if (players.length < 3) {
      Alert.alert(
        'Not Enough Players', 
        'You need at least 3 players to start the game. Please add more players.',
        [{ text: 'OK' }]
      );
      return;
    }
  
    // Save players before navigating
    if (players.length > 0) {
      await playerStorageService.savePlayers(players);
    }
  
    router.push({
      pathname: '/question/question-set',
      params: {
         players: JSON.stringify(players),
      }
    });
  };

  const handleAddPlayer = () => {
    if (playerName.trim() && players.length < 8) {
      setPlayers([...players, playerName.trim().toUpperCase()]);
      setPlayerName('');
      setPlayerCount(players.length + 1);
    }
  };

  const handleRemovePlayer = async (index: number) => {
    const playerToRemove = players[index];
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
    setPlayerCount(newPlayers.length);
    
    // Remove from persistent storage as well
    await playerStorageService.removePlayer(playerToRemove);
  };

  const loadSavedPlayers = async () => {
    try {
      const savedPlayers = await playerStorageService.getSavedPlayers();
      setPlayers(savedPlayers);
      setPlayerCount(savedPlayers.length);
    } catch (error) {
      console.error('Error loading saved players:', error);
      setPlayers([]);
      setPlayerCount(0);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header - Higher on screen */}
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons 
            name="arrow-back" 
            size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
            color={colors.primary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons 
            name="close" 
            size={isSmallScreen ? layout.iconSize.md : layout.iconSize.lg} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={[
          styles.scrollContentContainer,
          isSmallScreen && styles.scrollContentContainerSmall
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Players Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
            ADD PLAYERS
          </Text>
          
          {/* Enhanced Player Input - Bigger text field and plus icon */}
          <View style={[styles.playerInputContainer, isSmallScreen && styles.playerInputContainerSmall]}>
            <TextInput
              style={[
                styles.playerInput,
                isSmallScreen && styles.playerInputSmall
              ]}
              placeholder="Enter player name"
              placeholderTextColor={colors.gray400}
              value={playerName}
              onChangeText={setPlayerName}
              returnKeyType="done"
              onSubmitEditing={handleAddPlayer}
            />
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddPlayer}
              disabled={!playerName.trim() || players.length >= 8}
            >
              <Ionicons 
                name="add-circle" 
                size={isSmallScreen ? layout.iconSize.xl : layout.iconSize['2xl']} 
                color={playerName.trim() && players.length < 8 ? colors.primaryLight : colors.gray300} 
              />
            </TouchableOpacity>
          </View>

          {/* Enhanced Player List with Optimized Swipeable Pills */}
          <View style={[styles.playerList, isSmallScreen && styles.playerListSmall]}>
            {players.map((player, index) => (
              <PlayerPill
                key={`${player}-${index}`}
                player={player}
                index={index}
                onRemove={handleRemovePlayer}
                isSmallScreen={isSmallScreen}
              />
            ))}
          </View>

          {/* Player count indicator */}
          {players.length > 0 && (
            <Text style={[styles.playerCountText, isSmallScreen && styles.playerCountTextSmall]}>
              {players.length} player{players.length !== 1 ? 's' : ''} added
            </Text>
          )}
        </View>

        {/* Bottom spacer to prevent content hiding behind footer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Footer - Closer to bottom, no borders/shadows */}
      <View style={[styles.footer, isSmallScreen && styles.footerSmall]}>
        {players.length < 3 && (
          <View style={styles.warningContainer}>
            <Ionicons 
              name="information-circle-outline" 
              size={layout.iconSize.sm} 
              color={colors.black} 
            />
            <Text style={[styles.warningText, isSmallScreen && styles.warningTextSmall]}>
              Add at least {3 - players.length} more player{3 - players.length > 1 ? 's' : ''} to continue
            </Text>
          </View>
        )}
        
        <Button
          title="NEXT"
          onPress={handleSet}
          variant="primary"
          size={isSmallScreen ? "md" : "lg"}
          disabled={players.length < 3}
          style={[
            styles.nextButton,
            players.length < 3 && styles.nextButtonDisabled
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Fixed Header - Higher on screen, clean flat design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  
  headerSmall: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  
  headerButton: {
    padding: spacing.sm,
  },
  
  // Scrollable Content
  scrollContent: {
    flex: 1,
  },
  
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  
  scrollContentContainerSmall: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.lg,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  sectionTitleSmall: {
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
  },
  
  // Enhanced Player Input - Bigger text field
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  
  playerInputContainerSmall: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  
  playerInput: {
    ...createInputStyle('default'),
    flex: 1,
    height: 56,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
  },
  
  playerInputSmall: {
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
  },
  
  addButton: {
    padding: spacing.xs,
  },
  
  // OPTIMIZATION: Enhanced Player List with better layout performance
  playerList: {
    gap: spacing.md,
  },
  
  playerListSmall: {
    gap: spacing.sm,
  },
  
  playerPillContainer: {
    height: 56,
    marginVertical: 2,
  },
  
  playerPillContainerSmall: {
    height: 48,
  },
  
  deleteBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.error,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  
  playerPill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface || colors.gray100,
    borderRadius: 25,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray200,
    zIndex: 1,
  },
  
  playerPillSmall: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  
  playerPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  
  playerName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    flex: 1,
  },
  
  playerNameSmall: {
    fontSize: typography.fontSize.base,
  },
  
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  
  playerCountText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  
  playerCountTextSmall: {
    fontSize: typography.fontSize.xs,
  },
  
  bottomSpacer: {
    height: spacing['6xl'],
  },
  
  // Fixed Footer
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  
  footerSmall: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  
  warningText: {
    fontSize: typography.fontSize.sm,
    color: colors.black,
    fontWeight: typography.fontWeight.medium,
  },
  
  warningTextSmall: {
    fontSize: typography.fontSize.xs,
  },
  
  nextButton: {
    width: '100%',
  },
  
  nextButtonDisabled: {
    opacity: 0.5,
  },
});