const BeverageDetail = ({ beveragePairing, type, onClose }) => {
  const isCocktail = type === 'cocktail'
  const item = isCocktail ? beveragePairing.cocktail : beveragePairing.wine

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isCocktail ? item.name : item.type}
            </h2>
            <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              {isCocktail ? 'Cocktail' : 'Wine Pairing'}
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
          {isCocktail ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {item.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-purple-600 mr-2">•</span>
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
                  {item.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                        {idx + 1}
                      </span>
                      <p className="text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {item.flavorProfile && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-800 mb-1">Why This Pairs Well</h3>
                  <p className="text-sm text-purple-700">{item.flavorProfile}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {item.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">About This Wine</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              )}

              {item.flavorProfile && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-800 mb-1">Why This Pairs Well</h3>
                  <p className="text-sm text-purple-700">{item.flavorProfile}</p>
                </div>
              )}
            </>
          )}
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

export default BeverageDetail
