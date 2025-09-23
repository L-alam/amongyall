import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, layout, spacing, typography } from '../constants/theme';

interface WavelengthHowToPlayModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const SLIDES = [
  {
    title: "Setup Game",
    content: "Add all the players of the group (max 8). Then choose a player to go first and a word pair to start.",
    icon: "people" as const,
  },
  {
    title: "Give Clue",
    content: "The chosen player will receive a scale with a goalzone. Come up with a one word clue to guide the group to the blue area of the scale",
    icon: "bulb" as const,
  },
  {
    title: "Place Markers",
    content: "Show the scale to the group and say your clue. Then take turns placing your marker where you think the goalzone might be",
    icon: "radio-button-on" as const,
  },
  {
    title: "Reveal & Score",
    content: "Reveal scores and see if you were right! The player who gave the clue gets a point for every person in the goal zone",
    icon: "trophy" as const,
  },
];

export const WavelengthHowToPlayModal: React.FC<WavelengthHowToPlayModalProps> = ({ visible, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (slideIndex: number) => {
    if (slideIndex >= 0 && slideIndex < SLIDES.length) {
      setCurrentSlide(slideIndex);
    }
  };

  const goToPrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
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

          {/* Slide Content with Navigation Arrows */}
          <View style={styles.slideContainer}>
            {/* Left Arrow */}
            <View style={styles.leftArrowContainer}>
              {currentSlide > 0 && (
                <TouchableOpacity style={styles.arrowButton} onPress={goToPrevious}>
                  <Ionicons 
                    name="chevron-back" 
                    size={layout.iconSize.lg} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Slide Content */}
            <View style={styles.slideContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={currentSlideData.icon}
                  size={layout.iconSize['4xl'] || 64}
                  color={colors.primary}
                />
              </View>
              
              <Text style={styles.slideTitle}>{currentSlideData.title}</Text>
              <Text style={styles.slideText}>{currentSlideData.content}</Text>
            </View>

            {/* Right Arrow */}
            <View style={styles.rightArrowContainer}>
              {currentSlide < SLIDES.length - 1 && (
                <TouchableOpacity style={styles.arrowButton} onPress={goToNext}>
                  <Ionicons 
                    name="chevron-forward" 
                    size={layout.iconSize.lg} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    height: 280,
    paddingHorizontal: spacing.sm,
  },

  leftArrowContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightArrowContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowButton: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
});