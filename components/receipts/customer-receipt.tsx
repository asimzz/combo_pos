"use client";

import { useEffect, useRef, useState } from "react";
import { OrderWithItems } from "@/types";
import { formatDate, formatPrice, getRandomReceiptMessage } from "@/lib/utils";
import { Printer } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

interface BusinessSettings {
  restaurantName: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  feedbackUrl: string | null;
  momoMerchantId: string | null;
  momoUssdNumber: string | null;
  receiptFooter: string | null;
  showReceiptQR: boolean;
}

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
  const [feedbackQR, setFeedbackQR] = useState<string>("");
  const [receiptMessage, setReceiptMessage] = useState<string>("");
  const [settings, setSettings] = useState<BusinessSettings>({
    restaurantName: "Combo Restaurant",
    tagline: "Different Every Time. Always You.",
    address: "KG 18 Ave. Kisiminti, Kigali, Rwanda",
    phone: "+250791942826",
    feedbackUrl: "https://combo.rw/feedback",
    momoMerchantId: "COMBO_RESTAURANT",
    momoUssdNumber: "7919494",
    receiptFooter: null,
    showReceiptQR: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    generateQRCodes();
    setReceiptMessage(getRandomReceiptMessage());
  }, [order, settings]);

  const generateQRCodes = async () => {
    try {
      if (order.paymentMethod === "MOMO" && settings.showReceiptQR) {
        const merchant = settings.momoMerchantId ?? "COMBO_RESTAURANT";
        const momoData = `momo://pay?amount=${order.total}&ref=${order.orderNumber}&merchant=${merchant}`;
        const momoQRCode = await QRCode.toDataURL(momoData, { width: 128, margin: 1 });
        setMomoQR(momoQRCode);
      } else {
        setMomoQR("");
      }

      if (settings.showReceiptQR) {
        const feedbackUrl = settings.feedbackUrl ?? "https://combo.rw/feedback";
        const feedbackQRCode = await QRCode.toDataURL(feedbackUrl, { width: 128, margin: 1 });
        setFeedbackQR(feedbackQRCode);
      } else {
        setFeedbackQR("");
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

  const ussdNumber = settings.momoUssdNumber ?? "7919494";

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
              Print customer receipt
            </Button>
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
                alt={settings.restaurantName}
                className="mx-auto h-12 w-auto"
              />
            </div>
            {settings.tagline && (
              <div className="text-sm text-gray-600 mb-1">{settings.tagline}</div>
            )}
            {settings.address && (
              <div className="text-sm">{settings.address}</div>
            )}
            {settings.phone && (
              <div className="text-sm">Tel: {settings.phone}</div>
            )}
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
                      {`*182*8*1*${ussdNumber}*${Number(order.total)}#`}
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
          {settings.showReceiptQR && (
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
          )}

          {/* Feedback QR */}
          {feedbackQR && settings.showReceiptQR && (
            <div className="text-center mb-4">
              <img
                src={feedbackQR}
                alt="Feedback QR Code"
                className="mx-auto"
                width={90}
                height={90}
              />
              <div className="text-[11px] font-medium mt-1">Share your feedback!</div>
              <div className="text-[10px] text-gray-500">
                Scan the QR code or visit {(settings.feedbackUrl ?? "combo.rw/feedback").replace(/^https?:\/\//, "")}
              </div>
            </div>
          )}

          <div className="divider"></div>

          {/* Footer */}
          <div className="text-center text-[11px] text-gray-500 space-y-1">
            <div className="text-gray-700 font-medium">{receiptMessage}</div>
            {settings.receiptFooter ? (
              <div>{settings.receiptFooter}</div>
            ) : (
              <div>Visit us again soon</div>
            )}
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
            position: fixed;
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
