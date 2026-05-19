import { useMemo, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { usePedidos } from '@/hooks/usePedidos'
import { FiltrosPedidos as FiltrosBar } from './components/FiltrosPedidos'
import { VendasSection } from './components/VendasSection'
import { FinanceiroSection } from './components/FinanceiroSection'
import { AquisicaoSection } from './components/AquisicaoSection'
import { CanalSection } from './components/CanalSection'
import { ClienteSection } from './components/ClienteSection'
import { OperacionalSection } from './components/OperacionalSection'
import { ProdutoSection } from './components/ProdutoSection'
import type { FiltrosPedidos } from '@/types'
import { toast } from 'sonner'

export function PedidosPage() {
  const [filtros, setFiltros] = useState<FiltrosPedidos>({
    periodo: '30d',
    canais: [],
  })

  const { data: pedidos, isLoading, error } = usePedidos(filtros)

  if (error) {
    toast.error('Erro ao carregar pedidos')
  }

  const metricas = useMemo(() => {
    if (!pedidos) return null

    const ativos = pedidos.filter((p) => !p.situacao_nome?.toLowerCase().includes('cancelad'))
    const cancelados = pedidos.filter((p) => p.situacao_nome?.toLowerCase().includes('cancelad'))

    const totalPedidos = ativos.length
    const totalPecas = ativos
      .flatMap((p) => p.bling_pedido_itens)
      .reduce((s, i) => s + Number(i.quantidade), 0)
    const receitaBruta = ativos.reduce((s, p) => s + Number(p.total_pedido), 0)
    const valorProdutos = ativos.reduce((s, p) => s + Number(p.total_produtos), 0)
    const ticketMedio = totalPedidos > 0 ? receitaBruta / totalPedidos : 0

    const docsUnicos = new Set(ativos.map((p) => p.contato_documento).filter(Boolean))
    const totalClientes = docsUnicos.size

    const contagemPorDoc = ativos.reduce((acc, p) => {
      if (p.contato_documento) acc[p.contato_documento] = (acc[p.contato_documento] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const clientesRecorrentes = Object.values(contagemPorDoc).filter((n) => n > 1).length
    const taxaRecompra = totalClientes > 0 ? clientesRecorrentes / totalClientes : 0

    const porCanal = ativos.reduce((acc, p) => {
      const id = p.unidade_negocio_id
      if (!acc[id]) acc[id] = { pedidos: 0, receita: 0, pecas: 0 }
      acc[id].pedidos++
      acc[id].receita += Number(p.total_pedido)
      acc[id].pecas += p.bling_pedido_itens.reduce((s, i) => s + Number(i.quantidade), 0)
      return acc
    }, {} as Record<number, { pedidos: number; receita: number; pecas: number }>)

    const comEntrega = ativos.filter((p) => p.data_saida && p.data_pedido)
    const prazoMedio =
      comEntrega.length > 0
        ? comEntrega.reduce((s, p) => {
            const diff =
              (new Date(p.data_saida!).getTime() - new Date(p.data_pedido).getTime()) / 86400000
            return s + diff
          }, 0) / comEntrega.length
        : null

    // Ranking de SKUs calculado dos pedidos já filtrados
    const skuAcc: Record<string, {
      sku: string; nome: string; pecas_vendidas: number
      pedidoIds: Set<number>; receita_estimada: number
      totalAparicoes: number; cancelamentos: number
    }> = {}

    for (const pedido of pedidos) {
      const isCancelado = pedido.situacao_nome?.toLowerCase().includes('cancelad') ?? false
      for (const item of pedido.bling_pedido_itens) {
        const key = item.item_codigo
        if (!skuAcc[key]) {
          skuAcc[key] = { sku: key, nome: item.item_descricao, pecas_vendidas: 0, pedidoIds: new Set(), receita_estimada: 0, totalAparicoes: 0, cancelamentos: 0 }
        }
        const e = skuAcc[key]
        e.totalAparicoes++
        e.pedidoIds.add(pedido.id)
        if (!isCancelado) {
          e.pecas_vendidas += Number(item.quantidade)
          e.receita_estimada += Number(pedido.total_pedido)
        } else {
          e.cancelamentos++
        }
      }
    }

    const skusRanking = Object.values(skuAcc)
      .map(e => ({
        sku: e.sku,
        nome: e.nome,
        pecas_vendidas: e.pecas_vendidas,
        pedidos: e.pedidoIds.size,
        receita_estimada: e.receita_estimada,
        taxa_cancelamento: e.totalAparicoes > 0 ? e.cancelamentos / e.totalAparicoes : 0,
      }))
      .sort((a, b) => b.receita_estimada - a.receita_estimada)
      .slice(0, 10)

    return {
      totalPedidos,
      totalPecas,
      receitaBruta,
      valorProdutos,
      ticketMedio,
      totalClientes,
      taxaRecompra,
      taxaCancelamento: pedidos.length > 0 ? cancelados.length / pedidos.length : 0,
      prazoMedio,
      porCanal,
      margemBruta: receitaBruta > 0 ? (receitaBruta - valorProdutos) / receitaBruta : 0,
      skusRanking,
    }
  }, [pedidos])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Pedidos</h2>
        <FiltrosBar filtros={filtros} onChange={setFiltros} />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && metricas && (
        <>
          <VendasSection
            totalPedidos={metricas.totalPedidos}
            totalPecas={metricas.totalPecas}
            receitaBruta={metricas.receitaBruta}
            valorProdutos={metricas.valorProdutos}
          />

          <FinanceiroSection
            ticketMedio={metricas.ticketMedio}
            margemBruta={metricas.margemBruta}
            receitaBruta={metricas.receitaBruta}
            totalClientes={metricas.totalClientes}
          />

          <AquisicaoSection
            totalClientes={metricas.totalClientes}
            totalPedidos={metricas.totalPedidos}
          />

          <CanalSection
            porCanal={metricas.porCanal}
            receitaTotal={metricas.receitaBruta}
          />

          <ClienteSection
            totalClientes={metricas.totalClientes}
            taxaRecompra={metricas.taxaRecompra}
            receitaBruta={metricas.receitaBruta}
            totalPedidos={metricas.totalPedidos}
          />

          <OperacionalSection
            taxaCancelamento={metricas.taxaCancelamento}
            prazoMedio={metricas.prazoMedio}
          />

          <ProdutoSection skus={metricas.skusRanking} isLoading={false} />
        </>
      )}

      {!isLoading && !metricas && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <p>Nenhum dado encontrado para o período selecionado</p>
        </div>
      )}
    </div>
  )
}
