const name = 'testproject'

const { remoteHost } = require('../../config')

module.exports = (shipit) => {
  require('../../../lib/deploy.js')(shipit)

  shipit.initConfig({
    default: {
      dist: 'dist/*',
      deployTo: `/root/${name}`,
      keepReleases: 3
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
