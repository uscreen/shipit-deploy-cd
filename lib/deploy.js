const moment = require('moment')
const path = require('path')
const chalk = require('chalk')
const utils = require('shipit-utils')

module.exports = shipit => {
  const createReleasePath = async () => {
    shipit.releaseDirname = moment.utc().format('YYYYMMDDHHmmss')
    shipit.releasePath = path.join(
      shipit.config.deployTo,
      'releases',
      shipit.releaseDirname
    )
    shipit.log('Create release path "%s"', shipit.releasePath)
    await shipit.remote(`mkdir -p ${shipit.releasePath}`)
    shipit.log(chalk.green('Release path created.'))
  }

  const copyBuildToRelease = async () => {
    shipit.log(
      'Copy build from "%s" to "%s"',
      shipit.config.dist,
      shipit.releasePath
    )
    await shipit.copyToRemote(shipit.config.dist, shipit.releasePath)
    shipit.log(chalk.green('Build copied to remote.'))
  }

  const publishRelease = async () => {
    shipit.log('Publishing release "%s"', shipit.releasePath)
    const relativeReleasePath = path.join('releases', shipit.releaseDirname)
    await shipit.remote(
      'cd ' +
        shipit.config.deployTo +
        ' && ' +
        'if [ -d current ] && [ ! -L current ]; then ' +
        'echo "ERR: could not make symlink"; ' +
        'else ' +
        'ln -nfs ' +
        relativeReleasePath +
        ' current_tmp && ' +
        'mv -fT current_tmp current; ' +
        'fi'
    )
    shipit.log(chalk.green('Release published.'))
  }

  const cleanReleases = async () => {
    shipit.log(
      'Keeping "%d" last releases, cleaning others',
      shipit.config.keepReleases
    )
    const releasesPath = path.join(shipit.config.deployTo, 'releases')
    await shipit.remote(
      '(ls -rd ' +
        releasesPath +
        '/*|head -n ' +
        shipit.config.keepReleases +
        ';ls -d ' +
        releasesPath +
        '/*)|sort|uniq -u|xargs rm -rf'
    )
    shipit.log(chalk.green('cleaned.'))
  }

  utils.registerTask(shipit, 'deploy-cd', async () => {
    await createReleasePath()
    await copyBuildToRelease()
    await publishRelease()
    await cleanReleases()
  })
}
