module.exports = {
  '*.ts': (filesArray) => {
    return [`npx eslint ${filesArray.join(' ')}`, `npx prettier ${filesArray.join(' ')}`];
  },
  '*.tsx': (filesArray) => {
    return [`npx eslint ${filesArray.join(' ')}`, `npx prettier ${filesArray.join(' ')}`];
  },
  '*.md': (filesArray) => {
    return [`npx prettier ${filesArray.join(' ')}`];
  },
};
