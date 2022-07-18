'use strict'

const { exec } = require('child_process')

// avoid problems converting strings/dates:
process.env.TZ = 'utc'

const remoteHost = 'www@shipit-deploy-cd-test.uscreen.me:2222'

const cli = (cmd, cwd, env, timeout) => {
  env = { ...process.env, ...env }

  return new Promise((resolve) => {
    exec(cmd, { cwd, env, timeout }, (error, stdout, stderr) => {
      resolve({
        code: error && error.code ? error.code : 0,
        error,
        stdout,
        stderr
      })
    })
  })
}

const ssh = (host, cmd, cwd, env, timeout) => {
  env = { ...process.env, ...env }
  return new Promise((resolve) => {
    const [dest, port = 22] = host.split(':')

    exec(
      `ssh ${dest} -p ${port} '${cmd}'`,
      { cwd, env, timeout },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr
        })
      }
    )
  })
}

const parseDirectoryPatternSegments = [
  '(?<type>[a-z-])[rwx-]{9}', // lrwxr-xr-x
  '\\d+', // file count
  '(\\d+|[a-z][a-z0-9_-]*)', // user id or name
  '(\\d+|[a-z][a-z0-9_-]*)', // group id or name
  '\\d+', // file size

  '(?<datetime>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2}.\\d+\\s\\+\\d{4})', // datetime

  '(?<name>[a-z0-9._]+(\\s->\\s.*)?)' // filename
]
const parseDirectoryPattern = new RegExp(
  `^${parseDirectoryPatternSegments.join('\\s+')}$`,
  'i'
)

const parseDirectoryLine = (str) => {
  const m = str.match(parseDirectoryPattern)

  if (!m) return null

  const type = m.groups.type === '-' ? 'f' : m.groups.type
  const [name, target] =
    m.groups.type === 'l' ? m.groups.name.split(/\s*->\s*/) : [m.groups.name]

  let ts = m.groups.datetime
  if (!ts.match(/\d{4}/)) ts = `${new Date().getFullYear()} ${ts}`
  ts = new Date(ts)

  const result = { type, name, ts }
  if (target) result.target = target

  return result
}

const parseDirectoryListing = (str) => {
  const lines = str.split('\n')

  const ms = lines.map(parseDirectoryLine).filter(Boolean)
  return ms
}

const directoryNameToDatePattern =
  /^(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})(?<hours>\d{2})(?<minutes>\d{2})(?<seconds>\d{2}$)/

const directoryNameToDate = (str) => {
  const m = str.match(directoryNameToDatePattern)
  if (!m) return null

  const g = m.groups

  // set seconds to 0 to make Date comparable to directory entry's timestamp:
  return new Date(
    `${g.year}-${g.month}-${g.day}T${g.hours}:${g.minutes}:${g.seconds}Z`
  )
}

const nearlyEqual = (d1, d2, epsilon) => {
  return Math.abs(d1 - d2) < epsilon
}

const nameIs = (v) => (e) => e.name === v
const typeIs = (v) => (e) => e.type === v
const targetIs = (v) => (e) => e.target === v
const byAsc = (v) => (e, f) => e[v] > f[v] ? 1 : e[v] < f[v] ? -1 : 0
const byDesc = (v) => (e, f) => e[v] < f[v] ? 1 : e[v] > f[v] ? -1 : 0

const resetRemoteFiles = async (host) => ssh(host, 'rm -rf ./testproject')

const getRemoteEntries = async (host, path) => {
  const result = await ssh(host, `cd ${path} && ls -l --time-style=full-iso`)
  return parseDirectoryListing(result.stdout)
}

const _filterProps = (depth, properties) => {
  if (properties.length === 0) return (o) => o

  return (o) => {
    const r = {}
    if (depth > 1 && o.entries) r.entries = o.entries
    for (const p of properties) r[p] = o[p]

    return r
  }
}

const getRemoteTree = async (
  host,
  path,
  depth = Infinity,
  properties = ['type', 'name']
) => {
  if (depth === 0) return []

  const filterProps = _filterProps(depth, properties)

  const entries = await getRemoteEntries(host, path)

  const dirEntries = entries.filter(typeIs('d'))
  for (const dir of dirEntries) {
    dir.entries = await getRemoteTree(
      host,
      `${path}/${dir.name}`,
      depth - 1,
      properties
    )
  }

  return entries.sort(byAsc('name')).map(filterProps)
}

module.exports = {
  remoteHost,
  cli,
  directoryNameToDate,
  nearlyEqual,
  resetRemoteFiles,
  getRemoteEntries,
  getRemoteTree,
  nameIs,
  typeIs,
  targetIs,
  byAsc,
  byDesc
}
