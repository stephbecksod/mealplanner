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
  // Support both cocktails array and single cocktail
  const cocktails = beveragePairing?.cocktails ||
    (beveragePairing?.cocktail ? [beveragePairing.cocktail] : [])
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

  const handleRemoveCocktail = (cocktailItem) => {
    Alert.alert(
      'Remove Cocktail',
      `Remove "${cocktailItem.name}" from this meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCocktail(dinner.id, cocktailItem.id)
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
            {/* Placeholder to align with side dishes/cocktails that have remove button */}
            <View style={styles.removePlaceholder} />
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

        {/* Cocktails */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{cocktails.length > 1 ? 'COCKTAILS' : 'COCKTAIL'}</Text>
        </View>
        {cocktails.length > 0 ? (
          cocktails.map((cocktailItem, index) => {
            const isSaved = isCocktailSaved(cocktailItem)
            return (
              <View key={cocktailItem.id || index} style={styles.itemRow}>
                <TouchableOpacity
                  style={styles.itemInfo}
                  onPress={() => setShowBeverageModal({ beverage: cocktailItem, type: 'cocktail' })}
                >
                  <Text style={styles.itemName}>{cocktailItem.name}</Text>
                </TouchableOpacity>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => setShowBeverageModal({ beverage: cocktailItem, type: 'cocktail' })}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.starButton, isSaved && styles.starButtonActive]}
                    onPress={() => handleToggleCocktailFavorite(cocktailItem)}
                  >
                    <StarIcon filled={isSaved} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveCocktail(cocktailItem)}
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
  const { mealPlan, groceryList, regenerateMeal, removeMeal, clearMealPlan, loading, addMeal, generateNewMeal } = useMealPlan()
  const { savedRecipes } = useFavorites()
  const [showClearModal, setShowClearModal] = useState(false)
  const [addingMeal, setAddingMeal] = useState(false)
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [generatingMeal, setGeneratingMeal] = useState(false)


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

  const handleGenerateNewMeal = async () => {
    setGeneratingMeal(true)
    try {
      await generateNewMeal(4)
      setShowAddMealModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to generate new meal')
    } finally {
      setGeneratingMeal(false)
    }
  }

  const handleAddFromFavorites = async (recipe) => {
    setAddingMeal(true)
    try {
      await addMeal(recipe, 4)
      setShowAddMealModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal from favorites')
    } finally {
      setAddingMeal(false)
    }
  }

  // Get recipes that are not already in the meal plan
  const getAvailableFavorites = () => {
    const existingRecipeNames = mealPlan.dinners
      .filter(d => d.mainDish)
      .map(d => d.mainDish.name.toLowerCase())

    return savedRecipes.filter(
      recipe => !existingRecipeNames.includes(recipe.name.toLowerCase())
    )
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

        {loading && !generatingMeal && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Updating...</Text>
          </View>
        )}

        {mealPlan.dinners.map((dinner, index) => (
          <MealCard
            key={dinner.id}
            dinner={dinner}
            dayIndex={index}
            onRegenerate={() => handleRegenerate(dinner.id)}
            onRemove={() => handleRemove(dinner.id)}
            loading={loading || generatingMeal}
          />
        ))}

        {/* Loading indicator for new meal - appears between meals and button */}
        {generatingMeal && (
          <View style={styles.generatingMealOverlay}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.generatingMealText}>Generating new meal...</Text>
          </View>
        )}

        {canAddMoreMeals && (
          <TouchableOpacity
            style={[styles.addMealButton, generatingMeal && styles.addMealButtonDisabled]}
            onPress={() => setShowAddMealModal(true)}
            disabled={loading || generatingMeal}
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

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMealModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addMealModalContent}>
            <View style={styles.addMealModalHeader}>
              <Text style={styles.modalTitle}>Add Meal</Text>
              <TouchableOpacity onPress={() => setShowAddMealModal(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Generate New Meal Option */}
            <TouchableOpacity
              style={[styles.addMealOption, styles.addMealOptionPrimary, generatingMeal && styles.addMealOptionDisabled]}
              onPress={handleGenerateNewMeal}
              disabled={generatingMeal || addingMeal}
            >
              {generatingMeal ? (
                <View style={styles.addMealOptionLoading}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={styles.addMealOptionPrimaryText}>Generating New Meal...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.addMealOptionIcon}>⚡</Text>
                  <Text style={styles.addMealOptionPrimaryText}>Generate New Meal</Text>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.addMealOptionSubtext}>Let AI create a new recipe for you</Text>

            {/* Add Custom Recipe Option */}
            <TouchableOpacity
              style={styles.addMealOption}
              onPress={() => {
                setShowAddMealModal(false)
                Alert.alert('Coming Soon', 'Custom recipe entry will be available in a future update.')
              }}
            >
              <Text style={styles.addMealOptionIcon}>✏️</Text>
              <Text style={styles.addMealOptionText}>Add Custom Recipe</Text>
            </TouchableOpacity>
            <Text style={styles.addMealOptionSubtext}>Enter your own recipe manually</Text>

            {/* Divider */}
            <View style={styles.addMealDivider}>
              <View style={styles.addMealDividerLine} />
              <Text style={styles.addMealDividerText}>or add from favorites</Text>
              <View style={styles.addMealDividerLine} />
            </View>

            {/* Favorites Section */}
            <ScrollView style={styles.favoritesScrollView} showsVerticalScrollIndicator={false}>
              {(() => {
                const availableFavorites = getAvailableFavorites()

                if (savedRecipes.length === 0) {
                  return (
                    <Text style={styles.noFavoritesText}>No favorites saved</Text>
                  )
                }

                if (availableFavorites.length === 0) {
                  return (
                    <View style={styles.allFavoritesInPlan}>
                      <Text style={styles.allFavoritesInPlanText}>
                        All favorite meals are already included in the meal plan
                      </Text>
                    </View>
                  )
                }

                return availableFavorites.map((recipe) => (
                  <View key={recipe.id} style={styles.favoriteItem}>
                    <View style={styles.favoriteItemInfo}>
                      <Text style={styles.favoriteItemName}>{recipe.name}</Text>
                      <Text style={styles.favoriteItemCuisine}>{recipe.cuisine}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addFromFavoriteButton}
                      onPress={() => handleAddFromFavorites(recipe)}
                      disabled={addingMeal}
                    >
                      {addingMeal ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.addFromFavoriteText}>Add to Week</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              })()}
            </ScrollView>

            <TouchableOpacity
              style={styles.addMealCancelButton}
              onPress={() => setShowAddMealModal(false)}
            >
              <Text style={styles.addMealCancelText}>Cancel</Text>
            </TouchableOpacity>
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
  removePlaceholder: {
    width: 28,
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
  addMealButtonDisabled: {
    opacity: 0.6,
  },
  addMealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generatingMealOverlay: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generatingMealText: {
    marginTop: 12,
    fontSize: 16,
    color: '#16A34A',
    fontWeight: '500',
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
  modalCloseButton: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  addMealModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  addMealModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addMealOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  addMealOptionPrimary: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  addMealOptionDisabled: {
    opacity: 0.7,
  },
  addMealOptionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addMealOptionIcon: {
    fontSize: 20,
  },
  addMealOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  addMealOptionPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  addMealOptionSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  addMealDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  addMealDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  addMealDividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  favoritesScrollView: {
    maxHeight: 200,
    marginBottom: 16,
  },
  noFavoritesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  allFavoritesInPlan: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
  },
  allFavoritesInPlanText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  favoriteItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  favoriteItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  favoriteItemCuisine: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  addFromFavoriteButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  addFromFavoriteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addMealCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addMealCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
})

export default MealPlanScreen
