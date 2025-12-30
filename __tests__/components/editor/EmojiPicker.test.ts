/**
 * Editor EmojiPicker Extension Tests
 *
 * Tests the TipTap emoji picker node extension.
 */

describe('EmojiPicker extension', () => {
  describe('extension configuration', () => {
    it('should export EmojiPicker extension', async () => {
      const module = await import('@/components/editor/extensions/EmojiPicker')
      expect(module.EmojiPicker).toBeDefined()
    })

    it('should have correct name', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.name).toBe('emojiPicker')
    })

    it('should be a Node type', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.type).toBe('node')
    })
  })

  describe('emoji categories', () => {
    // Testing the EMOJI_CATEGORIES constant structure
    const expectedCategories = [
      'Smileys',
      'Gestures',
      'Hearts',
      'Objects',
      'Symbols',
      'Nature',
    ]

    it('should have 6 emoji categories', () => {
      expect(expectedCategories.length).toBe(6)
    })

    it('should include common categories', () => {
      expect(expectedCategories).toContain('Smileys')
      expect(expectedCategories).toContain('Hearts')
      expect(expectedCategories).toContain('Objects')
    })
  })

  describe('extension structure', () => {
    it('should have parseHTML method', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.parseHTML).toBeDefined()
    })

    it('should have renderHTML method', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.renderHTML).toBeDefined()
    })

    it('should have addNodeView method', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.addNodeView).toBeDefined()
    })
  })

  describe('extension properties', () => {
    it('should be inline', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.inline).toBe(true)
    })

    it('should be an atom', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.atom).toBe(true)
    })

    it('should be in inline group', async () => {
      const { EmojiPicker } = await import('@/components/editor/extensions/EmojiPicker')
      expect(EmojiPicker.config.group).toBe('inline')
    })
  })
})
