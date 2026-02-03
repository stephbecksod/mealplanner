import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useFavorites } from '../context/FavoritesContext'

const RecipeCard = ({ recipe, onRemove }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{recipe.name}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
    <View style={styles.timeRow}>
      <Text style={styles.timeText}>Prep: {recipe.prepTime} min</Text>
      <Text style={styles.timeText}>Cook: {recipe.cookTime} min</Text>
    </View>
  </View>
)

const CocktailCard = ({ cocktail, onRemove }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{cocktail.name}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
    {cocktail.flavorProfile && (
      <Text style={styles.flavorText}>{cocktail.flavorProfile}</Text>
    )}
  </View>
)

const SideDishCard = ({ sideDish, onRemove }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>{sideDish.name}</Text>
      <TouchableOpacity onPress={onRemove}>
        <Text style={styles.removeText}>Remove</Text>
      </TouchableOpacity>
    </View>
    {sideDish.type && (
      <Text style={styles.typeText}>{sideDish.type}</Text>
    )}
  </View>
)

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

  const [activeTab, setActiveTab] = useState('recipes')

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
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
      return savedRecipes.map((recipe, index) => (
        <RecipeCard
          key={recipe.id || index}
          recipe={recipe}
          onRemove={() => toggleRecipe(recipe)}
        />
      ))
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
      return savedCocktails.map((cocktail, index) => (
        <CocktailCard
          key={cocktail.id || index}
          cocktail={cocktail}
          onRemove={() => toggleCocktail(cocktail)}
        />
      ))
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
      return savedSideDishes.map((sideDish, index) => (
        <SideDishCard
          key={sideDish.id || index}
          sideDish={sideDish}
          onRemove={() => toggleSideDish(sideDish)}
        />
      ))
    }
  }

  return (
    <View style={styles.container}>
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
          style={[styles.tab, activeTab === 'cocktails' && styles.tabActive]}
          onPress={() => setActiveTab('cocktails')}
        >
          <Text style={[styles.tabText, activeTab === 'cocktails' && styles.tabTextActive]}>
            Cocktails ({savedCocktails.length})
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
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  removeText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
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
})

export default FavoritesScreen
