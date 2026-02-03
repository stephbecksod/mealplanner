import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native'

const StarIcon = ({ filled, size = 20 }) => (
  <View style={{ width: size, height: size }}>
    <Text style={{ fontSize: size - 4, color: filled ? '#EAB308' : '#9CA3AF' }}>
      {filled ? '\u2605' : '\u2606'}
    </Text>
  </View>
)

const BeverageDetailModal = ({ visible, beverage, type, onClose, onToggleFavorite, isFavorite }) => {
  if (!beverage) return null

  const isCocktail = type === 'cocktail'
  const title = isCocktail ? beverage.name : beverage.type

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
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {isCocktail ? 'Cocktail' : 'Wine Pairing'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {onToggleFavorite && isCocktail && (
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
          {isCocktail ? (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {beverage.ingredients && beverage.ingredients.map((ing, idx) => (
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
                {beverage.instructions && beverage.instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {beverage.flavorProfile && (
                <View style={styles.pairingBox}>
                  <Text style={styles.pairingTitle}>Why This Pairs Well</Text>
                  <Text style={styles.pairingText}>{beverage.flavorProfile}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {beverage.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About This Wine</Text>
                  <Text style={styles.descriptionText}>{beverage.description}</Text>
                </View>
              )}

              {beverage.flavorProfile && (
                <View style={styles.pairingBox}>
                  <Text style={styles.pairingTitle}>Why This Pairs Well</Text>
                  <Text style={styles.pairingText}>{beverage.flavorProfile}</Text>
                </View>
              )}
            </>
          )}

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
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
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
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#7C3AED',
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
    backgroundColor: '#7C3AED',
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
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  pairingBox: {
    marginTop: 24,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    padding: 16,
  },
  pairingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6D28D9',
    marginBottom: 8,
  },
  pairingText: {
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
})

export default BeverageDetailModal
