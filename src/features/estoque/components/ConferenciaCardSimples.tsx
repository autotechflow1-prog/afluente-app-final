import { Card, CardContent } from '@/components/ui/card'
import type { GrupoSimples } from '../hooks/useConferenciaEstoque'

interface Props {
  grupo: GrupoSimples
  contagens: Record<string, number>
  onContagem: (sku: string, valor: number) => void
}

export function ConferenciaCardSimples({ grupo, contagens, onContagem }: Props) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex gap-3">
          {grupo.imagem ? (
            <img
              src={grupo.imagem}
              alt={grupo.nome}
              className="w-14 h-14 object-cover rounded shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight line-clamp-2">{grupo.nome}</p>
            {grupo.cor && (
              <p className="text-xs text-muted-foreground mt-0.5">{grupo.cor}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {grupo.variacoes.map(v => {
            const count = contagens[v.codigo]
            const divergencia = count !== undefined ? count - v.saldo : 0
            const temDiv = count !== undefined && divergencia !== 0
            return (
              <div key={v.codigo} className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">{v.tamanho}</span>
                <span className="text-xs font-bold">{v.saldo}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onContagem(v.codigo, Math.max(0, (count ?? v.saldo) - 1))}
                    className="w-6 h-7 rounded-l border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={count ?? ''}
                    placeholder={String(v.saldo)}
                    onChange={e => {
                      const n = parseInt(e.target.value, 10)
                      if (!isNaN(n) && n >= 0) onContagem(v.codigo, n)
                      else if (e.target.value === '') onContagem(v.codigo, v.saldo)
                    }}
                    className="w-14 h-7 border-y text-center text-sm bg-background outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onContagem(v.codigo, (count ?? v.saldo) + 1)}
                    className="w-6 h-7 rounded-r border bg-muted hover:bg-accent flex items-center justify-center text-sm font-bold leading-none"
                  >
                    +
                  </button>
                </div>
                {temDiv ? (
                  <span className={`text-[11px] font-medium ${divergencia > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {divergencia > 0 ? `+${divergencia}` : divergencia}
                  </span>
                ) : (
                  <span className="text-[11px] invisible">+0</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
