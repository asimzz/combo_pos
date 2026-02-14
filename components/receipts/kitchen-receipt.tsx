"use client";

import { useEffect, useRef } from "react";
import { OrderWithItems } from "@/types";
import { formatDate } from "@/lib/utils";
import { Printer } from "lucide-react";

interface KitchenReceiptProps {
  order: OrderWithItems;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

export function KitchenReceipt({
  order,
  onPrint,
  showPrintButton = true,
}: KitchenReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Kitchen Order - ${order.orderNumber}</title>
              <style>
                body {
                  font-family: 'Courier New', monospace;
                  margin: 0;
                  padding: 20px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .receipt { max-width: 300px; }
                .header { text-align: center; margin-bottom: 20px; }
                .header img { max-height: 40px; margin: 0 auto 10px; }
                .order-number { font-size: 18px; font-weight: bold; }
                .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                .item { margin-bottom: 15px; }
                .item-name { font-weight: bold; font-size: 14px; }
                .item-details { margin-left: 10px; }
                .notes { font-style: italic; margin-top: 5px; }
                .timestamp { text-align: center; margin-top: 20px; font-size: 10px; }
                .priority-high { border: 2px solid #ff0000; padding: 5px; }
                .priority-normal { border: 1px solid #000; padding: 5px; }
                @media print {
                  body { margin: 0; padding: 10px; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        if (onPrint) onPrint();
      }
    }
  };

  // Group items by category for better kitchen organization
  const itemsByCategory = order.orderItems.reduce(
    (acc, item) => {
      const categoryName = item.menuItem.category?.name || "Other";
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(item);
      return acc;
    },
    {} as Record<string, typeof order.orderItems>,
  );

  const isUrgent =
    order.status === "PREPARING" &&
    new Date().getTime() - new Date(order.createdAt).getTime() > 15 * 60 * 1000; // 15 minutes

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Kitchen Order</span>
          </button>
        </div>
      )}

      <div
        ref={printRef}
        className={`receipt bg-white p-6 border-2 max-w-sm mx-auto ${
          isUrgent
            ? "priority-high border-red-500"
            : "priority-normal border-gray-300"
        }`}
      >
        {/* Header */}
        <div className="header text-center mb-6">
          <div className="mb-3">
            <img
              src="/logo.svg"
              alt="Combo Restaurant"
              className="mx-auto h-12 w-auto"
            />
          </div>
          <div className="text-lg font-semibold mb-2">KITCHEN ORDER</div>
          {isUrgent && (
            <div className="bg-red-500 text-white px-3 py-1 text-sm font-bold rounded">
              URGENT - DELAYED ORDER
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="mb-6">
          <div className="order-number text-xl font-bold text-center mb-2">
            ORDER #{order.orderNumber}
          </div>
          <div className="text-center text-sm text-gray-600">
            {formatDate(new Date(order.createdAt))}
          </div>
          <div className="text-center text-sm font-medium">
            Server: {order.user.name}
          </div>
          {order.customerName && (
            <div className="text-center text-sm">
              Customer: {order.customerName}
            </div>
          )}
        </div>

        <div className="divider"></div>

        {/* Items by Category */}
        {Object.entries(itemsByCategory).map(([categoryName, items]) => (
          <div key={categoryName} className="mb-6">
            <div className="font-bold text-sm uppercase text-gray-700 mb-3 border-b border-gray-300 pb-1">
              {categoryName}
            </div>
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="item mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="item-name text-lg font-medium">
                      {item.quantity}x {item.menuItem.name}
                    </div>
                    {item.notes && (
                      <div className="notes text-sm text-red-600 font-medium mt-1">
                        ⚠ SPECIAL: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="divider"></div>

        {/* Order Notes */}
        {order.notes && (
          <div className="mb-4">
            <div className="font-bold text-sm uppercase mb-2">ORDER NOTES:</div>
            <div className="text-sm bg-yellow-50 p-3 border border-yellow-200 rounded">
              {order.notes}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="text-center mb-4">
          <div className="text-lg font-bold">
            Total Items:{" "}
            {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
          </div>
        </div>

        <div className="divider"></div>
      </div>
    </div>
  );
}
