'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Smartphone, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pills } from '@/components/ui/pills'

interface MomoPaymentProps {
  amount: number
  orderNumber: string
  customerPhone?: string
  onSuccess: (transactionId: string) => void
  onCancel: () => void
  onError: (error: string) => void
}

interface PaymentStatus {
  status: 'pending' | 'processing' | 'success' | 'failed' | 'timeout'
  transactionId?: string
  message?: string
}

export function MomoPayment({
  amount,
  orderNumber,
  customerPhone = '',
  onSuccess,
  onCancel,
  onError
}: MomoPaymentProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [ussdCode, setUssdCode] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'pending' })
  const [phoneNumber, setPhoneNumber] = useState(customerPhone)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [showQR, setShowQR] = useState(true)
  const merchantIdRef = useRef('COMBO_RESTAURANT_001')
  const ussdNumberRef = useRef('7919494')

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetch('/api/settings').then((r) => r.json())
        if (data.momoMerchantId) merchantIdRef.current = data.momoMerchantId
        if (data.momoUssdNumber) ussdNumberRef.current = data.momoUssdNumber
      } catch {}
      generatePaymentCodes(merchantIdRef.current, ussdNumberRef.current)
    }
    init()
    startPaymentStatusPolling()
    startTimer()
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus({ status: 'timeout', message: 'Payment request expired' })
    }
  }, [timeLeft])

  const generatePaymentCodes = async (merchantId: string, ussdNumber: string) => {
    try {
      const ussd = `*182*8*1*${ussdNumber}*${amount}#`
      setUssdCode(ussd)

      const momoPaymentData = {
        merchant_id: merchantId,
        amount: amount,
        currency: 'RWF',
        reference: orderNumber,
        description: `Order payment for ${orderNumber}`,
        callback_url: `${window.location.origin}/api/payments/momo/callback`,
        // In production, this would include authentication tokens and proper MTN MoMo format
      }

      const qrData = JSON.stringify(momoPaymentData)
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      })

      setQrCode(qrCodeDataURL)
    } catch (error) {
      console.error('Error generating payment codes:', error)
      onError('Failed to generate payment codes')
    }
  }

  const startPaymentStatusPolling = () => {
    const pollInterval = setInterval(async () => {
      if (paymentStatus.status === 'success' ||
          paymentStatus.status === 'failed' ||
          paymentStatus.status === 'timeout') {
        clearInterval(pollInterval)
        return
      }

      try {
        // In a real implementation, this would poll the MTN MoMo API for payment status
        // For now, we'll simulate random success after some time for demo purposes
        const shouldSimulateSuccess = Math.random() > 0.85 && timeLeft < 240 // Simulate success randomly

        if (shouldSimulateSuccess && paymentStatus.status === 'pending') {
          const transactionId = `MTN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          setPaymentStatus({
            status: 'success',
            transactionId,
            message: 'Payment completed successfully'
          })
          onSuccess(transactionId)
          clearInterval(pollInterval)
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
      }
    }, 3000) // Check every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(pollInterval)
  }

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const initiatePhonePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      onError('Please enter a valid phone number')
      return
    }

    setPaymentStatus({ status: 'processing', message: 'Sending payment request...' })

    try {
      // In a real implementation, this would call the MTN MoMo API
      // to send a push payment request to the customer's phone

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      setPaymentStatus({
        status: 'pending',
        message: 'Payment request sent to your phone. Please confirm on your device.'
      })
    } catch (error) {
      setPaymentStatus({ status: 'failed', message: 'Failed to send payment request' })
      onError('Failed to initiate phone payment')
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return <Clock className="w-8 h-8 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'failed':
      case 'timeout':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Clock className="w-8 h-8 text-blue-500" />
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-card-border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <img
            src="/mtn-logo.png"
            alt="MTN MoMo"
            className="h-8"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <h2 className="text-xl font-bold text-amber-600">MTN MoMo</h2>
        </div>
        <p className="text-gray-700 tabular-nums">Pay {amount.toLocaleString()} RWF</p>
        <p className="text-xs text-muted">Order: {orderNumber}</p>
      </div>

      {/* Timer */}
      <div className="mb-4 text-center">
        <div className={`text-2xl font-bold tabular-nums ${timeLeft < 60 ? 'text-red-500' : 'text-primary-600'}`}>
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-muted">Time remaining</p>
      </div>

      {/* Status */}
      <div className="mb-6 flex items-center justify-center gap-3">
        {getStatusIcon()}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900">
            {paymentStatus.status === 'pending' && 'Waiting for payment…'}
            {paymentStatus.status === 'processing' && 'Processing payment…'}
            {paymentStatus.status === 'success' && 'Payment successful'}
            {paymentStatus.status === 'failed' && 'Payment failed'}
            {paymentStatus.status === 'timeout' && 'Payment expired'}
          </div>
          {paymentStatus.message && <div className="mt-1 text-xs text-muted">{paymentStatus.message}</div>}
        </div>
      </div>

      {paymentStatus.status === 'pending' && (
        <div className="space-y-4">
          <Pills
            value={showQR ? 'qr' : 'phone'}
            onChange={(v) => setShowQR(v === 'qr')}
            options={[
              { value: 'qr', label: 'QR Code', icon: <QrCode className="h-3.5 w-3.5" /> },
              { value: 'phone', label: 'Phone', icon: <Smartphone className="h-3.5 w-3.5" /> },
            ]}
            size="md"
          />

          {showQR && qrCode && (
            <div className="space-y-3 text-center">
              <div className="inline-block rounded-lg border border-card-border bg-white p-4">
                <img src={qrCode} alt="MoMo Payment QR" className="h-48 w-48" />
              </div>
              <div className="text-sm text-gray-700">
                <p className="mb-1 font-medium">Scan with MTN MoMo app</p>
                <p className="text-muted">
                  Or dial: <span className="font-mono font-bold text-gray-900">{ussdCode}</span>
                </p>
              </div>
            </div>
          )}

          {!showQR && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Phone number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07xxxxxxxx"
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={(paymentStatus.status as string) === 'processing'}
                disabled={(paymentStatus.status as string) === 'processing' || !phoneNumber}
                onClick={initiatePhonePayment}
              >
                {(paymentStatus.status as string) === 'processing' ? 'Sending request…' : 'Send payment request'}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          size="md"
          className="flex-1"
          disabled={paymentStatus.status === 'processing'}
          onClick={onCancel}
        >
          Cancel
        </Button>

        {paymentStatus.status === 'failed' && (
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={() => {
              setPaymentStatus({ status: 'pending' })
              generatePaymentCodes(merchantIdRef.current, ussdNumberRef.current)
            }}
          >
            Try again
          </Button>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> This is a demo implementation. In production, this would integrate
          with the official MTN MoMo API for Rwanda (momoapi.mtn.co.rw).
        </p>
      </div>
    </div>
  )
}