import type { CommandSpec } from './types'

const ALLOWED_PROGRAMS = new Set([
  'cat', 'grep', 'awk', 'sed', 'head', 'tail', 'wc', 'sort', 'uniq', 'cut', 'tr',
  'sshd', 'systemctl', 'journalctl', 'service',
  'ufw', 'iptables', 'ip6tables', 'fail2ban-client',
  'ss', 'netstat', 'ip', 'ifconfig', 'lsof', 'curl', 'wget',
  'docker', 'podman',
  'apt-get', 'dpkg-query', 'dpkg', 'apt', 'yum', 'rpm', 'dnf',
  'find', 'stat', 'ls', 'test', 'file', 'readlink', '[',
  'redis-cli', 'psql', 'mysql', 'mongosh',
  'nginx', 'caddy', 'apache2ctl', 'httpd',
  'echo', 'printf', 'true', 'false',
  'hostname', 'uname', 'uptime', 'free', 'df', 'du',
  'id', 'whoami', 'groups', 'date', 'timedatectl',
  'sysctl', 'lsb_release', 'hostnamectl',
  'openssl', 'git', 'crontab',
  'which', 'lastb', 'certbot', 'swapon', 'ps',
  'sudo',
])

export function isProgramAllowed(program: string): boolean {
  const name = program.replace(/^.*\//, '')
  return ALLOWED_PROGRAMS.has(name)
}

function hasBlockedArgs(program: string, args: string[]): boolean {
  const name = program.replace(/^.*\//, '')

  if (name === 'curl') {
    for (let i = 0; i < args.length; i++) {
      const a = args[i]
      if (/^-[a-zA-Z]*[dFT]/.test(a)) return true
      if (/^--(data|data-binary|data-urlencode|data-raw|upload-file|form)/.test(a)) return true
      if ((a === '-X' || a === '--request') && i + 1 < args.length) {
        if (/^(POST|PUT|PATCH|DELETE)$/i.test(args[i + 1])) return true
      }
    }
    const allowedHosts = ['ifconfig.me', 'api.ipify.org', 'icanhazip.com', 'checkip.amazonaws.com']
    const urls = args.filter(a => /^https?:\/\//.test(a))
    for (const url of urls) {
      try {
        const host = new URL(url).hostname
        if (!allowedHosts.includes(host)) return true
      } catch { return true }
    }
  }

  if (name === 'wget') {
    if (args.some(a => /^--(post-data|post-file|method=POST)/i.test(a))) return true
  }

  if (name === 'systemctl') {
    if (args.some(a => /^(start|stop|restart|enable|disable)$/.test(a))) return true
  }

  if (name === 'apt-get' || name === 'apt') {
    if (args.some(a => /^(install|remove|purge)$/.test(a))) return true
  }

  if (name === 'yum' || name === 'dnf') {
    if (args.some(a => /^(install|remove|erase)$/.test(a))) return true
  }

  if (name === 'git') {
    const allowed = ['ls-files', '--version', 'log', 'status', 'config']
    if (!args.some(a => allowed.includes(a))) return true
    if (args.some(a => /^(clone|pull|push|fetch|apply|hook|remote|submodule)$/.test(a))) return true
  }

  if (name === 'openssl') {
    const allowed = ['x509', 'version']
    if (!args.some(a => allowed.includes(a))) return true
    if (args.some(a => /^(s_client|s_server|req|genrsa|genpkey|enc|ca)$/.test(a))) return true
  }

  if (name === 'sudo') {
    if (!args.includes('-n')) return true
    const subProgram = args.find(a => !a.startsWith('-'))
    if (!subProgram || !ALLOWED_PROGRAMS.has(subProgram.replace(/^.*\//, ''))) return true
  }

  if (name === 'find') {
    if (args.includes('-delete')) return true
    for (let i = 0; i < args.length; i++) {
      if ((args[i] === '-exec' || args[i] === '-execdir') && i + 1 < args.length) {
        const execProg = args[i + 1].replace(/^.*\//, '')
        if (!ALLOWED_PROGRAMS.has(execProg)) return true
      }
    }
  }

  return false
}

export function isPipelineCommandAllowed(cmd: CommandSpec): boolean {
  if (!isProgramAllowed(cmd.program)) return false
  if (hasBlockedArgs(cmd.program, cmd.args)) return false
  return true
}
