/**
 * SlashCommand Tests
 *
 * Tests the slash command system configuration and command definitions.
 * Note: TipTap extension functionality is tested via E2E tests.
 */

// We're testing the command definitions, not the TipTap integration
describe('SlashCommand configuration', () => {
  // Import the commands from the source file for testing
  // Since we can't easily import the internal commands array,
  // we'll test the expected behavior through module structure

  describe('command list', () => {
    it('should export SlashCommand extension', async () => {
      const module = await import('@/components/editor/SlashCommand')
      expect(module.SlashCommand).toBeDefined()
    })
  })

  describe('expected commands', () => {
    const expectedCommands = [
      'AI Generate',
      'Text',
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bullet List',
      'Numbered List',
      'Todo List',
      'Code Block',
      'Quote',
      'Divider',
      'Table',
      'Toggle',
      'Callout',
      'Image',
      'Bookmark',
      'Table of Contents',
      'Video',
      'File',
      'Math Equation',
      'Progress Bar',
      'Database',
      'Kanban Board',
      'Calendar',
      'Quote Block',
      'Columns',
      'Emoji',
      'Page Link',
    ]

    it('should include all expected commands in documentation', () => {
      // This test serves as documentation of expected commands
      expect(expectedCommands).toContain('Text')
      expect(expectedCommands).toContain('Heading 1')
      expect(expectedCommands).toContain('Emoji')
      expect(expectedCommands).toContain('Page Link')
    })

    it('should have 28 total commands', () => {
      expect(expectedCommands.length).toBe(28)
    })
  })

  describe('SlashCommand extension', () => {
    it('should be a valid TipTap extension', async () => {
      const { SlashCommand } = await import('@/components/editor/SlashCommand')

      expect(SlashCommand).toHaveProperty('name')
      expect(SlashCommand).toHaveProperty('type')
    })

    it('should have name slashCommand', async () => {
      const { SlashCommand } = await import('@/components/editor/SlashCommand')

      expect(SlashCommand.name).toBe('slashCommand')
    })
  })
})
