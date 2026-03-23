"use client";

import { useState } from "react";
import { OrderWithItems } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Check, Printer, RotateCcw, Receipt, ChefHat } from "lucide-react";
import { CustomerReceipt } from "@/components/receipts/customer-receipt";
import { KitchenReceipt } from "@/components/receipts/kitchen-receipt";

interface OrderConfirmationProps {
  order: OrderWithItems;
  onNewOrder: () => void;
}

export function OrderConfirmation({
  order,
  onNewOrder,
}: OrderConfirmationProps) {
  const [showCustomerReceipt, setShowCustomerReceipt] = useState(false);
  const [showKitchenReceipt, setShowKitchenReceipt] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  if (showCustomerReceipt) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Customer Receipt</h2>
            <button
              onClick={() => setShowCustomerReceipt(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
          <CustomerReceipt order={order} />
        </div>
      </div>
    );
  }

  if (showKitchenReceipt) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Kitchen Order</h2>
            <button
              onClick={() => setShowKitchenReceipt(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
          <KitchenReceipt order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xs w-full bg-white rounded-lg shadow-lg overflow-hidden receipt-container">
        {/* Success Header */}
        <div className="bg-success text-white p-4 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Check className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold">Order Confirmed!</h1>
          <p className="text-sm opacity-90">Order #{order.orderNumber}</p>
        </div>

        {/* Receipt */}
        <div className="p-2 receipt-content text-xs">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center mb-1">
              <img
                src="/logo.svg"
                alt="Combo Restaurant"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-xs text-gray-600">
              {formatDate(new Date(order.createdAt))}
            </p>
            <p className="text-xs text-secondary-600 font-medium">
              ALWAYS YOU.
            </p>
          </div>

          {/* Customer Info */}
          {(order.customerName || order.customerPhone) && (
            <div className="mb-2 pb-1 border-b border-gray-200">
              <h3 className="font-semibold text-xs mb-1">Customer</h3>
              {order.customerName && (
                <p className="text-xs text-gray-600">{order.customerName}</p>
              )}
              {order.customerPhone && (
                <p className="text-xs text-gray-600">{order.customerPhone}</p>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="mb-2 pb-1 border-b border-gray-200">
            <div className="space-y-0.5">
              {order.orderItems.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <span className="text-xs font-medium">
                        {item.menuItem.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ×{item.quantity}
                      </span>
                    </div>
                    <span className="text-xs">
                      {formatPrice(Number(item.total))}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-600 italic">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mb-2 pb-1 border-b border-gray-200">
              <h3 className="font-semibold text-xs mb-1">Order Notes</h3>
              <p className="text-xs text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="mb-2">
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>Discount:</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold">
              <span>TOTAL:</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="text-center text-xs text-gray-600 border-t pt-1">
            <p>Payment: {order.paymentMethod}</p>
            <p>Thank you for your order!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 space-y-2">
          <button
            onClick={() => setShowKitchenReceipt(true)}
            className="btn btn-outline btn-md w-full text-sm"
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Kitchen Order
          </button>
          <button
            onClick={() => setShowCustomerReceipt(true)}
            className="btn btn-outline btn-md w-full text-sm"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Customer Receipt
          </button>
          <button
            onClick={onNewOrder}
            className="btn btn-primary btn-md w-full text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          * {
            visibility: hidden;
          }
          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm !important;
            max-width: 58mm !important;
            font-size: 6px !important;
            line-height: 1.1 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .receipt-content {
            padding: 1mm !important;
            font-size: 6px !important;
          }
          .receipt-content * {
            font-size: 6px !important;
          }
          .receipt-content img {
            height: 12px !important;
            width: auto !important;
          }
          .receipt-container .p-4 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
