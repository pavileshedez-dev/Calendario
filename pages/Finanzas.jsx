import { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
    Wallet,
    Plus,
    TrendingUp,
    TrendingDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Trash2,
    X,
    DollarSign,
} from 'lucide-react'

const CATEGORIAS_INGRESO = ['Salario', 'Beca', 'Freelance', 'Otro']
const CATEGORIAS_GASTO = ['Comida', 'Transporte', 'Material', 'Ocio', 'Suscripciones', 'Alquiler', 'Otro']

export default function Finanzas() {
    const [transactions, setTransactions] = useLocalStorage('calendario-transactions', [])
    const [showModal, setShowModal] = useState(false)

    // Auto-open modal when navigated from FAB
    const location = typeof window !== 'undefined' ? window.history.state?.usr : null
    useEffect(() => {
        if (location?.openModal) {
            setShowModal(true)
        }
    }, [location])

    const totalIngresos = transactions
        .filter(t => t.type === 'ingreso')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalGastos = transactions
        .filter(t => t.type === 'gasto')
        .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIngresos - totalGastos

    function addTransaction(tx) {
        setTransactions([{ ...tx, id: Date.now().toString(), date: new Date().toISOString() }, ...transactions])
        setShowModal(false)
    }

    function deleteTransaction(id) {
        setTransactions(transactions.filter(t => t.id !== id))
    }

    // Monthly chart data (last 6 months)
    const monthlyData = getMonthlyData(transactions)

    return (
        <div className="page-enter space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Wallet size={28} className="text-emerald-600" strokeWidth={1.8} />
                        Control de Finanzas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Registra tus ingresos y gastos, y controla tu balance.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
                    <Plus size={16} /> Nuevo registro
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryCard
                    label="Balance"
                    amount={balance}
                    icon={DollarSign}
                    colorClass={balance >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}
                    showSign
                />
                <SummaryCard
                    label="Ingresos"
                    amount={totalIngresos}
                    icon={TrendingUp}
                    colorClass="text-emerald-600 bg-emerald-50"
                />
                <SummaryCard
                    label="Gastos"
                    amount={totalGastos}
                    icon={TrendingDown}
                    colorClass="text-red-500 bg-red-50"
                />
            </div>

            {/* Chart */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Resumen mensual
                </h3>
                <MiniBarChart data={monthlyData} />
            </div>

            {/* Transactions List */}
            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-surface-200">
                    <h3 className="text-sm font-semibold text-gray-600">
                        Transacciones recientes
                    </h3>
                </div>
                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                        No hay transacciones registradas todavía.
                    </div>
                ) : (
                    <div className="divide-y divide-surface-100">
                        {transactions.slice(0, 20).map(tx => (
                            <div
                                key={tx.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-surface-50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                    ${tx.type === 'ingreso' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                        {tx.type === 'ingreso'
                                            ? <ArrowUpCircle size={16} className="text-emerald-600" />
                                            : <ArrowDownCircle size={16} className="text-red-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{tx.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{tx.category}</span>
                                            <span className="text-xs text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold ${tx.type === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {tx.type === 'ingreso' ? '+' : '-'}{tx.amount.toFixed(2)} €
                                    </span>
                                    <button
                                        onClick={() => deleteTransaction(tx.id)}
                                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                                        aria-label="Eliminar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <TransactionModal onSave={addTransaction} onClose={() => setShowModal(false)} />
            )}
        </div>
    )
}

function SummaryCard({ label, amount, icon: Icon, colorClass, showSign }) {
    return (
        <div className="glass-card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                <Icon size={22} strokeWidth={1.8} />
            </div>
            <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className={`text-xl font-bold ${colorClass.split(' ')[0]}`}>
                    {showSign && amount >= 0 ? '+' : ''}{amount.toFixed(2)} €
                </p>
            </div>
        </div>
    )
}

function TransactionModal({ onSave, onClose }) {
    const [type, setType] = useState('gasto')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')

    const categories = type === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_GASTO

    function handleSubmit(e) {
        e.preventDefault()
        const parsedAmount = parseFloat(amount)
        if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return
        onSave({
            type,
            amount: parsedAmount,
            description: description.trim(),
            category: category || categories[0],
        })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 animate-slide-up space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Nuevo registro</h2>
                    <button type="button" onClick={onClose} className="btn-ghost p-1.5">
                        <X size={18} />
                    </button>
                </div>

                {/* Type Toggle */}
                <div className="flex gap-2 p-1 bg-surface-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => { setType('ingreso'); setCategory('') }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'ingreso' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'
                            }`}
                    >
                        Ingreso
                    </button>
                    <button
                        type="button"
                        onClick={() => { setType('gasto'); setCategory('') }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'gasto' ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'
                            }`}
                    >
                        Gasto
                    </button>
                </div>

                <div className="space-y-4">
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Monto (€)"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="input-field text-xl font-bold text-center"
                        autoFocus
                        required
                    />
                    <input
                        type="text"
                        placeholder="Descripción"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="input-field"
                        required
                    />
                    <select
                        value={category || categories[0]}
                        onChange={e => setCategory(e.target.value)}
                        className="input-field"
                    >
                        {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button type="submit" className="btn-primary text-sm">Añadir</button>
                </div>
            </form>
        </div>
    )
}

function MiniBarChart({ data }) {
    if (data.length === 0) {
        return <p className="text-sm text-gray-400 text-center py-8">No hay datos suficientes.</p>
    }

    const maxVal = Math.max(...data.map(d => Math.max(d.ingresos, d.gastos)), 1)

    return (
        <div className="flex items-end gap-3 h-40">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 w-full justify-center" style={{ height: '120px' }}>
                        <div
                            className="w-3 sm:w-4 bg-emerald-400 rounded-t-md transition-all duration-500"
                            style={{ height: `${(d.ingresos / maxVal) * 100}%`, minHeight: d.ingresos > 0 ? '4px' : '0' }}
                            title={`Ingresos: ${d.ingresos.toFixed(2)} €`}
                        />
                        <div
                            className="w-3 sm:w-4 bg-red-400 rounded-t-md transition-all duration-500"
                            style={{ height: `${(d.gastos / maxVal) * 100}%`, minHeight: d.gastos > 0 ? '4px' : '0' }}
                            title={`Gastos: ${d.gastos.toFixed(2)} €`}
                        />
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
                </div>
            ))}
        </div>
    )
}

function getMonthlyData(transactions) {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        const label = d.toLocaleDateString('es-ES', { month: 'short' })
        months.push({ key, label, ingresos: 0, gastos: 0 })
    }
    transactions.forEach(tx => {
        const txDate = new Date(tx.date)
        const txKey = `${txDate.getFullYear()}-${txDate.getMonth()}`
        const month = months.find(m => m.key === txKey)
        if (month) {
            if (tx.type === 'ingreso') month.ingresos += tx.amount
            else month.gastos += tx.amount
        }
    })
    return months
}
