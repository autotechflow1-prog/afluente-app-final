import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { dt } from '@/lib/formatters'
import type { EstoqueMovimentacao } from '@/types'

interface MovimentacaoTableProps {
  movimentacoes: EstoqueMovimentacao[]
  isLoading: boolean
  busca: string
}

export function MovimentacaoTable({ movimentacoes, isLoading, busca }: MovimentacaoTableProps) {
  const filtradas = movimentacoes.filter(m => {
    return (
      !busca ||
      m.sku.toLowerCase().includes(busca.toLowerCase()) ||
      m.produto_nome.toLowerCase().includes(busca.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Tamanho</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
            <TableHead>Tipo</TableHead>
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
          {filtradas.map(m => (
            <TableRow key={m.id}>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {dt(m.criado_em)}
              </TableCell>
              <TableCell className="font-mono text-xs">{m.sku}</TableCell>
              <TableCell className="text-sm font-medium">{m.produto_nome}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{m.cor ?? '—'}</TableCell>
              <TableCell className="text-sm">{m.tamanho ?? '—'}</TableCell>
              <TableCell className="text-right font-medium text-green-600">+{m.quantidade}</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Entrada</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
