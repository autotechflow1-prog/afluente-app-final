import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useProdutosMarketplace } from '@/hooks/useMarketplace'
import { StatusCell } from './components/StatusCell'
import { MarketplaceSheet } from './components/MarketplaceSheet'
import type { ProdutoComStatus } from '@/types'

export function MarketplacePage() {
  const { data, isLoading } = useProdutosMarketplace()
  const produtos = data?.produtos ?? []
  const marketplaces = data?.marketplaces ?? []
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todas')

  const categorias = useMemo(() => {
    const set = new Set(produtos.map((p) => p.categoria_nome).filter(Boolean) as string[])
    return Array.from(set).sort()
  }, [produtos])

  const filtrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchBusca =
        !busca ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        p.nome.toLowerCase().includes(busca.toLowerCase())
      const matchCat = categoria === 'todas' || p.categoria_nome === categoria
      return matchBusca && matchCat
    })
  }, [produtos, busca, categoria])

  function getStatusForMarketplace(produto: ProdutoComStatus, marketplaceId: string) {
    return produto.status[marketplaceId]
  }

  function renderTabela(mktId: string | null) {
    const lista = filtrados
    return (
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Tam.</TableHead>
              <TableHead>Categoria</TableHead>
              {mktId ? (
                <TableHead>Status / Preço</TableHead>
              ) : (
                marketplaces?.map((m) => (
                  <TableHead key={m.id}>{m.nome}</TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            )}
            {lista.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="p-1">
                  {p.imagem_principal_url ? (
                    <img
                      src={p.imagem_principal_url}
                      alt={p.nome}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.codigo}</TableCell>
                <TableCell className="max-w-40 truncate text-sm">{p.nome}</TableCell>
                <TableCell className="text-sm">{p.cor ?? '—'}</TableCell>
                <TableCell className="text-sm">{p.tamanho ?? '—'}</TableCell>
                <TableCell className="text-sm">{p.categoria_nome ?? '—'}</TableCell>
                {mktId ? (
                  <TableCell>
                    <StatusCell
                      sku={p.codigo}
                      marketplaceId={mktId}
                      status={getStatusForMarketplace(p, mktId)}
                    />
                  </TableCell>
                ) : (
                  marketplaces?.map((m) => (
                    <TableCell key={m.id}>
                      <StatusCell
                        sku={p.codigo}
                        marketplaceId={m.id}
                        status={getStatusForMarketplace(p, m.id)}
                      />
                    </TableCell>
                  ))
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Marketplace</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Buscar SKU ou nome..."
            value={busca}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
            className="w-48"
          />
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MarketplaceSheet />
        </div>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          {marketplaces?.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>{m.nome}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="todos" className="mt-4">
          {renderTabela(null)}
        </TabsContent>

        {marketplaces?.map((m) => (
          <TabsContent key={m.id} value={m.id} className="mt-4">
            {renderTabela(m.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
