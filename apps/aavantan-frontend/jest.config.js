module.exports = {
  name: 'aavantan-frontend',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/aavantan-frontend',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
