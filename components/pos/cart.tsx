'use client'

import { useState } from 'react'
import { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, X, DollarSign, PackageCheck, Edit, ShoppingCart } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pills } from '@/components/ui/pills'

interface CartProps {
  cart: CartItem[]
  onRemoveItem: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onUpdateNotes: (menuItemId: string, notes: string) => void
  onUpdateTakeaway: (menuItemId: string, takeaway: boolean, takeawayCharge: number) => void
  onUpdatePrice: (menuItemId: string, priceAdjustment: number, adjustmentReason: string) => void
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
  onUpdatePrice,
  onClearCart,
  onSubmitOrder,
}: CartProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOMO'>('CASH')
  const [discount, setDiscount] = useState(0)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPriceAdjust, setShowPriceAdjust] = useState<Record<string, boolean>>({})

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price + (item.priceAdjustment || 0)) * item.quantity,
    0,
  )
  const takeawayTotal = cart.reduce(
    (sum, item) => sum + (item.takeaway ? item.takeawayCharge || 0 : 0),
    0,
  )
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

    setCustomerName('')
    setCustomerPhone('')
    setOrderNotes('')
    setDiscount(0)
    setShowCheckout(false)
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted" />
          <h3 className="text-base font-semibold text-gray-900">Cart is empty</h3>
          <p className="mt-1 text-sm text-muted">Add items from the menu to start an order</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Order items <span className="text-muted">({cart.length})</span>
        </h2>
        <Button variant="ghost" size="xs" onClick={onClearCart}>
          Clear all
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {cart.map((item) => (
          <div
            key={item.menuItemId}
            className="rounded-lg border border-card-border bg-white p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
              <IconButton
                size="sm"
                variant="danger"
                aria-label="Remove item"
                onClick={() => onRemoveItem(item.menuItemId)}
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconButton
                  size="sm"
                  aria-label="Decrease quantity"
                  onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </IconButton>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <IconButton
                  size="sm"
                  aria-label="Increase quantity"
                  onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </IconButton>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold tabular-nums">
                  {formatPrice(
                    (item.price + (item.priceAdjustment || 0)) * item.quantity +
                      (item.takeaway ? item.takeawayCharge || 0 : 0),
                  )}
                </div>
                {item.priceAdjustment ? (
                  <div className="text-[11px] text-amber-600">
                    +{formatPrice(item.priceAdjustment)}/item
                  </div>
                ) : null}
              </div>
            </div>

            <Input
              type="text"
              placeholder="Add notes..."
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(item.menuItemId, e.target.value)}
              className="mb-2 text-xs"
            />

            <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showPriceAdjust[item.menuItemId] || !!item.priceAdjustment}
                onChange={(e) => {
                  setShowPriceAdjust((prev) => ({ ...prev, [item.menuItemId]: e.target.checked }))
                  if (!e.target.checked) {
                    onUpdatePrice(item.menuItemId, 0, '')
                  }
                }}
                className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
              />
              <Edit className="h-3.5 w-3.5 text-muted" />
              <span>Adjust price</span>
            </label>
            {(showPriceAdjust[item.menuItemId] || !!item.priceAdjustment) && (
              <div className="mb-2 space-y-2">
                <Input
                  type="number"
                  placeholder="+ Amount (RWF)"
                  min="0"
                  value={item.priceAdjustment || ''}
                  onChange={(e) =>
                    onUpdatePrice(item.menuItemId, Number(e.target.value) || 0, item.adjustmentReason || '')
                  }
                  className="text-xs"
                />
                <Input
                  type="text"
                  placeholder="Reason"
                  value={item.adjustmentReason || ''}
                  onChange={(e) =>
                    onUpdatePrice(item.menuItemId, item.priceAdjustment || 0, e.target.value)
                  }
                  className="text-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={item.takeaway || false}
                  onChange={(e) =>
                    onUpdateTakeaway(item.menuItemId, e.target.checked, item.takeawayCharge || 0)
                  }
                  className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
                />
                <PackageCheck className="h-3.5 w-3.5 text-muted" />
                <span>Takeaway</span>
              </label>
              {item.takeaway && (
                <Input
                  type="number"
                  placeholder="Charge (RWF)"
                  min="0"
                  value={item.takeawayCharge || ''}
                  onChange={(e) =>
                    onUpdateTakeaway(item.menuItemId, true, Number(e.target.value) || 0)
                  }
                  className="flex-1 text-xs"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1 border-t border-card-border p-4">
        {takeawayTotal > 0 && (
          <div className="flex justify-between text-sm text-muted">
            <span>Takeaway charges</span>
            <span className="tabular-nums">{formatPrice(takeawayTotal)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span className="tabular-nums">-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>
      </div>

      {showCheckout ? (
        <div className="space-y-3 border-t border-card-border p-4">
          <Input
            type="text"
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            type="tel"
            placeholder="Customer phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Order notes (optional)"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Discount amount"
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
          />

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
              Payment method
            </label>
            <Pills
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v)}
              options={[
                { value: 'CASH', label: 'Cash', icon: <DollarSign className="h-3.5 w-3.5" /> },
                { value: 'MOMO', label: 'MoMo' },
              ]}
              size="md"
            />
          </div>

          <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit}>
            Complete order — {formatPrice(total)}
          </Button>
          <Button variant="outline" size="md" className="w-full" onClick={() => setShowCheckout(false)}>
            Back to cart
          </Button>
        </div>
      ) : (
        <div className="border-t border-card-border p-4">
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShowCheckout(true)}>
            Proceed to checkout
          </Button>
        </div>
      )}
    </div>
  )
}
