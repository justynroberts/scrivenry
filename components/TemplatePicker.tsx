'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PAGE_TEMPLATES, type PageTemplate } from '@/lib/templates'

interface TemplatePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: PageTemplate) => void
}

export function TemplatePicker({ open, onOpenChange, onSelect }: TemplatePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="template-picker">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {PAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onSelect(template)
                onOpenChange(false)
              }}
              className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors text-left"
              data-testid={`template-${template.id}`}
            >
              <span className="text-2xl">{template.icon}</span>
              <div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
