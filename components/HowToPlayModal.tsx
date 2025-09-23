import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, layout, spacing, typography } from '../constants/theme';

interface HowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const SLIDES = [
  {
    title: "Setup Players",
    content: "Add all the players of the group (max 8). Then pick a theme or create your own",
    icon: "people" as const,
  },
  {
    title: "Pass the Phone",
    content: "Pass the phone around. All players will get the same word except one. One player will be the spy!",
    icon: "phone-portrait" as const,
  },
  {
    title: "Give Clues",
    content: "Take turns saying a clue related to the shared word. Don't be too obvious! The spy can win the game if they correctly guess the secret word",
    icon: "eye" as const,
  },
  {
    title: "Vote & Win",
    content: "Discuss then vote on who the spy is. If the spy is found they can still win if they can correctly guess the secret word. Have Fun!!",
    icon: "trophy" as const,
  },
];

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ visible, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      slideAnim.setValue(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const shouldSwipe = Math.abs(dx) > screenWidth * 0.3;

      if (shouldSwipe) {
        if (dx > 0 && currentSlide > 0) {
          // Swipe right - go to previous slide
          animateToSlide(currentSlide - 1);
        } else if (dx < 0 && currentSlide < SLIDES.length - 1) {
          // Swipe left - go to next slide
          animateToSlide(currentSlide + 1);
        } else {
          // Snap back
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // Snap back
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const animateToSlide = (slideIndex: number) => {
    const direction = slideIndex > currentSlide ? -screenWidth : screenWidth;
    
    Animated.timing(slideAnim, {
      toValue: direction,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSlide(slideIndex);
      slideAnim.setValue(-direction);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const goToSlide = (slideIndex: number) => {
    if (slideIndex === currentSlide) return;
    animateToSlide(slideIndex);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      animateToSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      animateToSlide(currentSlide - 1);
    }
  };

  const currentSlideData = SLIDES[currentSlide];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>How to Play</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={layout.iconSize.lg} color={colors.gray600} />
            </TouchableOpacity>
          </View>

          {/* Slide Content */}
          <View style={styles.slideContainer} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.slideContent,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={currentSlideData.icon}
                  size={layout.iconSize['4xl'] || 64}
                  color={colors.primary}
                />
              </View>
              
              <Text style={styles.slideTitle}>{currentSlideData.title}</Text>
              <Text style={styles.slideText}>{currentSlideData.content}</Text>
            </Animated.View>
          </View>

          {/* Dot Indicators */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === currentSlide && styles.dotActive,
                ]}
                onPress={() => goToSlide(index)}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentSlide > 0 && (
              <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                <Ionicons name="chevron-back" size={layout.iconSize.md} color={colors.primary} />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.navButton, styles.nextButton]} 
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentSlide === SLIDES.length - 1 ? 'Got It!' : 'Next'}
              </Text>
              {currentSlide < SLIDES.length - 1 && (
                <Ionicons name="chevron-forward" size={layout.iconSize.md} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },

  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing?.wide || 0.5,
  },

  closeButton: {
    padding: spacing.sm,
  },

  slideContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  slideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth - (spacing.xl * 4), // Account for modal and slide padding
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight || colors.surface || colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  slideTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  slideText: {
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
    paddingHorizontal: spacing.sm,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.sm,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray300,
  },

  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.xs,
  },

  nextButton: {
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
  },

  navButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },

  nextButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.white,
    fontWeight: typography.fontWeight.medium,
  },
});