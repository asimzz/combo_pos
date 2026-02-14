'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import QRCode from 'qrcode'

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

  useEffect(() => {
    generatePaymentCodes()
    startPaymentStatusPolling()
    startTimer()
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus({ status: 'timeout', message: 'Payment request expired' })
    }
  }, [timeLeft])

  const generatePaymentCodes = async () => {
    try {
      // In a real implementation, this would call the MTN MoMo API to generate payment request
      // For now, we'll simulate the payment codes

      // Generate USSD code for manual dialing
      const ussd = `*182*7*1*${amount}*${orderNumber}#`
      setUssdCode(ussd)

      // Generate QR code with MoMo payment data
      // This would typically contain:
      // - Merchant ID
      // - Amount
      // - Transaction reference
      // - Callback URL
      const momoPaymentData = {
        merchant_id: 'COMBO_RESTAURANT_001',
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img
            src="/mtn-logo.png"
            alt="MTN MoMo"
            className="h-8 mr-2"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none'
            }}
          />
          <h2 className="text-2xl font-bold text-yellow-600">MTN MoMo</h2>
        </div>
        <p className="text-gray-600">Pay {amount.toLocaleString()} RWF</p>
        <p className="text-sm text-gray-500">Order: {orderNumber}</p>
      </div>

      {/* Timer */}
      <div className="text-center mb-4">
        <div className={`text-2xl font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
          {formatTime(timeLeft)}
        </div>
        <p className="text-sm text-gray-500">Time remaining</p>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center mb-6">
        {getStatusIcon()}
        <div className="ml-3 text-center">
          <div className="font-medium">
            {paymentStatus.status === 'pending' && 'Waiting for payment...'}
            {paymentStatus.status === 'processing' && 'Processing payment...'}
            {paymentStatus.status === 'success' && 'Payment successful!'}
            {paymentStatus.status === 'failed' && 'Payment failed'}
            {paymentStatus.status === 'timeout' && 'Payment expired'}
          </div>
          {paymentStatus.message && (
            <div className="text-sm text-gray-600 mt-1">{paymentStatus.message}</div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      {paymentStatus.status === 'pending' && (
        <div className="space-y-4">
          {/* Toggle between QR and Phone */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowQR(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                showQR
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-1" />
              QR Code
            </button>
            <button
              onClick={() => setShowQR(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !showQR
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Smartphone className="w-4 h-4 inline mr-1" />
              Phone
            </button>
          </div>

          {/* QR Code Method */}
          {showQR && qrCode && (
            <div className="text-center space-y-3">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img src={qrCode} alt="MoMo Payment QR" className="w-48 h-48" />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Scan with MTN MoMo app</p>
                <p>Or dial: <span className="font-mono font-bold">{ussdCode}</span></p>
              </div>
            </div>
          )}

          {/* Phone Method */}
          {!showQR && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07xxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={initiatePhonePayment}
                disabled={paymentStatus.status === 'processing' || !phoneNumber}
                className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {paymentStatus.status === 'processing' ? (
                  <>
                    <Clock className="w-4 h-4 inline mr-2 animate-spin" />
                    Sending request...
                  </>
                ) : (
                  'Send Payment Request'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex space-x-3">
        <button
          onClick={onCancel}
          disabled={paymentStatus.status === 'processing'}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        {paymentStatus.status === 'failed' && (
          <button
            onClick={() => {
              setPaymentStatus({ status: 'pending' })
              generatePaymentCodes()
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-700">
          <strong>Note:</strong> This is a demo implementation. In production, this would integrate
          with the official MTN MoMo API for Rwanda (momoapi.mtn.co.rw).
        </p>
      </div>
    </div>
  )
}