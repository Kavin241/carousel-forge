---
description: Automatically append project changes to PROJECT_LOG.md and push to GitHub (which triggers Vercel deployments).
---

// turbo-all

1. Use the `multi_replace_file_content` tool to append a short summary of the session's architectural changes, feature additions, or bug fixes to `PROJECT_LOG.md` (located in the root directory). Focus on *why* and *what* changed so future AI agents have full context.
2. Run `git add .` to stage all modified files.
3. Run `git commit -m "[AI] chore: auto-save session state and update project log"`
4. Run `git push` to sync the repository to GitHub. This will automatically trigger a new deployment on Vercel if the platform is linked to your repo.
5. Notify the user that the project history has been successfully documented, committed, and deployed.
