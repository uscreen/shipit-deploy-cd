const { test, beforeEach } = require('node:test')
const assert = require('node:assert')
const sinon = require('sinon')
const Shipit = require('shipit-cli')
const deploy = require('../lib/deploy')

let shipit // local-to-test temporary variable

beforeEach(() => {
  shipit = new Shipit({
    environment: 'test',
    log: sinon.stub()
  })
  shipit.stage = 'test'
  deploy(shipit)
})

test('Registering shipit-deploy-cd task', async () => {
  assert.ok(
    shipit.tasks['deploy-cd'],
    'should have registered with default task name'
  )
})
