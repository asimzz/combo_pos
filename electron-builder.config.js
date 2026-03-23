module.exports = {
  appId: 'com.combo.pos',
  productName: 'Combo POS',
  directories: {
    output: 'release',
    buildResources: 'build'
  },
  files: [
    'electron/**/*',
    '.next/standalone/**/*',
    '.next/static/**/*',
    'public/**/*',
    'package.json'
  ],
  win: {
    icon: 'public/logo.png',
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false
  },
  mac: {
    icon: 'public/logo.png',
    category: 'public.app-category.business'
  },
  linux: {
    icon: 'public/logo.png',
    category: 'Office'
  }
}