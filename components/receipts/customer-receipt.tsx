"use client";

import { useEffect, useRef, useState } from "react";
import { OrderWithItems } from "@/types";
import { formatDate, formatPrice, getRandomReceiptMessage } from "@/lib/utils";
import { Printer } from "lucide-react";
import QRCode from "qrcode";

interface CustomerReceiptProps {
  order: OrderWithItems;
  onPrint?: () => void;
  showPrintButton?: boolean;
}

export function CustomerReceipt({
  order,
  onPrint,
  showPrintButton = true,
}: CustomerReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [momoQR, setMomoQR] = useState<string>("");
  const [receiptMessage, setReceiptMessage] = useState<string>("");

  useEffect(() => {
    generateQRCodes();
    setReceiptMessage(getRandomReceiptMessage());
  }, [order]);

  const generateQRCodes = async () => {
    try {
      // Generate MoMo payment QR if payment method is MoMo
      if (order.paymentMethod === "MOMO") {
        // This would be the actual MTN MoMo payment URL/data
        // For now, using a placeholder format
        const momoData = `momo://pay?amount=${order.total}&ref=${order.orderNumber}&merchant=COMBO_RESTAURANT`;
        const momoQRCode = await QRCode.toDataURL(momoData, {
          width: 128,
          margin: 1,
        });
        setMomoQR(momoQRCode);
      }
    } catch (error) {
      console.error("Error generating QR codes:", error);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
      if (onPrint) onPrint();
    }
  };

  return (
    <>
      <div className="space-y-4">
        {showPrintButton && (
          <div className="flex justify-end no-print">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Customer Receipt</span>
            </button>
          </div>
        )}

        <div
          ref={printRef}
          className="print-receipt receipt bg-white p-6 border border-gray-300 max-w-sm mx-auto text-[11px]"
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
            <div className="text-sm text-gray-600 mb-1">
              Different Every Time. Always You.
            </div>
            <div className="text-sm">KG 18 Ave. Kisiminti</div>
            <div className="text-sm">Kigali, Rwanda</div>
            <div className="text-sm">Tel: +250795466099</div>
          </div>

          <div className="divider"></div>

          {/* Order Details */}
          <div className="mb-4">
            <div className="order-number text-center text-xs font-bold mb-2">
              Order #{order.orderNumber}
            </div>
            <div className="text-xs">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(new Date(order.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span>Server:</span>
                <span>{order.user.name}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{order.customerName}</span>
                </div>
              )}
              {order.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{order.customerPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="divider"></div>

          {/* Items */}
          <div className="mb-4">
            {order.orderItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="mb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs mr-1">
                      {item.quantity}x {item.menuItem.name}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-600 italic mt-1">
                        Note: {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">
                      {formatPrice(Number(item.total))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="divider"></div>

          {/* Totals */}
          <div className="mb-4 space-y-1">
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{formatPrice(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm total-row">
              <span>TOTAL:</span>
              <span>{formatPrice(Number(order.total))}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Payment:</span>
              <span>{order.paymentMethod}</span>
            </div>
          </div>

          {/* Payment Options for Cash */}
          {order.paymentMethod === "CASH" && (
            <div className="mb-4">
              <div className="divider"></div>
              <div className="text-center mb-3">
                <div className="text-xs font-medium mb-2">
                  Quick Mobile Payment Options
                </div>
                <div className="text-[11px] text-gray-600 space-y-1">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium">MTN MoMo:</div>
                    <div className="font-mono">
                      {`*182*8*1*1234567*${Number(order.total)}#`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="divider"></div>

          {/* Order Notes */}
          {order.notes && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-1">Order Notes:</div>
              <div className="text-xs text-gray-600">{order.notes}</div>
            </div>
          )}

          {/* QR Codes */}
          <div className="qr-section space-y-4">
            {momoQR && order.paymentMethod === "MOMO" && (
              <div className="text-center">
                <div className="text-[11px] font-medium mb-2">MoMo Payment</div>
                <img
                  src={momoQR}
                  alt="MoMo Payment QR"
                  className="qr-code mx-auto"
                  width={100}
                  height={100}
                />
                <div className="text-[11px] text-gray-500 mt-1">
                  Scan to pay with MTN MoMo
                </div>
              </div>
            )}
          </div>

          <div className="divider"></div>

          {/* Footer */}
          <div className="text-center text-[11px] text-gray-500 space-y-1">
            <div className="text-gray-700 font-medium">{receiptMessage}</div>
            <div>Visit us again soon</div>
          </div>
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
