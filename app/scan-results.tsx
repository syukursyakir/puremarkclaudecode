import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { getScanById, ScanHistoryItem, ComplianceStatus, getProfile, renameScan } from '@/services/storage';

const MAX_NAME_LENGTH = 30;

// Status configuration for UI display
const statusConfig = {
  compliant: {
    label: 'Compliant',
    color: '#7A9F7A',
    icon: 'checkmark-circle' as const,
    badgeLabel: 'COMPLIANT',
  },
  conditionally: {
    label: 'Conditionally Compliant',
    color: '#C4A574',
    icon: 'alert-circle' as const,
    badgeLabel: 'CONDITIONAL',
  },
  not_compliant: {
    label: 'Not Compliant',
    color: '#A08080',
    icon: 'close-circle' as const,
    badgeLabel: 'NOT COMPLIANT',
  },
};

// Get display text for diet-specific status
function getStatusLabel(item: ScanHistoryItem): string {
  if (!item.dietVerdict) return statusConfig[item.status].label;

  if (item.diet === 'halal' && item.dietVerdict.halal) {
    const status = item.dietVerdict.halal.status;
    if (status === 'HALAL') return 'Halal';
    if (status === 'HARAM') return 'Haram';
    return 'Needs Verification';
  }

  if (item.diet === 'kosher' && item.dietVerdict.kosher) {
    const status = item.dietVerdict.kosher.status;
    if (status === 'KOSHER_CONFIRMED') return 'Kosher';
    if (status === 'NOT_KOSHER') return 'Not Kosher';
    return 'Needs Certification';
  }

  if (item.diet === 'vegan' && item.dietVerdict.vegan) {
    const status = item.dietVerdict.vegan.status;
    if (status === 'COMPLIANT') return 'Vegan';
    if (status === 'NOT_COMPLIANT') return 'Not Vegan';
    return 'Uncertain';
  }

  if (item.diet === 'vegetarian' && item.dietVerdict.vegetarian) {
    const status = item.dietVerdict.vegetarian.status;
    if (status === 'COMPLIANT') return 'Vegetarian';
    if (status === 'NOT_COMPLIANT') return 'Not Vegetarian';
    return 'Uncertain';
  }

  if (item.diet === 'pescetarian' && item.dietVerdict.pescetarian) {
    const status = item.dietVerdict.pescetarian.status;
    if (status === 'COMPLIANT') return 'Pescetarian';
    if (status === 'NOT_COMPLIANT') return 'Not Pescetarian';
    return 'Uncertain';
  }

  return statusConfig[item.status].label;
}

function getIngredientStatusLabel(
  ingredient: ScanHistoryItem['ingredients'][0],
  diet: 'halal' | 'kosher' | 'vegan' | 'vegetarian' | 'pescetarian' | null
): string {
  if (diet === 'halal' && ingredient.halal) {
    const status = ingredient.halal.status;
    if (status === 'HALAL') return 'HALAL';
    if (status === 'HARAM') return 'HARAM';
    if (status === 'MUSHBOOH') return 'MUSHBOOH';
    return 'UNVERIFIED';
  }

  if (diet === 'kosher' && ingredient.kosher) {
    const status = ingredient.kosher.status;
    if (status === 'KOSHER_CONFIRMED') return 'KOSHER';
    if (status === 'NOT_KOSHER') return 'NOT KOSHER';
    return 'NEEDS CERT';
  }

  if (diet === 'vegan' && ingredient.vegan) {
    const status = ingredient.vegan.status;
    if (status === 'COMPLIANT') return 'VEGAN';
    if (status === 'NOT_COMPLIANT') return 'NOT VEGAN';
    return 'UNCERTAIN';
  }

  if (diet === 'vegetarian' && ingredient.vegetarian) {
    const status = ingredient.vegetarian.status;
    if (status === 'COMPLIANT') return 'VEGETARIAN';
    if (status === 'NOT_COMPLIANT') return 'NOT VEG';
    return 'UNCERTAIN';
  }

  if (diet === 'pescetarian' && ingredient.pescetarian) {
    const status = ingredient.pescetarian.status;
    if (status === 'COMPLIANT') return 'PESCETARIAN';
    if (status === 'NOT_COMPLIANT') return 'NOT PESC';
    return 'UNCERTAIN';
  }

  return statusConfig[ingredient.status].badgeLabel;
}

export default function ScanResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const [item, setItem] = useState<ScanHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [userAllergies, setUserAllergies] = useState<string[]>([]);

  // Inline rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState('');
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadScanData();
  }, [scanId]);

  const loadScanData = async () => {
    if (!scanId) {
      setLoading(false);
      return;
    }

    try {
      const [data, profile] = await Promise.all([
        getScanById(scanId),
        getProfile()
      ]);
      setItem(data);
      setUserAllergies(profile.allergies.map(a => a.toLowerCase()));
    } catch (error) {
      console.error('Error loading scan:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if an allergen matches the user's profile
  const isUserAllergen = (allergen: string): boolean => {
    const allergenLower = allergen.toLowerCase();
    return userAllergies.some(userAllergen =>
      allergenLower.includes(userAllergen) || userAllergen.includes(allergenLower)
    );
  };

  const handleBack = () => {
    router.back();
  };

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const toggleIngredient = (ingredientName: string) => {
    setExpandedIngredient(
      expandedIngredient === ingredientName ? null : ingredientName
    );
  };

  // Start editing the product name
  const startEditing = () => {
    if (item) {
      setEditingName(item.productName);
      setIsEditing(true);
      // Focus the input after state update
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  };

  // Save the edited name
  const saveEdit = async () => {
    if (!item || !scanId) return;

    const trimmedName = editingName.trim();
    if (!trimmedName) {
      // Revert to original if empty
      setIsEditing(false);
      setEditingName('');
      return;
    }

    const finalName = trimmedName.slice(0, MAX_NAME_LENGTH);

    try {
      await renameScan(scanId, finalName);
      setItem({ ...item, productName: finalName });
    } catch (error) {
      console.error('Error renaming product:', error);
    } finally {
      setIsEditing(false);
      setEditingName('');
      Keyboard.dismiss();
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingName('');
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gray600} />
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.gray400} />
          <Text style={styles.loadingText}>Scan not found</Text>
          <Pressable style={styles.backButtonLarge} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const config = statusConfig[item.status];
  const verdictReason = item.diet === 'halal' 
    ? item.dietVerdict?.halal?.reason 
    : item.dietVerdict?.kosher?.reason;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Scan Results</Text>
          <View style={styles.productNameRow}>
            {isEditing ? (
              <View style={styles.editingContainer}>
                <TextInput
                  ref={nameInputRef}
                  style={styles.productNameInput}
                  value={editingName}
                  onChangeText={(text) => setEditingName(text.slice(0, MAX_NAME_LENGTH))}
                  onBlur={saveEdit}
                  onSubmitEditing={saveEdit}
                  autoFocus
                  selectTextOnFocus
                  maxLength={MAX_NAME_LENGTH}
                  returnKeyType="done"
                  placeholder="Product name"
                  placeholderTextColor={Colors.gray400}
                />
                <Pressable onPress={cancelEdit} style={styles.cancelEditButton}>
                  <Ionicons name="close" size={16} color={Colors.gray500} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.productNameTouchable}
                onPress={startEditing}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Ionicons name="pencil" size={12} color={Colors.gray400} style={styles.editIcon} />
              </Pressable>
            )}
          </View>
        </View>
        <Pressable onPress={handleDone} style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: config.color },
            ]}
          >
            <Ionicons
              name={config.icon}
              size={32}
              color={Colors.white}
            />
            <Text style={styles.statusLabel}>
              {getStatusLabel(item)}
            </Text>
          </View>
          
          {/* Diet indicator */}
          {item.diet && (
            <View style={styles.dietIndicator}>
              <Text style={styles.dietIndicatorText}>
                {item.diet.charAt(0).toUpperCase() + item.diet.slice(1)} Analysis
              </Text>
            </View>
          )}
          
          {/* Verdict reason */}
          {verdictReason && (
            <Text style={styles.verdictReason}>{verdictReason}</Text>
          )}
        </View>

        {/* Detected Language */}
        {item.detectedLanguage && (
          <View style={styles.languageCard}>
            <Ionicons name="language-outline" size={16} color={Colors.gray500} />
            <Text style={styles.languageText}>
              Detected language: {item.detectedLanguage}
            </Text>
          </View>
        )}

        {/* Allergen Alerts */}
        {item.allergens && item.allergens.length > 0 && (
          <View style={styles.allergenCard}>
            <View style={styles.allergenHeader}>
              <Ionicons name="warning-outline" size={20} color="#C4A574" />
              <Text style={styles.allergenTitle}>Detected Allergens</Text>
            </View>

            {/* User's allergens found - DANGER */}
            {item.allergens.filter(isUserAllergen).length > 0 && (
              <View style={styles.userAllergenSection}>
                <View style={styles.dangerHeader}>
                  <Ionicons name="alert-circle" size={16} color="#D32F2F" />
                  <Text style={styles.dangerHeaderText}>Your Allergens Detected!</Text>
                </View>
                <View style={styles.allergenList}>
                  {item.allergens.filter(isUserAllergen).map((allergen, index) => (
                    <View key={index} style={styles.allergenPillDanger}>
                      <Text style={styles.allergenPillText}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Other allergens found - INFO */}
            {item.allergens.filter(a => !isUserAllergen(a)).length > 0 && (
              <View style={styles.otherAllergenSection}>
                <Text style={styles.otherAllergenLabel}>Other allergens in product:</Text>
                <View style={styles.allergenList}>
                  {item.allergens.filter(a => !isUserAllergen(a)).map((allergen, index) => (
                    <View key={index} style={styles.allergenPill}>
                      <Text style={styles.allergenPillText}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Ingredient Analysis */}
        <Text style={styles.sectionTitle}>
          Ingredient Analysis ({item.ingredientsCount})
        </Text>

        {item.ingredients.map((ingredient, index) => {
          const ingConfig = statusConfig[ingredient.status];
          const isExpanded = expandedIngredient === ingredient.name;
          const hasUserAllergen = ingredient.allergy_flag && isUserAllergen(ingredient.allergy_flag);

          // Get evidence text for expansion
          // Get evidence based on diet type
          const getEvidence = () => {
            switch (item.diet) {
              case 'halal': return ingredient.halal?.evidence;
              case 'kosher': return ingredient.kosher?.evidence;
              case 'vegan': return ingredient.vegan?.evidence;
              case 'vegetarian': return ingredient.vegetarian?.evidence;
              case 'pescetarian': return ingredient.pescetarian?.evidence;
              default: return undefined;
            }
          };
          const evidence = getEvidence();

          return (
            <Pressable
              key={`${ingredient.name}-${index}`}
              style={[
                styles.ingredientItem,
                hasUserAllergen && styles.ingredientItemDanger,
              ]}
              onPress={() => toggleIngredient(ingredient.name)}
            >
              <View style={styles.ingredientMain}>
                <View style={styles.ingredientNameRow}>
                  {hasUserAllergen && (
                    <Ionicons name="alert-circle" size={16} color="#D32F2F" style={styles.allergenIcon} />
                  )}
                  <Text style={[styles.ingredientName, hasUserAllergen && styles.ingredientNameDanger]}>
                    {ingredient.name}
                  </Text>
                </View>
                <View style={styles.ingredientRight}>
                  {hasUserAllergen && (
                    <View style={styles.allergenBadge}>
                      <Text style={styles.allergenBadgeText}>ALLERGEN</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.ingredientBadge,
                      { backgroundColor: ingConfig.color + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ingredientBadgeText,
                        { color: ingConfig.color },
                      ]}
                    >
                      {getIngredientStatusLabel(ingredient, item.diet)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.gray400}
                  />
                </View>
              </View>

              {/* Expanded details */}
              {isExpanded && evidence && evidence.length > 0 && (
                <View style={styles.ingredientDetails}>
                  {evidence.map((ev, evIndex) => (
                    <View key={evIndex} style={styles.evidenceRow}>
                      <View style={styles.evidenceDot} />
                      <Text style={styles.evidenceText}>{ev}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Disclaimer:</Text>
          <Text style={styles.disclaimerText}>
            Results are provided by AI-powered analysis and are for informational purposes only. 
            Always verify ingredients with manufacturers when in doubt about dietary compliance.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray500,
  },
  backButtonLarge: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray100,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    fontStyle: 'italic',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.gray500,
    flexShrink: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productNameTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editIcon: {
    marginLeft: 6,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productNameInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  cancelEditButton: {
    marginLeft: 8,
    padding: 4,
  },
  doneButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A9F7A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 4,
    textAlign: 'center',
  },
  dietIndicator: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
  },
  dietIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600,
  },
  verdictReason: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  languageText: {
    fontSize: 13,
    color: Colors.gray600,
  },
  allergenCard: {
    backgroundColor: '#FEF3E2',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  allergenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  allergenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B6914',
  },
  allergenList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  userAllergenSection: {
    marginBottom: Spacing.md,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dangerHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },
  otherAllergenSection: {
    marginTop: Spacing.sm,
  },
  otherAllergenLabel: {
    fontSize: 12,
    color: '#8B6914',
    marginBottom: Spacing.xs,
  },
  allergenPill: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#C4A574',
    borderRadius: BorderRadius.full,
  },
  allergenPillDanger: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#D32F2F',
    borderRadius: BorderRadius.full,
  },
  allergenPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  ingredientItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ingredientItemDanger: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  ingredientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  allergenIcon: {
    marginRight: 6,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.black,
    flex: 1,
  },
  ingredientNameDanger: {
    color: '#C62828',
    fontWeight: '600',
  },
  allergenBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#D32F2F',
    borderRadius: BorderRadius.sm,
    marginRight: 6,
  },
  allergenBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
  },
  ingredientRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ingredientBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
  },
  ingredientBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ingredientDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  evidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray400,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  evidenceText: {
    fontSize: 13,
    color: Colors.gray600,
    flex: 1,
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  disclaimerText: {
    ...Typography.bodySmall,
    color: Colors.gray500,
    lineHeight: 20,
  },
});
