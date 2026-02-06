import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native'

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

const StarIcon = ({ filled, size = 20 }) => (
  <View style={{ width: size, height: size }}>
    <Text style={{ fontSize: size - 4, color: filled ? '#EAB308' : '#9CA3AF' }}>
      {filled ? '\u2605' : '\u2606'}
    </Text>
  </View>
)

const RecipeDetailModal = ({ visible, recipe, onClose, onToggleFavorite, isFavorite, onConvertMethod }) => {
  const [converting, setConverting] = useState(null)

  if (!recipe) return null

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  const handleConvertMethod = async (method) => {
    if (!onConvertMethod) return

    setConverting(method.equipment)
    try {
      await onConvertMethod(method.equipment)
    } finally {
      setConverting(null)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>
            {recipe.cuisine && (
              <Text style={styles.cuisine}>{recipe.cuisine}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={onToggleFavorite}
                style={[
                  styles.starButton,
                  isFavorite && styles.starButtonActive
                ]}
              >
                <StarIcon filled={isFavorite} size={24} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.timeGrid}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Prep Time</Text>
              <Text style={styles.timeValue}>{recipe.prepTime || 0} min</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Cook Time</Text>
              <Text style={styles.timeValue}>{recipe.cookTime || 0} min</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Servings</Text>
              <Text style={styles.timeValue}>{recipe.servings || 4}</Text>
            </View>
          </View>

          {/* Tags Section (Dietary Info + Equipment) */}
          {(recipe.dietaryInfo?.length > 0 || recipe.equipment?.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.badgeContainer}>
                {recipe.dietaryInfo?.map((info, idx) => (
                  <View key={`diet-${idx}`} style={styles.badge}>
                    <Text style={styles.badgeText}>{info}</Text>
                  </View>
                ))}
                {recipe.equipment?.map((equip, idx) => (
                  <View key={`equip-${idx}`} style={styles.equipmentBadge}>
                    <Text style={styles.equipmentBadgeText}>
                      {EQUIPMENT_LABELS[equip] || equip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Alternative Methods Section */}
          {recipe.alternativeMethods?.length > 0 && onConvertMethod && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alternative Methods</Text>
              <Text style={styles.sectionSubtitle}>
                This recipe can be adapted for other cooking equipment you have.
              </Text>
              <View style={styles.methodsContainer}>
                {recipe.alternativeMethods.map((method, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleConvertMethod(method)}
                    disabled={converting !== null}
                    style={[
                      styles.methodButton,
                      converting === method.equipment && styles.methodButtonActive,
                      converting !== null && converting !== method.equipment && styles.methodButtonDisabled,
                    ]}
                  >
                    {converting === method.equipment ? (
                      <View style={styles.methodButtonLoading}>
                        <ActivityIndicator size="small" color="#1D4ED8" />
                        <Text style={styles.methodButtonText}>Converting...</Text>
                      </View>
                    ) : (
                      <Text style={styles.methodButtonText}>{method.label}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients && recipe.ingredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <Text style={styles.bullet}>{'\u2022'}</Text>
                <Text style={styles.ingredientText}>
                  <Text style={styles.quantity}>{ing.quantity}</Text> {ing.item}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions && recipe.instructions.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cuisine: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  starButton: {
    padding: 8,
    borderRadius: 8,
  },
  starButtonActive: {
    backgroundColor: '#FEF3C7',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeGrid: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 8,
    gap: 12,
  },
  timeBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    marginTop: -8,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
  },
  equipmentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  equipmentBadgeText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '500',
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  methodButtonActive: {
    backgroundColor: '#DBEAFE',
  },
  methodButtonDisabled: {
    opacity: 0.5,
  },
  methodButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#16A34A',
    marginRight: 10,
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  quantity: {
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    paddingTop: 4,
  },
  bottomPadding: {
    height: 40,
  },
})

export default RecipeDetailModal
