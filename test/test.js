const tap = require('tap')
const sinon = require('sinon')
const Shipit = require('shipit-cli')
const deploy = require('../lib/deploy')

let shipit // local-to-test temporary variable

tap.beforeEach(() => {
  shipit = new Shipit({
    environment: 'test',
    log: sinon.stub()
  })
  shipit.stage = 'test'
  deploy(shipit)
})

tap.test('shipit-deploy-cd', async (t) => {
  t.ok(
    shipit.tasks['deploy-cd'],
    'should have registered with default task name'
  )

  t.end()
})
