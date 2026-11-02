import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
    Bot,
    Send,
    Trash2,
    Loader2,
    User,
    Sparkles,
    AlertCircle,
    Settings,
    X,
    Key,
} from 'lucide-react'

export default function AsesorIA() {
    const [messages, setMessages] = useLocalStorage('calendario-chat', [])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showSettings, setShowSettings] = useState(false)
    const [apiKey, setApiKey] = useLocalStorage('calendario-gemini-key', 'AIzaSyA2i0UJFHQ96iHC9olzrcyHMe-oR9Q1tuc')
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function sendMessage(e) {
        e.preventDefault()
        const text = input.trim()
        if (!text || isLoading) return

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setError(null)
        setIsLoading(true)

        try {
            if (!apiKey) {
                // Demo mode — simulate response
                await new Promise(r => setTimeout(r, 1200))
                const demoReply = getDemoResponse(text)
                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: demoReply,
                    timestamp: new Date().toISOString(),
                }
                setMessages(prev => [...prev, aiMsg])
            } else {
                // Real Gemini API call
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                ...messages.map(m => ({
                                    role: m.role === 'assistant' ? 'model' : 'user',
                                    parts: [{ text: m.content }],
                                })),
                                { role: 'user', parts: [{ text }] },
                            ],
                            systemInstruction: {
                                parts: [{
                                    text: 'Eres un asesor académico y personal amigable. Ayudas a estudiantes universitarios con sus dudas sobre estudios, organización del tiempo, técnicas de estudio, y cualquier tema académico. Responde siempre en español de forma clara y concisa.',
                                }],
                            },
                        }),
                    }
                )

                if (!response.ok) {
                    throw new Error(`Error de API: ${response.status}`)
                }

                const data = await response.json()
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.'

                const aiMsg = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: aiText,
                    timestamp: new Date().toISOString(),
                }
                setMessages(prev => [...prev, aiMsg])
            }
        } catch (err) {
            setError(err.message || 'Error al conectar con la IA.')
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    function clearChat() {
        setMessages([])
        setError(null)
    }

    return (
        <div className="page-enter flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Bot size={28} className="text-violet-600" strokeWidth={1.8} />
                        Asesor IA
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {apiKey ? 'Conectado a la API de Gemini' : 'Modo demo — configura tu API key para conectar'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowSettings(true)} className="btn-ghost p-2" title="Configurar API Key">
                        <Settings size={18} />
                    </button>
                    {messages.length > 0 && (
                        <button onClick={clearChat} className="btn-ghost p-2 text-red-400 hover:text-red-600" title="Limpiar chat">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-surface-50/50 border border-surface-200 p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                            <Sparkles size={28} className="text-violet-500" />
                        </div>
                        <h3 className="font-semibold text-gray-600">¡Hola! Soy tu asesor IA</h3>
                        <p className="text-sm text-gray-400 max-w-sm">
                            Puedo ayudarte con dudas académicas, técnicas de estudio, organización del tiempo y mucho más.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                            {['¿Cómo estudio anatomía?', '¿Técnicas de memoria?', 'Organizar mi semana'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                                    className="badge bg-violet-50 text-violet-600 hover:bg-violet-100 cursor-pointer transition-colors py-1.5 px-3"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <ChatBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400 px-1">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Escribiendo…</span>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-xl">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="mt-3 flex gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribe tu mensaje…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    className="input-field flex-1"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Send size={16} />
                </button>
            </form>

            {/* Settings Modal */}
            {showSettings && (
                <SettingsModal
                    apiKey={apiKey}
                    onSave={(key) => { setApiKey(key); setShowSettings(false) }}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </div>
    )
}

function ChatBubble({ message }) {
    const isUser = message.role === 'user'
    const time = new Date(message.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center
        ${isUser ? 'bg-primary-100' : 'bg-gradient-to-br from-violet-100 to-purple-100'}`}>
                {isUser
                    ? <User size={14} className="text-primary-600" />
                    : <Sparkles size={14} className="text-violet-600" />}
            </div>
            <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
                        ? 'bg-primary-600 text-white rounded-tr-md'
                        : 'bg-white border border-surface-200 text-gray-700 rounded-tl-md shadow-card'
                    }`}>
                    {message.content}
                </div>
                <p className={`text-[10px] text-gray-400 ${isUser ? 'text-right' : ''} px-1`}>
                    {time}
                </p>
            </div>
        </div>
    )
}

function SettingsModal({ apiKey, onSave, onClose }) {
    const [key, setKey] = useState(apiKey)

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-elevated w-full max-w-md p-6 animate-slide-up space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Key size={18} className="text-violet-600" />
                        Configurar API
                    </h2>
                    <button onClick={onClose} className="btn-ghost p-1.5">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                        Introduce tu clave de la API de Gemini para activar las respuestas reales de IA. Sin API key, funciona en modo demo.
                    </p>
                    <input
                        type="password"
                        placeholder="AIza... (tu clave API de Gemini)"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        className="input-field"
                    />
                    <p className="text-xs text-gray-400">
                        Puedes obtener una en{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary-600 underline">
                            Google AI Studio
                        </a>
                        . La clave se guarda localmente en tu navegador.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
                    <button onClick={() => onSave(key)} className="btn-primary text-sm">Guardar</button>
                </div>
            </div>
        </div>
    )
}

function getDemoResponse(input) {
    const lower = input.toLowerCase()
    if (lower.includes('anatomía') || lower.includes('estudiar')) {
        return '📚 Para estudiar anatomía eficazmente, te recomiendo:\n\n1. **Repetición espaciada**: Usa flashcards con apps como Anki.\n2. **Mapas mentales**: Conecta sistemas (ej: sistema circulatorio → corazón → arterias).\n3. **Dibujar**: Esquematizar estructuras ayuda a la memoria visual.\n4. **Casos clínicos**: Relaciona la teoría con situaciones reales.\n\n¿Quieres que profundice en alguna técnica?'
    }
    if (lower.includes('memoria') || lower.includes('recordar')) {
        return '🧠 Aquí van algunas técnicas de memoria probadas:\n\n1. **Palacio de la memoria**: Asocia datos con lugares que conoces bien.\n2. **Acrónimos y mnemotecnias**: Crea frases con las iniciales.\n3. **Aprendizaje activo**: Explica el tema en voz alta como si enseñaras.\n4. **Descanso**: El sueño consolidará la información.\n\n¡La constancia es clave! 💪'
    }
    if (lower.includes('organizar') || lower.includes('tiempo') || lower.includes('semana')) {
        return '📅 Para organizar tu semana como estudiante:\n\n1. **Bloquea tiempo**: Asigna bloques de 25-50 min (técnica Pomodoro).\n2. **Prioriza**: Usa la matriz de Eisenhower (urgente/importante).\n3. **Revisa el domingo**: Planifica la semana con anticipación.\n4. **Incluye descansos**: El cerebro necesita pausas.\n\n¡Usa el Gestor Universitario de esta app para organizar tus tareas! 🎯'
    }
    return '¡Buena pregunta! 🤔 Estoy en modo demo ahora mismo. Para obtener respuestas completas y personalizadas, configura tu clave de la API de Gemini en los ajustes (icono ⚙️).\n\nMientras tanto, puedo ayudarte con temas como:\n• Técnicas de estudio\n• Organización del tiempo\n• Consejos académicos'
}
