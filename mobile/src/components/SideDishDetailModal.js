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

const SideDishDetailModal = ({ visible, sideDish, onClose, onToggleFavorite, isFavorite }) => {
  if (!sideDish) return null

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
            <Text style={styles.title} numberOfLines={2}>{sideDish.name}</Text>
            {sideDish.type && (
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{sideDish.type}</Text>
              </View>
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
          {sideDish.complementReason && (
            <View style={styles.pairingBox}>
              <Text style={styles.pairingTitle}>Why This Pairs Well</Text>
              <Text style={styles.pairingText}>{sideDish.complementReason}</Text>
            </View>
          )}

          <View style={styles.timeGrid}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Prep Time</Text>
              <Text style={styles.timeValue}>{sideDish.prepTime || 0} min</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Cook Time</Text>
              <Text style={styles.timeValue}>{sideDish.cookTime || 0} min</Text>
            </View>
          </View>

          {sideDish.dietaryInfo && sideDish.dietaryInfo.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dietary Info</Text>
              <View style={styles.badgeContainer}>
                {sideDish.dietaryInfo.map((info, idx) => (
                  <View key={idx} style={styles.badge}>
                    <Text style={styles.badgeText}>{info}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {sideDish.ingredients && sideDish.ingredients.map((ing, idx) => (
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
            {sideDish.instructions && sideDish.instructions.map((step, idx) => (
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
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1D4ED8',
    textTransform: 'capitalize',
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
  pairingBox: {
    marginTop: 20,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
  },
  pairingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  pairingText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
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

export default SideDishDetailModal
