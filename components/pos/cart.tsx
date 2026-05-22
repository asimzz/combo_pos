'use client'

import { useEffect, useState } from 'react'
import { CartItem } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, X, DollarSign, PackageCheck, Edit, ShoppingCart, Tag } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pills } from '@/components/ui/pills'

interface ApplicablePromotion {
  id: string
  name: string
  type: string
  value: number
  discountAmount: number
}

interface CartProps {
  cart: CartItem[]
  onRemoveItem: (id: string) => void
  onUpdateQuantity: (id: string, quantity: number) => void
  onUpdateNotes: (id: string, notes: string) => void
  onUpdateTakeaway: (id: string, takeaway: boolean, takeawayCharge: number) => void
  onUpdatePrice: (id: string, priceAdjustment: number, adjustmentReason: string) => void
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
  const [appliedPromotion, setAppliedPromotion] = useState<ApplicablePromotion | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPriceAdjust, setShowPriceAdjust] = useState<Record<string, boolean>>({})

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price + (item.priceAdjustment || 0)) * item.quantity,
    0,
  )

  useEffect(() => {
    if (!showCheckout || subtotal <= 0) return
    fetch('/api/promotions/applicable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtotal,
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.price + (i.priceAdjustment || 0),
        })),
      }),
    })
      .then((r) => r.json())
      .then((list: ApplicablePromotion[]) => {
        if (list.length > 0 && discount === 0) {
          setDiscount(list[0].discountAmount)
          setAppliedPromotion(list[0])
        }
      })
      .catch(() => {})
  // Only run when checkout opens — not on every discount change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckout])
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
    setAppliedPromotion(null)
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
            key={item.id}
            className="rounded-lg border border-card-border bg-white p-3"
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
              <IconButton
                size="sm"
                variant="danger"
                aria-label="Remove item"
                onClick={() => onRemoveItem(item.id)}
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>

            {item.skewers?.length ? (
              <p className="mb-1 text-xs font-medium text-amber-700">
                {item.skewers.join(' · ')}
              </p>
            ) : null}

            {item.sides?.length ? (
              <p className="mb-2 text-xs text-muted">{item.sides.join(' · ')}</p>
            ) : null}

            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconButton
                  size="sm"
                  aria-label="Decrease quantity"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </IconButton>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <IconButton
                  size="sm"
                  aria-label="Increase quantity"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
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
                  <div className={`text-[11px] ${item.priceAdjustment < 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {item.priceAdjustment > 0 ? '+' : ''}{formatPrice(item.priceAdjustment)}/item
                  </div>
                ) : null}
              </div>
            </div>

            <Input
              type="text"
              placeholder="Add notes..."
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(item.id, e.target.value)}
              className="mb-2 text-xs"
            />

            <label className="mb-2 flex cursor-pointer items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showPriceAdjust[item.id] || !!item.priceAdjustment}
                onChange={(e) => {
                  setShowPriceAdjust((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  if (!e.target.checked) {
                    onUpdatePrice(item.id, 0, '')
                  }
                }}
                className="h-4 w-4 rounded border-card-border text-primary-600 focus:ring-primary-500"
              />
              <Edit className="h-3.5 w-3.5 text-muted" />
              <span>Adjust price</span>
            </label>
            {(showPriceAdjust[item.id] || !!item.priceAdjustment) && (
              <div className="mb-2 space-y-2">
                <Input
                  type="number"
                  placeholder="+ Amount (RWF)"
                  value={item.priceAdjustment || ''}
                  onChange={(e) =>
                    onUpdatePrice(item.id, Number(e.target.value) || 0, item.adjustmentReason || '')
                  }
                  className="text-xs"
                />
                <Input
                  type="text"
                  placeholder="Reason"
                  value={item.adjustmentReason || ''}
                  onChange={(e) =>
                    onUpdatePrice(item.id, item.priceAdjustment || 0, e.target.value)
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
                    onUpdateTakeaway(item.id, e.target.checked, item.takeawayCharge || 0)
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
                    onUpdateTakeaway(item.id, true, Number(e.target.value) || 0)
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
            <span className="flex items-center gap-1">
              {appliedPromotion && <Tag className="h-3.5 w-3.5" />}
              {appliedPromotion ? appliedPromotion.name : 'Discount'}
            </span>
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
          <div className="space-y-1">
            {appliedPromotion && (
              <p className="flex items-center gap-1 text-xs text-green-700">
                <Tag className="h-3 w-3" />
                <span>
                  <span className="font-semibold">{appliedPromotion.name}</span> auto-applied
                  {appliedPromotion.type === 'PERCENTAGE'
                    ? ` (${appliedPromotion.value}%)`
                    : ''}
                </span>
              </p>
            )}
            <Input
              type="number"
              placeholder="Discount amount (RWF)"
              value={discount || ''}
              onChange={(e) => {
                setDiscount(Number(e.target.value) || 0)
                setAppliedPromotion(null)
              }}
            />
          </div>

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
            Place order — {formatPrice(total)}
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
