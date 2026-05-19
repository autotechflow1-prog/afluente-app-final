import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { brl, num, pct } from '@/lib/formatters'
import type { SkuRanking } from '@/types'

interface ProdutoSectionProps {
  skus: SkuRanking[]
  isLoading: boolean
}

export function ProdutoSection({ skus, isLoading }: ProdutoSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
        Top 10 SKUs
      </h3>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Peças</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">Cancelam.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && skus.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  Nenhum dado encontrado para o período selecionado
                </TableCell>
              </TableRow>
            )}
            {!isLoading && skus.map((s, i) => (
              <TableRow key={s.sku}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                <TableCell className="max-w-40 truncate text-sm">{s.nome}</TableCell>
                <TableCell className="text-right">{num(s.pecas_vendidas)}</TableCell>
                <TableCell className="text-right">{num(s.pedidos)}</TableCell>
                <TableCell className="text-right">{brl(s.receita_estimada)}</TableCell>
                <TableCell className="text-right">{pct(s.taxa_cancelamento ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
