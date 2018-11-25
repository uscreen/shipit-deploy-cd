const deploy = require('./lib/deploy')

module.exports = (shipit, taskname = 'deploy-cd') => {
  deploy(shipit, taskname)
}