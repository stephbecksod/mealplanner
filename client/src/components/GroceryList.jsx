import { useState, useEffect } from 'react'
import { useMealPlan } from '../context/MealPlanContext'
import { groupByCategory } from '../utils/groceryUtils'

const GroceryList = () => {
  const { groceryList, updateGroceryItem, addManualGroceryItem, refreshGroceryList, mealPlan } = useMealPlan()
  const [newItem, setNewItem] = useState('')
  const [includeBeverages, setIncludeBeverages] = useState(false)
  const [checkedWines, setCheckedWines] = useState({})

  // Check if any meals have beverage pairings
  const hasCocktails = mealPlan?.dinners?.some(d => d.beveragePairing?.cocktail) || false
  const hasWines = mealPlan?.dinners?.some(d => d.beveragePairing?.wine) || false
  const hasBeverages = hasCocktails || hasWines

  // Get unique wines from meal plan
  const wines = mealPlan?.dinners
    ?.filter(d => d.beveragePairing?.wine)
    ?.map(d => d.beveragePairing.wine.type) || []
  const uniqueWines = [...new Set(wines)]

  // Refresh grocery list when beverage toggle changes
  useEffect(() => {
    if (groceryList && hasCocktails) {
      refreshGroceryList(includeBeverages)
    }
  }, [includeBeverages])

  if (!groceryList) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">No grocery list available. Generate a meal plan first!</p>
      </div>
    )
  }

  const groupedItems = groupByCategory(groceryList.items)

  const handleAddItem = (e) => {
    e.preventDefault()
    if (newItem.trim()) {
      addManualGroceryItem(newItem.trim())
      setNewItem('')
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Grocery List</h2>

      {hasBeverages && (
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mb-4">
          <div>
            <span className="text-sm font-medium text-purple-800">Include beverage ingredients</span>
          </div>
          <button
            onClick={() => setIncludeBeverages(!includeBeverages)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              includeBeverages ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                includeBeverages ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      <form onSubmit={handleAddItem} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add custom item..."
            className="flex-1 input-field"
          />
          <button type="submit" className="btn-primary">
            Add
          </button>
        </div>
      </form>

      {groupedItems.map(({ category, items }) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 capitalize">
            {category}
          </h3>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateGroceryItem(item.id, e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mr-3"
                />
                <span className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  <span className="font-semibold">{item.quantity}</span> {item.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {includeBeverages && hasWines && uniqueWines.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Wines
          </h3>
          <ul className="space-y-2">
            {uniqueWines.map((wine, idx) => (
              <li key={idx} className="flex items-center">
                <input
                  type="checkbox"
                  checked={checkedWines[wine] || false}
                  onChange={(e) => setCheckedWines(prev => ({ ...prev, [wine]: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mr-3"
                />
                <span className={`flex-1 ${checkedWines[wine] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  <span className="font-semibold">1 bottle</span> {wine}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {groceryList.manualItems && groceryList.manualItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Custom Items
          </h3>
          <ul className="space-y-2">
            {groceryList.manualItems.map((item) => (
              <li key={item.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateGroceryItem(item.id, e.target.checked)}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mr-3"
                />
                <span className={`flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default GroceryList
