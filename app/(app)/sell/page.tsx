'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { CategoryWithItems, CartItem, OrderWithItems } from '@/types'
import { MenuGrid } from '@/components/pos/menu-grid'
import { Cart } from '@/components/pos/cart'
import { SidesModal, GroupSelection } from '@/components/pos/sides-modal'
import { SkewerModal, SkewerSelection } from '@/components/pos/skewer-modal'
import { isSkewerItem, getSkewerCount } from '@/lib/skewer-config'
import { SellSkeleton } from '@/components/skeletons/sell-skeleton'
import { CustomerReceipt } from '@/components/receipts/customer-receipt'
import { KitchenReceipt } from '@/components/receipts/kitchen-receipt'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShoppingCart, X, Printer, Receipt } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'
import { SANDWICH_CATEGORY_NAMES, SIDES_CATEGORY_NAMES, FRIES_DEDUCTION, EXTRA_PRICE, SANDWICH_DEFAULT_SIDE, getFreeQty, getSideSize } from '@/lib/sides-config'
import { formatPrice } from '@/lib/utils'
import type { MenuItem } from '@prisma/client'

export default function SellPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<CategoryWithItems[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null)
  const [pendingSkewer, setPendingSkewer] = useState<MenuItem | null>(null)
  const [pendingSkewerSelection, setPendingSkewerSelection] = useState<SkewerSelection | null>(null)
  const [lastOrder, setLastOrder] = useState<OrderWithItems | null>(null)
  const [reprintType, setReprintType] = useState<'customer' | 'kitchen' | null>(null)

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
    const category = categories.find(c => c.id === item.categoryId)
    const isSideItem = category ? SIDES_CATEGORY_NAMES.includes(category.name) : false
    if (isSideItem) {
      setCart(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          menuItemId: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: 1,
        },
      ])
    } else if (isSkewerItem(item.name)) {
      setPendingSkewer(item)
      setPendingSkewerSelection(null)
    } else {
      setPendingItem(item)
    }
  }

  const confirmSkewerSelection = (item: MenuItem, selection: SkewerSelection) => {
    setPendingSkewerSelection(selection)
    setPendingSkewer(null)
    setPendingItem(item)
  }

  const confirmAddToCart = (item: MenuItem, groupSelections: GroupSelection[]) => {
    const category = categories.find(c => c.id === item.categoryId)
    const isSandwich = category ? SANDWICH_CATEGORY_NAMES.includes(category.name) : false
    const freeQty = getFreeQty(item.name)

    const extrasCharge = groupSelections.reduce((sum, { selected }) =>
      sum + Math.max(0, selected.length - freeQty) * EXTRA_PRICE, 0)

    const allSides = groupSelections.flatMap(g => g.selected)
    const friesRemoved = isSandwich && !allSides.includes(SANDWICH_DEFAULT_SIDE)
    const totalAdjustment = (friesRemoved ? -FRIES_DEDUCTION : 0) + extrasCharge
    const priceAdjustment = totalAdjustment !== 0 ? totalAdjustment : undefined
    const adjustmentReason = [
      friesRemoved ? 'No fries' : null,
      extrasCharge > 0 ? `Extras +${formatPrice(extrasCharge)}` : null,
    ].filter(Boolean).join(', ') || undefined

    setCart(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: 1,
        sides: allSides.length > 0 ? allSides : undefined,
        skewers: pendingSkewerSelection
          ? Object.entries(pendingSkewerSelection.counts).flatMap(([type, n]) => Array(n).fill(type))
          : undefined,
        skewerDeductions: pendingSkewerSelection?.deductions,
        priceAdjustment,
        adjustmentReason,
      },
    ])
    setPendingItem(null)
    setPendingSkewerSelection(null)
  }

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prevCart =>
      prevCart.map(item => (item.id === id ? { ...item, quantity } : item)),
    )
  }

  const updateNotes = (id: string, notes: string) => {
    setCart(prevCart =>
      prevCart.map(item => (item.id === id ? { ...item, notes } : item)),
    )
  }

  const updatePrice = (id: string, priceAdjustment: number, adjustmentReason: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, priceAdjustment, adjustmentReason } : item,
      ),
    )
  }

  const updateTakeaway = (id: string, takeaway: boolean, takeawayCharge: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id
          ? { ...item, takeaway, takeawayCharge: takeaway ? takeawayCharge : 0 }
          : item,
      ),
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
      const isDelivery = cart.some(i => i.takeaway)

      const orderPayload = {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: item.priceAdjustment ? item.price + item.priceAdjustment : undefined,
          skewerDeductions: item.skewerDeductions,
          notes: [
            item.skewers?.length
              ? `Skewers: ${item.skewers.join(', ')}`
              : null,
            item.sides?.length
              ? `Sides: ${item.sides.map(s => `${s} (${getSideSize(item.name)})`).join(', ')}`
              : null,
            item.notes,
            item.priceAdjustment
              ? `[Price ${item.priceAdjustment > 0 ? '+' : ''}${item.priceAdjustment} RWF: ${item.adjustmentReason || 'adjusted'}]`
              : null,
            item.takeaway ? `[TAKEAWAY${item.takeawayCharge ? ` +${item.takeawayCharge} RWF` : ''}]` : null,
          ].filter(Boolean).join(' ') || undefined,
        })),
        ...orderData,
        serviceCharge: takeawayTotal,
        isDelivery,
        notes: [
          orderData.notes,
          takeawayItems ? `Takeaway: ${takeawayItems}` : null,
        ].filter(Boolean).join(' | ') || undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })

      if (response.ok) {
        const order: OrderWithItems = await response.json()
        setLastOrder(order)
        clearCart()
        toast.success('Order placed!')
        fetchMenu()
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

  const sidesCategories = categories.filter(c => SIDES_CATEGORY_NAMES.includes(c.name))
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const pendingCategory = pendingItem ? categories.find(c => c.id === pendingItem.categoryId) : null
  const pendingIsSandwich = pendingCategory ? SANDWICH_CATEGORY_NAMES.includes(pendingCategory.name) : false

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
          {lastOrder && (
            <div className="flex items-center justify-between gap-2 border-b border-card-border bg-green-50 px-4 py-2">
              <span className="text-xs font-medium text-green-800 truncate">
                Last: #{lastOrder.orderNumber}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setReprintType('customer')}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  title="Print customer receipt"
                >
                  <Receipt className="h-3 w-3" />
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setReprintType('kitchen')}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                  title="Print kitchen order"
                >
                  <Printer className="h-3 w-3" />
                  Kitchen
                </button>
                <IconButton size="sm" aria-label="Dismiss" onClick={() => setLastOrder(null)}>
                  <X className="h-3 w-3" />
                </IconButton>
              </div>
            </div>
          )}
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

      {/* Skewer type selector — appears before sides modal */}
      {pendingSkewer && (
        <SkewerModal
          item={pendingSkewer}
          skewerCount={getSkewerCount(pendingSkewer.name)}
          onConfirm={confirmSkewerSelection}
          onClose={() => { setPendingSkewer(null); setPendingSkewerSelection(null) }}
        />
      )}

      {/* Sides Modal */}
      {pendingItem && (
        <SidesModal
          item={pendingItem}
          isSandwich={pendingIsSandwich}
          sidesCategories={sidesCategories}
          onConfirm={(item, groupSelections) => confirmAddToCart(item, groupSelections)}
          onClose={() => { setPendingItem(null); setPendingSkewerSelection(null) }}
        />
      )}

      {/* Reprint receipt modal */}
      <Modal
        open={!!reprintType && !!lastOrder}
        onClose={() => setReprintType(null)}
        title={reprintType === 'kitchen' ? 'Kitchen Order' : 'Customer Receipt'}
        width="md"
      >
        {lastOrder && reprintType === 'customer' && (
          <CustomerReceipt order={lastOrder} onPrint={() => setReprintType(null)} showPrintButton />
        )}
        {lastOrder && reprintType === 'kitchen' && (
          <KitchenReceipt order={lastOrder} onPrint={() => setReprintType(null)} showPrintButton />
        )}
      </Modal>
    </div>
  )
}
