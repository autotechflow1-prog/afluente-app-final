interface EntradaTamanhoInputProps {
  tamanho: string
  value: number
  onChange: (v: number) => void
}

export function EntradaTamanhoInput({ tamanho, value, onChange }: EntradaTamanhoInputProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-medium text-muted-foreground uppercase">{tamanho}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-6 h-7 rounded-l border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n) && n >= 0) onChange(n)
            else if (e.target.value === '') onChange(0)
          }}
          className="w-12 h-7 border-y text-center text-sm bg-background outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-6 h-7 rounded-r border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
        >
          +
        </button>
      </div>
      {value > 0 && (
        <span className="text-[11px] font-medium text-green-600">+{value}</span>
      )}
    </div>
  )
}
