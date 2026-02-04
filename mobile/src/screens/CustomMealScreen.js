import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native'
import { useMealPlan } from '../context/MealPlanContext'

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
  { value: 'produce', label: 'Produce' },
  { value: 'protein', label: 'Protein' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'spices', label: 'Spices' },
  { value: 'other', label: 'Other' },
]

// Custom dropdown component
const Dropdown = ({ value, options, onSelect, placeholder, displayKey = null }) => {
  const [visible, setVisible] = useState(false)

  const getDisplayValue = () => {
    if (!value) return placeholder || 'Select...'
    if (displayKey) {
      const option = options.find(o => o.value === value)
      return option ? option[displayKey] : value
    }
    return value
  }

  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
          {getDisplayValue()}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>{placeholder || 'Select'}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, index) => displayKey ? item.value : item + index}
              renderItem={({ item }) => {
                const itemValue = displayKey ? item.value : item
                const itemLabel = displayKey ? item[displayKey] : item
                const isSelected = value === itemValue
                return (
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => {
                      onSelect(itemValue)
                      setVisible(false)
                    }}
                  >
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                      {itemLabel}
                    </Text>
                    {isSelected && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                )
              }}
            />
            <TouchableOpacity
              style={styles.dropdownCancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.dropdownCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  )
}

const CustomMealScreen = ({ navigation }) => {
  const { addMeal } = useMealPlan()
  const [loading, setLoading] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [cuisine, setCuisine] = useState('American')
  const [servings, setServings] = useState('4')
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

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.')
      return
    }

    setLoading(true)

    try {
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

      await addMeal(recipe, parseInt(servings) || 4)
      navigation.goBack()
    } catch (error) {
      Alert.alert('Error', 'Failed to add custom recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Recipe Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Recipe Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Grandma's Chicken Pot Pie"
            placeholderTextColor="#9CA3AF"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Cuisine and Servings */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Cuisine</Text>
            <Dropdown
              value={cuisine}
              options={CUISINE_OPTIONS}
              onSelect={setCuisine}
              placeholder="Select cuisine"
            />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              keyboardType="number-pad"
              placeholder="4"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Prep and Cook Time */}
        <View style={styles.row}>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Prep Time (min)</Text>
            <TextInput
              style={styles.input}
              value={prepTime}
              onChangeText={setPrepTime}
              keyboardType="number-pad"
              placeholder="Optional"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.halfSection}>
            <Text style={styles.label}>Cook Time (min)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="number-pad"
              placeholder="Optional"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.label}>Ingredients *</Text>
          {errors.ingredients && <Text style={styles.errorText}>{errors.ingredients}</Text>}

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  style={[styles.input, styles.ingredientName]}
                  value={ingredient.item}
                  onChangeText={(value) => updateIngredient(index, 'item', value)}
                  placeholder="Ingredient"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={[styles.input, styles.ingredientQty]}
                  value={ingredient.quantity}
                  onChangeText={(value) => updateIngredient(index, 'quantity', value)}
                  placeholder="Qty"
                  placeholderTextColor="#9CA3AF"
                />
                <View style={styles.categoryDropdownContainer}>
                  <Dropdown
                    value={ingredient.category}
                    options={CATEGORY_OPTIONS}
                    onSelect={(value) => updateIngredient(index, 'category', value)}
                    placeholder="Category"
                    displayKey="label"
                  />
                </View>
              </View>
              {ingredients.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeIngredient(index)}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Text style={styles.addButtonText}>+ Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.label}>Instructions *</Text>
          {errors.instructions && <Text style={styles.errorText}>{errors.instructions}</Text>}

          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <TextInput
                style={[styles.input, styles.instructionInput]}
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                placeholder={`Step ${index + 1}`}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
              {instructions.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeInstruction(index)}
                >
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
            <Text style={styles.addButtonText}>+ Add Step</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Recipe</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfSection: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#6B7280',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    padding: 16,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  dropdownCheck: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownCancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  dropdownCancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientQty: {
    flex: 1,
  },
  categoryDropdownContainer: {
    flex: 1.2,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    paddingTop: 12,
    width: 24,
  },
  instructionInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#16A34A',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})

export default CustomMealScreen
