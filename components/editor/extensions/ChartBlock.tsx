'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useState, useEffect, useRef } from 'react'
import { BarChart3, Play, Code, Eye, Copy, Check } from 'lucide-react'

interface ChartBlockProps {
  node: {
    attrs: {
      config: string
      chartType: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
}

const defaultConfig = {
  bar: `{
  "labels": ["January", "February", "March", "April", "May"],
  "datasets": [{
    "label": "Sales",
    "data": [65, 59, 80, 81, 56],
    "backgroundColor": ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]
  }]
}`,
  line: `{
  "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "datasets": [{
    "label": "Visitors",
    "data": [120, 190, 300, 500, 200, 300, 450],
    "borderColor": "#8b5cf6",
    "tension": 0.4
  }]
}`,
  pie: `{
  "labels": ["Red", "Blue", "Yellow", "Green", "Purple"],
  "datasets": [{
    "data": [12, 19, 3, 5, 2],
    "backgroundColor": ["#ef4444", "#3b82f6", "#eab308", "#22c55e", "#8b5cf6"]
  }]
}`,
  doughnut: `{
  "labels": ["Desktop", "Mobile", "Tablet"],
  "datasets": [{
    "data": [55, 35, 10],
    "backgroundColor": ["#8b5cf6", "#06b6d4", "#f59e0b"]
  }]
}`,
}

function ChartBlockComponent({ node, updateAttributes }: ChartBlockProps) {
  const [chartType, setChartType] = useState(node.attrs.chartType || 'bar')
  const [config, setConfig] = useState(node.attrs.config || defaultConfig.bar)
  const [isEditing, setIsEditing] = useState(!node.attrs.config)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    if (!isEditing && canvasRef.current) {
      renderChart()
    }
    return () => {
      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy()
      }
    }
  }, [isEditing, config, chartType])

  const renderChart = async () => {
    try {
      const Chart = (await import('chart.js/auto')).default

      if (chartRef.current) {
        (chartRef.current as { destroy: () => void }).destroy()
      }

      const data = JSON.parse(config)

      chartRef.current = new Chart(canvasRef.current!, {
        type: chartType as 'bar' | 'line' | 'pie' | 'doughnut',
        data,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              labels: {
                color: '#a78bfa',
              },
            },
          },
          scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
            x: {
              ticks: { color: '#a78bfa' },
              grid: { color: '#3b3b5c' },
            },
            y: {
              ticks: { color: '#a78bfa' },
              grid: { color: '#3b3b5c' },
            },
          },
        },
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render chart')
    }
  }

  const handleSave = () => {
    updateAttributes({ config, chartType })
    setIsEditing(false)
  }

  const handleTypeChange = (newType: string) => {
    setChartType(newType)
    if (!node.attrs.config) {
      setConfig(defaultConfig[newType as keyof typeof defaultConfig])
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="border border-cyan-500/30 rounded-lg overflow-hidden bg-cyan-950/20">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-cyan-900/30 border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">Chart</span>
            <select
              value={chartType}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="ml-2 px-2 py-0.5 text-xs bg-cyan-900/50 border border-cyan-500/30 rounded text-cyan-300"
            >
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="pie">Pie</option>
              <option value="doughnut">Doughnut</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-cyan-800/50 text-cyan-400"
              title="Copy config"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 rounded hover:bg-cyan-800/50 text-cyan-400"
              title={isEditing ? 'Preview' : 'Edit'}
            >
              {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
              >
                <Play className="h-3 w-3" />
                Render
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="p-3">
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              className="w-full h-48 bg-black/30 text-cyan-100 font-mono text-sm p-3 rounded border border-cyan-500/20 focus:border-cyan-500/50 focus:outline-none resize-none"
              placeholder="Enter Chart.js data configuration..."
              spellCheck={false}
            />
            <p className="text-xs text-cyan-400/60 mt-2">
              JSON format with labels and datasets. See Chart.js documentation for options.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {error ? (
              <div className="text-red-400 text-sm p-3 bg-red-950/30 rounded">
                Error: {error}
              </div>
            ) : (
              <div className="flex justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-80" />
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const ChartBlock = Node.create({
  name: 'chartBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      config: { default: '' },
      chartType: { default: 'bar' },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="chart-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'chart-block' })]
  },

  addNodeView() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(ChartBlockComponent as any)
  },
})
