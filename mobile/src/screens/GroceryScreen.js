import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, TextInput, Modal, FlatList } from 'react-native'
import { useMealPlan } from '../context/MealPlanContext'

const GROCERY_CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'protein', label: 'Protein' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'spices', label: 'Spices' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
]

const CategoryDropdown = ({ value, onSelect }) => {
  const [visible, setVisible] = useState(false)
  const selectedCategory = GROCERY_CATEGORIES.find(c => c.value === value)

  return (
    <>
      <TouchableOpacity style={styles.categoryDropdown} onPress={() => setVisible(true)}>
        <Text style={styles.categoryDropdownText}>
          {selectedCategory?.label || 'Other'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownTitle}>Select Category</Text>
            <FlatList
              data={GROCERY_CATEGORIES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownOption, value === item.value && styles.dropdownOptionSelected]}
                  onPress={() => {
                    onSelect(item.value)
                    setVisible(false)
                  }}
                >
                  <Text style={[styles.dropdownOptionText, value === item.value && styles.dropdownOptionTextSelected]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Text style={styles.dropdownCheckmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const GroceryScreen = () => {
  const { groceryList, mealPlan, updateGroceryItem, addManualGroceryItem, refreshGroceryList } = useMealPlan()
  const [newItem, setNewItem] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('other')
  const [includeBeverages, setIncludeBeverages] = useState(false)
  const [checkedWines, setCheckedWines] = useState({})

  // Check if any meals have beverage pairings (support both old and new format)
  const hasCocktails = mealPlan?.dinners?.some(d => {
    const cocktails = d.beveragePairing?.cocktails || (d.beveragePairing?.cocktail ? [d.beveragePairing.cocktail] : [])
    return cocktails.length > 0
  }) || false
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

  if (!groceryList || !groceryList.items || groceryList.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No grocery list</Text>
        <Text style={styles.emptyText}>Generate a meal plan to create your grocery list</Text>
      </View>
    )
  }

  const handleAddItem = () => {
    if (newItem.trim()) {
      addManualGroceryItem(newItem.trim(), newItemCategory)
      setNewItem('')
      setNewItemCategory('other')
    }
  }

  // Combine regular items with manual items that have categories
  const allItems = [
    ...groceryList.items,
    ...(groceryList.manualItems || []).filter(item => item.category && item.category !== 'other'),
  ]

  // Get manual items without category or with 'other' category
  const uncategorizedManualItems = (groceryList.manualItems || []).filter(
    item => !item.category || item.category === 'other'
  )

  // Group items by category
  const categories = {}
  for (const item of allItems) {
    const category = item.category || 'other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(item)
  }

  const categoryOrder = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'beverages', 'other']
  const sortedCategories = Object.keys(categories).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.toLowerCase())
    const bIndex = categoryOrder.indexOf(b.toLowerCase())
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const handleToggleItem = (itemId, currentChecked) => {
    updateGroceryItem(itemId, !currentChecked)
  }

  const handleToggleWine = (wine) => {
    setCheckedWines(prev => ({ ...prev, [wine]: !prev[wine] }))
  }

  const checkedCount = groceryList.items.filter(i => i.checked).length
  const totalCount = groceryList.items.length

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.progressText}>{checkedCount} / {totalCount} items</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(checkedCount / totalCount) * 100}%` }]} />
      </View>

      {hasBeverages && (
        <View style={styles.beverageToggle}>
          <Text style={styles.beverageToggleText}>Include beverage ingredients</Text>
          <Switch
            value={includeBeverages}
            onValueChange={setIncludeBeverages}
            trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
            thumbColor={includeBeverages ? '#7C3AED' : '#9CA3AF'}
          />
        </View>
      )}

      <View style={styles.addItemContainer}>
        <View style={styles.addItemRow}>
          <TextInput
            style={styles.addItemInput}
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Add custom item..."
            placeholderTextColor="#9CA3AF"
          />
          <CategoryDropdown
            value={newItemCategory}
            onSelect={setNewItemCategory}
          />
        </View>
        <TouchableOpacity
          style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
          onPress={handleAddItem}
          disabled={!newItem.trim()}
        >
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      {sortedCategories.map(category => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Text>
          {categories[category].map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => handleToggleItem(item.id, item.checked)}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.checked && styles.itemChecked]}>
                  {item.item}
                </Text>
                <Text style={[styles.itemQuantity, item.checked && styles.itemChecked]}>
                  {item.quantity}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {includeBeverages && hasWines && uniqueWines.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Wines</Text>
          {uniqueWines.map((wine, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.itemRow}
              onPress={() => handleToggleWine(wine)}
            >
              <View style={[styles.checkbox, checkedWines[wine] && styles.checkboxChecked]}>
                {checkedWines[wine] && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, checkedWines[wine] && styles.itemChecked]}>
                  {wine}
                </Text>
                <Text style={[styles.itemQuantity, checkedWines[wine] && styles.itemChecked]}>
                  1 bottle
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {uncategorizedManualItems.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Other</Text>
          {uncategorizedManualItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => handleToggleItem(item.id, item.checked)}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, item.checked && styles.itemChecked]}>
                  {item.item}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  addItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    minWidth: 110,
  },
  categoryDropdownText: {
    fontSize: 15,
    color: '#1F2937',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 6,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: 400,
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0FDF4',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownOptionTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  dropdownCheckmark: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  beverageToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  beverageToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6D28D9',
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
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  itemChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
})

export default GroceryScreen
