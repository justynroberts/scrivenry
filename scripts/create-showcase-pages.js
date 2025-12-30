const Database = require('better-sqlite3');
const { ulid } = require('ulid');

const db = new Database('./data/scrivenry.db');

const USER_ID = '01KDGZAAMCREKR48K51P42HQ1V';
const WORKSPACE_ID = '01KDGZAAMFWKFCQ9J61PGGVG6S';
const now = Date.now();

const showcasePages = [
  {
    title: 'Editor Blocks Showcase',
    icon: '📝',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Editor Blocks Showcase' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'This page demonstrates the various block types available in Scrivenry.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Text Formatting' }] },
        { type: 'paragraph', content: [
          { type: 'text', marks: [{ type: 'bold' }], text: 'Bold text' },
          { type: 'text', text: ', ' },
          { type: 'text', marks: [{ type: 'italic' }], text: 'italic text' },
          { type: 'text', text: ', and ' },
          { type: 'text', marks: [{ type: 'underline' }], text: 'underlined text' }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Lists' }] },
        { type: 'bulletList', content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First bullet point' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second bullet point' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Third bullet point' }] }] }
        ]},
        { type: 'orderedList', attrs: { start: 1 }, content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First numbered item' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second numbered item' }] }] }
        ]},
        { type: 'taskList', content: [
          { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Completed task' }] }] },
          { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Pending task' }] }] }
        ]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Callout Block' }] },
        { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'This is a callout block - great for tips and important notes!' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Quote Block' }] },
        { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'The best way to predict the future is to invent it. - Alan Kay' }] }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Divider' }] },
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Content after the divider.' }] }
      ]
    }
  },
  {
    title: 'Charts and Diagrams',
    icon: '📊',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Charts and Diagrams' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports rich visualizations including Mermaid diagrams and Chart.js charts.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Mermaid Diagram' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create flowcharts, sequence diagrams, and more using Mermaid syntax:' }] },
        { type: 'mermaidBlock', attrs: { code: 'flowchart TD\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n    C --> E[End]\n    D --> E' }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Chart Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create bar, line, pie, and doughnut charts:' }] },
        { type: 'chartBlock', attrs: { chartType: 'bar', config: JSON.stringify({
          labels: ['January', 'February', 'March', 'April', 'May'],
          datasets: [{
            label: 'Sales',
            data: [65, 59, 80, 81, 56],
            backgroundColor: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']
          }]
        }) }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Table' }] },
        { type: 'table', content: [
          { type: 'tableRow', content: [
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Feature' }] }] },
            { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Status' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Charts' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete' }] }] }
          ]},
          { type: 'tableRow', content: [
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Diagrams' }] }] },
            { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complete' }] }] }
          ]}
        ]}
      ]
    }
  },
  {
    title: 'Interactive Elements',
    icon: '⭐',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Interactive Elements' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry includes various interactive blocks for rich content.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Rating Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Rate items with customizable star ratings:' }] },
        { type: 'ratingBlock', attrs: { rating: 4, maxRating: 5, label: 'Product Quality', size: 'md' }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Timeline Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Track events chronologically:' }] },
        { type: 'timelineBlock', attrs: { items: [
          { id: '1', date: '2024-01', title: 'Project Started', description: 'Initial planning and setup', color: '#8b5cf6' },
          { id: '2', date: '2024-03', title: 'MVP Released', description: 'First version launched', color: '#22c55e' },
          { id: '3', date: '2024-06', title: 'v2.0 Released', description: 'Major feature update', color: '#3b82f6' }
        ]}},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Progress Bar' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Track progress visually:' }] },
        { type: 'progressBar' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Kanban Board' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Organize tasks with drag-and-drop boards:' }] },
        { type: 'kanbanBoard' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Calendar Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Schedule and view events:' }] },
        { type: 'calendarBlock' }
      ]
    }
  },
  {
    title: 'Code Execution',
    icon: '💻',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Code Execution' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports live code execution in the browser!' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'JavaScript Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Run JavaScript code directly in your notes:' }] },
        { type: 'javascriptBlock', attrs: {
          code: '// Calculate sum of array\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = numbers.reduce((a, b) => a + b, 0);\nconsole.log("Sum:", sum);\n\n// Generate random numbers\nfor (let i = 0; i < 3; i++) {\n  console.log("Random:", Math.floor(Math.random() * 100));\n}\n\nreturn "Done!";',
          output: null, error: null, autoRun: false, showOutput: true
        }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Python Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Run Python code using Pyodide (WebAssembly):' }] },
        { type: 'pythonBlock', attrs: {
          code: '# Python in the browser!\nimport math\n\n# Calculate factorial\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\nfor i in range(1, 8):\n    print(f"{i}! = {factorial(i)}")',
          output: null, error: null, autoRun: false
        }},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Code Block (Syntax Highlighting)' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'For documentation with syntax highlighting:' }] },
        { type: 'codeBlock', attrs: { language: 'typescript' }, content: [{ type: 'text', text: 'interface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction greetUser(user: User): string {\n  return `Hello, ${user.name}!`;\n}' }]},
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Math Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'LaTeX math equations:' }] },
        { type: 'mathBlock' }
      ]
    }
  },
  {
    title: 'Media and Embeds',
    icon: '🎬',
    content: {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Media and Embeds' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry supports various media types and embeds.' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Image Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Upload and display images:' }] },
        { type: 'imageBlock' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Video Embed' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Embed YouTube, Vimeo, and Loom videos:' }] },
        { type: 'videoEmbed' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bookmark' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Create rich link previews:' }] },
        { type: 'bookmark' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'File Attachment' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Attach files to your pages:' }] },
        { type: 'fileBlock' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Table of Contents' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Auto-generated navigation:' }] },
        { type: 'tableOfContents' },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Columns Layout' }] },
        { type: 'columns', content: [
          { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Left column content goes here.' }] }] },
          { type: 'column', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Right column content here.' }] }] }
        ]}
      ]
    }
  }
];

// Insert pages
const insertPage = db.prepare(`
  INSERT INTO pages (id, workspace_id, title, icon, content, created_by, last_edited_by, created_at, updated_at, depth, position)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`);

showcasePages.forEach((page, index) => {
  const id = ulid();
  insertPage.run(
    id,
    WORKSPACE_ID,
    page.title,
    page.icon,
    JSON.stringify(page.content),
    USER_ID,
    USER_ID,
    now,
    now,
    100 + index
  );
  console.log(`Created: ${page.title} (${id})`);
});

db.close();
console.log('\nAll showcase pages created successfully!');
