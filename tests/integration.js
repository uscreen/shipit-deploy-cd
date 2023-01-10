const tap = require('tap')
const path = require('path')
const {
  cli,
  remoteHost,
  // directoryNameToDate,
  // nearlyEqual,
  resetRemoteFiles,
  getRemoteEntries,
  getRemoteTree,
  nameIs,
  byDesc
} = require('./config')

// const maxDateDiff = 2000

const rootTreeExpected = [
  {
    type: 'd',
    name: 'testproject',
    entries: [
      {
        type: 'l',
        name: 'current'
      },
      {
        type: 'd',
        name: 'releases'
      }
    ]
  }
]

const releaseTreesExpected = [
  [{ type: 'f', name: 'foo' }],
  [
    { type: 'f', name: 'bar' },
    { type: 'f', name: 'foo' }
  ],
  [
    { type: 'f', name: 'bar' },
    { type: 'f', name: 'foo' },
    {
      type: 'd',
      name: 'foobar',
      entries: [{ type: 'f', name: 'qux' }]
    }
  ],
  [
    { type: 'f', name: 'bar' },
    { type: 'f', name: 'foo' },
    {
      type: 'd',
      name: 'foobar',
      entries: [{ type: 'f', name: 'qux' }]
    }
  ],
  [
    { type: 'f', name: 'bar' },
    {
      type: 'd',
      name: 'foobar',
      entries: [{ type: 'f', name: 'qux' }]
    }
  ]
]

tap.test('Deploying multiple times', async (t) => {
  t.before(() => resetRemoteFiles(remoteHost))

  const previousReleases = []

  t.test('Executing first deployment', async (t) => {
    const cwd = path.resolve(__dirname, 'fixtures/1')
    const shipitResult = await cli('shipit stage deploy', cwd)
    t.equal(0, shipitResult.code, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    t.same(
      rootTreeExpected,
      rootTree,
      'should have created the correct folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    t.equal(
      1,
      releasesEntries.length,
      'should have  one entry inside "releases"'
    )

    const [newRelease] = releasesEntries.sort(byDesc('name'))

    t.ok(
      newRelease.name.match(/^\d{14}$/),
      '... entry should be a folder appropriately named'
    )
    // t.ok(
    //   nearlyEqual(
    //     directoryNameToDate(newRelease.name),
    //     newRelease.ts,
    //     maxDateDiff
    //   ),
    //   "... entry's name should correspond to entry's timestamp"
    // )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    t.equal(
      `releases/${newRelease.name}`,
      testprojectEntries.find(nameIs('current')).target,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    t.same(
      releaseTreesExpected[0],
      newReleaseTree,
      'should have copied local folder "dist" to "current"'
    )

    previousReleases.push(newRelease)
  })

  t.test('Executing second deployment', async (t) => {
    const cwd = path.resolve(__dirname, 'fixtures/2')
    const shipitResult = await cli('shipit stage deploy', cwd)
    t.equal(0, shipitResult.code, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    t.same(
      rootTreeExpected,
      rootTree,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    t.equal(
      2,
      releasesEntries.length,
      'should have two entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    t.ok(
      newRelease.name.match(/^\d{14}$/),
      '... entry should be a folder appropriately named'
    )
    // t.ok(
    //   nearlyEqual(
    //     directoryNameToDate(newRelease.name),
    //     newRelease.ts,
    //     maxDateDiff
    //   ),
    //   "... entry's name should correspond to entry's timestamp"
    // )
    t.same(
      previousReleases.map((r) => r.name).sort(),
      other.map((r) => r.name).sort(),
      'should have kept old releases'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    t.equal(
      `releases/${newRelease.name}`,
      testprojectEntries.find(nameIs('current')).target,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    t.same(
      releaseTreesExpected[1],
      newReleaseTree,
      'should have copied local folder "dist" to "current"'
    )

    /**
     * check older releases
     */
    for (let i = 0; i < previousReleases.length; i++) {
      const release = previousReleases[i]
      const releaseTree = await getRemoteTree(
        remoteHost,
        `./testproject/releases/${release.name}`
      )
      t.same(
        releaseTreesExpected[i],
        releaseTree,
        `should not have changed old release ${release.name}`
      )
    }

    previousReleases.push(newRelease)
  })

  t.test('Executing third deployment', async (t) => {
    const cwd = path.resolve(__dirname, 'fixtures/3')
    const shipitResult = await cli('shipit stage deploy', cwd)
    t.equal(0, shipitResult.code, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    t.same(
      rootTreeExpected,
      rootTree,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    t.equal(
      3,
      releasesEntries.length,
      'should have three entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    t.ok(
      newRelease.name.match(/^\d{14}$/),
      '... entry should be a folder appropriately named'
    )
    // t.ok(
    //   nearlyEqual(
    //     directoryNameToDate(newRelease.name),
    //     newRelease.ts,
    //     maxDateDiff
    //   ),
    //   "... entry's name should correspond to entry's timestamp"
    // )
    t.same(
      previousReleases.map((r) => r.name).sort(),
      other.map((r) => r.name).sort(),
      'should have kept old releases'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    t.equal(
      `releases/${newRelease.name}`,
      testprojectEntries.find(nameIs('current')).target,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    t.same(
      releaseTreesExpected[2],
      newReleaseTree,
      'should have copied local folder "dist" to "current"'
    )

    /**
     * check older releases
     */
    for (let i = 0; i < previousReleases.length; i++) {
      const release = previousReleases[i]
      const releaseTree = await getRemoteTree(
        remoteHost,
        `./testproject/releases/${release.name}`
      )
      t.same(
        releaseTreesExpected[i],
        releaseTree,
        `should not have changed old release ${release.name}`
      )
    }

    previousReleases.push(newRelease)
  })

  t.test('Executing fourth deployment', async (t) => {
    const cwd = path.resolve(__dirname, 'fixtures/4')
    const shipitResult = await cli('shipit stage deploy', cwd)
    t.equal(0, shipitResult.code, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    t.same(
      rootTreeExpected,
      rootTree,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    t.equal(
      3,
      releasesEntries.length,
      'should still have three entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    t.ok(
      newRelease.name.match(/^\d{14}$/),
      '... entry should be a folder appropriately named'
    )

    // t.ok(
    //   nearlyEqual(
    //     directoryNameToDate(newRelease.name),
    //     newRelease.ts,
    //     maxDateDiff
    //   ),
    //   "... entry's name should correspond to entry's timestamp"
    // )
    t.same(
      previousReleases
        .map((r) => r.name)
        .sort()
        .slice(-2),
      other.map((r) => r.name).sort(),
      'should have removed the oldest release'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    t.equal(
      `releases/${newRelease.name}`,
      testprojectEntries.find(nameIs('current')).target,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    t.same(
      releaseTreesExpected[3],
      newReleaseTree,
      'should have copied local folder "dist" to "current"'
    )

    /**
     * check older releases
     */
    for (let i = 1; i < previousReleases.length; i++) {
      const release = previousReleases[i]
      const releaseTree = await getRemoteTree(
        remoteHost,
        `./testproject/releases/${release.name}`
      )
      t.same(
        releaseTreesExpected[i],
        releaseTree,
        `should not have changed old release ${release.name}`
      )
    }
  })
})
