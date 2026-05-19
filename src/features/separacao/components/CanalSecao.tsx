import { getCanalInfo } from '@/lib/canais'
import { PedidoCard } from './PedidoCard'
import type { PedidoComItens } from '../hooks/useSeparacao'

interface CanalSecaoProps {
  canalId: number
  pedidos: PedidoComItens[]
  separados: Set<string>
  onSeparar: (pedido: PedidoComItens) => Promise<void>
  onDesfazer: (numeroBling: string) => void
}

export function CanalSecao({ canalId, pedidos, separados, onSeparar, onDesfazer }: CanalSecaoProps) {
  const canal = getCanalInfo(canalId)
  const totalPecas = pedidos.reduce((s, p) => s + p.total_pecas, 0)
  const isLight = canal.cor === '#FFE600'

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span
          className="text-sm font-bold px-2.5 py-1 rounded"
          style={{ backgroundColor: canal.cor, color: isLight ? '#000' : '#fff' }}
        >
          {canal.nome}
        </span>
        <span className="text-sm text-muted-foreground">
          {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'} ·{' '}
          {totalPecas} {totalPecas === 1 ? 'peça' : 'peças'}
        </span>
      </div>

      <div className="space-y-3">
        {pedidos.map(pedido => (
          <PedidoCard
            key={pedido.bling_id}
            pedido={pedido}
            separado={separados.has(pedido.numero_bling)}
            onSeparar={onSeparar}
            onDesfazer={onDesfazer}
          />
        ))}
      </div>
    </section>
  )
}
