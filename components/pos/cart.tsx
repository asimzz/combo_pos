'use client'

import { useState } from 'react'
import { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, X, DollarSign, PackageCheck } from 'lucide-react'

interface CartProps {
  cart: CartItem[]
  onRemoveItem: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onUpdateNotes: (menuItemId: string, notes: string) => void
  onUpdateTakeaway: (menuItemId: string, takeaway: boolean, takeawayCharge: number) => void
  onClearCart: () => void
  onSubmitOrder: (orderData: {
    customerName?: string
    customerPhone?: string
    notes?: string
    paymentMethod: 'CASH' | 'MOMO'
    discount: number
  }) => void
}

export function Cart({
  cart,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateNotes,
  onUpdateTakeaway,
  onClearCart,
  onSubmitOrder,
}: CartProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOMO'>('CASH')
  const [discount, setDiscount] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const takeawayTotal = cart.reduce((sum, item) => sum + (item.takeaway ? (item.takeawayCharge || 0) : 0), 0)
  const total = subtotal + takeawayTotal - discount

  const handleSubmit = () => {
    if (cart.length === 0) return

    onSubmitOrder({
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      notes: orderNotes || undefined,
      paymentMethod,
      discount,
    })

    // Reset form
    setCustomerName('')
    setCustomerPhone('')
    setOrderNotes('')
    setDiscount(0)
    setShowCheckout(false)
  }

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cart is empty
          </h3>
          <p className="text-gray-500">
            Add items from the menu to start an order
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Order Items ({cart.length})</h2>
          <button
            onClick={onClearCart}
            className="text-error hover:text-error/80"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cart.map((item) => (
          <div key={item.menuItemId} className="card p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <button
                onClick={() => onRemoveItem(item.menuItemId)}
                className="text-error hover:text-error/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                  className="btn btn-outline btn-sm w-8 h-8 p-0"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                  className="btn btn-outline btn-sm w-8 h-8 p-0"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="font-semibold">
                {formatPrice(item.price * item.quantity + (item.takeaway ? (item.takeawayCharge || 0) : 0))}
              </span>
            </div>

            <input
              type="text"
              placeholder="Add notes..."
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(item.menuItemId, e.target.value)}
              className="input text-sm mb-2"
            />

            {/* Takeaway */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.takeaway || false}
                  onChange={(e) => onUpdateTakeaway(item.menuItemId, e.target.checked, item.takeawayCharge || 0)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <PackageCheck className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-600">Takeaway</span>
              </label>
              {item.takeaway && (
                <input
                  type="number"
                  placeholder="Charge (RWF)"
                  min="0"
                  value={item.takeawayCharge || ''}
                  onChange={(e) => onUpdateTakeaway(item.menuItemId, true, Number(e.target.value) || 0)}
                  className="input text-xs w-full sm:w-28 py-1"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        {takeawayTotal > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Takeaway charges:</span>
            <span>{formatPrice(takeawayTotal)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Discount:</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {/* Checkout */}
      {showCheckout ? (
        <div className="p-4 border-t border-gray-200 space-y-4">
          <input
            type="text"
            placeholder="Customer Name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
          />
          <input
            type="tel"
            placeholder="Customer Phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="input"
          />
          <input
            type="text"
            placeholder="Order notes (optional)"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="input"
          />
          <input
            type="number"
            placeholder="Discount amount"
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="input"
          />

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`btn btn-sm ${
                  paymentMethod === 'CASH' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod('MOMO')}
                className={`btn btn-sm ${
                  paymentMethod === 'MOMO' ? 'btn-primary' : 'btn-outline'
                }`}
              >
                <div className="w-4 h-4 mr-1 bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  M
                </div>
                MoMo
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSubmit}
              className="btn btn-primary btn-lg w-full text-sm py-3"
            >
              Complete Order - {formatPrice(total)}
            </button>
            <button
              onClick={() => setShowCheckout(false)}
              className="btn btn-outline btn-md w-full"
            >
              Back to Cart
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowCheckout(true)}
            className="btn btn-primary btn-lg w-full"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  )
}
