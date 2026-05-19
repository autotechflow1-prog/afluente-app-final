import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PedidoComItens } from '../hooks/useSeparacao'

const STATUS_INFO: Record<number, { label: string; className: string }> = {
  6:  { label: 'Em aberto',    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  15: { label: 'Em andamento', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  21: { label: 'Ag. envio',    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  9:  { label: 'Atendido',     className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  12: { label: 'Cancelado',    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function extrairNome(descricao: string): string {
  return descricao
    .replace(/\s*(Tamanho|Cor):[^;,]+[;,]?/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[;,]+$/, '')
    .trim()
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

interface PedidoCardProps {
  pedido: PedidoComItens
  separado: boolean
  onSeparar: (pedido: PedidoComItens) => Promise<void>
  onDesfazer: (numeroBling: string) => void
}

export function PedidoCard({ pedido, separado, onSeparar, onDesfazer }: PedidoCardProps) {
  const [loading, setLoading] = useState(false)
  const status = STATUS_INFO[pedido.situacao_id] ?? {
    label: `Status ${pedido.situacao_id}`,
    className: 'bg-gray-100 text-gray-700',
  }

  async function handleSeparar() {
    setLoading(true)
    try {
      await onSeparar(pedido)
      toast.success(
        `Pedido #${pedido.numero_bling} separado — ${pedido.total_pecas} ${pedido.total_pecas === 1 ? 'peça registrada' : 'peças registradas'}`
      )
    } catch {
      toast.error('Erro ao registrar separação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={separado ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20' : ''}>
      <CardContent className="pt-4 pb-0">
        {/* Header */}
        <div className="flex items-start gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold">#{pedido.numero_bling}</span>
          <span className="text-xs text-muted-foreground self-center">{formatData(pedido.data_pedido)}</span>
          <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', status.className)}>
            {status.label}
          </span>
          {separado && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Separado
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 truncate">{pedido.contato_nome}</p>

        {/* Itens */}
        <div className="mt-3 pt-3 border-t space-y-2.5">
          {pedido.itens.map((item, i) => (
            <div key={`${item.sku}-${i}`} className="flex items-start gap-2.5">
              {item.imagem_url ? (
                <img
                  src={item.imagem_url}
                  alt={extrairNome(item.descricao)}
                  className="w-12 h-12 object-cover rounded shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-muted-foreground">{item.sku}</p>
                <p className="text-sm leading-snug">{extrairNome(item.descricao)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[
                    item.tamanho && `Tamanho: ${item.tamanho}`,
                    item.cor && `Cor: ${item.cor}`,
                    `${item.quantidade} un`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 pb-3 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Total:{' '}
            <span className="font-semibold text-foreground">
              {pedido.total_pecas} {pedido.total_pecas === 1 ? 'peça' : 'peças'}
            </span>
          </span>
          {separado ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDesfazer(pedido.numero_bling)}
              className="text-xs h-7"
            >
              Desfazer
            </Button>
          ) : (
            <Button size="sm" disabled={loading} onClick={handleSeparar} className="text-xs h-7">
              {loading ? 'Salvando...' : 'Separar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
