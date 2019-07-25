# shipit-deploy-cd

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
$ yarn add shipit-cli @uscreen.de/shipit-deploy-cd # or use npm -i
```

__b)__ Or just add `shipit-deploy-cd` to any existing setup:

```sh
$ yarn add @uscreen.de/shipit-deploy-cd # or use npm -i
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

## Roadmap

- add tests (shame)
- add api/config docs