# Creating a Pull Request for the Deal Analyzer updates

1. **Ensure your local branch is up to date.**
   ```bash
   git status
   ```
   Commit any outstanding changes (the deal analyzer work should already be committed on the `work` branch).

2. **Push the branch to the remote.**
   Replace `origin` with your remote name if it differs.
   ```bash
   git push origin work
   ```

3. **Open the repository on GitHub and start a PR.**
   - Navigate to the repository page.
   - GitHub will offer a “Compare & pull request” banner for the newly pushed `work` branch.
   - If you do not see the banner, click **Pull requests** → **New pull request**, then choose `work` as the compare branch and the default branch (usually `main`) as the base.

4. **Fill in the PR details.**
   - Title suggestion: `Enhance deal analyzer with scenario comparison and tips`.
   - Include a summary of the scenario comparison UI, KPI helper tweaks, and notes about the baseline functionality.
   - Mention that no automated tests were run (if applicable).

5. **Create the PR.**
   Click **Create pull request** to submit. Share the PR link with reviewers so they can review and merge it when ready.

If you prefer using the GitHub CLI, you can run:
```bash
gh pr create --base main --head work --title "Enhance deal analyzer with scenario comparison and tips" --body-file notes/how-to-create-pr.md
```
(Adjust the title/body as needed and ensure the GitHub CLI is authenticated.)
