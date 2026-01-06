const Database = require('better-sqlite3');

const db = new Database('./data/scrivenry.db');

// Get current page
const page = db.prepare("SELECT id, content FROM pages WHERE title='Python Packages Guide'").get();

if (!page) {
  console.error('Page not found');
  process.exit(1);
}

const content = JSON.parse(page.content);

// Add REST API section before the Limitations section
const restApiSection = [
  { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Making REST API Calls' }] },
  { type: 'paragraph', content: [{ type: 'text', text: 'Browser security (CORS) limits external HTTP requests. Use Pyodide\'s built-in pyfetch or JavaScript\'s fetch:' }] },

  { type: 'callout', attrs: { emoji: '⚠️' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Only APIs with CORS headers allowing browser requests will work. The requests library does NOT work in Pyodide.' }] }] },

  { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Using pyfetch (Recommended)' }] },
  { type: 'pythonBlock', attrs: {
    code: `from pyodide.http import pyfetch
import json

# Fetch from a CORS-enabled API
response = await pyfetch("https://api.github.com/users/octocat")
data = await response.json()

print("Name:", data["name"])
print("Company:", data["company"])
print("Location:", data["location"])
print("Public repos:", data["public_repos"])`,
    output: null,
    error: null,
    packages: null
  }},

  { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Using JavaScript fetch' }] },
  { type: 'pythonBlock', attrs: {
    code: `from js import fetch, JSON

# Call JavaScript's fetch directly
response = await fetch("https://jsonplaceholder.typicode.com/posts/1")
data = await response.json()

# Access JS object properties
print("Title:", data.title)
print("Body:", data.body[:50] + "...")`,
    output: null,
    error: null,
    packages: null
  }},

  { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'POST Request Example' }] },
  { type: 'pythonBlock', attrs: {
    code: `from pyodide.http import pyfetch
import json

# POST request with JSON body
response = await pyfetch(
    "https://jsonplaceholder.typicode.com/posts",
    method="POST",
    headers={"Content-Type": "application/json"},
    body=json.dumps({
        "title": "Hello from Scrivenry",
        "body": "Testing Python REST calls",
        "userId": 1
    })
)

result = await response.json()
print("Created post ID:", result["id"])
print("Title:", result["title"])`,
    output: null,
    error: null,
    packages: null
  }},

  { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'CORS-Friendly Public APIs' }] },
  { type: 'paragraph', content: [{ type: 'text', text: 'These APIs work from browsers without CORS issues:' }] },
  { type: 'bulletList', content: [
    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'api.github.com - GitHub public data' }] }] },
    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'jsonplaceholder.typicode.com - Fake REST API for testing' }] }] },
    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'api.publicapis.org - Directory of public APIs' }] }] },
    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'catfact.ninja - Random cat facts' }] }] },
    { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'official-joke-api.appspot.com - Random jokes' }] }] }
  ]}
];

// Find the Limitations section index and insert before it
const limitationsIndex = content.content.findIndex(
  node => node.type === 'heading' &&
  node.content?.[0]?.text === 'Limitations'
);

if (limitationsIndex !== -1) {
  content.content.splice(limitationsIndex, 0, ...restApiSection);
} else {
  // Add before the last heading if Limitations not found
  content.content.push(...restApiSection);
}

// Update the page
db.prepare("UPDATE pages SET content = ?, updated_at = ? WHERE id = ?").run(
  JSON.stringify(content),
  Date.now(),
  page.id
);

console.log('Updated Python Packages Guide with REST API examples');
db.close();
