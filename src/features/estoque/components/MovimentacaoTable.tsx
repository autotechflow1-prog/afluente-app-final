import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { dt } from '@/lib/formatters'
import type { EstoqueMovimentacao } from '@/types'

interface MovimentacaoTableProps {
  movimentacoes: EstoqueMovimentacao[]
  isLoading: boolean
  busca: string
  tipoFiltro: string
}

const TIPO_CONFIG = {
  entrada: { label: 'Entrada', class: 'bg-green-100 text-green-800 hover:bg-green-100' },
  saida:   { label: 'Saída',   class: 'bg-red-100 text-red-800 hover:bg-red-100' },
  ajuste:  { label: 'Ajuste',  class: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
}

export function MovimentacaoTable({ movimentacoes, isLoading, busca, tipoFiltro }: MovimentacaoTableProps) {
  const filtradas = movimentacoes.filter(m => {
    const matchBusca = !busca || m.sku.toLowerCase().includes(busca.toLowerCase()) ||
      m.produto_nome.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = tipoFiltro === 'todos' || m.tipo === tipoFiltro
    return matchBusca && matchTipo
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Qtd</TableHead>
            <TableHead>Anterior → Novo</TableHead>
            <TableHead>Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtradas.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                Nenhuma movimentação encontrada
              </TableCell>
            </TableRow>
          )}
          {filtradas.map(m => {
            const cfg = TIPO_CONFIG[m.tipo] ?? TIPO_CONFIG.ajuste
            const sinal = m.tipo === 'entrada' ? '+' : m.tipo === 'saida' ? '-' : '±'
            return (
              <TableRow key={m.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{dt(m.criado_em)}</TableCell>
                <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{m.produto_nome}</span>
                  {(m.cor || m.tamanho) && (
                    <span className="text-muted-foreground"> · {[m.cor, m.tamanho].filter(Boolean).join(' ')}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cfg.class}>{cfg.label}</Badge>
                </TableCell>
                <TableCell className={`text-right font-medium ${m.tipo === 'entrada' ? 'text-green-600' : m.tipo === 'saida' ? 'text-destructive' : 'text-amber-600'}`}>
                  {sinal}{m.quantidade}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {m.quantidade_anterior} → {m.quantidade_nova}
                </TableCell>
                <TableCell className="text-sm max-w-48 truncate">{m.motivo}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
