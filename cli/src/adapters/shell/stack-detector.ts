import type { ICommandRunner } from '../../ports/command-runner'
import type { DetectedStack } from '../../core/types'

const STEP_TIMEOUT_MS = 10_000

async function tryGet(runner: ICommandRunner, program: string, args: string[]): Promise<string | null> {
  try {
    const result = await runner.runCommand(program, args, STEP_TIMEOUT_MS)
    return result || null
  } catch {
    return null
  }
}

async function getDebianVersion(runner: ICommandRunner, pkg: string): Promise<string | null> {
  const raw = await tryGet(runner, 'dpkg-query', ['-W', '-f', '${Version}', pkg])
  if (raw && raw !== '<none>' && raw !== 'Version') return raw
  return null
}

export async function detectStack(runner: ICommandRunner): Promise<DetectedStack> {
  const stack: DetectedStack = {}

  const dockerV = await tryGet(runner, 'docker', ['--version'])
  if (dockerV) {
    stack.docker = true
    const m = dockerV.match(/Docker version ([\d.]+)/)
    if (m) stack.docker_version = m[1]
    const deb = await getDebianVersion(runner, 'docker.io')
    if (deb) { stack.docker_debian_version = deb } else { stack.docker_version_precision = 'major_only' }
  }

  const podmanV = await tryGet(runner, 'podman', ['--version'])
  if (podmanV) {
    stack.podman = true
  }

  const nodeV = await tryGet(runner, 'node', ['--version'])
  if (nodeV) {
    stack.nodejs = true
    stack.nodejs_version = nodeV.replace(/^v/, '')
  }

  const psqlV = await tryGet(runner, 'psql', ['--version'])
  if (psqlV) {
    stack.postgresql = true
    const m = psqlV.match(/([\d.]+)/)
    if (m) stack.postgresql_version = m[1]
    const deb = (await getDebianVersion(runner, 'postgresql'))
      || (await getDebianVersion(runner, 'postgresql-14'))
      || (await getDebianVersion(runner, 'postgresql-15'))
      || (await getDebianVersion(runner, 'postgresql-16'))
    if (deb) { stack.postgresql_debian_version = deb } else { stack.postgresql_version_precision = 'major_only' }
  }

  const redisV = await tryGet(runner, 'redis-cli', ['--version'])
  if (redisV) {
    stack.redis = true
    const m = redisV.match(/([\d.]+)/)
    if (m) stack.redis_version = m[1]
    const deb = await getDebianVersion(runner, 'redis-server')
    if (deb) { stack.redis_debian_version = deb } else { stack.redis_version_precision = 'major_only' }
  }

  const caddyV = await tryGet(runner, 'caddy', ['version'])
  if (caddyV) {
    stack.caddy = true
    const m = caddyV.match(/v([\d.]+)/)
    if (m) stack.caddy_version = m[1]
  }

  const nginxV = await tryGet(runner, 'nginx', ['-v'])
  if (nginxV) {
    stack.nginx = true
    const m = nginxV.match(/([\d.]+)/)
    if (m) stack.nginx_version = m[1]
  }

  const sshV = await tryGet(runner, 'ssh', ['-V'])
  if (sshV) {
    stack.openssh = true
    const m = sshV.match(/OpenSSH_([\w.p]+)/)
    if (m) stack.openssh_version = m[1]
    const deb = await getDebianVersion(runner, 'openssh-server')
    if (deb) { stack.openssh_debian_version = deb } else { stack.openssh_version_precision = 'major_only' }
  }

  return stack
}
