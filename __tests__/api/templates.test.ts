import { GET } from '@/app/api/templates/route'
import { PAGE_TEMPLATES } from '@/lib/templates'

describe('GET /api/templates', () => {
  it('should return all templates', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('templates')
    expect(data.templates).toEqual(PAGE_TEMPLATES)
  })

  it('should return templates array', async () => {
    const response = await GET()
    const data = await response.json()

    expect(Array.isArray(data.templates)).toBe(true)
    expect(data.templates.length).toBe(5)
  })

  it('should include blank template', async () => {
    const response = await GET()
    const data = await response.json()

    const blankTemplate = data.templates.find((t: any) => t.id === 'blank')
    expect(blankTemplate).toBeDefined()
    expect(blankTemplate.name).toBe('Blank Page')
  })

  it('should include all template properties', async () => {
    const response = await GET()
    const data = await response.json()

    data.templates.forEach((template: any) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('icon')
      expect(template).toHaveProperty('content')
    })
  })

  it('should return valid JSON response', async () => {
    const response = await GET()

    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
