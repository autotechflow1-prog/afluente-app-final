import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { num } from '@/lib/formatters'

interface AquisicaoSectionProps {
  totalClientes: number
  totalPedidos: number
}


export function AquisicaoSection({ totalClientes, totalPedidos }: AquisicaoSectionProps) {
  const items = [
    { label: 'Novos Clientes', value: num(totalClientes) },
    { label: 'Total Pedidos', value: num(totalPedidos) },
    { label: 'Pedidos / Cliente', value: totalClientes > 0 ? (totalPedidos / totalClientes).toFixed(1) : '0' },
  ]

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Aquisição</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <p className="text-xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
