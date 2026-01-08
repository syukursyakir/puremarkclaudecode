# Claude Code Instructions

You are allowed to:
- Create, modify, and delete files freely
- Run shell commands without asking
- Install dependencies when needed
- Refactor code across the project
- Edit configuration files
- Assume I approve safe and standard actions

Rules:
- Do not ask for confirmation before making changes
- Only ask if an action is destructive (e.g. deleting large directories, wiping data)
- Prefer acting immediately and explaining after
- Use best engineering judgment
- After every code edit, automatically run `git add .` and `git commit -m "SUITABLE_MESSAGE"` (no push)

The user explicitly grants permission for normal development actions.

