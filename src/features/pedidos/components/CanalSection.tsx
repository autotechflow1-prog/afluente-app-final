import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCanalInfo } from '@/lib/canais'
import { brl, num, pct } from '@/lib/formatters'

interface CanalData {
  pedidos: number
  receita: number
  pecas: number
}

interface CanalSectionProps {
  porCanal: Record<number, CanalData>
  receitaTotal: number
}

export function CanalSection({ porCanal, receitaTotal }: CanalSectionProps) {
  const entradas = Object.entries(porCanal)
    .map(([id, data]) => ({ id: Number(id), ...data, canal: getCanalInfo(Number(id)) }))
    .sort((a, b) => b.receita - a.receita)

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Por Canal</h3>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Peças</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead className="text-right">% Total</TableHead>
              <TableHead className="text-right">Ticket Médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum dado encontrado para o período selecionado
                </TableCell>
              </TableRow>
            )}
            {entradas.map(({ id, canal, pedidos, receita, pecas }) => (
              <TableRow key={id}>
                <TableCell>
                  <Badge style={{ backgroundColor: canal.cor, color: canal.cor === '#FFE600' ? '#000' : '#fff' }}>
                    {canal.nome}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{num(pedidos)}</TableCell>
                <TableCell className="text-right">{num(pecas)}</TableCell>
                <TableCell className="text-right">{brl(receita)}</TableCell>
                <TableCell className="text-right">{pct(receitaTotal > 0 ? receita / receitaTotal : 0)}</TableCell>
                <TableCell className="text-right">{brl(pedidos > 0 ? receita / pedidos : 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
