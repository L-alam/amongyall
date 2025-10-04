// lib/storeKitService.ts
import { Alert, Platform } from 'react-native';
import {
    Product,
    Purchase,
    PurchaseError,
    SubscriptionPurchase,
    endConnection,
    finishTransaction,
    getProducts,
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestSubscription,
} from 'react-native-iap';
import { supabase } from './supabase';
  
  // Your App Store Connect Product ID
  const MONTHLY_PRO_SKU = 'com.lalam.amongyall.pro';
  
  export class StoreKitService {
    private purchaseUpdateSubscription: any;
    private purchaseErrorSubscription: any;
  
    async initialize() {
      try {
        // Initialize connection to App Store
        await initConnection();
        console.log('StoreKit initialized');
  
        // Set up listeners
        this.setupListeners();
  
        return true;
      } catch (error) {
        console.error('Error initializing StoreKit:', error);
        return false;
      }
    }
  
    private setupListeners() {
      // Listen for purchase updates
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: Purchase | SubscriptionPurchase) => {
          console.log('Purchase update:', purchase);
          
          const receipt = purchase.transactionReceipt;
          if (receipt) {
            try {
              // Verify receipt with your backend
              await this.verifyReceipt(receipt, purchase.productId);
              
              // Finish the transaction
              await finishTransaction({ purchase, isConsumable: false });
              
              Alert.alert(
                'Success!',
                'Your Pro subscription is now active!'
              );
            } catch (error) {
              console.error('Error processing purchase:', error);
              Alert.alert('Error', 'Failed to activate subscription');
            }
          }
        }
      );
  
      // Listen for purchase errors
      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => {
          if (error.code !== 'E_USER_CANCELLED') {
            console.error('Purchase error:', error);
            Alert.alert('Purchase Error', error.message);
          }
        }
      );
    }
  
    async getSubscriptionProduct(): Promise<Product | null> {
      try {
        const products = await getProducts({ skus: [MONTHLY_PRO_SKU] });
        return products[0] || null;
      } catch (error) {
        console.error('Error getting products:', error);
        return null;
      }
    }
  
    async purchaseSubscription(): Promise<boolean> {
      if (Platform.OS !== 'ios') {
        Alert.alert('Error', 'StoreKit is only available on iOS');
        return false;
      }
  
      try {
        // Request the subscription
        await requestSubscription({
          sku: MONTHLY_PRO_SKU,
        });
        
        // Purchase listener will handle the rest
        return true;
      } catch (error: any) {
        if (error.code !== 'E_USER_CANCELLED') {
          console.error('Purchase error:', error);
          Alert.alert('Purchase Error', error.message);
        }
        return false;
      }
    }
  
    private async verifyReceipt(receipt: string, productId: string) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }
  
        // Call your Supabase function to verify the receipt
        const { data, error } = await supabase.functions.invoke('verify-apple-receipt', {
          body: {
            receipt,
            productId,
            userId: user.id,
          },
        });
  
        if (error) {
          throw error;
        }
  
        console.log('Receipt verified successfully:', data);
        return data;
      } catch (error) {
        console.error('Error verifying receipt:', error);
        throw error;
      }
    }
  
    async restorePurchases() {
      try {
        // This will trigger purchase listeners for any active subscriptions
        const purchases = await getProducts({ skus: [MONTHLY_PRO_SKU] });
        console.log('Restored purchases:', purchases);
        return true;
      } catch (error) {
        console.error('Error restoring purchases:', error);
        Alert.alert('Error', 'Failed to restore purchases');
        return false;
      }
    }
  
    cleanup() {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
      }
      endConnection();
    }
  }
  
  // Export singleton instance
  export const storeKitService = new StoreKitService();