import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { brl, num } from '@/lib/formatters'

interface VendasSectionProps {
  totalPedidos: number
  totalPecas: number
  receitaBruta: number
  valorProdutos: number
}

export function VendasSection({ totalPedidos, totalPecas, receitaBruta, valorProdutos }: VendasSectionProps) {
  const kpis = [
    { label: 'Pedidos', value: num(totalPedidos) },
    { label: 'Peças', value: num(totalPecas) },
    { label: 'Receita Bruta', value: brl(receitaBruta) },
    { label: 'Valor Produtos', value: brl(valorProdutos) },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map(({ label, value }) => (
        <Card key={label}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-2xl font-semibold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
