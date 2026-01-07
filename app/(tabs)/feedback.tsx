import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const FEEDBACK_EMAIL = 'muhammad.syakir.mzack@gmail.com';
const MAX_IMAGES = 3;

type FeedbackType = 'bug' | 'feature' | 'uiux' | 'general';

interface FeedbackOption {
  id: FeedbackType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const feedbackOptions: FeedbackOption[] = [
  { id: 'bug', label: 'Bug Report', icon: 'bug-outline' },
  { id: 'feature', label: 'Feature Request', icon: 'bulb-outline' },
  { id: 'uiux', label: 'UI/UX Issue', icon: 'chatbubbles-outline' },
  { id: 'general', label: 'General Feedback', icon: 'chatbubble-outline' },
];

export default function FeedbackScreen() {
  const [selectedType, setSelectedType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (message.length < 10) {
      Alert.alert('Message Required', 'Please enter at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if mail composer is available
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          'Email Not Available',
          'Please set up an email account on your device to send feedback.',
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      // Get the feedback type label
      const feedbackTypeLabel = feedbackOptions.find(opt => opt.id === selectedType)?.label || selectedType;

      // Compose the email
      const result = await MailComposer.composeAsync({
        recipients: [FEEDBACK_EMAIL],
        subject: `[PureMark Feedback] ${feedbackTypeLabel}`,
        body: `
Feedback Type: ${feedbackTypeLabel}

Message:
${message}

---
Sent from PureMark App
Device Time: ${new Date().toLocaleString()}
        `.trim(),
        attachments: images,
      });

      if (result.status === MailComposer.MailComposerStatus.SENT) {
        Alert.alert(
          'Thank You! 🎉',
          'Your feedback has been sent successfully. We appreciate your input!',
          [{ text: 'OK' }]
        );
        // Reset form
        setMessage('');
        setImages([]);
        setSelectedType('bug');
      } else if (result.status === MailComposer.MailComposerStatus.CANCELLED) {
        // User cancelled, no action needed
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      Alert.alert(
        'Error',
        'Failed to open email. Please try again or contact us directly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPhotos = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit Reached', `You can only attach up to ${MAX_IMAGES} images.`);
      return;
    }

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to attach screenshots.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Feedback</Text>
          <Text style={styles.headerSubtitle}>Help improve certification accuracy</Text>
        </View>

        {/* Share Your Feedback Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>💬</Text>
          <Text style={styles.sectionTitle}>Share Your Feedback</Text>
        </View>

        {/* Feedback Form Card */}
        <View style={styles.formCard}>
          {/* Feedback Type */}
          <Text style={styles.fieldLabel}>Feedback Type</Text>
          <View style={styles.typeGrid}>
            {feedbackOptions.map((option) => (
              <Pressable
                key={option.id}
                style={[
                  styles.typeOption,
                  selectedType === option.id && styles.typeOptionSelected,
                ]}
                onPress={() => setSelectedType(option.id)}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={selectedType === option.id ? Colors.gray800 : Colors.gray500}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === option.id && styles.typeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Message Input */}
          <Text style={styles.fieldLabel}>Your Message</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>{message.length} characters</Text>
            <Text style={styles.characterCountText}>Min. 10 characters</Text>
          </View>

          {/* Attach Screenshots */}
          <View style={styles.attachHeader}>
            <Ionicons name="camera-outline" size={16} color={Colors.gray500} />
            <Text style={styles.attachLabel}>Attach Screenshots (Optional)</Text>
            <Text style={styles.imageCount}>{images.length}/{MAX_IMAGES}</Text>
          </View>

          {/* Image Preview Grid */}
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={uri} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#E74C3C" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Upload Button */}
          {images.length < MAX_IMAGES && (
            <Pressable
              style={({ pressed }) => [
                styles.uploadArea,
                pressed && styles.uploadAreaPressed,
              ]}
              onPress={handleUploadPhotos}
            >
              <Ionicons name="images-outline" size={32} color={Colors.gray400} />
              <Text style={styles.uploadTitle}>
                {images.length === 0 ? 'Upload Photos' : 'Add More Photos'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {images.length === 0 
                  ? 'Tap to select from gallery' 
                  : `${MAX_IMAGES - images.length} more available`}
              </Text>
            </Pressable>
          )}

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              (message.length < 10 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={message.length < 10 || isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color={Colors.white} />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Opening Email...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Ionicons name="send" size={18} color={Colors.white} />
                <Text style={[styles.submitButtonText, { marginLeft: 8 }]}>Submit Feedback</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    fontStyle: 'italic',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.gray500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    width: '48%',
  },
  typeOptionSelected: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray400,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
    marginLeft: Spacing.sm,
  },
  typeLabelSelected: {
    color: Colors.black,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  textInput: {
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.black,
    minHeight: 120,
  },
  characterCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  characterCountText: {
    fontSize: 12,
    color: Colors.gray400,
  },
  attachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  attachLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray500,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  imageCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray400,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.white,
    borderRadius: 11,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  uploadAreaPressed: {
    backgroundColor: Colors.gray100,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.sm,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: Colors.gray500,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#8BA888',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
