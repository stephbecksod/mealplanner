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
import { useFavorites } from '../context/FavoritesContext'
import RecipeDetailModal from '../components/RecipeDetailModal'
import SideDishDetailModal from '../components/SideDishDetailModal'
import BeverageDetailModal from '../components/BeverageDetailModal'

const StarIcon = ({ filled, size = 16 }) => (
  <Text style={{ fontSize: size, color: filled ? '#EAB308' : '#9CA3AF' }}>
    {filled ? '\u2605' : '\u2606'}
  </Text>
)

const PlusIcon = () => (
  <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: 'bold' }}>+</Text>
)

const CloseIcon = () => (
  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u00D7'}</Text>
)

const MealCard = ({ dinner, dayIndex, onRegenerate, onRemove, loading: parentLoading }) => {
  const { mainDish, sideDishes, beveragePairing, servings } = dinner
  const dayLabel = `Day ${dayIndex + 1}`

  const {
    isRecipeSaved,
    isCocktailSaved,
    isSideDishSaved,
    toggleRecipe,
    toggleCocktail,
    toggleSideDish,
  } = useFavorites()

  const {
    loading,
    addSideDish,
    removeSideDish,
    addCocktail,
    removeCocktail,
    addWinePairing,
    removeWinePairing,
  } = useMealPlan()

  const [showRecipeModal, setShowRecipeModal] = useState(false)
  const [showSideModal, setShowSideModal] = useState(null)
  const [showBeverageModal, setShowBeverageModal] = useState(null)
  const [loadingAction, setLoadingAction] = useState(null)

  if (!mainDish) return null

  const isMainSaved = isRecipeSaved(mainDish)
  const cocktail = beveragePairing?.cocktail
  const wine = beveragePairing?.wine
  const totalTime = (mainDish.prepTime || 0) + (mainDish.cookTime || 0)

  const handleToggleMainFavorite = async () => {
    try {
      await toggleRecipe(mainDish)
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites')
    }
  }

  const handleToggleSideFavorite = async (side) => {
    try {
      await toggleSideDish(side)
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites')
    }
  }

  const handleToggleCocktailFavorite = async (cocktailItem) => {
    try {
      await toggleCocktail(cocktailItem)
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites')
    }
  }

  const handleAddSideDish = async () => {
    setLoadingAction('sideDish')
    try {
      await addSideDish(dinner.id)
    } catch (error) {
      Alert.alert('Error', 'Failed to generate side dish')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRemoveSideDish = (side) => {
    Alert.alert(
      'Remove Side Dish',
      `Remove "${side.name}" from this meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSideDish(dinner.id, side.id)
            } catch (error) {
              Alert.alert('Error', 'Failed to remove side dish')
            }
          },
        },
      ]
    )
  }

  const handleAddCocktail = async () => {
    setLoadingAction('cocktail')
    try {
      await addCocktail(dinner.id)
    } catch (error) {
      Alert.alert('Error', 'Failed to generate cocktail')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRemoveCocktail = () => {
    Alert.alert(
      'Remove Cocktail',
      `Remove "${cocktail.name}" from this meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCocktail(dinner.id)
            } catch (error) {
              Alert.alert('Error', 'Failed to remove cocktail')
            }
          },
        },
      ]
    )
  }

  const handleAddWine = async () => {
    setLoadingAction('wine')
    try {
      await addWinePairing(dinner.id)
    } catch (error) {
      Alert.alert('Error', 'Failed to generate wine pairing')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleRemoveWine = () => {
    Alert.alert(
      'Remove Wine Pairing',
      `Remove "${wine.type}" from this meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWinePairing(dinner.id)
            } catch (error) {
              Alert.alert('Error', 'Failed to remove wine pairing')
            }
          },
        },
      ]
    )
  }

  const isDisabled = loading || parentLoading || loadingAction

  return (
    <>
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          <View style={styles.mealActions}>
            <TouchableOpacity onPress={onRegenerate} disabled={isDisabled}>
              <Text style={[styles.actionText, isDisabled && styles.disabledText]}>Regenerate</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRemove} disabled={isDisabled}>
              <Text style={[styles.actionText, styles.removeText, isDisabled && styles.disabledText]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Dish */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MAIN</Text>
        </View>
        <View style={styles.itemRow}>
          <TouchableOpacity style={styles.itemInfo} onPress={() => setShowRecipeModal(true)}>
            <Text style={styles.mainDishName}>{mainDish.name}</Text>
            <Text style={styles.itemMeta}>{mainDish.cuisine} | {totalTime} min | {servings} servings</Text>
            {mainDish.dietaryInfo && mainDish.dietaryInfo.length > 0 && (
              <View style={styles.badgeRow}>
                {mainDish.dietaryInfo.slice(0, 3).map((info, idx) => (
                  <View key={idx} style={styles.badge}>
                    <Text style={styles.badgeText}>{info}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => setShowRecipeModal(true)}
            >
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.starButton, isMainSaved && styles.starButtonActive]}
              onPress={handleToggleMainFavorite}
            >
              <StarIcon filled={isMainSaved} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Side Dishes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SIDES</Text>
        </View>
        {sideDishes && sideDishes.length > 0 ? (
          sideDishes.map((side, index) => {
            const isSaved = isSideDishSaved(side)
            return (
              <View key={side.id || index} style={styles.itemRow}>
                <TouchableOpacity style={styles.itemInfo} onPress={() => setShowSideModal(side)}>
                  <Text style={styles.itemName}>{side.name}</Text>
                  {side.type && <Text style={styles.itemMeta}>{side.type}</Text>}
                </TouchableOpacity>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setShowSideModal(side)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.starButton, isSaved && styles.starButtonActive]}
                    onPress={() => handleToggleSideFavorite(side)}
                  >
                    <StarIcon filled={isSaved} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSideDish(side)}
                    disabled={isDisabled}
                  >
                    <CloseIcon />
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        ) : null}
        <TouchableOpacity
          style={[styles.addButton, loadingAction === 'sideDish' && styles.addButtonLoading]}
          onPress={handleAddSideDish}
          disabled={isDisabled}
        >
          {loadingAction === 'sideDish' ? (
            <ActivityIndicator size="small" color="#16A34A" />
          ) : (
            <>
              <PlusIcon />
              <Text style={styles.addButtonText}>Add Side Dish</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cocktail */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>COCKTAIL</Text>
        </View>
        {cocktail ? (
          <View style={styles.itemRow}>
            <TouchableOpacity
              style={styles.itemInfo}
              onPress={() => setShowBeverageModal({ beverage: cocktail, type: 'cocktail' })}
            >
              <Text style={styles.itemName}>{cocktail.name}</Text>
            </TouchableOpacity>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => setShowBeverageModal({ beverage: cocktail, type: 'cocktail' })}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.starButton, isCocktailSaved(cocktail) && styles.starButtonActive]}
                onPress={() => handleToggleCocktailFavorite(cocktail)}
              >
                <StarIcon filled={isCocktailSaved(cocktail)} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveCocktail}
                disabled={isDisabled}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonPurple, loadingAction === 'cocktail' && styles.addButtonLoading]}
            onPress={handleAddCocktail}
            disabled={isDisabled}
          >
            {loadingAction === 'cocktail' ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <>
                <PlusIcon />
                <Text style={[styles.addButtonText, styles.addButtonTextPurple]}>Add Cocktail</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Wine */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>WINE</Text>
        </View>
        {wine ? (
          <View style={styles.itemRow}>
            <TouchableOpacity
              style={styles.itemInfo}
              onPress={() => setShowBeverageModal({ beverage: wine, type: 'wine' })}
            >
              <Text style={styles.itemName}>{wine.type}</Text>
            </TouchableOpacity>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => setShowBeverageModal({ beverage: wine, type: 'wine' })}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              <View style={styles.starPlaceholder} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveWine}
                disabled={isDisabled}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonPurple, loadingAction === 'wine' && styles.addButtonLoading]}
            onPress={handleAddWine}
            disabled={isDisabled}
          >
            {loadingAction === 'wine' ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <>
                <PlusIcon />
                <Text style={[styles.addButtonText, styles.addButtonTextPurple]}>Add Wine Pairing</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <RecipeDetailModal
        visible={showRecipeModal}
        recipe={mainDish}
        onClose={() => setShowRecipeModal(false)}
        onToggleFavorite={handleToggleMainFavorite}
        isFavorite={isMainSaved}
      />

      <SideDishDetailModal
        visible={showSideModal !== null}
        sideDish={showSideModal}
        onClose={() => setShowSideModal(null)}
        onToggleFavorite={() => showSideModal && handleToggleSideFavorite(showSideModal)}
        isFavorite={showSideModal ? isSideDishSaved(showSideModal) : false}
      />

      <BeverageDetailModal
        visible={showBeverageModal !== null}
        beverage={showBeverageModal?.beverage}
        type={showBeverageModal?.type}
        onClose={() => setShowBeverageModal(null)}
        onToggleFavorite={
          showBeverageModal?.type === 'cocktail'
            ? () => handleToggleCocktailFavorite(showBeverageModal.beverage)
            : undefined
        }
        isFavorite={
          showBeverageModal?.type === 'cocktail' && showBeverageModal?.beverage
            ? isCocktailSaved(showBeverageModal.beverage)
            : false
        }
      />
    </>
  )
}

const MealPlanScreen = ({ navigation }) => {
  const { mealPlan, groceryList, regenerateMeal, removeMeal, clearMealPlan, loading, addMeal } = useMealPlan()
  const [showClearModal, setShowClearModal] = useState(false)
  const [addingMeal, setAddingMeal] = useState(false)


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

  const handleAddMeal = async () => {
    setAddingMeal(true)
    try {
      // Generate a new meal using the existing preferences
      const { mealsAPI } = require('../services/api')
      const existingMeals = mealPlan.dinners
        .filter(d => d.mainDish)
        .map(d => ({
          name: d.mainDish.name,
          ingredients: d.mainDish.ingredients?.map(i => i.item) || [],
        }))

      const newRecipe = await mealsAPI.regenerateMeal({
        dietaryPreferences: mealPlan.dietaryPreferences || [],
        cuisinePreferences: mealPlan.cuisinePreferences || [],
        proteinPreferences: mealPlan.proteinPreferences || [],
        servings: 4,
        includeSides: true,
        existingMeals,
        prioritizeOverlap: mealPlan.prioritizeOverlap !== false,
      })

      const { sideDish, ...mainDish } = newRecipe

      // Day is determined by index, no need to specify
      await addMeal({
        mainDish,
        sideDishes: sideDish ? [sideDish] : [],
        servings: 4,
        beveragePairing: null,
        isAlaCarte: false,
      })
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal')
    } finally {
      setAddingMeal(false)
    }
  }

  const canAddMoreMeals = mealPlan.dinners.length < 7

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

        {(loading || addingMeal) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>{addingMeal ? 'Adding meal...' : 'Updating...'}</Text>
          </View>
        )}

        {mealPlan.dinners.map((dinner, index) => (
          <MealCard
            key={dinner.id}
            dinner={dinner}
            dayIndex={index}
            onRegenerate={() => handleRegenerate(dinner.id)}
            onRemove={() => handleRemove(dinner.id)}
            loading={loading || addingMeal}
          />
        ))}

        {canAddMoreMeals && (
          <TouchableOpacity
            style={styles.addMealButton}
            onPress={handleAddMeal}
            disabled={loading || addingMeal}
          >
            <Text style={styles.addMealButtonText}>+ Add Another Meal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Clear All Modal */}
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    marginLeft: 16,
  },
  removeText: {
    color: '#DC2626',
  },
  disabledText: {
    opacity: 0.5,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  mainDishName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  itemMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#16A34A',
  },
  starButton: {
    padding: 6,
    borderRadius: 6,
  },
  starButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  starPlaceholder: {
    width: 28,
  },
  removeButton: {
    padding: 6,
    borderRadius: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 6,
  },
  addButtonLoading: {
    backgroundColor: '#F9FAFB',
  },
  addButtonPurple: {
    borderColor: '#DDD6FE',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButtonTextPurple: {
    color: '#7C3AED',
  },
  addMealButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addMealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 20,
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
