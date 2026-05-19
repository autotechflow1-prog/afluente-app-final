import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { brl, num } from '@/lib/formatters'
import type { BlingProduct } from '@/types'

interface ProdutoTableProps {
  produtos: BlingProduct[]
  onToggle: (id: string, valor: boolean) => void
}

export function ProdutoTable({ produtos, onToggle }: ProdutoTableProps) {
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

  const ativos = produtos.filter((p) => p.ativo_frontend).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {produtos.length} produtos · {ativos} ativos
        </p>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar SKU ou nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full sm:w-56"
          />
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ativo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            )}
            {filtrados.map((p) => {
              return (
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
                  <TableCell className="max-w-48 truncate">{p.nome}</TableCell>
                  <TableCell className="text-sm">{p.cor ?? '—'}</TableCell>
                  <TableCell className="text-sm">{p.tamanho ?? '—'}</TableCell>
                  <TableCell className="text-sm">{p.categoria_nome ?? '—'}</TableCell>
                  <TableCell className="text-right text-sm">
                    {p.estoque_saldo !== undefined ? num(p.estoque_saldo) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {p.preco !== undefined ? brl(p.preco) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.ativo_frontend ? 'default' : 'secondary'}>
                      {p.ativo_frontend ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.ativo_frontend}
                      onCheckedChange={(v) => onToggle(p.id, v)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function ProdutoTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}
