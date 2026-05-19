import { CheckCircle2, Circle } from 'lucide-react'
import { useUpsertStatus } from '@/hooks/useMarketplace'
import type { MarketplaceStatusEntry } from '@/types'
import { toast } from 'sonner'

interface StatusCellProps {
  sku: string
  marketplaceId: string
  status?: MarketplaceStatusEntry
}

type BoolField = 'upload_feito' | 'especificacoes_ok' | 'descricao_ok' | 'fotos_ok' | 'preco_ok'

const CAMPOS: { field: BoolField; label: string }[] = [
  { field: 'upload_feito', label: 'Upload' },
  { field: 'especificacoes_ok', label: 'Specs' },
  { field: 'descricao_ok', label: 'Desc.' },
  { field: 'fotos_ok', label: 'Fotos' },
  { field: 'preco_ok', label: 'Preço' },
]

export function StatusCell({ sku, marketplaceId, status }: StatusCellProps) {
  const upsert = useUpsertStatus()

  function toggleField(field: BoolField) {
    const novoValor = !(status?.[field] ?? false)
    upsert.mutate(
      { sku, marketplace_id: marketplaceId, [field]: novoValor },
      { onError: () => toast.error('Erro ao salvar') }
    )
  }

  return (
    <div className="flex items-center gap-2">
      {CAMPOS.map(({ field, label }) => {
        const feito = status?.[field] ?? false
        return (
          <button
            key={field}
            title={label}
            onClick={() => toggleField(field)}
            className="flex flex-col items-center gap-0.5 hover:opacity-70 transition-opacity"
          >
            {feito ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
