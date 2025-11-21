import { useState } from 'react'
import { useMealPlan } from '../context/MealPlanContext'
import { groupByCategory } from '../utils/groceryUtils'

const GroceryList = () => {
  const { groceryList, updateGroceryItem, addManualGroceryItem } = useMealPlan()
  const [newItem, setNewItem] = useState('')

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Grocery List</h2>

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
