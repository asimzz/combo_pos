'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { CategoryWithItems, CartItem, OrderSummary } from '@/types'
import { MenuGrid } from '@/components/pos/menu-grid'
import { Cart } from '@/components/pos/cart'
import { Header } from '@/components/pos/header'
import { OrderConfirmation } from '@/components/pos/order-confirmation'
import toast from 'react-hot-toast'
import { ShoppingCart, X } from 'lucide-react'

export default function POSPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<CategoryWithItems[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
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
        const order = await response.json()
        setLastOrder(order)
        setShowConfirmation(true)
        clearCart()
        toast.success('Order created successfully!')
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (showConfirmation && lastOrder) {
    return (
      <OrderConfirmation
        order={lastOrder}
        onNewOrder={() => {
          setShowConfirmation(false)
          setLastOrder(null)
        }}
      />
    )
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Menu Section */}
        <div className="flex-1 p-3 lg:p-4 overflow-y-auto">
          <MenuGrid
            categories={categories}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart Section - Desktop sidebar */}
        <div className="hidden lg:flex lg:w-72 xl:w-80 2xl:w-96 bg-white border-l border-gray-200 flex-col shrink-0">
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
          onClick={() => setShowMobileCart(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-50"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {cartItemCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Cart</h2>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
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