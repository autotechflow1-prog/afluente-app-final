import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrivateRoute } from '@/components/layout/PrivateRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProdutosPage } from '@/features/produtos/ProdutosPage'
import { MarketplacePage } from '@/features/marketplace/MarketplacePage'
import { PedidosPage } from '@/features/pedidos/PedidosPage'
import { ConferenciaEstoquePage } from '@/features/estoque/ConferenciaEstoquePage'
import { MovimentacoesEstoquePage } from '@/features/estoque/MovimentacoesEstoquePage'
import { EntradaEstoquePage } from '@/features/estoque/EntradaEstoquePage'
import { SepacaoPedidosPage } from '@/features/separacao/SepacaoPedidosPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/produtos" replace />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/separacao-pedidos" element={<SepacaoPedidosPage />} />
            <Route path="/entrada-estoque" element={<EntradaEstoquePage />} />
            <Route path="/conferencia-estoque" element={<ConferenciaEstoquePage />} />
            <Route path="/movimentacoes-estoque" element={<MovimentacoesEstoquePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
