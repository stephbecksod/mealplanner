const SideDishDetail = ({ sideDish, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{sideDish.name}</h2>
            <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
              {sideDish.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {sideDish.complementReason && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Why this pairs well:</span> {sideDish.complementReason}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Prep Time</p>
              <p className="text-lg font-bold text-gray-800">{sideDish.prepTime} min</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Cook Time</p>
              <p className="text-lg font-bold text-gray-800">{sideDish.cookTime} min</p>
            </div>
          </div>

          {sideDish.dietaryInfo && sideDish.dietaryInfo.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Dietary Info</h3>
              <div className="flex flex-wrap gap-2">
                {sideDish.dietaryInfo.map((info, idx) => (
                  <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                    {info}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {sideDish.ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary-600 mr-2">•</span>
                  <span className="text-gray-700">
                    <span className="font-semibold">{ing.quantity}</span> {ing.item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
            <ol className="space-y-3">
              {sideDish.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    {idx + 1}
                  </span>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="w-full btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default SideDishDetail
