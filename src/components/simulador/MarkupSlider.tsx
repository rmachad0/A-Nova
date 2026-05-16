'use client'

interface MarkupSliderProps {
  value: number
  onChange: (v: number) => void
  presets: number[]
}

export default function MarkupSlider({ value, onChange, presets }: MarkupSliderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="label">Markup %</label>
        <span className="text-neon font-bold text-lg">{value}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={200}
        step={0.5}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-surface-3 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                   [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-neon [&::-webkit-slider-thumb]:shadow-neon-sm
                   [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${(value / 200) * 100}%, #222 ${(value / 200) * 100}%, #222 100%)`
        }}
      />

      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ${
              value === p
                ? 'bg-neon text-black shadow-neon-sm'
                : 'bg-surface-3 text-text-secondary hover:text-white hover:bg-surface-2 border border-border'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  )
}
