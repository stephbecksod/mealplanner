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
import { useFavorites } from '../context/FavoritesContext'
import { useMealPlan } from '../context/MealPlanContext'
import RecipeDetailModal from '../components/RecipeDetailModal'
import SideDishDetailModal from '../components/SideDishDetailModal'
import BeverageDetailModal from '../components/BeverageDetailModal'

const FavoritesScreen = () => {
  const {
    savedRecipes,
    savedCocktails,
    savedSideDishes,
    loading,
    toggleRecipe,
    toggleCocktail,
    toggleSideDish,
  } = useFavorites()

  const {
    mealPlan,
    addMeal,
    addSideDishToMeal,
    addAlaCarteSideDish,
    addCocktailToMeal,
    addAlaCarteCocktail,
  } = useMealPlan()

  const [activeTab, setActiveTab] = useState('recipes')
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [selectedCocktail, setSelectedCocktail] = useState(null)
  const [selectedSideDish, setSelectedSideDish] = useState(null)
  const [addToWeekModal, setAddToWeekModal] = useState(null) // { type: 'sideDish' | 'cocktail', item: object }
  const [addingItemId, setAddingItemId] = useState(null)
  const [recentlyAddedIds, setRecentlyAddedIds] = useState(new Set())

  // Get non-a-la-carte meals for the day selection
  const regularMeals = (mealPlan?.dinners || []).filter(d => !d.isAlaCarte)

  // Check if items are already in the meal plan
  const isRecipeInMealPlan = (recipeId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => d.mainDish?.id === recipeId)
  }

  const isSideDishInMealPlan = (sideDishId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => {
      const sides = d.sideDishes || []
      return sides.some(s => s.id === sideDishId || s.id?.startsWith(sideDishId))
    })
  }

  const isCocktailInMealPlan = (cocktailId) => {
    if (!mealPlan?.dinners) return false
    return mealPlan.dinners.some(d => {
      const cocktails = d.beveragePairing?.cocktails ||
        (d.beveragePairing?.cocktail ? [d.beveragePairing.cocktail] : [])
      return cocktails.some(c => c.id === cocktailId || c.id?.startsWith(cocktailId))
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  const handleRemoveRecipe = async (recipe) => {
    Alert.alert(
      'Remove Recipe',
      `Remove "${recipe.name}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleRecipe(recipe),
        },
      ]
    )
  }

  const handleRemoveCocktail = async (cocktail) => {
    Alert.alert(
      'Remove Cocktail',
      `Remove "${cocktail.name}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleCocktail(cocktail),
        },
      ]
    )
  }

  const handleRemoveSideDish = async (sideDish) => {
    Alert.alert(
      'Remove Side Dish',
      `Remove "${sideDish.name}" from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => toggleSideDish(sideDish),
        },
      ]
    )
  }

  // Add recipe directly as next day (no day picker)
  const handleAddRecipeToWeek = async (recipe) => {
    if (!mealPlan) {
      Alert.alert('No Meal Plan', 'Please generate a meal plan first before adding recipes.')
      return
    }

    setAddingItemId(recipe.id)
    try {
      await addMeal(recipe, 4)
      setRecentlyAddedIds(prev => new Set([...prev, recipe.id]))
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipe to meal plan.')
    } finally {
      setAddingItemId(null)
    }
  }

  // Add side dish to a specific day
  const handleAddSideDishToDay = async (mealId) => {
    if (!addToWeekModal || addToWeekModal.type !== 'sideDish') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addSideDishToMeal(mealId, addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } catch (error) {
      Alert.alert('Error', 'Failed to add side dish.')
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  // Add side dish as a la carte
  const handleAddSideDishAlaCarte = async () => {
    if (!addToWeekModal || addToWeekModal.type !== 'sideDish') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addAlaCarteSideDish(addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } catch (error) {
      Alert.alert('Error', 'Failed to add side dish.')
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  // Add cocktail to a specific day
  const handleAddCocktailToDay = async (mealId) => {
    if (!addToWeekModal || addToWeekModal.type !== 'cocktail') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addCocktailToMeal(mealId, addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } catch (error) {
      Alert.alert('Error', 'Failed to add cocktail.')
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  // Add cocktail as a la carte
  const handleAddCocktailAlaCarte = async () => {
    if (!addToWeekModal || addToWeekModal.type !== 'cocktail') return
    const itemId = addToWeekModal.item.id
    setAddingItemId(itemId)
    try {
      await addAlaCarteCocktail(addToWeekModal.item)
      setRecentlyAddedIds(prev => new Set([...prev, itemId]))
    } catch (error) {
      Alert.alert('Error', 'Failed to add cocktail.')
    } finally {
      setAddingItemId(null)
      setAddToWeekModal(null)
    }
  }

  const renderRecipeCard = (recipe, index) => {
    const isIncluded = isRecipeInMealPlan(recipe.id) || recentlyAddedIds.has(recipe.id)
    const isLoading = addingItemId === recipe.id

    return (
      <View key={recipe.id || index} style={styles.card}>
        <TouchableOpacity style={styles.cardContent} onPress={() => setSelectedRecipe(recipe)}>
          <Text style={styles.cardTitle}>{recipe.name}</Text>
          <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>Prep: {recipe.prepTime} min</Text>
            <Text style={styles.timeText}>Cook: {recipe.cookTime} min</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedRecipe(recipe)}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          {isLoading ? (
            <View style={styles.addingButton}>
              <ActivityIndicator size="small" color="#166534" />
              <Text style={styles.addingText}>Adding...</Text>
            </View>
          ) : isIncluded ? (
            <View style={styles.includedButton}>
              <Text style={styles.includedText}>Included in Week</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.addToPlanButton} onPress={() => handleAddRecipeToWeek(recipe)}>
              <Text style={styles.addToPlanText}>Add to Week</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleRemoveRecipe(recipe)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderSideDishCard = (sideDish, index) => {
    const isIncluded = isSideDishInMealPlan(sideDish.id) || recentlyAddedIds.has(sideDish.id)
    const isLoading = addingItemId === sideDish.id

    return (
      <View key={sideDish.id || index} style={styles.card}>
        <TouchableOpacity style={styles.cardContent} onPress={() => setSelectedSideDish(sideDish)}>
          <Text style={styles.cardTitle}>{sideDish.name}</Text>
          {sideDish.type && (
            <Text style={styles.typeText}>{sideDish.type}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedSideDish(sideDish)}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          {isLoading ? (
            <View style={styles.addingButton}>
              <ActivityIndicator size="small" color="#166534" />
              <Text style={styles.addingText}>Adding...</Text>
            </View>
          ) : isIncluded ? (
            <View style={styles.includedButton}>
              <Text style={styles.includedText}>Included in Week</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToPlanButton}
              onPress={() => setAddToWeekModal({ type: 'sideDish', item: sideDish })}
            >
              <Text style={styles.addToPlanText}>Add to Week</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleRemoveSideDish(sideDish)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderCocktailCard = (cocktail, index) => {
    const isIncluded = isCocktailInMealPlan(cocktail.id) || recentlyAddedIds.has(cocktail.id)
    const isLoading = addingItemId === cocktail.id

    return (
      <View key={cocktail.id || index} style={styles.card}>
        <TouchableOpacity style={styles.cardContent} onPress={() => setSelectedCocktail(cocktail)}>
          <Text style={styles.cardTitle}>{cocktail.name}</Text>
          {cocktail.flavorProfile && (
            <Text style={styles.flavorText} numberOfLines={2}>{cocktail.flavorProfile}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.viewButton} onPress={() => setSelectedCocktail(cocktail)}>
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          {isLoading ? (
            <View style={styles.addingButton}>
              <ActivityIndicator size="small" color="#166534" />
              <Text style={styles.addingText}>Adding...</Text>
            </View>
          ) : isIncluded ? (
            <View style={styles.includedButton}>
              <Text style={styles.includedText}>Included in Week</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addToPlanButton}
              onPress={() => setAddToWeekModal({ type: 'cocktail', item: cocktail })}
            >
              <Text style={styles.addToPlanText}>Add to Week</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleRemoveCocktail(cocktail)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderContent = () => {
    if (activeTab === 'recipes') {
      if (savedRecipes.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved recipes yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the star on any recipe to save it here
            </Text>
          </View>
        )
      }
      return savedRecipes.map(renderRecipeCard)
    }

    if (activeTab === 'sides') {
      if (savedSideDishes.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved side dishes yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the star on any side dish to save it here
            </Text>
          </View>
        )
      }
      return savedSideDishes.map(renderSideDishCard)
    }

    if (activeTab === 'cocktails') {
      if (savedCocktails.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved cocktails yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the star on any cocktail to save it here
            </Text>
          </View>
        )
      }
      return savedCocktails.map(renderCocktailCard)
    }
  }

  return (
    <View style={styles.container}>
      {/* Tab Bar - Order: Recipes, Sides, Cocktails */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
            Recipes ({savedRecipes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sides' && styles.tabActive]}
          onPress={() => setActiveTab('sides')}
        >
          <Text style={[styles.tabText, activeTab === 'sides' && styles.tabTextActive]}>
            Sides ({savedSideDishes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cocktails' && styles.tabActive]}
          onPress={() => setActiveTab('cocktails')}
        >
          <Text style={[styles.tabText, activeTab === 'cocktails' && styles.tabTextActive]}>
            Cocktails ({savedCocktails.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        visible={selectedRecipe !== null}
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onToggleFavorite={() => {
          if (selectedRecipe) {
            toggleRecipe(selectedRecipe)
            setSelectedRecipe(null)
          }
        }}
        isFavorite={true}
      />

      {/* Side Dish Detail Modal */}
      <SideDishDetailModal
        visible={selectedSideDish !== null}
        sideDish={selectedSideDish}
        onClose={() => setSelectedSideDish(null)}
        onToggleFavorite={() => {
          if (selectedSideDish) {
            toggleSideDish(selectedSideDish)
            setSelectedSideDish(null)
          }
        }}
        isFavorite={true}
      />

      {/* Cocktail Detail Modal */}
      <BeverageDetailModal
        visible={selectedCocktail !== null}
        beverage={selectedCocktail}
        type="cocktail"
        onClose={() => setSelectedCocktail(null)}
        onToggleFavorite={() => {
          if (selectedCocktail) {
            toggleCocktail(selectedCocktail)
            setSelectedCocktail(null)
          }
        }}
        isFavorite={true}
      />

      {/* Add to Week Modal for Side Dishes and Cocktails */}
      <Modal
        visible={addToWeekModal !== null}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {addToWeekModal?.type === 'sideDish' ? 'Side Dish' : 'Cocktail'} to Week
              </Text>
              <TouchableOpacity onPress={() => setAddToWeekModal(null)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalItemName}>
              Adding: {addToWeekModal?.item?.name}
            </Text>

            {regularMeals.length > 0 ? (
              <>
                <Text style={styles.modalSubtitle}>Select a day to add to:</Text>
                <View style={styles.dayPickerContainer}>
                  {regularMeals.map((meal, index) => {
                    const mainDishName = meal.mainDish?.name || 'No main dish'
                    return (
                      <TouchableOpacity
                        key={meal.id}
                        style={styles.dayButton}
                        onPress={() => {
                          if (addToWeekModal?.type === 'sideDish') {
                            handleAddSideDishToDay(meal.id)
                          } else {
                            handleAddCocktailToDay(meal.id)
                          }
                        }}
                      >
                        <Text style={styles.dayButtonLabel}>Day {index + 1}</Text>
                        <Text style={styles.dayButtonMeal} numberOfLines={1}>- {mainDishName}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            ) : (
              <Text style={styles.noMealPlanText}>
                No meal plan yet. You can add this as a la carte.
              </Text>
            )}

            <TouchableOpacity
              style={styles.alaCarteButton}
              onPress={() => {
                if (addToWeekModal?.type === 'sideDish') {
                  handleAddSideDishAlaCarte()
                } else {
                  handleAddCocktailAlaCarte()
                }
              }}
            >
              <Text style={styles.alaCarteButtonText}>Add a la carte</Text>
              <Text style={styles.alaCarteSubtext}>
                Add as a standalone item at the end of your meal plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setAddToWeekModal(null)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#16A34A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#16A34A',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cuisineText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 16,
  },
  flavorText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  typeText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 12,
  },
  viewButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  addToPlanButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
  },
  addToPlanText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  addingButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  includedButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
  },
  includedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#86EFAC',
  },
  removeText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  modalItemName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  dayPickerContainer: {
    marginBottom: 16,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  dayButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  dayButtonMeal: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  noMealPlanText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  alaCarteButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  alaCarteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 4,
  },
  alaCarteSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#374151',
    fontWeight: '600',
  },
})

export default FavoritesScreen
