import { useState } from 'react'

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
  'Other',
]

const CATEGORY_OPTIONS = [
  'produce',
  'protein',
  'dairy',
  'pantry',
  'spices',
  'other',
]

const CustomMealForm = ({ onSubmit, onCancel, loading }) => {
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [servings, setServings] = useState(4)
  const [prepTime, setPrepTime] = useState('')
  const [cookTime, setCookTime] = useState('')
  const [ingredients, setIngredients] = useState([
    { item: '', quantity: '', category: 'produce' },
  ])
  const [instructions, setInstructions] = useState([''])
  const [errors, setErrors] = useState({})

  const addIngredient = () => {
    setIngredients([...ingredients, { item: '', quantity: '', category: 'produce' }])
  }

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index, field, value) => {
    const updated = [...ingredients]
    updated[index][field] = value
    setIngredients(updated)
  }

  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index))
    }
  }

  const updateInstruction = (index, value) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  const validate = () => {
    const newErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Recipe name is required'
    }

    const validIngredients = ingredients.filter(i => i.item.trim() && i.quantity.trim())
    if (validIngredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient with item and quantity is required'
    }

    const validInstructions = instructions.filter(i => i.trim())
    if (validInstructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) return

    const recipe = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      cuisine: cuisine || 'American',
      servings: parseInt(servings) || 4,
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      ingredients: ingredients
        .filter(i => i.item.trim() && i.quantity.trim())
        .map(i => ({
          item: i.item.trim(),
          quantity: i.quantity.trim(),
          category: i.category,
        })),
      instructions: instructions.filter(i => i.trim()),
      dietaryInfo: [],
      isCustom: true,
    }

    onSubmit(recipe, servings)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Recipe Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Recipe Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Grandma's Chicken Pot Pie"
          className={`input-field ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Cuisine and Servings row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cuisine
          </label>
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            className="input-field"
          >
            <option value="">Select cuisine...</option>
            {CUISINE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Servings
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Prep and Cook time row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Prep Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={prepTime}
            onChange={(e) => setPrepTime(e.target.value)}
            placeholder="Optional"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cook Time (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value)}
            placeholder="Optional"
            className="input-field"
          />
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ingredients *
        </label>
        {errors.ingredients && (
          <p className="text-red-500 text-sm mb-2">{errors.ingredients}</p>
        )}
        <div className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                value={ingredient.item}
                onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                placeholder="Ingredient name"
                className="input-field flex-1"
              />
              <input
                type="text"
                value={ingredient.quantity}
                onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                placeholder="Quantity (e.g., 2 cups)"
                className="input-field w-32"
              />
              <select
                value={ingredient.category}
                onChange={(e) => updateIngredient(index, 'category', e.target.value)}
                className="input-field w-28"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                disabled={ingredients.length === 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ingredient
        </button>
      </div>

      {/* Instructions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Instructions *
        </label>
        {errors.instructions && (
          <p className="text-red-500 text-sm mb-2">{errors.instructions}</p>
        )}
        <div className="space-y-2">
          {instructions.map((instruction, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="text-gray-500 font-medium pt-2 w-6 text-right">
                {index + 1}.
              </span>
              <textarea
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder={`Step ${index + 1}`}
                rows={2}
                className="input-field flex-1 resize-none"
              />
              <button
                type="button"
                onClick={() => removeInstruction(index)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                disabled={instructions.length === 1}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addInstruction}
          className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Step
        </button>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding...
            </>
          ) : (
            'Add Recipe'
          )}
        </button>
      </div>
    </form>
  )
}

export default CustomMealForm
