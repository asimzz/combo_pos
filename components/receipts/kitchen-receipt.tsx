"use client";

import { useRef } from "react";
import { OrderWithItems } from "@/types";
import { formatDate } from "@/lib/utils";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      window.print();
      if (onPrint) onPrint();
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

  return (
    <>
      <div className="space-y-4">
        {showPrintButton && (
          <div className="flex justify-end no-print">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print kitchen order
            </Button>
          </div>
        )}

        <div
          ref={printRef}
          className="print-receipt receipt bg-white p-6 border-2 max-w-sm mx-auto text-[11px] priority-normal border-gray-300"
        >
          <div className="header text-center mb-6">
            <div className="mb-3">
              <img
                src="/logo.svg"
                alt="Combo Restaurant"
                className="mx-auto h-12 w-auto"
              />
            </div>
            <div className="text-base font-semibold mb-2">KITCHEN ORDER</div>
          </div>

          {/* Order Details */}
          <div className="mb-6">
            <div className="order-number text-sm font-bold text-center mb-2">
              ORDER #{order.orderNumber}
            </div>
            <div className="text-center text-xs text-gray-600">
              {formatDate(new Date(order.createdAt))}
            </div>
            <div className="text-center text-xs font-medium">
              Server: {order.user.name}
            </div>
            {order.customerName && (
              <div className="text-center text-xs">
                Customer: {order.customerName}
              </div>
            )}
          </div>

          <div className="divider"></div>

          {/* Items by Category */}
          {Object.entries(itemsByCategory).map(([categoryName, items]) => (
            <div key={categoryName} className="mb-6">
              <div className="font-bold text-xs uppercase text-gray-700 mb-3 border-b border-gray-300 pb-1">
                {categoryName}
              </div>
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="item mb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="item-name text-xs font-medium">
                        {item.quantity}x {item.menuItem.name}
                      </div>
                      {item.notes && (
                        <div className="notes text-xs text-red-600 font-medium mt-1">
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
              <div className="font-bold text-sm uppercase mb-2">
                ORDER NOTES:
              </div>
              <div className="text-sm bg-yellow-50 p-3 border border-yellow-200 rounded">
                {order.notes}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="text-center mb-4">
            <div className="text-base font-bold">
              Total Items:{" "}
              {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </div>

          <div className="divider"></div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden;
          }
          .print-receipt,
          .print-receipt * {
            visibility: visible;
          }
          .print-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            max-width: 58mm;
            padding: 2mm !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
