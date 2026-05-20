import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { MovimentacaoTable } from './components/MovimentacaoTable'
import { useMovimentacoes } from './hooks/useMovimentacoes'

export function MovimentacoesEstoquePage() {
  const { data: movimentacoes = [], isLoading } = useMovimentacoes()
  const [busca, setBusca] = useState('')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Movimentações de Estoque</h2>
        <p className="text-sm text-muted-foreground">{movimentacoes.length} registros</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Buscar SKU ou produto..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-56"
        />
      </div>

      <MovimentacaoTable
        movimentacoes={movimentacoes}
        isLoading={isLoading}
        busca={busca}
      />
    </div>
  )
}
