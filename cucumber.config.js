module.exports = {
  default: {
    require: [
      'tests/step-definitions/**/*.ts',
      'tests/support/**/*.ts'
    ],
    requireModule: ['ts-node/register'],
    timeout:  30000,
    paths: ['tests/features/**/*.feature'],
    format: ['progress',
      "html:artifacts/cucumber-report.html",
      "json:artifacts/cucumber-report.json"
    ]
    
  }
};
