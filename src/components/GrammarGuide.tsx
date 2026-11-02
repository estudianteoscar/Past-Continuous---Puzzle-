import React from 'react';
import { BookOpen, Check, HelpCircle, ArrowRight } from 'lucide-react';

interface GrammarGuideProps {
  onBackToGame: () => void;
}

export const GrammarGuide: React.FC<GrammarGuideProps> = ({ onBackToGame }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Guía Gramatical de Referencia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Past Continuous Tense (Pasado Continuo)
          </h1>
        </div>

        <button
          onClick={onBackToGame}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
        >
          Volver al Juego
        </button>
      </div>

      <div className="space-y-6">
        {/* Core Formula Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3 font-display">
            1. Estructura Básica
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            El pasado continuo se utiliza para expresar acciones que estaban ocurriendo en un momento específico del pasado. Se forma con el verbo auxiliar <strong className="text-slate-900">to be</strong> en pasado (<strong className="text-indigo-600">was/were</strong>) seguido del verbo principal con terminación <strong className="text-indigo-600">-ing</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50/60 border border-indigo-150 p-4 rounded-xl">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                Singular (was)
              </span>
              <p className="text-sm font-semibold text-slate-800">
                I, He, She, It <span className="text-indigo-600 font-bold">+ WAS + verb-ing</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ej: <em>She was studying English yesterday.</em>
              </p>
            </div>

            <div className="bg-sky-50/60 border border-sky-150 p-4 rounded-xl">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
                Plural / You (were)
              </span>
              <p className="text-sm font-semibold text-slate-800">
                You, We, They <span className="text-sky-600 font-bold">+ WERE + verb-ing</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ej: <em>They were watching TV at 8 PM.</em>
              </p>
            </div>
          </div>
        </div>

        {/* The 3 Main Forms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 font-display">
            2. Formas Afirmativa, Negativa e Interrogativa
          </h2>

          <div className="space-y-4 text-sm">
            {/* Affirmative */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Afirmativa
              </span>
              <p className="font-semibold text-slate-800 mt-2">
                Sujeto + was/were + Verbo-ing + Complemento
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Ejemplo: <strong>He was watching TV.</strong> (Él estaba viendo televisión.)
              </p>
            </div>

            {/* Negative */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Negativa
              </span>
              <p className="font-semibold text-slate-800 mt-2">
                Sujeto + wasn't / weren't + Verbo-ing + Complemento
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Ejemplo: <strong>He wasn't playing soccer.</strong> (Él no estaba jugando fútbol.)
              </p>
            </div>

            {/* Interrogative */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Interrogativa
              </span>
              <p className="font-semibold text-slate-800 mt-2">
                Was / Were + Sujeto + Verbo-ing + Complemento + ?
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Ejemplo: <strong>Were they studying English?</strong> (¿Estaban ellos estudiando inglés?)
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Pregunta con Wh-: <strong>What were you doing yesterday?</strong>
              </p>
            </div>
          </div>
        </div>

        {/* When vs While */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-2 font-display">
            3. Conectores Temporales: When vs. While
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Muy frecuente en los exámenes y en el Nivel 7 y 10 del juego.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-1">WHEN (Cuando)</h3>
              <p className="text-slate-600 mb-2">
                Introduce una acción corta o repentina en <strong>Past Simple</strong> que interrumpe una acción continua.
              </p>
              <p className="font-mono bg-slate-50 p-2 rounded text-slate-800">
                I was walking in the park <strong>when</strong> it started to rain.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-1">WHILE (Mientras)</h3>
              <p className="text-slate-600 mb-2">
                Introduce una acción continua y prolongada en <strong>Past Continuous</strong>, o dos acciones simultáneas.
              </p>
              <p className="font-mono bg-slate-50 p-2 rounded text-slate-800">
                <strong>While</strong> she was reading, he was sleeping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
