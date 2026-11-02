import { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
    Plus,
    X,
    GraduationCap,
    BookOpen,
    FileText,
    ClipboardList,
    Calendar,
    Filter,
    Trash2,
    GripVertical,
    BookPlus,
} from 'lucide-react'

const COLUMNS = [
    { id: 'pendiente', title: 'Pendiente', color: 'bg-amber-400' },
    { id: 'en-curso', title: 'En curso', color: 'bg-blue-400' },
    { id: 'completado', title: 'Completado', color: 'bg-emerald-400' },
]

const ASIGNATURAS = ['Profesión del Logopeda', 'Bases de la Neurociencia', 'Lingüística II', 'Psicología del Lenguaje', 'Fisiología de los Órganos del Lenguaje', 'Estadística I', 'Otra']

const TIPOS = [
    { id: 'tarea', label: 'Tarea', icon: ClipboardList },
    { id: 'entrega', label: 'Entrega', icon: FileText },
    { id: 'apunte', label: 'Apunte', icon: BookOpen },
]

const ASIGNATURA_COLORS = {
    'Profesión del Logopeda': 'bg-rose-100 text-rose-700',
    'Bases de la Neurociencia': 'bg-sky-100 text-sky-700',
    'Lingüística II': 'bg-violet-100 text-violet-700',
    'Psicología del Lenguaje': 'bg-amber-100 text-amber-700',
    'Fisiología de los Órganos del Lenguaje': 'bg-teal-100 text-teal-700',
    'Estadística I': 'bg-indigo-100 text-indigo-700',
    Otra: 'bg-gray-100 text-gray-600',
}

function getTipoLabel(tipo) {
    return TIPOS.find(t => t.id === tipo)?.label || tipo || 'Tarea'
}

function getTipoValue(label) {
    return TIPOS.find(t => t.label.toLocaleLowerCase() === label.trim().toLocaleLowerCase())?.id || label.trim()
}

export default function Universidad() {
    const [tasks, setTasks] = useLocalStorage('calendario-tasks', [])
    const [asignaturas, setAsignaturas] = useLocalStorage('calendario-asignaturas', ASIGNATURAS)
    const [customTypes, setCustomTypes] = useLocalStorage('calendario-tipos-tarea', [])
    const [showModal, setShowModal] = useState(false)
    const [showSubjectsModal, setShowSubjectsModal] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [filterAsignatura, setFilterAsignatura] = useState('Todas')
    const [draggedId, setDraggedId] = useState(null)

    // Auto-open modal when navigated from FAB
    const location = typeof window !== 'undefined' ? window.history.state?.usr : null
    useEffect(() => {
        if (location?.openModal) {
            setEditTask(null)
            setShowModal(true)
        }
    }, [location])

    const filteredTasks = filterAsignatura === 'Todas'
        ? tasks
        : tasks.filter(t => t.asignatura === filterAsignatura)

    function addOrUpdateTask(task) {
        const tipo = getTipoValue(task.tipo)
        if (editTask) {
            setTasks(tasks.map(t => t.id === editTask.id ? { ...task, tipo, id: editTask.id } : t))
        } else {
            setTasks([...tasks, { ...task, tipo, id: Date.now().toString() }])
        }
        if (!TIPOS.some(t => t.id === tipo)) {
            setCustomTypes(current => current.some(t => t.toLocaleLowerCase() === tipo.toLocaleLowerCase())
                ? current
                : [...current, tipo])
        }
        setEditTask(null)
        setShowModal(false)
    }

    function addSubject(subject) {
        const trimmedSubject = subject.trim()
        if (!trimmedSubject || asignaturas.some(a => a.toLocaleLowerCase() === trimmedSubject.toLocaleLowerCase())) return false
        setAsignaturas([...asignaturas, trimmedSubject])
        return true
    }

    function deleteTask(id) {
        setTasks(tasks.filter(t => t.id !== id))
    }

    function handleDragStart(id) {
        setDraggedId(id)
    }

    function handleDrop(newStatus) {
        if (draggedId) {
            setTasks(tasks.map(t =>
                t.id === draggedId ? { ...t, status: newStatus } : t
            ))
            setDraggedId(null)
        }
    }

    return (
        <div className="page-enter space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <GraduationCap size={28} className="text-primary-600" strokeWidth={1.8} />
                        Gestor Universitario
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Organiza tus tareas y entregas por asignatura.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowSubjectsModal(true)}
                        className="btn-secondary text-sm"
                    >
                        <BookPlus size={16} /> Asignaturas
                    </button>
                    {/* Filter */}
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={filterAsignatura}
                            onChange={e => setFilterAsignatura(e.target.value)}
                            className="input-field pl-8 pr-4 py-2 text-sm w-40"
                        >
                            <option value="Todas">Todas</option>
                            {asignaturas.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    {/* Add button */}
                    <button
                        onClick={() => { setEditTask(null); setShowModal(true) }}
                        className="btn-primary text-sm"
                    >
                        <Plus size={16} /> Nueva
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {COLUMNS.map(col => (
                    <div
                        key={col.id}
                        className="space-y-3"
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(col.id)}
                    >
                        {/* Column Header */}
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                            <h3 className="text-sm font-semibold text-gray-600">{col.title}</h3>
                            <span className="badge bg-surface-100 text-gray-500">
                                {filteredTasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="space-y-2.5 min-h-[80px] rounded-xl bg-surface-50/50 p-2">
                            {filteredTasks
                                .filter(t => t.status === col.id)
                                .map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={() => { setEditTask(task); setShowModal(true) }}
                                        onDelete={() => deleteTask(task.id)}
                                        onDragStart={() => handleDragStart(task.id)}
                                    />
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <TaskModal
                    task={editTask}
                    asignaturas={asignaturas}
                    customTypes={customTypes}
                    onSave={addOrUpdateTask}
                    onClose={() => { setShowModal(false); setEditTask(null) }}
                />
            )}
            {showSubjectsModal && (
                <SubjectsModal
                    asignaturas={asignaturas}
                    onAdd={addSubject}
                    onClose={() => setShowSubjectsModal(false)}
                />
            )}
        </div>
    )
}

function TaskCard({ task, onEdit, onDelete, onDragStart }) {
    const TipoIcon = TIPOS.find(t => t.id === task.tipo)?.icon || ClipboardList
    const tipoLabel = getTipoLabel(task.tipo)

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onEdit}
            className="glass-card-hover p-4 cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`badge ${ASIGNATURA_COLORS[task.asignatura] || ASIGNATURA_COLORS.Otra}`}>
                            {task.asignatura}
                        </span>
                        <TipoIcon size={13} className="text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">{tipoLabel}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                            <Calendar size={11} />
                            {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                            })}
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={14} className="text-gray-300" />
                    <button
                        onClick={e => { e.stopPropagation(); onDelete() }}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        aria-label="Eliminar"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    )
}

function TaskModal({ task, asignaturas, customTypes, onSave, onClose }) {
    const [title, setTitle] = useState(task?.title || '')
    const [description, setDescription] = useState(task?.description || '')
    const [asignatura, setAsignatura] = useState(task?.asignatura || ASIGNATURAS[0])
    const [tipo, setTipo] = useState(getTipoLabel(task?.tipo))
    const [status, setStatus] = useState(task?.status || 'pendiente')
    const [dueDate, setDueDate] = useState(task?.dueDate || '')

    function handleSubmit(e) {
        e.preventDefault()
        if (!title.trim()) return
        if (!tipo.trim()) return
        onSave({ title: title.trim(), description: description.trim(), asignatura, tipo: tipo.trim(), status, dueDate })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg p-6 animate-slide-up space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">
                        {task ? 'Editar tarea' : 'Nueva tarea'}
                    </h2>
                    <button type="button" onClick={onClose} className="btn-ghost p-1.5">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <input
                        type="text"
                        placeholder="Título de la tarea"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="input-field text-base font-medium"
                        autoFocus
                        required
                    />

                    {/* Description */}
                    <textarea
                        placeholder="Descripción (opcional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className="input-field resize-none"
                    />

                    {/* Asignatura & Tipo */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Asignatura</label>
                            <select value={asignatura} onChange={e => setAsignatura(e.target.value)} className="input-field">
                                {asignaturas.map(a => <option key={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                            <input
                                type="text"
                                value={tipo}
                                onChange={e => setTipo(e.target.value)}
                                list="task-types"
                                className="input-field"
                                placeholder="Escribe un tipo"
                                required
                            />
                            <datalist id="task-types">
                                {[...TIPOS.map(t => t.label), ...customTypes].map(t => (
                                    <option key={t} value={t} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* Status & Due Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
                                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha de entrega</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary text-sm">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary text-sm">
                        {task ? 'Guardar cambios' : 'Crear tarea'}
                    </button>
                </div>
            </form>
        </div>
    )
}

function SubjectsModal({ asignaturas, onAdd, onClose }) {
    const [subject, setSubject] = useState('')
    const [error, setError] = useState('')

    function handleSubmit(e) {
        e.preventDefault()
        if (!subject.trim()) return
        if (!onAdd(subject)) {
            setError('Esa asignatura ya está en la lista.')
            return
        }
        setSubject('')
        setError('')
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 animate-slide-up space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">Asignaturas</h2>
                    <button type="button" onClick={onClose} className="btn-ghost p-1.5" aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={subject}
                        onChange={e => { setSubject(e.target.value); setError('') }}
                        placeholder="Nombre de la asignatura"
                        className="input-field"
                        autoFocus
                        required
                    />
                    <button type="submit" className="btn-primary shrink-0" aria-label="Añadir asignatura">
                        <Plus size={16} /> Añadir
                    </button>
                </form>
                {error && <p className="text-xs text-red-500 -mt-3">{error}</p>}
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Disponibles</p>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {asignaturas.map(a => (
                            <span key={a} className="badge bg-surface-100 text-gray-600">{a}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
