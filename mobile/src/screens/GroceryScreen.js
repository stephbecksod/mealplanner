import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useMealPlan } from '../context/MealPlanContext'

const GroceryScreen = () => {
  const { groceryList, mealPlan, updateGroceryItem } = useMealPlan()

  if (!groceryList || !groceryList.items || groceryList.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No grocery list</Text>
        <Text style={styles.emptyText}>Generate a meal plan to create your grocery list</Text>
      </View>
    )
  }

  // Group items by category
  const categories = {}
  for (const item of groceryList.items) {
    const category = item.category || 'Other'
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(item)
  }

  const categoryOrder = ['produce', 'protein', 'dairy', 'pantry', 'spices', 'other']
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

      {groceryList.manualItems && groceryList.manualItems.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Added Items</Text>
          {groceryList.manualItems.map(item => (
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
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
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
