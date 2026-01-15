import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { getScanHistory, ScanHistoryItem, ComplianceStatus, deleteScan, renameScan } from '@/services/storage';
import { loadScanHistory as loadCloudHistory, deleteScan as deleteCloudScan } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_NAME_LENGTH = 30;

// Re-export types for other screens
export type { ComplianceStatus, ScanHistoryItem } from '@/services/storage';

type FilterType = 'all' | ComplianceStatus;

interface FilterOption {
  id: FilterType;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const filterOptions: FilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'compliant', label: 'Compliant', icon: 'checkmark-circle-outline' },
  { id: 'conditionally', label: 'Conditionally', icon: 'alert-circle-outline' },
  { id: 'not_compliant', label: 'Not Compliant' },
];

const statusConfig = {
  compliant: {
    label: 'Compliant',
    color: '#7A9F7A',
    icon: 'checkmark-circle' as const,
  },
  conditionally: {
    label: 'Conditionally\nCompliant',
    color: '#C4A574',
    icon: 'alert-circle' as const,
  },
  not_compliant: {
    label: 'Not\nCompliant',
    color: '#A08080',
    icon: 'close-circle' as const,
  },
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const [historyData, setHistoryData] = useState<ScanHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScanHistoryItem | null>(null);
  const modalScaleAnim = useRef(new Animated.Value(0)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // Track animated values for each item (for slide-out animation)
  const itemAnimations = useRef<{ [key: string]: Animated.Value }>({});
  
  const getItemAnimation = (id: string) => {
    if (!itemAnimations.current[id]) {
      itemAnimations.current[id] = new Animated.Value(0);
    }
    return itemAnimations.current[id];
  };

  // Load history on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      // Always load local history first
      const localData = await getScanHistory();

      // For authenticated users, also try to load cloud history
      if (user) {
        try {
          const cloudData = await loadCloudHistory();
          // Convert cloud data to local format and merge
          const cloudItems: ScanHistoryItem[] = cloudData.map((item: any) => ({
            id: item.id,
            productName: item.product_name || 'Unknown Product',
            date: new Date(item.scan_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: new Date(item.scan_timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            timestamp: new Date(item.scan_timestamp).getTime(),
            ingredientsCount: item.analysis?.length || 0,
            status: determineStatus(item.diet_verdict),
            imageColor: '#E8D4B8',
            diet: item.diet_verdict?.halal ? 'halal' : item.diet_verdict?.kosher ? 'kosher' : null,
            dietVerdict: item.diet_verdict,
            ingredients: item.analysis || [],
            allergens: item.allergens || [],
            detectedLanguage: item.detected_language,
          }));

          // Merge cloud and local, preferring local items with same ID
          const localIds = new Set(localData.map(item => item.id));
          const uniqueCloudItems = cloudItems.filter(item => !localIds.has(item.id));
          const mergedData = [...localData, ...uniqueCloudItems].sort((a, b) => b.timestamp - a.timestamp);

          setHistoryData(mergedData);
        } catch (cloudError) {
          console.log('[History] Cloud sync failed, using local only:', cloudError);
          setHistoryData(localData);
        }
      } else {
        setHistoryData(localData);
      }

      // Reset animations for new items
      itemAnimations.current = {};
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine compliance status from diet verdict
  const determineStatus = (dietVerdict: any): ComplianceStatus => {
    if (!dietVerdict) return 'conditionally';
    const halal = dietVerdict.halal;
    const kosher = dietVerdict.kosher;
    if (halal?.status === 'HALAL' || kosher?.status === 'KOSHER_CONFIRMED') return 'compliant';
    if (halal?.status === 'HARAM' || kosher?.status === 'NOT_KOSHER') return 'not_compliant';
    return 'conditionally';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };
  
  // Show delete confirmation modal with animation
  const showDeleteModal = (item: ScanHistoryItem) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
    
    // Animate modal in
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Hide modal with animation
  const hideDeleteModal = () => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDeleteModalVisible(false);
      setItemToDelete(null);
    });
  };
  
  // Perform delete with slide-out animation
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const itemId = itemToDelete.id;
    const animation = getItemAnimation(itemId);
    
    // First, hide the modal
    hideDeleteModal();
    
    // Wait a bit for modal to close, then animate the item out
    setTimeout(() => {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        // After animation, delete from storage and update state
        try {
          await deleteScan(itemId);
          // Also delete from cloud for authenticated users (non-blocking)
          if (user) {
            deleteCloudScan(itemId).catch((err) => {
              console.log('[History] Cloud delete skipped:', err?.message);
            });
          }
          setHistoryData(prev => prev.filter(item => item.id !== itemId));
          // Clean up the animation reference
          delete itemAnimations.current[itemId];
        } catch (error) {
          console.error('Error deleting scan:', error);
        }
      });
    }, 100);
  };
  
  // Start inline editing
  const startEditing = (item: ScanHistoryItem) => {
    setEditingId(item.id);
    setEditingName(item.productName);
  };
  
  // Save inline edit (on blur or submit)
  const saveEdit = async (itemId: string) => {
    if (!editingName.trim()) {
      // If empty, revert to original name
      setEditingId(null);
      setEditingName('');
      return;
    }
    
    const trimmedName = editingName.trim().slice(0, MAX_NAME_LENGTH);
    
    try {
      await renameScan(itemId, trimmedName);
      setHistoryData(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, productName: trimmedName } 
            : item
        )
      );
    } catch (error) {
      console.error('Error renaming scan:', error);
    } finally {
      setEditingId(null);
      setEditingName('');
    }
  };

  const filteredHistory = useMemo(() => {
    let filtered = historyData;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === activeFilter);
    }

    return filtered;
  }, [historyData, searchQuery, activeFilter]);

  // Calculate summary stats
  const totalScans = historyData.length;
  const compliantCount = historyData.filter((i) => i.status === 'compliant').length;
  const notCompliantCount = historyData.filter((i) => i.status === 'not_compliant').length;
  const compliantPercent = totalScans > 0 ? Math.round((compliantCount / totalScans) * 100) : 0;
  const notCompliantPercent = totalScans > 0 ? Math.round((notCompliantCount / totalScans) * 100) : 0;

  const handleItemPress = (item: ScanHistoryItem) => {
    router.push({
      pathname: '/scan-results',
      params: { scanId: item.id },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSubtitle}>View your past ingredient scans</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scans..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {filterOptions.map((filter) => (
            <Pressable
              key={filter.id}
              style={[
                styles.filterPill,
                activeFilter === filter.id && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              {filter.icon && (
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={activeFilter === filter.id ? Colors.white : Colors.gray600}
                  style={styles.filterIcon}
                />
              )}
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Lifetime Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Lifetime Summary</Text>
            <Ionicons name="pie-chart-outline" size={20} color={Colors.gray400} />
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: statusConfig.compliant.color }]}>
                {compliantPercent}%
              </Text>
              <Text style={styles.statLabel}>Compliant</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: statusConfig.not_compliant.color }]}>
                {notCompliantPercent}%
              </Text>
              <Text style={styles.statLabel}>Not Compliant</Text>
            </View>
          </View>
        </View>

        {/* History List */}
        {filteredHistory.map((item) => {
          const animation = getItemAnimation(item.id);
          const translateX = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -SCREEN_WIDTH],
          });
          const opacity = animation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.5, 0],
          });
          
          return (
            <Animated.View
              key={item.id}
              style={{
                transform: [{ translateX }],
                opacity,
              }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.historyItem,
                  pressed && styles.historyItemPressed,
                ]}
                onPress={() => handleItemPress(item)}
              >
                {/* Product Image Placeholder */}
                <View style={[styles.productImage, { backgroundColor: item.imageColor }]}>
                  <Ionicons name="image-outline" size={24} color={Colors.gray500} />
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                  {/* Product Name with inline edit */}
                  <View style={styles.productNameRow}>
                    {editingId === item.id ? (
                      <TextInput
                        style={styles.productNameInput}
                        value={editingName}
                        onChangeText={(text) => setEditingName(text.slice(0, MAX_NAME_LENGTH))}
                        onBlur={() => saveEdit(item.id)}
                        onSubmitEditing={() => saveEdit(item.id)}
                        autoFocus
                        selectTextOnFocus
                        maxLength={MAX_NAME_LENGTH}
                        returnKeyType="done"
                      />
                    ) : (
                      <>
                        <Text style={styles.productName} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <Pressable
                          style={({ pressed }) => [
                            styles.editNameButton,
                            pressed && styles.editNameButtonPressed,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            startEditing(item);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="pencil" size={12} color={Colors.gray400} />
                        </Pressable>
                      </>
                    )}
                  </View>
                  <Text style={styles.productDate}>
                    {item.date} • {item.time}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productIngredients}>
                      {item.ingredientsCount} ingredients
                    </Text>
                    {item.diet && (
                      <View style={styles.dietBadge}>
                        <Text style={styles.dietBadgeText}>
                          {item.diet.charAt(0).toUpperCase() + item.diet.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusConfig[item.status].color },
                    ]}
                  >
                    <Ionicons
                      name={statusConfig[item.status].icon}
                      size={20}
                      color={Colors.white}
                    />
                    <Text style={styles.statusText}>
                      {statusConfig[item.status].label}
                    </Text>
                  </View>
                </View>

                {/* Delete Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.deleteButtonPressed,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    showDeleteModal(item);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.gray400} />
                </Pressable>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Empty State */}
        {historyData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyStateText}>No scans yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Scan your first ingredient list to see it here
            </Text>
            <Pressable 
              style={styles.emptyStateButton}
              onPress={() => router.navigate('/(tabs)/scan')}
            >
              <Text style={styles.emptyStateButtonText}>Start Scanning</Text>
            </Pressable>
          </View>
        )}

        {/* No Results State */}
        {historyData.length > 0 && filteredHistory.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={Colors.gray300} />
            <Text style={styles.emptyStateText}>No scans found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filter
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideDeleteModal}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={hideDeleteModal}
        >
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: modalOpacityAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: modalOpacityAnim,
                transform: [
                  { scale: modalScaleAnim },
                ],
              },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Modal Header with Icon */}
              <View style={styles.modalIconContainer}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name="trash" size={28} color="#A08080" />
                </View>
              </View>
              
              {/* Modal Title */}
              <Text style={styles.modalTitle}>Delete Scan?</Text>
              
              {/* Modal Message */}
              <Text style={styles.modalMessage}>
                Are you sure you want to delete{'\n'}
                <Text style={styles.modalProductName}>
                  "{itemToDelete?.productName}"
                </Text>
                ?{'\n'}This action cannot be undone.
              </Text>
              
              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonCancel,
                    pressed && styles.modalButtonPressed,
                  ]}
                  onPress={hideDeleteModal}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={({ pressed }) => [
                    styles.modalButton,
                    styles.modalButtonDelete,
                    pressed && styles.modalButtonDeletePressed,
                  ]}
                  onPress={confirmDelete}
                >
                  <Ionicons name="trash" size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.modalButtonDeleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray500,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.black,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  filterScroll: {
    marginBottom: Spacing.md,
    marginHorizontal: -Spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  filterPillActive: {
    backgroundColor: Colors.gray800,
    borderColor: Colors.gray800,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600,
  },
  filterTextActive: {
    color: Colors.white,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray500,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyItemPressed: {
    opacity: 0.8,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  productDate: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  productIngredients: {
    fontSize: 11,
    color: Colors.gray400,
  },
  dietBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.sm,
  },
  dietBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.gray600,
  },
  statusContainer: {
    marginRight: Spacing.xs,
  },
  statusBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 8,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.gray800,
    borderRadius: BorderRadius.lg,
  },
  emptyStateButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  // Delete Button Styles
  deleteButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  deleteButtonPressed: {
    opacity: 0.5,
  },
  // Inline Edit Styles
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  productNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  editNameButton: {
    padding: 4,
    marginLeft: 4,
  },
  editNameButtonPressed: {
    opacity: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    width: SCREEN_WIDTH - 64,
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  modalProductName: {
    fontWeight: '600',
    color: Colors.gray700,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  modalButtonPressed: {
    opacity: 0.8,
  },
  modalButtonCancel: {
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray700,
  },
  modalButtonDelete: {
    backgroundColor: '#D55555',
  },
  modalButtonDeletePressed: {
    backgroundColor: '#B44444',
  },
  modalButtonDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
