import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { useMealPlan } from '../context/MealPlanContext'

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'Keto', 'Paleo',
]

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'Mediterranean', 'American', 'French', 'Korean',
]

const PROTEIN_OPTIONS = [
  'Chicken', 'Beef', 'Pork', 'Fish/Seafood', 'Tofu/Tempeh', 'Lamb', 'Turkey', 'Shrimp',
]

const HomeScreen = ({ navigation }) => {
  const { generateMealPlan, loading, error } = useMealPlan()

  const [numberOfMeals, setNumberOfMeals] = useState(3)
  const [servings, setServings] = useState(4)
  const [selectedDietary, setSelectedDietary] = useState([])
  const [selectedCuisines, setSelectedCuisines] = useState([])
  const [selectedProteins, setSelectedProteins] = useState([])
  const [includeSides, setIncludeSides] = useState(false)
  const [includeCocktails, setIncludeCocktails] = useState(false)
  const [includeWine, setIncludeWine] = useState(false)
  const [prioritizeOverlap, setPrioritizeOverlap] = useState(true)

  const toggleOption = (option, selected, setSelected) => {
    if (selected.includes(option)) {
      setSelected(selected.filter(item => item !== option))
    } else {
      setSelected([...selected, option])
    }
  }

  const handleGenerate = async () => {
    try {
      await generateMealPlan({
        numberOfMeals,
        dietaryPreferences: selectedDietary,
        cuisinePreferences: selectedCuisines,
        proteinPreferences: selectedProteins,
        servings,
        includeSides,
        includeCocktails,
        includeWine,
        prioritizeOverlap,
      })
      navigation.navigate('MealPlan')
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate meal plan')
    }
  }

  const renderChips = (options, selected, setSelected) => (
    <View style={styles.chipContainer}>
      {options.map(option => (
        <TouchableOpacity
          key={option}
          style={[styles.chip, selected.includes(option) && styles.chipSelected]}
          onPress={() => toggleOption(option, selected, setSelected)}
        >
          <Text style={[styles.chipText, selected.includes(option) && styles.chipTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plan Your Week's Dinners</Text>
      <Text style={styles.subtitle}>Generate a customized meal plan with smart grocery lists</Text>

      <View style={styles.card}>
        {/* Number of Meals */}
        <Text style={styles.label}>How many dinners per week?</Text>
        <View style={styles.mealButtons}>
          {[1, 2, 3, 4, 5].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.mealButton, numberOfMeals === num && styles.mealButtonSelected]}
              onPress={() => setNumberOfMeals(num)}
            >
              <Text style={[styles.mealButtonText, numberOfMeals === num && styles.mealButtonTextSelected]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Servings */}
        <Text style={styles.label}>Servings per meal</Text>
        <View style={styles.servingsContainer}>
          <TouchableOpacity
            style={styles.servingsButton}
            onPress={() => setServings(Math.max(1, servings - 1))}
          >
            <Text style={styles.servingsButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.servingsText}>{servings}</Text>
          <TouchableOpacity
            style={styles.servingsButton}
            onPress={() => setServings(Math.min(12, servings + 1))}
          >
            <Text style={styles.servingsButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Dietary Preferences */}
        <Text style={styles.label}>Dietary Preferences (optional)</Text>
        {renderChips(DIETARY_OPTIONS, selectedDietary, setSelectedDietary)}

        {/* Cuisine Preferences */}
        <Text style={styles.label}>Cuisine Preferences (optional)</Text>
        {renderChips(CUISINE_OPTIONS, selectedCuisines, setSelectedCuisines)}

        {/* Protein Preferences */}
        <Text style={styles.label}>Protein Preferences (optional)</Text>
        {renderChips(PROTEIN_OPTIONS, selectedProteins, setSelectedProteins)}

        {/* Toggles */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Include Side Dishes</Text>
              <Text style={styles.toggleDescription}>Generate complementary sides</Text>
            </View>
            <Switch
              value={includeSides}
              onValueChange={setIncludeSides}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={includeSides ? '#16A34A' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Include Cocktails</Text>
              <Text style={styles.toggleDescription}>Generate cocktail pairings</Text>
            </View>
            <Switch
              value={includeCocktails}
              onValueChange={setIncludeCocktails}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={includeCocktails ? '#16A34A' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Include Wine Pairing</Text>
              <Text style={styles.toggleDescription}>Get wine suggestions</Text>
            </View>
            <Switch
              value={includeWine}
              onValueChange={setIncludeWine}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={includeWine ? '#16A34A' : '#9CA3AF'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Prioritize Ingredient Overlap</Text>
              <Text style={styles.toggleDescription}>Share ingredients across meals</Text>
            </View>
            <Switch
              value={prioritizeOverlap}
              onValueChange={setPrioritizeOverlap}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={prioritizeOverlap ? '#16A34A' : '#9CA3AF'}
            />
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>Generating...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20,
  },
  mealButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  mealButtonSelected: {
    backgroundColor: '#16A34A',
  },
  mealButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  mealButtonTextSelected: {
    color: '#fff',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
  },
  servingsText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#16A34A',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#fff',
  },
  toggleContainer: {
    marginTop: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
})

export default HomeScreen
