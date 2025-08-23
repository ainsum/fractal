# Git Hooks & Code Quality Setup

This document explains the modern pre-commit hook setup for the Fractal project, following 2025 best practices.

## 🎯 Overview

We use a modern stack of tools to ensure code quality and consistency:

- **Husky**: Manages Git hooks
- **lint-staged**: Runs checks only on staged files (fast and efficient)
- **Biome**: Linting and formatting (modern replacement for ESLint + Prettier)
- **commitlint**: Validates commit message format

## 🚀 Quick Start

The hooks are automatically installed when you run `npm install`. If you need to manually set them up:

```bash
npm run prepare
```

## 📋 Hook Details

### Pre-commit Hook (`.husky/pre-commit`)

**What it does:**
- Runs `lint-staged` on all staged files
- Only processes files that are actually staged (fast execution)
- Automatically fixes formatting issues when possible

**What gets checked:**
- **TypeScript/JavaScript files**: Biome linting + formatting
- **JSON/Markdown/YAML files**: Biome formatting only

**Example output:**
```bash
$ git commit -m "feat: add new feature"
✔ Preparing lint-staged...
✔ Running tasks for staged files...
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...
[main abc1234] feat: add new feature
```

### Pre-push Hook (`.husky/pre-push`)

**What it does:**
- Runs TypeScript type checking on the entire codebase
- Runs the full test suite
- Prevents pushing if there are type errors or failing tests

**Why this matters:**
- Catches issues that might not be caught by pre-commit (e.g., type errors in unstaged files)
- Ensures the codebase is always in a working state
- Prevents broken code from reaching the remote repository

### Commit Message Hook (`.husky/commit-msg`)

**What it does:**
- Validates commit message format using conventional commits
- Ensures consistent commit history
- Enables automatic changelog generation

**Valid commit message format:**
```
type(scope?): subject

Examples:
feat: add new user authentication
fix(auth): resolve login issue
docs: update API documentation
style: format code with biome
refactor(ui): simplify component structure
test: add unit tests for user service
```

## ⚙️ Configuration

### lint-staged Configuration (`package.json`)

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "biome check --write",
      "biome format --write"
    ],
    "*.{json,md,yml,yaml}": [
      "biome format --write"
    ]
  }
}
```

### commitlint Configuration (`commitlint.config.js`)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 
      'perf', 'test', 'build', 'ci', 'chore', 
      'revert', 'wip'
    ]],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72]
  }
};
```

## 🛠️ Available Scripts

```bash
# Manual hook execution
npm run pre-commit    # Run lint-staged manually
npm run pre-push      # Run type-check + tests manually

# Setup
npm run prepare       # Install/update Husky hooks
```

## 🔧 Troubleshooting

### Hook Not Running

1. **Check if hooks are installed:**
   ```bash
   ls -la .husky/
   ```

2. **Reinstall hooks:**
   ```bash
   npm run prepare
   ```

3. **Check file permissions:**
   ```bash
   chmod +x .husky/pre-commit .husky/pre-push .husky/commit-msg
   ```

### Skipping Hooks (Emergency Only)

**⚠️ Only use in emergencies!**

```bash
# Skip pre-commit hook
git commit -m "message" --no-verify

# Skip pre-push hook
git push --no-verify
```

### Performance Issues

If hooks are running slowly:

1. **Check staged files only:**
   ```bash
   git status
   ```

2. **Run lint-staged manually to see what's slow:**
   ```bash
   npx lint-staged --verbose
   ```

3. **Consider excluding large files:**
   Add to `.lintstagedrc.js`:
   ```javascript
   module.exports = {
     '*.{js,jsx,ts,tsx}': (filenames) => {
       const filteredFiles = filenames.filter(
         (file) => !file.includes('node_modules')
       );
       return [`biome check --write ${filteredFiles.join(' ')}`];
     }
   };
   ```

## 🎯 Best Practices

### For Developers

1. **Commit frequently**: Small, focused commits are easier to review and debug
2. **Use conventional commits**: Makes history more readable and enables automation
3. **Fix issues locally**: Don't skip hooks unless absolutely necessary
4. **Test before committing**: Run `npm run type-check` and `npm test` locally

### For Teams

1. **Document custom rules**: Update this file when adding new hooks
2. **Monitor performance**: If hooks become slow, investigate and optimize
3. **Regular updates**: Keep Husky, lint-staged, and other tools updated
4. **CI/CD integration**: Ensure CI runs the same checks as local hooks

## 📚 Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Biome Documentation](https://biomejs.dev/)

## 🔄 Migration from ESLint/Prettier

If you're migrating from ESLint + Prettier:

1. **Remove old dependencies:**
   ```bash
   npm uninstall eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
   ```

2. **Remove old config files:**
   ```bash
   rm .eslintrc.js .prettierrc
   ```

3. **Update lint-staged config** (already done in this setup)

4. **Update CI/CD pipelines** to use Biome instead of ESLint/Prettier

The setup is now complete and follows 2025 best practices! 🎉
