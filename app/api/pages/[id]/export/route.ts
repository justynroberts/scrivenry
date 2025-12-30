import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { pages } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Convert TipTap JSON to Markdown
function contentToMarkdown(content: Record<string, unknown>): string {
  if (!content || !content.content) return ''

  const nodes = content.content as Array<Record<string, unknown>>
  let markdown = ''

  for (const node of nodes) {
    markdown += nodeToMarkdown(node)
  }

  return markdown.trim()
}

function nodeToMarkdown(node: Record<string, unknown>): string {
  const type = node.type as string
  const attrs = node.attrs as Record<string, unknown> | undefined
  const content = node.content as Array<Record<string, unknown>> | undefined

  switch (type) {
    case 'paragraph':
      return textContent(content) + '\n\n'

    case 'heading': {
      const level = (attrs?.level as number) || 1
      const prefix = '#'.repeat(level)
      return `${prefix} ${textContent(content)}\n\n`
    }

    case 'bulletList':
      return listToMarkdown(content, '-') + '\n'

    case 'orderedList':
      return listToMarkdown(content, '1.') + '\n'

    case 'taskList':
      return taskListToMarkdown(content) + '\n'

    case 'codeBlock': {
      const language = (attrs?.language as string) || ''
      return `\`\`\`${language}\n${textContent(content)}\n\`\`\`\n\n`
    }

    case 'blockquote':
      return `> ${textContent(content)}\n\n`

    case 'horizontalRule':
      return '---\n\n'

    case 'table':
      return tableToMarkdown(content)

    default:
      return textContent(content)
  }
}

function textContent(content?: Array<Record<string, unknown>>): string {
  if (!content) return ''

  return content.map(node => {
    if (node.type === 'text') {
      let text = node.text as string
      const marks = node.marks as Array<{ type: string }> | undefined

      if (marks) {
        for (const mark of marks) {
          switch (mark.type) {
            case 'bold':
              text = `**${text}**`
              break
            case 'italic':
              text = `*${text}*`
              break
            case 'code':
              text = `\`${text}\``
              break
            case 'strike':
              text = `~~${text}~~`
              break
          }
        }
      }

      return text
    }
    return ''
  }).join('')
}

function listToMarkdown(content?: Array<Record<string, unknown>>, prefix: string = '-'): string {
  if (!content) return ''

  return content.map((item, index) => {
    const itemContent = item.content as Array<Record<string, unknown>> | undefined
    const text = itemContent?.map(n => textContent(n.content as Array<Record<string, unknown>>)).join('') || ''
    const actualPrefix = prefix === '1.' ? `${index + 1}.` : prefix
    return `${actualPrefix} ${text}`
  }).join('\n')
}

function taskListToMarkdown(content?: Array<Record<string, unknown>>): string {
  if (!content) return ''

  return content.map(item => {
    const attrs = item.attrs as Record<string, unknown> | undefined
    const checked = attrs?.checked ? 'x' : ' '
    const itemContent = item.content as Array<Record<string, unknown>> | undefined
    const text = itemContent?.map(n => textContent(n.content as Array<Record<string, unknown>>)).join('') || ''
    return `- [${checked}] ${text}`
  }).join('\n')
}

function tableToMarkdown(content?: Array<Record<string, unknown>>): string {
  if (!content) return ''

  const rows = content.map(row => {
    const cells = (row.content as Array<Record<string, unknown>>) || []
    return '| ' + cells.map(cell => {
      const cellContent = (cell.content as Array<Record<string, unknown>>) || []
      return cellContent.map(n => textContent(n.content as Array<Record<string, unknown>>)).join('')
    }).join(' | ') + ' |'
  })

  if (rows.length > 0) {
    const firstRow = content[0]
    const cellCount = ((firstRow?.content as Array<unknown>) || []).length
    const separator = '| ' + Array(cellCount).fill('---').join(' | ') + ' |'
    rows.splice(1, 0, separator)
  }

  return rows.join('\n') + '\n\n'
}

// Convert TipTap JSON to HTML
function contentToHtml(content: Record<string, unknown>, title: string): string {
  if (!content || !content.content) return ''

  const nodes = content.content as Array<Record<string, unknown>>
  let html = ''

  for (const node of nodes) {
    html += nodeToHtml(node)
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #ddd; margin-left: 0; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${html}
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nodeToHtml(node: Record<string, unknown>): string {
  const type = node.type as string
  const attrs = node.attrs as Record<string, unknown> | undefined
  const content = node.content as Array<Record<string, unknown>> | undefined

  switch (type) {
    case 'paragraph':
      return `<p>${htmlContent(content)}</p>`

    case 'heading': {
      const level = (attrs?.level as number) || 1
      return `<h${level}>${htmlContent(content)}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${content?.map(item => `<li>${htmlContent((item.content as Array<Record<string, unknown>>)?.[0]?.content as Array<Record<string, unknown>>)}</li>`).join('')}</ul>`

    case 'orderedList':
      return `<ol>${content?.map(item => `<li>${htmlContent((item.content as Array<Record<string, unknown>>)?.[0]?.content as Array<Record<string, unknown>>)}</li>`).join('')}</ol>`

    case 'codeBlock': {
      const language = (attrs?.language as string) || ''
      return `<pre><code class="language-${language}">${escapeHtml(textContent(content))}</code></pre>`
    }

    case 'blockquote':
      return `<blockquote><p>${htmlContent(content)}</p></blockquote>`

    case 'horizontalRule':
      return '<hr>'

    default:
      return `<p>${htmlContent(content)}</p>`
  }
}

function htmlContent(content?: Array<Record<string, unknown>>): string {
  if (!content) return ''

  return content.map(node => {
    if (node.type === 'text') {
      let text = escapeHtml(node.text as string)
      const marks = node.marks as Array<{ type: string }> | undefined

      if (marks) {
        for (const mark of marks) {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`
              break
            case 'italic':
              text = `<em>${text}</em>`
              break
            case 'code':
              text = `<code>${text}</code>`
              break
            case 'strike':
              text = `<del>${text}</del>`
              break
          }
        }
      }

      return text
    }
    return ''
  }).join('')
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'markdown'

    const page = await db.query.pages.findFirst({
      where: eq(pages.id, id),
    })

    if (!page || page.deletedAt) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const content = page.content as Record<string, unknown> | null

    if (format === 'html') {
      const html = content ? contentToHtml(content, page.title) : `<h1>${page.title}</h1>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${page.title}.html"`,
        },
      })
    }

    // Default to markdown
    const markdown = content
      ? `# ${page.title}\n\n${contentToMarkdown(content)}`
      : `# ${page.title}\n`

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${page.title}.md"`,
      },
    })
  } catch (error) {
    console.error('Failed to export page:', error)
    return NextResponse.json(
      { error: 'Failed to export page' },
      { status: 500 }
    )
  }
}
