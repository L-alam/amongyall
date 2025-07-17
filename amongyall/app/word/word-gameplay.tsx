import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Pressable, SafeAreaView, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { colors, spacing, layout, typography } from '../../constants/theme';
import { 
  textStyles, 
  layoutStyles, 
  createButtonStyle, 
  createButtonTextStyle,
  createInputStyle,
  combineStyles,
} from '../../utils/styles';
import { Button } from '../../components/Button';
import { themes, getRandomWordsFromTheme, getAllThemeNames } from '../../constants/theme';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';


const RegularContent = () => {
    return (
      <View style={regularContentStyles.card}>
        <Text style={regularContentStyles.text}>Regular content ✨</Text>
      </View>
    );
  };
  
  const regularContentStyles = StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: '#b6cff7',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: '#001a72',
    },
  });
  
  const FlippedContent = () => {
    return (
      <View style={flippedContentStyles.card}>
        <Text style={flippedContentStyles.text}>Flipped content 🚀</Text>
      </View>
    );
  };
  
  const flippedContentStyles = StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: '#baeee5',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: '#001a72',
    },
  });
  
  const FlipCard = ({
    isFlipped,
    cardStyle,
    direction = 'y',
    duration = 500,
    RegularContent,
    FlippedContent,
  }) => {
    const isDirectionX = direction === 'x';
  
    const regularCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [0, 180]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration });
  
      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });
  
    const flippedCardAnimatedStyle = useAnimatedStyle(() => {
      const spinValue = interpolate(Number(isFlipped.value), [0, 1], [180, 360]);
      const rotateValue = withTiming(`${spinValue}deg`, { duration });
  
      return {
        transform: [
          isDirectionX ? { rotateX: rotateValue } : { rotateY: rotateValue },
        ],
      };
    });
  
    return (
      <View>
        <Animated.View
          style={[
            flipCardStyles.regularCard,
            cardStyle,
            regularCardAnimatedStyle,
          ]}>
          {RegularContent}
        </Animated.View>
        <Animated.View
          style={[
            flipCardStyles.flippedCard,
            cardStyle,
            flippedCardAnimatedStyle,
          ]}>
          {FlippedContent}
        </Animated.View>
      </View>
    );
  };
  
  const flipCardStyles = StyleSheet.create({
    regularCard: {
      position: 'absolute',
      zIndex: 1,
    },
    flippedCard: {
      zIndex: 2,
    },
  });


export default function WordGameplay() {
    const params = useLocalSearchParams();
    const handleBack = () => {
        router.back();
      };

    const isFlipped = useSharedValue(false);

    const handlePress = () => {
        isFlipped.value = !isFlipped.value;
    };

    return (
        <View style={layoutStyles.container}>
            {/* Header */}
            <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={layout.iconSize.md} color={colors.primary} />
            </TouchableOpacity>
            
            <Text style={textStyles.h2}>Word Chameleon</Text>
            
            <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                <Ionicons name="close" size={layout.iconSize.md} color={colors.primary} />
            </TouchableOpacity>
            </View>

            <SafeAreaView style={styles.container}>
                <FlipCard
                isFlipped={isFlipped}
                cardStyle={styles.flipCard}
                FlippedContent={<FlippedContent />}
                RegularContent={<RegularContent />}
                />
                <View style={styles.buttonContainer}>
                <Button
                title="START GAME"
                variant="primary"
                size="sm"
                onPress={handlePress}
                style={styles.startButton}
                />
                </View>
            </SafeAreaView>

        </View>
    )
}


const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing['3xl'],
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    
    headerButton: {
      padding: spacing.sm,
    },
    
    container: {
        flex: 1,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
      },
      buttonContainer: {
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
      },
      toggleButton: {
        backgroundColor: '#b58df1',
        padding: 12,
        borderRadius: 48,
      },
      toggleButtonText: {
        color: '#fff',
        textAlign: 'center',
      },
      flipCard: {
        width: 170,
        height: 200,
        backfaceVisibility: 'hidden',
      },
      startButton: {
        marginTop: spacing.lg,
        marginBottom: spacing.xl,
      },
})

