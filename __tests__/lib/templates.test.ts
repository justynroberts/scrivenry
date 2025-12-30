import { PAGE_TEMPLATES, getTemplateById, PageTemplate } from '@/lib/templates'

describe('PAGE_TEMPLATES', () => {
  it('should have all expected templates', () => {
    const expectedIds = ['blank', 'meeting-notes', 'project-plan', 'todo-list', 'documentation']
    const actualIds = PAGE_TEMPLATES.map(t => t.id)
    expect(actualIds).toEqual(expectedIds)
  })

  it('should have 5 templates', () => {
    expect(PAGE_TEMPLATES).toHaveLength(5)
  })

  describe('each template', () => {
    it.each(PAGE_TEMPLATES)('$name should have required properties', (template) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('icon')
      expect(template).toHaveProperty('content')
    })

    it.each(PAGE_TEMPLATES)('$name should have valid content structure', (template) => {
      expect(template.content).toHaveProperty('type', 'doc')
      expect(template.content).toHaveProperty('content')
      expect(Array.isArray(template.content.content)).toBe(true)
    })

    it.each(PAGE_TEMPLATES)('$name should have non-empty strings', (template) => {
      expect(template.id.length).toBeGreaterThan(0)
      expect(template.name.length).toBeGreaterThan(0)
      expect(template.description.length).toBeGreaterThan(0)
      expect(template.icon.length).toBeGreaterThan(0)
    })
  })

  describe('blank template', () => {
    it('should have minimal content', () => {
      const blank = PAGE_TEMPLATES.find(t => t.id === 'blank')
      expect(blank?.content.content).toHaveLength(1)
      expect(blank?.content.content[0]).toEqual({ type: 'paragraph' })
    })
  })

  describe('meeting-notes template', () => {
    it('should contain expected sections', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'meeting-notes')
      const content = template?.content.content as Record<string, unknown>[]

      const headings = content.filter(node => node.type === 'heading')
      expect(headings.length).toBeGreaterThanOrEqual(4) // Meeting Notes, Date, Attendees, Agenda, Action Items
    })

    it('should have task list for action items', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'meeting-notes')
      const content = template?.content.content as Record<string, unknown>[]

      const taskLists = content.filter(node => node.type === 'taskList')
      expect(taskLists.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('project-plan template', () => {
    it('should contain a table for timeline', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'project-plan')
      const content = template?.content.content as Record<string, unknown>[]

      const tables = content.filter(node => node.type === 'table')
      expect(tables.length).toBe(1)
    })

    it('should contain a callout block', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'project-plan')
      const content = template?.content.content as Record<string, unknown>[]

      const callouts = content.filter(node => node.type === 'callout')
      expect(callouts.length).toBe(1)
    })
  })

  describe('todo-list template', () => {
    it('should have multiple task lists', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'todo-list')
      const content = template?.content.content as Record<string, unknown>[]

      const taskLists = content.filter(node => node.type === 'taskList')
      expect(taskLists.length).toBe(3) // Today, This Week, Later
    })
  })

  describe('documentation template', () => {
    it('should contain a code block', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'documentation')
      const content = template?.content.content as Record<string, unknown>[]

      const codeBlocks = content.filter(node => node.type === 'codeBlock')
      expect(codeBlocks.length).toBe(1)
    })

    it('should contain a toggle block', () => {
      const template = PAGE_TEMPLATES.find(t => t.id === 'documentation')
      const content = template?.content.content as Record<string, unknown>[]

      const toggles = content.filter(node => node.type === 'toggle')
      expect(toggles.length).toBe(1)
    })
  })
})

describe('getTemplateById', () => {
  it('should return template when found', () => {
    const result = getTemplateById('blank')
    expect(result).toBeDefined()
    expect(result?.id).toBe('blank')
    expect(result?.name).toBe('Blank Page')
  })

  it('should return undefined for non-existent template', () => {
    const result = getTemplateById('non-existent')
    expect(result).toBeUndefined()
  })

  it('should return correct template for each id', () => {
    PAGE_TEMPLATES.forEach(template => {
      const result = getTemplateById(template.id)
      expect(result).toEqual(template)
    })
  })

  it('should handle empty string', () => {
    const result = getTemplateById('')
    expect(result).toBeUndefined()
  })

  it('should be case-sensitive', () => {
    const result = getTemplateById('BLANK')
    expect(result).toBeUndefined()
  })
})
