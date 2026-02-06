import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { userPreferencesService, COOKING_EQUIPMENT_OPTIONS } from '../services/supabaseData'
import { useToast } from '../components/Toast'

const CheckIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
)

const Settings = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
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
        showError('Failed to load settings')
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
      showError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">
          Customize your meal planning preferences
        </p>
      </div>

      {/* Account Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Account</h2>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <span className="text-gray-600">Email</span>
          <span className="font-medium text-gray-800">{user?.email}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-gray-600">Member since</span>
          <span className="font-medium text-gray-800">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Cooking Equipment */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Kitchen Equipment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select what you have available. Recipes will be tailored to your equipment.
            </p>
          </div>
          {saving && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          )}
        </div>

        <div className="space-y-2">
          {COOKING_EQUIPMENT_OPTIONS.map((equipment) => {
            const isSelected = cookingEquipment.includes(equipment.id)
            return (
              <button
                key={equipment.id}
                onClick={() => toggleEquipment(equipment.id)}
                disabled={saving}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                  {equipment.label}
                </span>
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {isSelected && <CheckIcon />}
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Changes are saved automatically. Your equipment preferences will be used when generating new meal plans.
        </p>
      </div>
    </div>
  )
}

export default Settings
