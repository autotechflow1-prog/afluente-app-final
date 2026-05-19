import { useMemo, useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { StatusTabs, STATUS_TABS } from './components/StatusTabs'
import { CanalSecao } from './components/CanalSecao'
import { ResumoRodape } from './components/ResumoRodape'
import { useSeparacao } from './hooks/useSeparacao'
import type { PedidoComItens } from './hooks/useSeparacao'

const CANAL_ORDER = [1775320, 1759519, 2577541, 2456400, 1788181, 0]

export function SepacaoPedidosPage() {
  const [tabKey, setTabKey] = useState('separar')
  const [busca, setBusca] = useState('')

  const statusIds = STATUS_TABS.find(t => t.key === tabKey)?.ids ?? null

  const { porCanal, isLoading, error, separados, marcarSeparado, desmarcarSeparado, inserirMovimentacao } =
    useSeparacao(statusIds)

  const porCanalFiltrado = useMemo(() => {
    if (!busca.trim()) return porCanal
    const q = busca.toLowerCase()
    const result: Record<number, PedidoComItens[]> = {}
    for (const [id, pedidos] of Object.entries(porCanal)) {
      const filtrados = (pedidos as PedidoComItens[]).filter(
        p =>
          p.numero_bling.toLowerCase().includes(q) ||
          p.contato_nome.toLowerCase().includes(q)
      )
      if (filtrados.length > 0) result[Number(id)] = filtrados
    }
    return result
  }, [porCanal, busca])

  const secoesVisiveis = CANAL_ORDER.filter(id => (porCanalFiltrado[id]?.length ?? 0) > 0)

  const allPedidosFlat = Object.values(porCanal).flat() as PedidoComItens[]
  const totalPecas = allPedidosFlat.reduce((s, p) => s + p.total_pecas, 0)

  const pedidosFiltradosFlat = Object.values(porCanalFiltrado).flat() as PedidoComItens[]
  const separadosNaView = allPedidosFlat.filter(p => separados.has(p.numero_bling))
  const pecasSeparadas = separadosNaView.reduce((s, p) => s + p.total_pecas, 0)

  async function handleSeparar(pedido: PedidoComItens) {
    await inserirMovimentacao(pedido)
    marcarSeparado(pedido.numero_bling)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Carregando pedidos...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive text-sm">Erro ao carregar pedidos: {String(error)}</p>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Separação de Pedidos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {allPedidosFlat.length} {allPedidosFlat.length === 1 ? 'pedido' : 'pedidos'} · {totalPecas} {totalPecas === 1 ? 'peça' : 'peças'}
          </p>
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <StatusTabs value={tabKey} onChange={setTabKey} />
          <Input
            placeholder="Buscar por nº do pedido ou cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Seções por canal */}
        {pedidosFiltradosFlat.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {allPedidosFlat.length === 0
              ? 'Nenhum pedido para o status selecionado'
              : 'Nenhum resultado para a busca'}
          </div>
        ) : (
          <div className="space-y-8">
            {secoesVisiveis.map(canalId => (
              <CanalSecao
                key={canalId}
                canalId={canalId}
                pedidos={porCanalFiltrado[canalId]!}
                separados={separados}
                onSeparar={handleSeparar}
                onDesfazer={desmarcarSeparado}
              />
            ))}
          </div>
        )}
      </div>

      <ResumoRodape
        totalPedidos={allPedidosFlat.length}
        separadosCount={separadosNaView.length}
        pecasSeparadas={pecasSeparadas}
      />
    </div>
  )
}
