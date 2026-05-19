interface TamanhoInputProps {
  tamanho: string
  estoqueBling: number
  estoqueReal: number
  reservado: number
  value: number | undefined
  onChange: (v: number) => void
}

export function TamanhoInput({ tamanho, estoqueBling, estoqueReal, reservado, value, onChange }: TamanhoInputProps) {
  const divergencia = value !== undefined ? value - estoqueReal : 0
  const temDivergencia = value !== undefined && divergencia !== 0

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-medium text-muted-foreground uppercase">{tamanho}</span>

      {/* Estoque real — referência para conferência */}
      <span className="text-xs font-bold text-green-600">{estoqueReal}</span>

      {/* Estoque Bling — saldo puro */}
      <span className="text-[11px] text-muted-foreground">{estoqueBling}</span>

      {/* Reservado — mantém altura mesmo quando zero */}
      {reservado > 0 ? (
        <span className="text-[11px] font-medium text-amber-600">+{reservado}</span>
      ) : (
        <span className="text-[11px] invisible">+0</span>
      )}

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, (value ?? estoqueReal) - 1))}
          className="w-6 h-7 rounded-l border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value ?? ''}
          placeholder={String(estoqueReal)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n) && n >= 0) onChange(n)
            else if (e.target.value === '') onChange(estoqueReal)
          }}
          className="w-14 h-7 border-y text-center text-sm bg-background outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange((value ?? estoqueReal) + 1)}
          className="w-6 h-7 rounded-r border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
        >
          +
        </button>
      </div>

      {temDivergencia && (
        <span className={`text-[11px] font-medium ${divergencia > 0 ? 'text-green-600' : 'text-destructive'}`}>
          {divergencia > 0 ? `+${divergencia}` : divergencia}
        </span>
      )}
    </div>
  )
}
