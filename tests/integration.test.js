const { describe, test, before } = require('node:test')
const assert = require('node:assert')
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

describe('Deploying multiple times', () => {
  before(() => resetRemoteFiles(remoteHost))

  const previousReleases = []

  test('Executing first deployment', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/1')
    const shipitResult = await cli('shipit stage deploy', cwd)
    assert.strictEqual(shipitResult.code, 0, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    assert.deepStrictEqual(
      rootTree,
      rootTreeExpected,
      'should have created the correct folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    assert.strictEqual(
      releasesEntries.length,
      1,
      'should have one entry inside "releases"'
    )

    const [newRelease] = releasesEntries.sort(byDesc('name'))

    assert.ok(
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

    assert.strictEqual(
      testprojectEntries.find(nameIs('current')).target,
      `releases/${newRelease.name}`,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    assert.deepStrictEqual(
      newReleaseTree,
      releaseTreesExpected[0],
      'should have copied local folder "dist" to "current"'
    )

    previousReleases.push(newRelease)
  })

  test('Executing second deployment', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/2')
    const shipitResult = await cli('shipit stage deploy', cwd)
    assert.strictEqual(shipitResult.code, 0, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    assert.deepStrictEqual(
      rootTree,
      rootTreeExpected,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    assert.strictEqual(
      releasesEntries.length,
      2,
      'should have two entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    assert.ok(
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
    assert.deepStrictEqual(
      other.map((r) => r.name).sort(),
      previousReleases.map((r) => r.name).sort(),
      'should have kept old releases'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    assert.strictEqual(
      testprojectEntries.find(nameIs('current')).target,
      `releases/${newRelease.name}`,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    assert.deepStrictEqual(
      newReleaseTree,
      releaseTreesExpected[1],
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
      assert.deepStrictEqual(
        releaseTree,
        releaseTreesExpected[i],
        `should not have changed old release ${release.name}`
      )
    }

    previousReleases.push(newRelease)
  })

  test('Executing third deployment', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/3')
    const shipitResult = await cli('shipit stage deploy', cwd)
    assert.strictEqual(shipitResult.code, 0, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    assert.deepStrictEqual(
      rootTree,
      rootTreeExpected,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    assert.strictEqual(
      releasesEntries.length,
      3,
      'should have three entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    assert.ok(
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
    assert.deepStrictEqual(
      other.map((r) => r.name).sort(),
      previousReleases.map((r) => r.name).sort(),
      'should have kept old releases'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    assert.strictEqual(
      testprojectEntries.find(nameIs('current')).target,
      `releases/${newRelease.name}`,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    assert.deepStrictEqual(
      newReleaseTree,
      releaseTreesExpected[2],
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
      assert.deepStrictEqual(
        releaseTree,
        releaseTreesExpected[i],
        `should not have changed old release ${release.name}`
      )
    }

    previousReleases.push(newRelease)
  })

  test('Executing fourth deployment', async () => {
    const cwd = path.resolve(__dirname, 'fixtures/4')
    const shipitResult = await cli('shipit stage deploy', cwd)
    assert.strictEqual(shipitResult.code, 0, 'should return code 0')

    /**
     * check root
     */
    const rootTree = await getRemoteTree(remoteHost, '.', 2)
    assert.deepStrictEqual(
      rootTree,
      rootTreeExpected,
      'should not have changed folder structure'
    )

    /**
     * check releases
     */
    const releasesEntries = await getRemoteEntries(
      remoteHost,
      './testproject/releases'
    )

    assert.strictEqual(
      releasesEntries.length,
      3,
      'should still have three entries inside "releases"'
    )

    const [newRelease, ...other] = releasesEntries.sort(byDesc('name'))

    assert.ok(
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
    assert.deepStrictEqual(
      other.map((r) => r.name).sort(),
      previousReleases
        .map((r) => r.name)
        .sort()
        .slice(-2),
      'should have removed the oldest release'
    )

    /**
     * check current
     */
    const testprojectEntries = await getRemoteEntries(
      remoteHost,
      './testproject'
    )

    assert.strictEqual(
      testprojectEntries.find(nameIs('current')).target,
      `releases/${newRelease.name}`,
      'should link "current" to newest folder inside folder "releases"'
    )

    /**
     * check new release
     */
    const newReleaseTree = await getRemoteTree(
      remoteHost,
      `./testproject/releases/${newRelease.name}`
    )
    assert.deepStrictEqual(
      newReleaseTree,
      releaseTreesExpected[3],
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
      assert.deepStrictEqual(
        releaseTree,
        releaseTreesExpected[i],
        `should not have changed old release ${release.name}`
      )
    }
  })
})
