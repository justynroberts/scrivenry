const Database = require('better-sqlite3');
const { ulid } = require('ulid');

const db = new Database('./data/scrivenry.db');

// Get the first workspace
const workspace = db.prepare('SELECT id FROM workspaces LIMIT 1').get();
const user = db.prepare('SELECT id FROM users LIMIT 1').get();

if (!workspace || !user) {
  console.error('No workspace or user found. Please create an account first.');
  process.exit(1);
}

const WORKSPACE_ID = workspace.id;
const USER_ID = user.id;
const now = Date.now();

const pythonPackagesPage = {
  title: 'Python Packages Guide',
  icon: '📦',
  content: {
    type: 'doc',
    content: [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Python Packages in Scrivenry' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Scrivenry uses Pyodide to run Python directly in your browser via WebAssembly. You can install additional packages using micropip.' }] },

      { type: 'callout', attrs: { emoji: '💡' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click the Package icon (box) in any Python block header to add packages. Enter package names separated by commas or spaces.' }] }] },

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'How to Install Packages' }] },
      { type: 'orderedList', attrs: { start: 1 }, content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Create a Python block using /python command' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click the Package icon (box) in the header' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Enter package names: numpy, pandas, matplotlib' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click Run - packages install automatically before execution' }] }] }
      ]},

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Example: Using NumPy' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Try running this with "numpy" in the packages field:' }] },
      { type: 'pythonBlock', attrs: {
        code: 'import numpy as np\n\n# Create arrays\narr = np.array([1, 2, 3, 4, 5])\nprint("Array:", arr)\nprint("Mean:", np.mean(arr))\nprint("Std:", np.std(arr))\nprint("Sum:", np.sum(arr))\n\n# Matrix operations\nmatrix = np.array([[1, 2], [3, 4]])\nprint("\\nMatrix:\\n", matrix)\nprint("Transpose:\\n", matrix.T)',
        output: null,
        error: null,
        packages: 'numpy'
      }},

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Example: Data Analysis with Pandas' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Add "pandas" to packages:' }] },
      { type: 'pythonBlock', attrs: {
        code: 'import pandas as pd\n\n# Create a DataFrame\ndata = {\n    "Name": ["Alice", "Bob", "Charlie", "Diana"],\n    "Age": [25, 30, 35, 28],\n    "City": ["NYC", "LA", "Chicago", "Miami"],\n    "Salary": [50000, 60000, 75000, 55000]\n}\n\ndf = pd.DataFrame(data)\nprint("DataFrame:")\nprint(df)\nprint("\\nStatistics:")\nprint(df.describe())\nprint("\\nAverage Salary:", df["Salary"].mean())',
        output: null,
        error: null,
        packages: 'pandas'
      }},

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Supported Packages (Built-in)' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'These packages are included in Pyodide and load quickly:' }] },
      { type: 'table', content: [
        { type: 'tableRow', content: [
          { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Category' }] }] },
          { type: 'tableHeader', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Packages' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Scientific' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'numpy, scipy, sympy' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Data' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'pandas, xlrd, openpyxl' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Visualization' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'matplotlib, seaborn, plotly' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ML/Stats' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'scikit-learn, statsmodels' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Text/NLP' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'regex, nltk, beautifulsoup4' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Utilities' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'pyyaml, toml, jsonschema, Pillow' }] }] }
        ]},
        { type: 'tableRow', content: [
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Crypto' }] }] },
          { type: 'tableCell', attrs: { colspan: 1, rowspan: 1 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'cryptography, pycryptodome' }] }] }
        ]}
      ]},

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Pure Python Packages (via micropip)' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Any pure Python package from PyPI can be installed. These are fetched on-demand:' }] },
      { type: 'bulletList', content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'requests - HTTP library (limited in browser)' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'python-dateutil - Date parsing' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'pytz - Timezone handling' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'markdown - Markdown processing' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'jinja2 - Template engine' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'faker - Generate fake data' }] }] }
      ]},

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Limitations' }] },
      { type: 'callout', attrs: { emoji: '⚠️' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Packages with C extensions that are not pre-compiled for WebAssembly will not work. Network access is limited due to browser security. File system access is virtualized.' }] }] },

      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Full Package List' }] },
      { type: 'paragraph', content: [
        { type: 'text', text: 'See the complete list of supported packages at ' },
        { type: 'text', marks: [{ type: 'link', attrs: { href: 'https://pyodide.org/en/stable/usage/packages-in-pyodide.html' }}], text: 'Pyodide Documentation' }
      ]}
    ]
  }
};

// Insert the page
const insertPage = db.prepare(`
  INSERT INTO pages (id, workspace_id, title, icon, content, created_by, last_edited_by, created_at, updated_at, depth, position)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
`);

const id = ulid();
insertPage.run(
  id,
  WORKSPACE_ID,
  pythonPackagesPage.title,
  pythonPackagesPage.icon,
  JSON.stringify(pythonPackagesPage.content),
  USER_ID,
  USER_ID,
  now,
  now,
  50
);

console.log(`Created: ${pythonPackagesPage.title} (${id})`);
db.close();
