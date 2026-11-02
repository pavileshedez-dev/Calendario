import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { Clock, Plus, X, Trash2, Edit3, Palette, BookOpen } from 'lucide-react'

// ── Asignaturas Plan Logopedia (INMUTABLE) ──
const ASIGNATURAS = [
    "Adquisición y Desarrollo del Lenguaje",
    "Estadística I",
    "Estadística II",
    "Trastornos de la Voz y de la Audición",
    "Trastornos Estructurales de las Funciones Orofaciales",
    "Trastornos del Desarrollo y del Aprendizaje",
    "Trastornos del Lenguaje de Etiología Neurológica",
    "Trastornos del Lenguaje en Problemas Psicopatológicos",
    "Evaluación I",
    "Evaluación II",
    "Exploración de la Audición y de la Voz",
]

function normalize(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ════════════════════════════════════════
// Autocomplete tipo RENFE para asignaturas
// ════════════════════════════════════════
function AsignaturaAutocomplete({ value, onChange }) {
    const [query, setQuery] = useState(value || '')
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    const suggestions = useMemo(() => {
        if (!query.trim()) return ASIGNATURAS
        const q = normalize(query)
        return ASIGNATURAS.filter(a => normalize(a).includes(q))
    }, [query])

    useEffect(() => {
        function handleClick(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    function select(asig) {
        setQuery(asig)
        onChange(asig)
        setOpen(false)
    }

    function handleChange(e) {
        setQuery(e.target.value)
        onChange('')
        setOpen(true)
    }

    function handleBlur() {
        const exact = ASIGNATURAS.find(a => normalize(a) === normalize(query))
        if (exact) { onChange(exact); setQuery(exact) }
    }

    const isValid = ASIGNATURAS.includes(value)

    return (
        <div ref={wrapperRef} className="relative">
            <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setOpen(true)}
                onBlur={handleBlur}
                placeholder="Buscar asignatura oficial…"
                className={`input-field pl-9 text-base font-medium ${!isValid && query.length > 1 ? 'border-red-300' : ''}`}
                autoComplete="off"
                required
            />
            {open && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-surface-200 rounded-xl shadow-elevated max-h-60 overflow-y-auto">
                    {suggestions.length > 0 ? suggestions.map(a => (
                        <li key={a}>
                            <button
                                type="button"
                                onMouseDown={() => select(a)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                                {a}
                            </button>
                        </li>
                    )) : (
                        <li className="px-4 py-3 text-sm text-red-400">
                            ⚠ No coincide con ninguna asignatura oficial
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7:00 - 20:00

const CLASS_COLORS = [
    { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', dot: 'bg-blue-500' },
    { id: 'rose', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-800', dot: 'bg-rose-500' },
    { id: 'amber', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', dot: 'bg-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    { id: 'violet', bg: 'bg-violet-100', border: 'border-violet-300', text: 'text-violet-800', dot: 'bg-violet-500' },
    { id: 'sky', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-800', dot: 'bg-sky-500' },
    { id: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', dot: 'bg-orange-500' },
    { id: 'teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', dot: 'bg-teal-500' },
    { id: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', dot: 'bg-pink-500' },
    { id: 'lime', bg: 'bg-lime-100', border: 'border-lime-300', text: 'text-lime-800', dot: 'bg-lime-500' },
]

export default function Horario() {
    const [classes, setClasses] = useLocalStorage('calendario-horario', [])
    const [showModal, setShowModal] = useState(false)
    const [editClass, setEditClass] = useState(null)
    const [clickedSlot, setClickedSlot] = useState(null)

    // Auto-open modal when navigated from FAB
    const location = typeof window !== 'undefined' ? window.history.state?.usr : null
    useEffect(() => {
        if (location?.openModal) {
            setEditClass(null)
            setClickedSlot(null)
            setShowModal(true)
        }
    }, [location])

    function saveClass(cls) {
        // Validate asignatura belongs to official list
        if (!ASIGNATURAS.includes(cls.subject)) {
            alert('⚠ La asignatura no pertenece al Plan de Logopedia. Selecciona una de la lista oficial.')
            return
        }
        if (editClass) {
            setClasses(classes.map(c => c.id === editClass.id ? { ...cls, id: editClass.id } : c))
        } else {
            setClasses([...classes, { ...cls, id: Date.now().toString() }])
        }
        setEditClass(null)
        setShowModal(false)
        setClickedSlot(null)
    }

    function deleteClass(id) {
        setClasses(classes.filter(c => c.id !== id))
    }

    function handleSlotClick(dayIdx, hour) {
        const existing = classes.find(c =>
            c.day === dayIdx && hour >= c.startHour && hour < c.endHour
        )
        if (existing) {
            setEditClass(existing)
            setClickedSlot(null)
        } else {
            setClickedSlot({ day: dayIdx, hour })
            setEditClass(null)
        }
        setShowModal(true)
    }

    return (
        <div className="page-enter space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={28} className="text-sky-600" strokeWidth={1.8} />
                        Horario de Clases
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Haz clic en una celda para añadir o editar una clase.
                    </p>
                </div>
                <button
                    onClick={() => { setEditClass(null); setClickedSlot(null); setShowModal(true) }}
                    className="btn-primary text-sm"
                >
                    <Plus size={16} /> Añadir clase
                </button>
            </div>

            {/* ── Desktop Grid View ── */}
            <div className="hidden md:block glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Header row */}
                        <div className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-surface-200">
                            <div className="p-3 bg-surface-50" />
                            {DAYS.map(day => (
                                <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 bg-surface-50 border-l border-surface-200">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Time rows */}
                        {HOURS.map(hour => (
                            <div key={hour} className="grid grid-cols-[60px_repeat(5,1fr)] border-b border-surface-100 last:border-b-0">
                                <div className="p-2 text-xs text-gray-400 font-medium text-right pr-3 bg-surface-50/50 flex items-start justify-end pt-1">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                                {DAYS.map((_, dayIdx) => {
                                    const cls = classes.find(c =>
                                        c.day === dayIdx && hour >= c.startHour && hour < c.endHour
                                    )
                                    const isStart = cls && cls.startHour === hour
                                    const isContinuation = cls && cls.startHour !== hour

                                    if (isContinuation) return (
                                        <div key={dayIdx} className="border-l border-surface-100" />
                                    )

                                    const color = cls ? CLASS_COLORS.find(c => c.id === cls.color) || CLASS_COLORS[0] : null

                                    return (
                                        <div
                                            key={dayIdx}
                                            className="border-l border-surface-100 relative min-h-[48px] cursor-pointer hover:bg-primary-50/30 transition-colors"
                                            onClick={() => handleSlotClick(dayIdx, hour)}
                                        >
                                            {isStart && (
                                                <div
                                                    className={`absolute inset-x-1 top-0.5 rounded-lg ${color.bg} ${color.border} border px-2 py-1.5 z-10 transition-shadow hover:shadow-card-hover group`}
                                                    style={{ height: `${(cls.endHour - cls.startHour) * 48 - 4}px` }}
                                                    onClick={(e) => { e.stopPropagation(); setEditClass(cls); setShowModal(true) }}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-xs font-bold ${color.text} truncate leading-tight`}>
                                                                {cls.subject}
                                                            </p>
                                                            {cls.room && (
                                                                <p className={`text-[10px] ${color.text} opacity-70 mt-0.5 truncate`}>
                                                                    📍 {cls.room}
                                                                </p>
                                                            )}
                                                            <p className={`text-[10px] ${color.text} opacity-60 mt-0.5`}>
                                                                {String(cls.startHour).padStart(2, '0')}:00 — {String(cls.endHour).padStart(2, '0')}:00
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); deleteClass(cls.id) }}
                                                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/60 transition-all"
                                                        >
                                                            <Trash2 size={11} className={color.text} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Mobile Card View ── */}
            <div className="md:hidden space-y-4">
                {DAYS.map((day, dayIdx) => {
                    const dayClasses = classes
                        .filter(c => c.day === dayIdx)
                        .sort((a, b) => a.startHour - b.startHour)

                    return (
                        <div key={day} className="glass-card overflow-hidden">
                            <div className="px-4 py-2.5 bg-surface-50 border-b border-surface-200">
                                <h3 className="text-sm font-semibold text-gray-600">{day}</h3>
                            </div>
                            {dayClasses.length === 0 ? (
                                <button
                                    onClick={() => { setClickedSlot({ day: dayIdx, hour: 8 }); setEditClass(null); setShowModal(true) }}
                                    className="w-full p-4 text-sm text-gray-400 text-center hover:bg-surface-50 transition-colors"
                                >
                                    + Añadir clase
                                </button>
                            ) : (
                                <div className="divide-y divide-surface-100">
                                    {dayClasses.map(cls => {
                                        const color = CLASS_COLORS.find(c => c.id === cls.color) || CLASS_COLORS[0]
                                        return (
                                            <div
                                                key={cls.id}
                                                onClick={() => { setEditClass(cls); setShowModal(true) }}
                                                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-50 transition-colors group"
                                            >
                                                <div className={`w-1 self-stretch rounded-full ${color.dot}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-700 truncate">{cls.subject}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                        <span>{String(cls.startHour).padStart(2, '0')}:00 — {String(cls.endHour).padStart(2, '0')}:00</span>
                                                        {cls.room && <span>· 📍 {cls.room}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteClass(cls.id) }}
                                                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                    <button
                                        onClick={() => { setClickedSlot({ day: dayIdx, hour: 8 }); setEditClass(null); setShowModal(true) }}
                                        className="w-full p-2.5 text-xs text-gray-400 text-center hover:bg-surface-50 transition-colors"
                                    >
                                        + Añadir otra clase
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* ── Legend ── */}
            {classes.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {[...new Set(classes.map(c => c.subject))].map(subject => {
                        const cls = classes.find(c => c.subject === subject)
                        const color = CLASS_COLORS.find(c => c.id === cls?.color) || CLASS_COLORS[0]
                        return (
                            <div key={subject} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                                <span className="text-xs text-gray-500">{subject}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Modal ── */}
            {showModal && (
                <ClassModal
                    cls={editClass}
                    defaultDay={clickedSlot?.day}
                    defaultHour={clickedSlot?.hour}
                    onSave={saveClass}
                    onDelete={editClass ? () => { deleteClass(editClass.id); setShowModal(false); setEditClass(null) } : null}
                    onClose={() => { setShowModal(false); setEditClass(null); setClickedSlot(null) }}
                />
            )}
        </div>
    )
}

function ClassModal({ cls, defaultDay, defaultHour, onSave, onDelete, onClose }) {
    const [subject, setSubject] = useState(cls?.subject || '')
    const [room, setRoom] = useState(cls?.room || '')
    const [day, setDay] = useState(cls?.day ?? defaultDay ?? 0)
    const [startHour, setStartHour] = useState(cls?.startHour ?? defaultHour ?? 8)
    const [endHour, setEndHour] = useState(cls?.endHour ?? (defaultHour ? defaultHour + 1 : 9))
    const [color, setColor] = useState(cls?.color || CLASS_COLORS[0].id)
    const [professor, setProfessor] = useState(cls?.professor || '')

    function handleSubmit(e) {
        e.preventDefault()
        if (!subject || !ASIGNATURAS.includes(subject)) {
            alert('⚠ Debes seleccionar una asignatura válida del Plan de Logopedia.')
            return
        }
        if (startHour >= endHour) return
        onSave({ subject, room: room.trim(), day, startHour: Number(startHour), endHour: Number(endHour), color, professor: professor.trim() })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <form
                onSubmit={handleSubmit}
                className="relative bg-white rounded-2xl shadow-elevated w-full max-w-lg p-6 animate-slide-up space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Edit3 size={18} className="text-sky-600" />
                        {cls ? 'Editar clase' : 'Nueva clase'}
                    </h2>
                    <button type="button" onClick={onClose} className="btn-ghost p-1.5">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Autocomplete asignatura */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Asignatura (Plan Logopedia) *
                        </label>
                        <AsignaturaAutocomplete value={subject} onChange={setSubject} />
                    </div>

                    {/* Room & Professor */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Aula</label>
                            <input
                                type="text"
                                placeholder="Ej: A-201"
                                value={room}
                                onChange={e => setRoom(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Profesor/a</label>
                            <input
                                type="text"
                                placeholder="Nombre"
                                value={professor}
                                onChange={e => setProfessor(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {/* Day selector */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">Día de la semana</label>
                        <div className="flex gap-2">
                            {DAYS_SHORT.map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => setDay(i)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all
                                        ${day === i ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-100 text-gray-500 hover:bg-surface-200'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Hora inicio</label>
                            <select value={startHour} onChange={e => { setStartHour(Number(e.target.value)); if (Number(e.target.value) >= endHour) setEndHour(Number(e.target.value) + 1) }} className="input-field">
                                {HOURS.map(h => (
                                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Hora fin</label>
                            <select value={endHour} onChange={e => setEndHour(Number(e.target.value))} className="input-field">
                                {HOURS.filter(h => h > startHour).map(h => (
                                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                                ))}
                                <option value={21}>21:00</option>
                            </select>
                        </div>
                    </div>

                    {/* Color picker */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                            <Palette size={12} /> Color
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {CLASS_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.id)}
                                    className={`w-8 h-8 rounded-lg ${c.bg} ${c.border} border-2 transition-all
                                        ${color === c.id ? 'ring-2 ring-primary-400 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-2">
                    <div>
                        {onDelete && (
                            <button type="button" onClick={onDelete} className="btn-ghost text-sm text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 size={14} /> Eliminar
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                        <button type="submit" className="btn-primary text-sm">
                            {cls ? 'Guardar' : 'Añadir'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
