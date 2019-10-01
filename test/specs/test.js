/* eslint-disable no-unused-expressions */
const sinon = require('sinon')
const Shipit = require('shipit-cli')
const deploy = require('../../lib/deploy')
let shipit // local-to-test temporary variable
describe('shipit-deploy-cd', () => {
  beforeEach(function() {
    shipit = new Shipit({
      environment: 'test',
      log: sinon.stub()
    })
    shipit.stage = 'test'
    deploy(shipit)
  })

  it('should have registered with default task name', done => {
    expect(shipit.tasks['deploy-cd']).to.exist
    done()
  })
})
