# MCP servers

`mcp.example.json` wires a small set of **generic, public** MCP servers that pair
well with this harness:

| Server | What it adds |
| --- | --- |
| `context7` | Up-to-date library/framework docs, on demand |
| `sequential-thinking` | A scratchpad for structured multi-step reasoning |
| `filesystem` | Scoped read/write to a project directory |
| `github` | Issues, PRs, repo operations (needs `GITHUB_TOKEN`) |
| `chrome-devtools` | Drive a real browser: DOM, network, screenshots |
| `playwright` | Browser automation and testing across Chromium, Firefox, and WebKit |
| `fetch` | Fetch a URL and return its content as text or markdown |
| `memory` | A persistent knowledge graph the agent can read and write across sessions |

## Rules of the road

- **No credentials in config.** Tokens come from environment variables
  (`${GITHUB_TOKEN}` etc.), never hard-coded.
- **Keep the fleet small.** Every server is a process the client cold-starts.
  A dozen rarely-used servers make every session slower to boot. Add a server
  when you actually use it; move rarely-used ones to project-scoped config.
- **Scope the filesystem server.** Point it at a specific project directory,
  not your home folder.
