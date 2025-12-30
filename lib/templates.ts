export interface PageTemplate {
  id: string
  name: string
  description: string
  icon: string
  content: Record<string, unknown>
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch',
    icon: '📄',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }]
    }
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structure for meeting discussions',
    icon: '📝',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Meeting Notes' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Date' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Enter date here...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Attendees' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name 1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Name 2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Agenda' }] },
        { type: 'orderedList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 1' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Topic 2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Action Items' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 1' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Action item 2' }] }] },
        ]},
      ]
    }
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Plan and track a project',
    icon: '📊',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Project Name' }] },
        { type: 'callout', attrs: { emoji: '🎯' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Project goal goes here...' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Overview' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Describe the project...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline' }] },
        { type: 'table', content: [
          { type: 'tableRow', content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Phase' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'End' }] }] },
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Planning' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '-' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '-' }] }] },
          ]},
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Tasks' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Define requirements' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create design' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Implement' }] }] },
        ]},
      ]
    }
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    description: 'Simple task tracker',
    icon: '✅',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'To-Do List' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Today' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 2' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'This Week' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }] },
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Later' }] },
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }] },
        ]},
      ]
    }
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Technical documentation structure',
    icon: '📚',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Documentation Title' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Brief overview of what this documentation covers.' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Getting Started' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Introduction and prerequisites...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Installation' }] },
        { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: '# Installation commands\nnpm install package-name' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Usage' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Usage examples...' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'API Reference' }] },
        { type: 'toggle', content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Click to expand API details...' }] },
        ]},
      ]
    }
  },
]

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find(t => t.id === id)
}
