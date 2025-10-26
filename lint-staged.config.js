module.exports = {
  '*.ts': (filesArray) => {
    const commands = [];

    // Separate backend files from other files
    const backendFiles = filesArray.filter((file) => file.startsWith('apps/backend/'));
    const otherFiles = filesArray.filter((file) => !file.startsWith('apps/backend/'));

    // Run ESLint with backend config for backend files
    if (backendFiles.length > 0) {
      const relativePaths = backendFiles.map((f) => f.replace('apps/backend/', ''));
      commands.push(`cd apps/backend && npx eslint ${relativePaths.join(' ')}`);
      commands.push(`npx prettier ${backendFiles.join(' ')}`);
    }

    // Run ESLint with root config for other files
    if (otherFiles.length > 0) {
      commands.push(`npx eslint ${otherFiles.join(' ')}`);
      commands.push(`npx prettier ${otherFiles.join(' ')}`);
    }

    return commands;
  },
  '*.tsx': (filesArray) => {
    return [`npx eslint ${filesArray.join(' ')}`, `npx prettier ${filesArray.join(' ')}`];
  },
  '*.md': (filesArray) => {
    return [`npx prettier ${filesArray.join(' ')}`];
  },
};
