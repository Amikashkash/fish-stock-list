#!/usr/bin/env node

/**
 * Version Bump Script
 * Updates version across all project files
 *
 * Usage:
 *   npm run version:patch  (1.0.0 -> 1.0.1)
 *   npm run version:minor  (1.0.0 -> 1.1.0)
 *   npm run version:major  (1.0.0 -> 2.0.0)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.join(__dirname, '..')

// Get bump type from command line
const bumpType = process.argv[2] || 'patch'

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: major, minor, or patch')
  process.exit(1)
}

// Read current version from package.json
const packageJsonPath = path.join(rootDir, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const currentVersion = packageJson.version

// Parse version
const [major, minor, patch] = currentVersion.split('.').map(Number)

// Calculate new version
let newVersion
switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`
    break
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`
    break
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`
    break
}

console.log(`\n📦 Bumping version: ${currentVersion} → ${newVersion}\n`)

// Update package.json
packageJson.version = newVersion
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
console.log('✅ Updated package.json')

// Update src/version.js
const versionJsPath = path.join(rootDir, 'src', 'version.js')
const today = new Date().toISOString().split('T')[0]
const releaseNames = {
  major: 'Major Release',
  minor: 'Feature Release',
  patch: 'Bugfix Release'
}

const versionJsContent = `/**
 * Version information
 * Update this file before each release
 */

export const VERSION = '${newVersion}'
export const RELEASE_DATE = '${today}'
export const RELEASE_NAME = '${releaseNames[bumpType]}'
`

fs.writeFileSync(versionJsPath, versionJsContent)
console.log('✅ Updated src/version.js')

// Prompt for CHANGELOG.md update
console.log('\n⚠️  Don\'t forget to update CHANGELOG.md!')
console.log(`   Add entry for version ${newVersion} with changes\n`)

// Summary
console.log('📋 Summary:')
console.log(`   Version: ${currentVersion} → ${newVersion}`)
console.log(`   Type: ${bumpType}`)
console.log(`   Date: ${today}`)
console.log('\n✨ Done! Next steps:')
console.log('   1. Update CHANGELOG.md')
console.log('   2. git add -A')
console.log(`   3. git commit -m "chore: Bump version to ${newVersion}"`)
console.log(`   4. git tag -a v${newVersion} -m "Release v${newVersion}"`)
console.log('   5. git push && git push --tags\n')
