import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native'
import { useMealPlan } from '../context/MealPlanContext'

const MealCard = ({ dinner, onRegenerate, onRemove, loading }) => {
  const { mainDish, sideDishes, beveragePairing, dayOfWeek } = dinner

  if (!mainDish) return null

  return (
    <View style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.dayLabel}>{dayOfWeek}</Text>
        <View style={styles.mealActions}>
          <TouchableOpacity onPress={onRegenerate} disabled={loading}>
            <Text style={styles.actionText}>Regenerate</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRemove} disabled={loading}>
            <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.mealName}>{mainDish.name}</Text>
      <Text style={styles.cuisineLabel}>{mainDish.cuisine}</Text>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>Prep: {mainDish.prepTime} min</Text>
        <Text style={styles.timeText}>Cook: {mainDish.cookTime} min</Text>
      </View>

      {sideDishes && sideDishes.length > 0 && (
        <View style={styles.sidesContainer}>
          <Text style={styles.sidesLabel}>Side Dishes:</Text>
          {sideDishes.map((side, index) => (
            <Text key={index} style={styles.sideItem}>• {side.name}</Text>
          ))}
        </View>
      )}

      {beveragePairing && (
        <View style={styles.beverageContainer}>
          {beveragePairing.cocktail && (
            <Text style={styles.beverageItem}>Cocktail: {beveragePairing.cocktail.name}</Text>
          )}
          {beveragePairing.wine && (
            <Text style={styles.beverageItem}>Wine: {beveragePairing.wine.type}</Text>
          )}
        </View>
      )}
    </View>
  )
}

const MealPlanScreen = ({ navigation }) => {
  const { mealPlan, groceryList, regenerateMeal, removeMeal, clearMealPlan, loading } = useMealPlan()
  const [showClearModal, setShowClearModal] = useState(false)

  if (!mealPlan || !mealPlan.dinners || mealPlan.dinners.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No meal plan yet</Text>
        <Text style={styles.emptyText}>Generate your first meal plan to get started!</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleRegenerate = async (mealId) => {
    const meal = mealPlan.dinners.find(d => d.id === mealId)
    Alert.alert(
      'Regenerate Meal',
      'Are you sure you want to regenerate this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            try {
              await regenerateMeal(mealId, {
                servings: meal.servings,
                dietaryPreferences: mealPlan.dietaryPreferences || [],
                cuisinePreferences: mealPlan.cuisinePreferences || [],
              })
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate meal')
            }
          },
        },
      ]
    )
  }

  const handleRemove = async (mealId) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMeal(mealId)
            } catch (error) {
              Alert.alert('Error', 'Failed to remove meal')
            }
          },
        },
      ]
    )
  }

  const handleClearAll = async () => {
    setShowClearModal(false)
    try {
      await clearMealPlan()
    } catch (error) {
      Alert.alert('Error', 'Failed to clear meal plan')
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>This Week's Meals</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setShowClearModal(true)}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Updating...</Text>
          </View>
        )}

        {mealPlan.dinners.map((dinner) => (
          <MealCard
            key={dinner.id}
            dinner={dinner}
            onRegenerate={() => handleRegenerate(dinner.id)}
            onRemove={() => handleRemove(dinner.id)}
            loading={loading}
          />
        ))}
      </ScrollView>

      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear All Meals?</Text>
            <Text style={styles.modalText}>This will remove all meals and start fresh.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleClearAll}
              >
                <Text style={styles.modalConfirmText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clearButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    textTransform: 'uppercase',
  },
  mealActions: {
    flexDirection: 'row',
  },
  actionText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
    marginRight: 16,
  },
  removeText: {
    color: '#DC2626',
  },
  mealName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cuisineLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 16,
  },
  sidesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sidesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  sideItem: {
    fontSize: 13,
    color: '#6B7280',
  },
  beverageContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  beverageItem: {
    fontSize: 13,
    color: '#6B7280',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 6,
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 6,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
})

export default MealPlanScreen
