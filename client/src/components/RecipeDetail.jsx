import { useState } from 'react'

const EQUIPMENT_LABELS = {
  oven: 'Oven',
  stovetop: 'Stovetop',
  grill: 'Grill',
  air_fryer: 'Air Fryer',
  instant_pot: 'Instant Pot',
  slow_cooker: 'Slow Cooker',
  sous_vide: 'Sous Vide',
  smoker: 'Smoker',
  dutch_oven: 'Dutch Oven',
  wok: 'Wok',
}

const RecipeDetail = ({ recipe, onClose }) => {
  const [expandedMethod, setExpandedMethod] = useState(null)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{recipe.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Prep Time</p>
              <p className="text-lg font-bold text-gray-800">{recipe.prepTime} min</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Cook Time</p>
              <p className="text-lg font-bold text-gray-800">{recipe.cookTime} min</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Servings</p>
              <p className="text-lg font-bold text-gray-800">{recipe.servings}</p>
            </div>
          </div>

          {/* Dietary Info and Equipment Tags */}
          {(recipe.dietaryInfo?.length > 0 || recipe.equipment?.length > 0) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.dietaryInfo?.map((info, idx) => (
                  <span key={`diet-${idx}`} className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    {info}
                  </span>
                ))}
                {recipe.equipment?.map((equip, idx) => (
                  <span key={`equip-${idx}`} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {EQUIPMENT_LABELS[equip] || equip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Methods Section */}
          {recipe.alternativeMethods?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Alternative Methods</h3>
              <div className="space-y-2">
                {recipe.alternativeMethods.map((method, idx) => (
                  <div key={idx} className="border border-blue-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedMethod(expandedMethod === idx ? null : idx)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      <span className="font-medium text-blue-700">
                        {method.label || EQUIPMENT_LABELS[method.equipment] || method.equipment}
                      </span>
                      <svg
                        className={`w-5 h-5 text-blue-500 transition-transform ${expandedMethod === idx ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedMethod === idx && method.notes && (
                      <div className="px-4 py-3 bg-white border-t border-blue-100">
                        <p className="text-gray-700 text-sm">{method.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span className="text-gray-700">
                    <span className="font-semibold">{ing.quantity}</span> {ing.item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="w-full btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeDetail
