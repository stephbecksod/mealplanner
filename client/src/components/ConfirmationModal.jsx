import { useState, useEffect } from 'react'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'primary', // 'primary' | 'danger'
  isLoading = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  // Reset processing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmButtonClass = confirmStyle === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-primary-600 hover:bg-primary-700 text-white'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          {title}
        </h3>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing || isLoading}
            className="flex-1 btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
            className={`flex-1 font-semibold py-2 px-4 rounded-lg transition-colors ${confirmButtonClass} ${
              (isProcessing || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {(isProcessing || isLoading) ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
