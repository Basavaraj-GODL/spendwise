import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import AppShell from './pages/AppShell'
import Dashboard from './pages/Dashboard'
import Unavailable from './pages/Unavailable'
import Signup from './pages/Signup'
import Login from './pages/login'
import Transactions from './pages/Transactions'
import AIScan from './pages/AIScan'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import SavingsGoals from './pages/SavingsGoals'
import RecurringPayments from './pages/RecurringPayments'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-scan" element={<AIScan />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<SavingsGoals />} />
        <Route path="recurring" element={<RecurringPayments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<Unavailable title="Page not found" stage="" />} />
    </Routes>
  )
}
