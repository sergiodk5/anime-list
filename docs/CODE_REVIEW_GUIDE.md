# Code Review Guide

Guide for handling pull request review comments efficiently using the GitHub CLI.

## Prerequisites

- GitHub CLI installed and authenticated: `gh auth status`
- Repository cloned locally with push access

## Fetching Review Comments

### View PR Comments

```bash
# View all comments on a PR
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments

# Example
gh api repos/sergiodk5/anime-list/pulls/9/comments
```

### View Review Threads (with resolution status)

```bash
gh api graphql -f query='
{
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr_number}) {
      reviewThreads(first: 20) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              body
              databaseId
            }
          }
        }
      }
    }
  }
}'
```

## Responding to Comments

### Reply to a Specific Comment

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -X POST \
  -f body="Your reply message here"
```

### Example Response Patterns

**For fixes:**
```bash
gh api repos/sergiodk5/anime-list/pulls/9/comments/123456/replies \
  -X POST \
  -f body="Fixed in commit abc123. Added validation as suggested."
```

**For acknowledged issues:**
```bash
gh api repos/sergiodk5/anime-list/pulls/9/comments/123456/replies \
  -X POST \
  -f body="Acknowledged. This will be addressed in a follow-up PR."
```

## Resolving Review Threads

### Resolve a Single Thread

```bash
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "THREAD_ID_HERE"}) {
    thread { isResolved }
  }
}'
```

### Resolve Multiple Threads

```bash
for thread_id in PRRT_abc123 PRRT_def456 PRRT_ghi789; do
  gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"$thread_id\"}) { thread { isResolved } } }"
done
```

## Best Practices

### 1. Fix Before Responding

Always implement the fix before replying to the comment. This ensures your response accurately describes what was done.

### 2. Reference Commits

Include commit hashes in your replies so reviewers can verify the fix:

```
Fixed in commit abc1234. Added input validation using regex pattern.
```

### 3. Categorize Comment Types

| Type | Action |
|------|--------|
| Bug/Security | Fix immediately, reference commit |
| Nitpick | Fix if reasonable, explain if not |
| Enhancement | Acknowledge, create follow-up issue if needed |
| Question | Answer clearly, add code comments if helpful |

### 4. Run Tests Before Pushing

```bash
npm run format && npm run lint && npm run test:unit
```

### 5. Commit Message Format

Group related fixes in logical commits:

```bash
git commit -m "fix: address security review feedback

- Add input validation for user-provided colors
- Escape HTML in dynamic attributes
- Use separate timeout variables to prevent race conditions"
```

### 6. Push and Verify

```bash
# Push changes
git push

# Verify all threads are resolved
gh api graphql -f query='{
  repository(owner: "sergiodk5", name: "anime-list") {
    pullRequest(number: 9) {
      reviewThreads(first: 20) {
        nodes { isResolved }
      }
    }
  }
}'
```

## Common Scenarios

### Security Issues

1. Fix the vulnerability immediately
2. Add tests to prevent regression
3. Reply with details of the fix
4. Resolve the thread

### Code Style / Naming

1. Evaluate if the suggestion improves clarity
2. Apply the change
3. Update related tests/docs
4. Reply confirming the change

### Feature Requests / Enhancements

1. Evaluate scope vs. current PR
2. If in scope: implement
3. If out of scope: acknowledge and suggest follow-up issue
4. Resolve with explanation

## Workflow Summary

```bash
# 1. Fetch comments
gh api repos/sergiodk5/anime-list/pulls/9/comments

# 2. Fix issues in code

# 3. Run checks
npm run format && npm run lint && npm run test:unit

# 4. Commit and push
git add . && git commit -m "fix: address review feedback" && git push

# 5. Reply to each comment
gh api repos/.../pulls/9/comments/{id}/replies -X POST -f body="Fixed in commit..."

# 6. Resolve threads
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "..."}) { thread { isResolved } } }'
```
