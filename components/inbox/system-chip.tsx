export function SystemChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="max-w-[80%] truncate rounded-full bg-gray-100 px-3 py-1 text-center text-[11px] text-muted">
        {children}
      </span>
    </div>
  )
}
