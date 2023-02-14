const name = 'testproject'

const { remoteHost } = require('../../config')

module.exports = (shipit) => {
  require('../../../lib/deploy.js')(shipit)

  shipit.initConfig({
    default: {
      dist: ['dist1/*', 'dist2/*'],
      deployTo: `/root/${name}`,
      keepReleases: 3,
      verbose: true
    },

    stage: {
      servers: remoteHost
    }
  })

  // convenience: register as 'deploy' task
  shipit.task('deploy', async () => {
    shipit.start('deploy-cd')
  })
}
