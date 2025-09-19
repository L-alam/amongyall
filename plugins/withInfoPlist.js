const { withInfoPlist } = require('expo/config-plugins');

module.exports = function withCustomInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    // Add camera permission directly
    config.modResults.NSCameraUsageDescription = "This app may access the camera to scan credit cards for payment processing through Stripe.";
    
    // Add other permissions if needed
    config.modResults.NSPhotoLibraryUsageDescription = "This app may access your photo library to select images for document processing.";
    
    // Ensure existing values are preserved
    config.modResults.ITSAppUsesNonExemptEncryption = false;
    
    return config;
  });
};