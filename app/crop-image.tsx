import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  PanResponder,
  Alert,
  GestureResponderEvent,
  PanResponderGestureState,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
// Use legacy API for expo-file-system v19+ (Expo SDK 54)
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { scanIngredients, ScanResponse } from '@/services/api';
import { getProfile, addScanToHistory } from '@/services/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_CONTAINER_HEIGHT = 400;
const MIN_CROP_SIZE = 80;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export default function CropImageScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displayedImageSize, setDisplayedImageSize] = useState({ width: 0, height: 0 });
  const [baseDisplaySize, setBaseDisplaySize] = useState({ width: 0, height: 0 });
  const [cropBox, setCropBox] = useState({
    x: 20,
    y: 50,
    width: SCREEN_WIDTH - 100,
    height: 150,
  });
  const [hasCropped, setHasCropped] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  // Use refs to track values for pan responder
  const cropBoxRef = useRef(cropBox);
  const displayedImageSizeRef = useRef(displayedImageSize);
  const startCropBoxRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const isProcessingRef = useRef(isProcessing);
  const zoomLevelRef = useRef(zoomLevel);
  const imageOffsetRef = useRef(imageOffset);
  const baseDisplaySizeRef = useRef(baseDisplaySize);

  // Keep refs in sync
  React.useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);

  React.useEffect(() => {
    displayedImageSizeRef.current = displayedImageSize;
  }, [displayedImageSize]);

  React.useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  React.useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  React.useEffect(() => {
    imageOffsetRef.current = imageOffset;
  }, [imageOffset]);

  React.useEffect(() => {
    baseDisplaySizeRef.current = baseDisplaySize;
  }, [baseDisplaySize]);

  // Get original image dimensions
  React.useEffect(() => {
    if (imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageSize({ width, height });
          // Calculate displayed size (fit to container)
          const aspectRatio = width / height;
          let displayWidth = SCREEN_WIDTH - 48;
          let displayHeight = displayWidth / aspectRatio;
          
          if (displayHeight > IMAGE_CONTAINER_HEIGHT) {
            displayHeight = IMAGE_CONTAINER_HEIGHT;
            displayWidth = displayHeight * aspectRatio;
          }
          
          setDisplayedImageSize({ width: displayWidth, height: displayHeight });
          setBaseDisplaySize({ width: displayWidth, height: displayHeight });
          displayedImageSizeRef.current = { width: displayWidth, height: displayHeight };
          baseDisplaySizeRef.current = { width: displayWidth, height: displayHeight };
          
          // Set initial crop box centered
          const initialCropWidth = Math.min(displayWidth * 0.85, displayWidth - 20);
          const initialCropHeight = Math.min(displayHeight * 0.4, 150);
          const initialCropBox = {
            x: (displayWidth - initialCropWidth) / 2,
            y: (displayHeight - initialCropHeight) / 2,
            width: initialCropWidth,
            height: initialCropHeight,
          };
          setCropBox(initialCropBox);
          cropBoxRef.current = initialCropBox;
        },
        (error) => console.error('Failed to get image size:', error)
      );
    }
  }, [imageUri]);

  // Handle zoom changes
  const handleZoom = (direction: 'in' | 'out') => {
    if (isProcessing) return;
    
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM)
      : Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
    
    if (newZoom === zoomLevel) return;
    
    setZoomLevel(newZoom);
    
    // Update displayed image size based on zoom
    const newWidth = baseDisplaySize.width * newZoom;
    const newHeight = baseDisplaySize.height * newZoom;
    setDisplayedImageSize({ width: newWidth, height: newHeight });
    displayedImageSizeRef.current = { width: newWidth, height: newHeight };
    
    // Adjust crop box position to stay within bounds
    const maxX = newWidth - cropBox.width;
    const maxY = newHeight - cropBox.height;
    
    // Scale crop box position with zoom
    const scaleFactor = newZoom / zoomLevel;
    let newCropX = cropBox.x * scaleFactor;
    let newCropY = cropBox.y * scaleFactor;
    
    // Constrain to bounds
    newCropX = Math.max(0, Math.min(newCropX, maxX));
    newCropY = Math.max(0, Math.min(newCropY, maxY));
    
    const newCropBox = {
      ...cropBox,
      x: newCropX,
      y: newCropY,
    };
    setCropBox(newCropBox);
    cropBoxRef.current = newCropBox;
  };

  // Create pan responder for the crop box
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessingRef.current,
      onMoveShouldSetPanResponder: () => !isProcessingRef.current,
      onPanResponderGrant: () => {
        if (isProcessingRef.current) return;
        // Store the starting position when gesture begins
        startCropBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (isProcessingRef.current) return;
        
        const { dx, dy } = gestureState;
        const displaySize = displayedImageSizeRef.current;
        const startBox = startCropBoxRef.current;

        let newX = startBox.x + dx;
        let newY = startBox.y + dy;

        // Constrain to image bounds
        newX = Math.max(0, Math.min(newX, displaySize.width - startBox.width));
        newY = Math.max(0, Math.min(newY, displaySize.height - startBox.height));

        const newCropBox = {
          ...startBox,
          x: newX,
          y: newY,
        };

        setCropBox(newCropBox);
        cropBoxRef.current = newCropBox;
        setHasCropped(true);
      },
    })
  ).current;

  // Create pan responders for corner handles
  const createCornerPanResponder = (corner: 'tl' | 'tr' | 'bl' | 'br') => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isProcessingRef.current,
      onMoveShouldSetPanResponder: () => !isProcessingRef.current,
      onPanResponderGrant: () => {
        if (isProcessingRef.current) return;
        startCropBoxRef.current = { ...cropBoxRef.current };
      },
      onPanResponderMove: (
        _: GestureResponderEvent,
        gestureState: PanResponderGestureState
      ) => {
        if (isProcessingRef.current) return;
        
        const { dx, dy } = gestureState;
        const displaySize = displayedImageSizeRef.current;
        const startBox = startCropBoxRef.current;

        let { x, y, width, height } = startBox;

        switch (corner) {
          case 'br': // Bottom Right - resize width and height
            width = Math.max(MIN_CROP_SIZE, Math.min(startBox.width + dx, displaySize.width - x));
            height = Math.max(MIN_CROP_SIZE, Math.min(startBox.height + dy, displaySize.height - y));
            break;
          case 'bl': // Bottom Left - move x, resize width and height
            const newWidthBL = Math.max(MIN_CROP_SIZE, startBox.width - dx);
            const newXBL = startBox.x + startBox.width - newWidthBL;
            if (newXBL >= 0) {
              x = newXBL;
              width = newWidthBL;
            }
            height = Math.max(MIN_CROP_SIZE, Math.min(startBox.height + dy, displaySize.height - y));
            break;
          case 'tr': // Top Right - move y, resize width and height
            width = Math.max(MIN_CROP_SIZE, Math.min(startBox.width + dx, displaySize.width - x));
            const newHeightTR = Math.max(MIN_CROP_SIZE, startBox.height - dy);
            const newYTR = startBox.y + startBox.height - newHeightTR;
            if (newYTR >= 0) {
              y = newYTR;
              height = newHeightTR;
            }
            break;
          case 'tl': // Top Left - move x and y, resize width and height
            const newWidthTL = Math.max(MIN_CROP_SIZE, startBox.width - dx);
            const newXTL = startBox.x + startBox.width - newWidthTL;
            const newHeightTL = Math.max(MIN_CROP_SIZE, startBox.height - dy);
            const newYTL = startBox.y + startBox.height - newHeightTL;
            if (newXTL >= 0) {
              x = newXTL;
              width = newWidthTL;
            }
            if (newYTL >= 0) {
              y = newYTL;
              height = newHeightTL;
            }
            break;
        }

        const newCropBox = { x, y, width, height };
        setCropBox(newCropBox);
        cropBoxRef.current = newCropBox;
        setHasCropped(true);
      },
    });
  };

  const tlPanResponder = useRef(createCornerPanResponder('tl')).current;
  const trPanResponder = useRef(createCornerPanResponder('tr')).current;
  const blPanResponder = useRef(createCornerPanResponder('bl')).current;
  const brPanResponder = useRef(createCornerPanResponder('br')).current;

  const handleScanIngredients = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to process.');
      return;
    }

    setIsProcessing(true);

    try {
      // Calculate crop coordinates relative to original image
      // Account for zoom level when calculating the actual crop region
      const effectiveDisplayWidth = baseDisplaySize.width * zoomLevel;
      const effectiveDisplayHeight = baseDisplaySize.height * zoomLevel;
      
      const scaleX = imageSize.width / effectiveDisplayWidth;
      const scaleY = imageSize.height / effectiveDisplayHeight;

      const cropOriginX = Math.max(0, Math.round(cropBox.x * scaleX));
      const cropOriginY = Math.max(0, Math.round(cropBox.y * scaleY));
      let cropWidth = Math.round(cropBox.width * scaleX);
      let cropHeight = Math.round(cropBox.height * scaleY);
      
      // Ensure crop doesn't exceed image bounds
      cropWidth = Math.min(cropWidth, imageSize.width - cropOriginX);
      cropHeight = Math.min(cropHeight, imageSize.height - cropOriginY);

      console.log('[DEBUG] Original image size:', imageSize.width, 'x', imageSize.height);
      console.log('[DEBUG] Zoom level:', zoomLevel);
      console.log('[DEBUG] Displayed size:', displayedImageSize.width, 'x', displayedImageSize.height);
      console.log('[DEBUG] Crop box (display):', cropBox);
      console.log('[DEBUG] Crop region (actual):', cropOriginX, cropOriginY, cropWidth, cropHeight);

      // Crop the image
      const croppedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropOriginX,
              originY: cropOriginY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('[DEBUG] Cropped image URI:', croppedImage.uri);

      // Convert cropped image to base64
      const base64 = await FileSystem.readAsStringAsync(croppedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('[DEBUG] Base64 length:', base64.length, '(~', Math.round(base64.length * 0.75 / 1024), 'KB)');

      // Get user profile (diet and allergies)
      const profile = await getProfile();

      // Call the backend API
      const response = await scanIngredients(base64, profile);

      if (!response.success) {
        Alert.alert('Scan Failed', response.error || 'Could not analyze ingredients. Please try again.');
        return;
      }

      // Save to history and get the history item
      const historyItem = await addScanToHistory(response, profile.diet);

      // Navigate to results screen with the scan data
      router.replace({
        pathname: '/scan-results',
        params: { 
          scanId: historyItem.id,
        },
      });

    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to analyze image. Make sure the backend is running and accessible.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    router.back();
  };

  if (!imageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No image provided</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ingredient Scan</Text>
        <Text style={styles.headerSubtitle}>Certification-grade ingredient analysis</Text>
      </View>

      {/* Image with Crop Overlay */}
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={zoomLevel > 1 && !isProcessing}
          contentContainerStyle={styles.scrollContent}
        >
          <ScrollView
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={zoomLevel > 1 && !isProcessing}
            nestedScrollEnabled
          >
            <View 
              style={[
                styles.imageWrapper,
                {
                  width: displayedImageSize.width || SCREEN_WIDTH - 48,
                  height: displayedImageSize.height || IMAGE_CONTAINER_HEIGHT,
                }
              ]}
            >
              {/* Image */}
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.image,
                  {
                    width: displayedImageSize.width || SCREEN_WIDTH - 48,
                    height: displayedImageSize.height || IMAGE_CONTAINER_HEIGHT,
                  },
                ]}
                resizeMode="contain"
              />

              {/* Dark overlay - top */}
              <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: cropBox.y }]} />
              {/* Dark overlay - bottom */}
              <View style={[styles.overlay, { top: cropBox.y + cropBox.height, left: 0, right: 0, bottom: 0 }]} />
              {/* Dark overlay - left */}
              <View style={[styles.overlay, { top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }]} />
              {/* Dark overlay - right */}
              <View style={[styles.overlay, { top: cropBox.y, left: cropBox.x + cropBox.width, right: 0, height: cropBox.height }]} />

              {/* Crop Box - disabled when processing */}
              {displayedImageSize.width > 0 && (
                <View
                  style={[
                    styles.cropBox,
                    {
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                    },
                    isProcessing && styles.cropBoxDisabled,
                  ]}
                  {...(isProcessing ? {} : panResponder.panHandlers)}
                >
                  {/* Grid lines */}
                  <View style={[styles.gridLine, { top: '33%', left: 0, right: 0, height: 1 }]} />
                  <View style={[styles.gridLine, { top: '66%', left: 0, right: 0, height: 1 }]} />
                  <View style={[styles.gridLine, { left: '33%', top: 0, bottom: 0, width: 1 }]} />
                  <View style={[styles.gridLine, { left: '66%', top: 0, bottom: 0, width: 1 }]} />
                </View>
              )}

              {/* Corner handles - hidden when processing */}
              {displayedImageSize.width > 0 && !isProcessing && (
                <>
                  <View
                    style={[styles.cornerHandle, { left: cropBox.x - 12, top: cropBox.y - 12 }]}
                    {...tlPanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, { left: cropBox.x + cropBox.width - 12, top: cropBox.y - 12 }]}
                    {...trPanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, { left: cropBox.x - 12, top: cropBox.y + cropBox.height - 12 }]}
                    {...blPanResponder.panHandlers}
                  />
                  <View
                    style={[styles.cornerHandle, { left: cropBox.x + cropBox.width - 12, top: cropBox.y + cropBox.height - 12 }]}
                    {...brPanResponder.panHandlers}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </ScrollView>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <Pressable
            style={[
              styles.zoomButton,
              zoomLevel <= MIN_ZOOM && styles.zoomButtonDisabled,
            ]}
            onPress={() => handleZoom('out')}
            disabled={zoomLevel <= MIN_ZOOM || isProcessing}
          >
            <Ionicons 
              name="remove" 
              size={20} 
              color={zoomLevel <= MIN_ZOOM ? Colors.gray400 : Colors.white} 
            />
          </Pressable>
          <Text style={styles.zoomText}>{zoomLevel.toFixed(1)}x</Text>
          <Pressable
            style={[
              styles.zoomButton,
              zoomLevel >= MAX_ZOOM && styles.zoomButtonDisabled,
            ]}
            onPress={() => handleZoom('in')}
            disabled={zoomLevel >= MAX_ZOOM || isProcessing}
          >
            <Ionicons 
              name="add" 
              size={20} 
              color={zoomLevel >= MAX_ZOOM ? Colors.gray400 : Colors.white} 
            />
          </Pressable>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.buttonPressed,
            isProcessing && styles.scanButtonDisabled,
          ]}
          onPress={handleScanIngredients}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons name="checkmark" size={20} color={Colors.white} />
          )}
          <Text style={styles.scanButtonText}>
            {isProcessing ? 'Analyzing...' : 'Scan Ingredients'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.retakeButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleRetake}
          disabled={isProcessing}
        >
          <Ionicons name="refresh" size={20} color={Colors.gray600} />
        </Pressable>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Crop ONLY the ingredient list</Text>
        <Text style={styles.instructionSubtitle}>
          Use +/- buttons to zoom in on small text. Drag the box to position it.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.gray500,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: Colors.gray600,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4ADE80',
    backgroundColor: 'transparent',
  },
  cropBoxDisabled: {
    borderColor: '#86EFAC',
  },
  cornerHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#4ADE80',
    borderRadius: 4,
    zIndex: 10,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  zoomText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  scanButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    width: 56,
    height: 56,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  instructions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  instructionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    textAlign: 'center',
  },
});
