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

const Home = () => {
  const navigate = useNavigate()
  const { generateMealPlan, loading, error } = useMealPlan()

  const [numberOfMeals, setNumberOfMeals] = useState(3)
  const [servings, setServings] = useState(4)
  const [selectedDietary, setSelectedDietary] = useState([])
  const [selectedCuisines, setSelectedCuisines] = useState([])

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

  const handleGenerate = async () => {
    try {
      await generateMealPlan({
        numberOfMeals,
        dietaryPreferences: selectedDietary,
        cuisinePreferences: selectedCuisines,
        servings,
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
