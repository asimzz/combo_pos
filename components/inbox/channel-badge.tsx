import { cn } from '@/lib/utils'

type Variant = 'pill' | 'dot'

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn('h-3 w-3', className)}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.165-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.992c-.003 5.45-4.437 9.886-9.885 9.886zM20.52 3.449C18.24 1.245 15.24.013 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 0 0 5.71 1.447h.005c6.581 0 11.940-5.335 11.943-11.893a11.821 11.821 0 0 0-3.473-8.453z" />
    </svg>
  )
}

export function ChannelBadge({
  channel = 'whatsapp',
  variant = 'pill',
  withLabel = true,
}: {
  channel?: 'whatsapp'
  variant?: Variant
  withLabel?: boolean
}) {
  if (variant === 'dot') {
    return (
      <span
        aria-label={channel}
        className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-sm"
      >
        <WhatsAppIcon className="h-2.5 w-2.5" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
      <WhatsAppIcon className="h-3 w-3 text-[#25D366]" />
      {withLabel ? <span>WhatsApp</span> : null}
    </span>
  )
}
