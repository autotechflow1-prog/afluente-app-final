import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { EntradaCard } from './components/EntradaCard'
import { useProdutosEntrada } from './hooks/useEntradaEstoque'

const CATEGORIAS = ['Todos', 'Masculina', 'Feminina', 'Infantil', 'Acessórios']

export function EntradaEstoquePage() {
  const { data: grupos = [], isLoading } = useProdutosEntrada()
  const [categoria, setCategoria] = useState('Todos')

  const gruposFiltrados = useMemo(() => {
    if (categoria === 'Todos') return grupos
    return grupos.filter(g => g.categoria === categoria)
  }, [grupos, categoria])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Entrada de Estoque</h2>
        <p className="text-sm text-muted-foreground">{grupos.length} produtos</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIAS.map(cat => (
          <Button
            key={cat}
            size="sm"
            variant="outline"
            className={cn(
              categoria === cat &&
                'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
            )}
            onClick={() => setCategoria(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruposFiltrados.length === 0 && (
            <p className="col-span-full text-center py-10 text-muted-foreground">
              Nenhum produto encontrado
            </p>
          )}
          {gruposFiltrados.map(g => (
            <EntradaCard key={g.chave} grupo={g} />
          ))}
        </div>
      )}
    </div>
  )
}
