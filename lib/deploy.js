const path = require('path')
const chalk = require('chalk')
const utils = require('shipit-utils')

const pad = (number) => {
  if (number < 10) {
    return '0' + number
  }
  return number
}

const getTimestamp = () => {
  const ts = new Date()
  return [
    ts.getUTCFullYear(),
    pad(ts.getUTCMonth() + 1),
    pad(ts.getUTCDate()),
    pad(ts.getUTCHours()),
    pad(ts.getUTCMinutes()),
    pad(ts.getUTCSeconds())
  ].join('')
}

module.exports = (shipit, taskname = 'deploy-cd') => {
  const createReleasePath = async () => {
    shipit.releaseDirname = getTimestamp()
    shipit.releasePath = path.join(
      shipit.config.deployTo,
      'releases',
      shipit.releaseDirname
    )
    shipit.log('Create release path "%s"', shipit.releasePath)
    await shipit.remote(`mkdir -p ${shipit.releasePath}`)
    shipit.log(chalk.green('Release path created.'))
  }

  const copyPreviousRelease = async () => {
    shipit.log('Copy previous release to "%s"', shipit.releasePath)
    const current = path.join(shipit.config.deployTo, 'current')
    await shipit.remote(
      `if [ -d ${current} ]; then ` +
        `cp -a ${current}/. ` +
        shipit.releasePath +
        '; ' +
        'fi'
    )
    shipit.log(chalk.green('Copied previous release.'))
  }

  const copyBuildToRelease = async () => {
    shipit.log(
      'Copy build from "%s" to "%s"',
      shipit.config.dist,
      shipit.releasePath
    )

    const options = shipit.config.verbose
      ? {
          rsync: '--del --verbose'
        }
      : {
          rsync: '--del'
        }

    if (Array.isArray(shipit.config.dist)) {
      for (const dist of shipit.config.dist) {
        await shipit.copyToRemote(dist, shipit.releasePath, options)
      }
    } else {
      await shipit.copyToRemote(shipit.config.dist, shipit.releasePath, options)
    }

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

  utils.registerTask(shipit, taskname, async () => {
    shipit.emit('deploy')

    await createReleasePath()
    await copyPreviousRelease()
    await copyBuildToRelease()
    shipit.emit('updated')

    await publishRelease()
    shipit.emit('published')

    await cleanReleases()
    shipit.emit('cleaned')

    shipit.emit('deployed')
  })
}
