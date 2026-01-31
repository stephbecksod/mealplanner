import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealPlan } from '../context/MealPlanContext'

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'Keto',
  'Paleo',
]

const CUISINE_OPTIONS = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'Mediterranean',
  'American',
  'French',
  'Korean',
]

const PROTEIN_OPTIONS = [
  'Chicken',
  'Beef',
  'Pork',
  'Fish/Seafood',
  'Tofu/Tempeh',
  'Lamb',
  'Turkey',
  'Shrimp',
]

const Home = () => {
  const navigate = useNavigate()
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

  const toggleDietary = (option) => {
    setSelectedDietary(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    )
  }

  const toggleCuisine = (option) => {
    setSelectedCuisines(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    )
  }

  const toggleProtein = (option) => {
    setSelectedProteins(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    )
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
      navigate('/meal-plan')
    } catch (err) {
      console.error('Failed to generate meal plan:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Plan Your Week's Dinners
        </h1>
        <p className="text-gray-600 text-lg">
          Generate a customized meal plan with smart grocery lists
        </p>
      </div>

      <div className="card space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            How many dinners per week?
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                onClick={() => setNumberOfMeals(num)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  numberOfMeals === num
                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Servings per meal
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value))}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Dietary Preferences (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => toggleDietary(option)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedDietary.includes(option)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Cuisine Preferences (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => toggleCuisine(option)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedCuisines.includes(option)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Protein Preferences (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {PROTEIN_OPTIONS.map(option => (
              <button
                key={option}
                onClick={() => toggleProtein(option)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedProteins.includes(option)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Include Side Dishes
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Generate complementary side dishes with each meal
              </p>
            </div>
            <button
              onClick={() => setIncludeSides(!includeSides)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeSides ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includeSides ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Include Cocktails
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Generate a cocktail pairing for each meal
              </p>
            </div>
            <button
              onClick={() => setIncludeCocktails(!includeCocktails)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeCocktails ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includeCocktails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Include Wine Pairing
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Generate a wine pairing suggestion for each meal
              </p>
            </div>
            <button
              onClick={() => setIncludeWine(!includeWine)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                includeWine ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  includeWine ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Prioritize Ingredient Overlap
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Design meals to share ingredients and simplify shopping
              </p>
            </div>
            <button
              onClick={() => setPrioritizeOverlap(!prioritizeOverlap)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prioritizeOverlap ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prioritizeOverlap ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'btn-primary shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating your meal plan...
            </span>
          ) : (
            'Generate Meal Plan'
          )}
        </button>
      </div>
    </div>
  )
}

export default Home
