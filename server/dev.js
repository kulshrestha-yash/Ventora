import { spawn } from 'node:child_process'

const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' })
]

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  children.forEach(child => child.kill())
}

children.forEach(child => {
  child.once('error', error => {
    console.error('Could not start a development server:', error.message)
    stop(1)
  })
  child.once('exit', code => {
    if (!stopping) stop(code || 0)
  })
})

process.once('SIGINT', () => stop())
process.once('SIGTERM', () => stop())
