'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter } from 'next/navigation'
import { CategoryWithItems, CartItem, OrderSummary } from '@/types'
import { MenuGrid } from '@/components/pos/menu-grid'
import { Cart } from '@/components/pos/cart'
import { SellSkeleton } from '@/components/skeletons/sell-skeleton'
import { toast } from 'sonner'
import { ShoppingCart, X } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

export default function SellPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryWithItems[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileCart, setShowMobileCart] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      redirect('/auth/signin')
    }
  }, [session, status])

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/pos-menu')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        toast.error('Failed to load menu')
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
      toast.error('Failed to load menu')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (item: CategoryWithItems['items'][0]) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menuItemId === item.id)

      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menuItemId === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      } else {
        return [
          ...prevCart,
          {
            id: item.id,
            name: item.name,
            price: Number(item.price),
            quantity: 1,
            menuItemId: item.id,
          }
        ]
      }
    })
  }

  const removeFromCart = (menuItemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.menuItemId !== menuItemId))
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId)
      return
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const updateNotes = (menuItemId: string, notes: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, notes }
          : item
      )
    )
  }

  const updatePrice = (menuItemId: string, priceAdjustment: number, adjustmentReason: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, priceAdjustment, adjustmentReason }
          : item
      )
    )
  }

  const updateTakeaway = (menuItemId: string, takeaway: boolean, takeawayCharge: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.menuItemId === menuItemId
          ? { ...item, takeaway, takeawayCharge: takeaway ? takeawayCharge : 0 }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const handleOrderSubmit = async (orderData: {
    customerName?: string
    customerPhone?: string
    notes?: string
    paymentMethod: 'CASH' | 'MOMO'
    discount: number
  }) => {
    try {
      const takeawayTotal = cart.reduce((sum, item) => sum + (item.takeaway ? (item.takeawayCharge || 0) : 0), 0)
      const takeawayItems = cart.filter(i => i.takeaway).map(i => i.name).join(', ')

      const orderPayload = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.priceAdjustment ? item.price + item.priceAdjustment : undefined,
          notes: [
            item.notes,
            item.priceAdjustment ? `[Price +${item.priceAdjustment} RWF: ${item.adjustmentReason || 'adjusted'}]` : null,
            item.takeaway ? `[TAKEAWAY${item.takeawayCharge ? ` +${item.takeawayCharge} RWF` : ''}]` : null,
          ].filter(Boolean).join(' ') || undefined,
        })),
        ...orderData,
        serviceCharge: takeawayTotal,
        notes: [
          orderData.notes,
          takeawayItems ? `Takeaway: ${takeawayItems}` : null,
        ].filter(Boolean).join(' | ') || undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (response.ok) {
        clearCart()
        toast.success('Order created successfully!')
        router.push('/orders')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order')
    }
  }

  if (status === 'loading' || loading) {
    return <SellSkeleton />
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="h-full bg-surface">
      <div className="flex h-full">
        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <MenuGrid
            categories={categories}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart Section - Desktop sidebar */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 2xl:w-[420px] bg-white border-l border-card-border flex-col shrink-0">
          <Cart
            cart={cart}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onUpdateNotes={updateNotes}
            onUpdateTakeaway={updateTakeaway}
            onUpdatePrice={updatePrice}
            onClearCart={clearCart}
            onSubmitOrder={handleOrderSubmit}
          />
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {!showMobileCart && (
        <button
          type="button"
          onClick={() => setShowMobileCart(true)}
          aria-label="Open cart"
          className="lg:hidden fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          <ShoppingCart className="h-6 w-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-500 text-xs font-bold text-gray-900">
              {cartItemCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 flex w-full flex-col bg-white shadow-2xl sm:w-96">
            <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
              <h2 className="text-base font-semibold text-gray-900">Cart</h2>
              <IconButton aria-label="Close cart" onClick={() => setShowMobileCart(false)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="flex-1 overflow-hidden">
              <Cart
                cart={cart}
                onRemoveItem={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onUpdateNotes={updateNotes}
                onUpdateTakeaway={updateTakeaway}
                onUpdatePrice={updatePrice}
                onClearCart={clearCart}
                onSubmitOrder={(data) => {
                  handleOrderSubmit(data)
                  setShowMobileCart(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}