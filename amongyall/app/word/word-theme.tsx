import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

export default function WordTheme() {


    // Go back to the player setup screen
    const handleBack = () => {
        router.back();
      };

    const [selectedTheme, setSelectedTheme] = useState('Music');
    const themes = ['Countries', 'Musical Instruments', 'Music', 'Under the Sea', 'Cities'];

    return (
        <ScrollView style={layoutStyles.container}>

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

            <View style={layoutStyles.content}>
                {/* Theme Section */}
                <View style={layoutStyles.section}>
                    <Text style={textStyles.h4}>Choose Theme</Text>
                    <View style={styles.themeList}>
                    {themes.map((theme) => (
                        <TouchableOpacity
                        key={theme}
                        style={combineStyles(
                            styles.themeItem,
                            selectedTheme === theme && styles.themeItemSelected
                        )}
                        onPress={() => setSelectedTheme(theme)}
                        >
                        <Text style={combineStyles(
                            textStyles.body,
                            selectedTheme === theme && styles.themeTextSelected
                        )}>
                            {theme}
                        </Text>
                        {selectedTheme === theme && (
                            <Ionicons 
                            name="checkmark" 
                            size={layout.iconSize.sm} 
                            color={colors.secondary} 
                            />
                        )}
                        </TouchableOpacity>
                    ))}
                    </View>
                </View>
            </View> 
        </ScrollView>
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
    
    subtitle: {
      textAlign: 'center',
      marginBottom: spacing.xl, 
    },
    
    playerCountControls: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md, 
    },
    
    countButton: {
      backgroundColor: colors.gray100, 
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    countButtonText: {
      fontSize: typography.fontSize.xl, 
      fontWeight: typography.fontWeight.bold, 
      color: colors.primary, 
    },
    
    playerInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg, 
      marginTop: spacing.md,
    },
    
    playerInput: {
      ...createInputStyle('default'), // Using our input factory!
      flex: 1,
    },
    
    addButton: {
      marginLeft: spacing.sm, 
      padding: spacing.sm, 
    },
    
    playerList: {
      gap: spacing.sm, 
    },
    
    playerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm, 
      paddingVertical: spacing.xs, 
    },
    
    playerName: {
      flex: 1,
      
    },
    
    themeList: {
      gap: spacing.sm, 
      marginTop: spacing.md, 
    },
    
    themeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md, 
      paddingHorizontal: spacing.lg, 
      borderWidth: 1,
      borderColor: colors.gray300, 
      borderRadius: 8,
    },
    
    themeItemSelected: {
      borderColor: colors.secondary, 
      backgroundColor: colors.secondary + '10', 
    },
    
    themeTextSelected: {
      color: colors.secondary, 
      fontWeight: typography.fontWeight.semibold, 
    },
    
    startButton: {
      marginTop: spacing.lg, 
    },
  });