import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert
} from 'react-native';
import { downloadService } from '../lib/downloadService';

const DownloadsScreen: React.FC = () => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedCustomItems, setSelectedCustomItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<any[]>([]);

  useEffect(() => {
    loadCustomItems();
  }, []);

  const loadCustomItems = async () => {
    try {
      // Load user's custom themes, questions, and pairs
      // You'll need to implement these API calls
      const customThemes = await getCustomThemes();
      const customQuestions = await getCustomQuestions();
      const customPairs = await getCustomPairs();
      
      const allCustomItems = [
        ...customThemes.map(item => ({ ...item, type: 'theme' })),
        ...customQuestions.map(item => ({ ...item, type: 'questions' })),
        ...customPairs.map(item => ({ ...item, type: 'pairs' }))
      ];
      
      setCustomItems(allCustomItems);
    } catch (error) {
      console.error('Error loading custom items:', error);
    }
  };

  const handleDownloadBasicThemes = async () => {
    setIsDownloading(true);
    try {
      await downloadService.downloadBasicThemes();
      Alert.alert('Success', 'Basic themes downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download basic themes');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadBasicPairs = async () => {
    setIsDownloading(true);
    try {
      await downloadService.downloadBasicPairs();
      Alert.alert('Success', 'Basic pairs downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download basic pairs');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCustomItems = async () => {
    if (selectedCustomItems.length === 0) {
      Alert.alert('No Selection', 'Please select items to download');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadService.downloadCustomItems(selectedCustomItems);
      Alert.alert('Success', 'Custom items downloaded successfully!');
      setSelectedCustomItems([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to download custom items');
    } finally {
      setIsDownloading(false);
    }
  };

  // ... rest of your component implementation
};