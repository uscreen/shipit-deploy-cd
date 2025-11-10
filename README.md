#### ⚠️ Maintenance Notice

**This package depends on shipit-cli as a peer dependency. Please note that shipit-cli appears to be no longer actively maintained — the last commit to the [shipit project](https://github.com/shipitjs/shipit) was made in 2020, the repository was archived by the owner in 2023. As a result, several security vulnerabilities have been identified in shipit-cli that can only be mitigated using dependency resolutions (yarn) or overrides (pnpm).**

**Use at your own risk.**

# shipit-deploy-cd

[![Test CI](https://github.com/uscreen/shipit-deploy-cd/actions/workflows/main.yml/badge.svg)](https://github.com/uscreen/shipit-deploy-cd/actions/workflows/main.yml)
[![Test Coverage](https://coveralls.io/repos/github/uscreen/shipit-deploy-cd/badge.svg?branch=master)](https://coveralls.io/github/uscreen/shipit-deploy-cd?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/uscreen/shipit-deploy-cd/badge.svg?targetFile=package.json)](https://snyk.io/test/github/uscreen/shipit-deploy-cd?targetFile=package.json)
[![NPM Version](https://badge.fury.io/js/@uscreen.de%2Fshipit-deploy-cd.svg)](https://badge.fury.io/js/@uscreen.de%2Fshipit-deploy-cd)

> A shipit deployment task without git requirements. 

Task is to just copy some local artefacts to a remote location. This is esp. usefull in Continous-Delivery-Scenarios. And that's why the package appended `cd`. It's using `rsync` under the hood to only transfer changes and keeps a capristrano like directory structure:

```sh
$ tree -L 2
.
├── current -> releases/20190725153703
└── releases
    ├── 20190623143320
    ├── 20190723150429
    ├── 20190724151443
    ├── 20190725152609
    └── 20190725153703
```

## install

__a)__ Install all required packages in one shot:

```sh
$ pnpm add shipit-cli @uscreen.de/shipit-deploy-cd # or use npm -i
```

__b)__ Or just add `shipit-deploy-cd` to any existing setup:

```sh
$ pnpm add @uscreen.de/shipit-deploy-cd # or use npm -i
```

_...will yield if `shipit-cli` missing_

## configure 

Add some proper task configuration to your `shipitfile.js`, example:

```js
// convenience: read app name from it's package.json
const { name } = require('./package.json')

module.exports = shipit => {

  // require and instantiate
  require('@uscreen.de/shipit-deploy-cd')(shipit)

  shipit.initConfig({
    // defaults, every env will inherit from here
    default: {
      dist: 'dist/*', // local source to sync from, can also be an array, like ['public', 'assets']
      deployTo: `/<remote>/<path>/<to>/<deploy>/<to>/${name}`,
      keepReleases: 5 // we keep a copy of last 5 releases
    },

    // example stage server (ssh connection settings)
    stage: {
      servers: 'deploy-stage@stage-deploy-01.example.com'
    },
    
    // example live servers (like above but 2 boxes)
    live: {
      servers: [
        'deploy-live@live-deploy-01.example.com',
        'deploy-live@live-deploy-02.example.com'
        ]
    }
  })

  // convenience: register as 'deploy' task
  shipit.task('deploy', async () => {
    shipit.start('deploy-cd')
  })
}

```

## use

As with all other shipit tasks, this one gets invoked by using the `shipit-cli`, ie.:

```sh
$ shipit stage deploy-cd # or, when registered with another task name
$ shipit stage deploy
```

## Workflow tasks

Following workflow task events are emitted:

- 'deploy'
- 'updated'
- 'published'
- 'cleaned'
- 'deployed'

## Tests

We use Docker to create a host that shipit-deploy-cd can deploy to during testing.

To start the test host, just run

    pnpm run testhost:start

Attention: Your public SSH keys are read from `~/.ssh/*.pub` and transferred to the test host. This is done to allow shipit-deploy-cd to connect to the test host during the tests.

Before you run the tests first time, you may find it useful to ssh to the service once to confirm the authenticity of the used host:

    ssh root@shipit-deploy-cd-test.uscreen.me -p 2222

Run the tests with

    pnpm run test

Stop the test host by

    pnpm run testhost:stop

## Roadmap

- add api/config docs
