'use client'

import { useState } from 'react'
import { CategoryWithItems } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Plus, AlertTriangle } from 'lucide-react'

interface MenuGridProps {
  categories: CategoryWithItems[]
  onAddToCart: (item: CategoryWithItems['items'][0]) => void
}

export function MenuGrid({ categories, onAddToCart }: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const filteredCategories = selectedCategory
    ? categories.filter(category => category.id === selectedCategory)
    : categories

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory('')}
          className={`btn btn-sm ${
            selectedCategory === '' ? 'btn-primary' : 'btn-outline'
          }`}
        >
          All Items
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`btn btn-sm ${
              selectedCategory === category.id ? 'btn-primary' : 'btn-outline'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      {filteredCategories.map(category => (
        <div key={category.id} className="space-y-4">
          <h2 className="text-xl lg:text-2xl font-semibold text-gray-800">
            {category.name}
          </h2>
          <p className="text-sm text-gray-600">{category.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {category.items.map(item => {
              const stock = item.stock || 0
              const lowStockAlert = item.lowStockAlert || 10
              const isOutOfStock = stock === 0
              const isLowStock = stock > 0 && stock <= lowStockAlert

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 overflow-hidden group ${
                    isOutOfStock
                      ? 'border-red-200 opacity-60 cursor-not-allowed'
                      : 'border-gray-100 hover:border-primary-200 hover:shadow-xl cursor-pointer'
                  }`}
                  onClick={() => !isOutOfStock && onAddToCart(item)}
                >
                {/* Header with price, menu number, and badges */}
                <div className={`p-3 text-white relative ${
                  isOutOfStock
                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                    : 'bg-gradient-to-r from-primary-500 to-secondary-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {isOutOfStock && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            OUT OF STOCK
                          </span>
                        )}
                        {isLowStock && (
                          <AlertTriangle className="w-4 h-4 text-yellow-300" />
                        )}
                      </div>
                      <h3 className="font-bold text-sm lg:text-base leading-tight truncate">{item.name}</h3>
                      <div className="text-lg lg:text-2xl font-black mt-1">
                        {formatPrice(Number(item.price))}
                      </div>
                    </div>
                    {item.featured && !isOutOfStock && (
                      <span className="bg-white text-primary-700 text-[10px] lg:text-xs px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-bold ml-1 shrink-0">
                        POPULAR
                      </span>
                    )}
                  </div>
                </div>

                {/* Description and action */}
                <div className="p-3">
                  <p className={`text-xs lg:text-sm mb-3 line-clamp-2 lg:line-clamp-3 leading-relaxed ${
                    isOutOfStock ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      {isOutOfStock ? (
                        <span className="text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded">
                          Only {stock} left
                        </span>
                      ) : stock <= 20 ? (
                        <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded">
                          {stock} in stock
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isOutOfStock) onAddToCart(item)
                      }}
                      disabled={isOutOfStock}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                        isOutOfStock
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'ml-auto bg-primary-500 hover:bg-primary-600 text-white group-hover:bg-primary-600'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Unavailable' : 'Add'}</span>
                    </button>
                  </div>
                </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No menu items available</p>
        </div>
      )}
    </div>
  )
}