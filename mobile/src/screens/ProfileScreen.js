import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { userPreferencesService, COOKING_EQUIPMENT_OPTIONS } from '../services/supabaseData'

const CheckIcon = () => (
  <Text style={styles.checkIcon}>{'\u2713'}</Text>
)

const ProfileScreen = () => {
  const { user, signOut } = useAuth()
  const [cookingEquipment, setCookingEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const equipment = await userPreferencesService.getCookingEquipment()
        setCookingEquipment(equipment)
      } catch (error) {
        console.error('Failed to load preferences:', error)
        Alert.alert('Error', 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  const toggleEquipment = async (equipmentId) => {
    const isCurrentlySelected = cookingEquipment.includes(equipmentId)
    const newEquipment = isCurrentlySelected
      ? cookingEquipment.filter(id => id !== equipmentId)
      : [...cookingEquipment, equipmentId]

    // Optimistic update
    setCookingEquipment(newEquipment)

    setSaving(true)
    try {
      await userPreferencesService.updateCookingEquipment(newEquipment)
    } catch (error) {
      console.error('Failed to save equipment preferences:', error)
      // Revert on error
      setCookingEquipment(cookingEquipment)
      Alert.alert('Error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out')
            }
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Avatar and Email */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        <Text style={styles.email}>{user?.email}</Text>

        {/* Account Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member since</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Kitchen Equipment Section */}
        <View style={styles.equipmentSection}>
          <View style={styles.equipmentHeader}>
            <Text style={styles.sectionTitle}>Kitchen Equipment</Text>
            {saving && (
              <View style={styles.savingIndicator}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.savingText}>Saving...</Text>
              </View>
            )}
          </View>
          <Text style={styles.sectionSubtitle}>
            Select what you have available. Recipes will be tailored to your equipment.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16A34A" />
            </View>
          ) : (
            <View style={styles.equipmentList}>
              {COOKING_EQUIPMENT_OPTIONS.map((equipment) => {
                const isSelected = cookingEquipment.includes(equipment.id)
                return (
                  <TouchableOpacity
                    key={equipment.id}
                    onPress={() => toggleEquipment(equipment.id)}
                    disabled={saving}
                    style={[
                      styles.equipmentItem,
                      isSelected && styles.equipmentItemSelected,
                      saving && styles.equipmentItemDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.equipmentLabel,
                      isSelected && styles.equipmentLabelSelected,
                    ]}>
                      {equipment.label}
                    </Text>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}>
                      {isSelected && <CheckIcon />}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}

          <Text style={styles.equipmentNote}>
            Changes are saved automatically. Your equipment preferences will be used when generating new meal plans.
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Meal Planner v1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  equipmentSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  equipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  equipmentList: {
    gap: 8,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  equipmentItemSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  equipmentItemDisabled: {
    opacity: 0.6,
  },
  equipmentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  equipmentLabelSelected: {
    color: '#166534',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#16A34A',
  },
  checkIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  equipmentNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  signOutButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    paddingBottom: 24,
    marginTop: 16,
  },
})

export default ProfileScreen
