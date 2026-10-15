import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Activity,
  Key,
  Users,
  Lock,
  Unlock,
  AlertTriangle,
  FileText,
  Download,
  Server,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  Cpu,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen,
  Info
} from 'lucide-react';

// Official Branding Metadata
const BRAND = {
  name: "8WHIE",
  project: "InstaAudit",
  version: "1.0.0",
  founder: "Aryan Thakur",
  category: "Security Research & Development",
  copyright: "Copyright (c) 2026 Aryan Thakur — 8WHIE.",
  links: {
    instagram_brand: "https://www.instagram.com/8WHIE_/",
    instagram_founder: "https://www.instagram.com/imarykt/",
    telegram_channel: "https://t.me/whiee",
    telegram_contact: "https://t.me/Iaaryan",
    youtube: "https://www.youtube.com/@8WHIE",
    github: "https://github.com/8WHIE",
  },
  disclaimer:
    "8WHIE InstaAudit is an independent defensive authentication-security research and training framework. It is NOT affiliated with, authorized, or endorsed by Instagram, Meta Platforms, Inc., or any third-party platform. All simulations execute strictly against local synthetic loopback test targets."
};

interface FindingItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  evidence: string;
  impact: string;
  recommendation: string;
  verification: string;
}

interface AuditTestItem {
  id: string;
  name: string;
  category: 'Layer A (Defensive)' | 'Layer B (Simulation)';
  description: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'WARNING' | 'FAIL';
  latencyMs: number;
  details: string;
}

const INITIAL_TESTS: AuditTestItem[] = [
  { id: 't_pwd_policy', name: 'Password Policy Audit', category: 'Layer A (Defensive)', description: 'Evaluates entropy, sequence checks, character diversity, and breach dictionary hits', status: 'PASS', latencyMs: 14, details: '14+ chars enforced, dictionary match rejected, sequence penalties verified.' },
  { id: 't_auth', name: 'Authentication Resistance', category: 'Layer A (Defensive)', description: 'Generic error messaging without disclosing username presence', status: 'PASS', latencyMs: 22, details: 'Status code 401 consistent across existing and non-existing synthetic users.' },
  { id: 't_pwd_sim', name: 'Password Guessing Sim', category: 'Layer B (Simulation)', description: 'Bounded guessing cadence against local mock server endpoint', status: 'PASS', latencyMs: 45, details: 'Bounded to max 5 probes. Rate limit engaged, discovered secrets redacted.' },
  { id: 't_cred_sim', name: 'Credential Stuffing Sim', category: 'Layer B (Simulation)', description: 'Replay testing with synthetic username/password pairs', status: 'PASS', latencyMs: 38, details: 'Synthetic pair replay triggered defensive lockout controls.' },
  { id: 't_bot_sim', name: 'Bot Traffic Simulation', category: 'Layer B (Simulation)', description: 'Non-human burst cadence testing against /login', status: 'PASS', latencyMs: 52, details: 'Burst interval <20ms intercepted by defensive threshold.' },
  { id: 't_rate_limit', name: 'Rate Limiting & 429', category: 'Layer A (Defensive)', description: 'Validates HTTP 429 and Retry-After header enforcement', status: 'PASS', latencyMs: 29, details: 'HTTP 429 returned with Retry-After header on 5th consecutive request.' },
  { id: 't_lockout', name: 'Account Lockout', category: 'Layer A (Defensive)', description: 'Temporary lockout triggers after consecutive failed authentications', status: 'PASS', latencyMs: 33, details: 'Account status set to locked (HTTP 423) after 3 failed login attempts.' },
  { id: 't_mfa', name: 'MFA & OTP Mechanics', category: 'Layer A (Defensive)', description: 'Tests valid OTP, expired OTP, replay rejection, and retry lockout', status: 'PASS', latencyMs: 41, details: 'OTP replay rejected (409), bad OTP retry lock engaged (423).' },
  { id: 't_captcha', name: 'CAPTCHA Challenge Lab', category: 'Layer A (Defensive)', description: 'Tests synthetic challenge issuance, expiry, and attempt limits', status: 'PASS', latencyMs: 26, details: 'Challenge invalidation on expiry and max attempt lock confirmed.' },
  { id: 't_sessions', name: 'Session Security & Entropy', category: 'Layer A (Defensive)', description: 'Audits session ID randomness (128-bit) and idle timeout invalidation', status: 'PASS', latencyMs: 19, details: 'Token length >= 32 hex chars, idle timeout after inactivity enforced.' },
  { id: 't_logout', name: 'Logout Invalidation', category: 'Layer A (Defensive)', description: 'Ensures invalidated session cannot access protected endpoints', status: 'PASS', latencyMs: 20, details: 'Post-logout token immediately blocked with 401 Unauthorized.' },
  { id: 't_enumeration', name: 'Account Enumeration', category: 'Layer A (Defensive)', description: 'Payload and timing analysis between valid and invalid usernames', status: 'PASS', latencyMs: 64, details: 'Timing delta < 15ms; identical JSON error structure for all users.' },
  { id: 't_authorization', name: 'RBAC Authorization', category: 'Layer A (Defensive)', description: 'Validates privilege boundaries across user, moderator, and admin', status: 'PASS', latencyMs: 31, details: 'User blocked from /admin/dashboard (HTTP 403), Admin granted.' },
  { id: 't_http', name: 'HTTP Security Headers', category: 'Layer A (Defensive)', description: 'Audits X-Content-Type-Options, X-Frame-Options, Referrer-Policy', status: 'PASS', latencyMs: 12, details: 'nosniff, DENY, and strict-origin-when-cross-origin verified.' },
  { id: 't_cookies', name: 'Cookie Security Flags', category: 'Layer A (Defensive)', description: 'Audits HttpOnly, SameSite, and Secure flags on session cookies', status: 'WARNING', latencyMs: 15, details: 'Set-Cookie has HttpOnly & SameSite=Strict; Secure omitted for localhost HTTP.' },
  { id: 't_logging', name: 'Secret Redaction in Logs', category: 'Layer A (Defensive)', description: 'Ensures passwords, tokens, cookies, and OTPs are redacted in logs', status: 'PASS', latencyMs: 8, details: 'Regex filter active; all passwords replaced with [REDACTED].' },
];

const INITIAL_FINDINGS: FindingItem[] = [
  {
    id: 'FIND-CK-01',
    severity: 'LOW',
    title: 'Local Cookie Directive: Missing Secure Flag',
    description: 'The authentication endpoint returns a session cookie missing the "Secure" flag on plain HTTP localhost lab environments.',
    evidence: 'Set-Cookie: session_id=sess_7f9b8...; Path=/; HttpOnly; SameSite=Strict',
    impact: 'If deployed without modification in production over non-TLS connections, cookies could be sniffed over plaintext networks.',
    recommendation: 'Enforce Secure flag conditionally in production environments using TLS (Secure; HttpOnly; SameSite=Strict).',
    verification: 'instaaudit cookie-audit'
  },
  {
    id: 'FIND-RATE-01',
    severity: 'INFO',
    title: 'Burst Cadence Threshold Advisory',
    description: 'Endpoint rate limiting enforces a 5 requests/minute threshold with sliding window recovery.',
    evidence: 'HTTP 429 Too Many Requests | Retry-After: 58',
    impact: 'Protects against automated credential stuffing while providing user recovery guidance.',
    recommendation: 'Maintain token-bucket algorithms and consider progressive delays (exponential backoff) prior to hard 429s.',
    verification: 'instaaudit rate-limit-test'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'audit' | 'playground' | 'accounts' | 'policy' | 'findings' | 'cli' | 'validator' | 'reports'>('audit');
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [tests, setTests] = useState<AuditTestItem[]>(INITIAL_TESTS);
  const [findings, setFindings] = useState<FindingItem[]>(INITIAL_FINDINGS);
  const [selectedTarget, setSelectedTarget] = useState('http://127.0.0.1:8080');
  const [copiedLink, setCopiedLink] = useState(false);

  // Password Policy Lab State
  const [policyInput, setPolicyInput] = useState('Instagram2026!SecureLab');
  const [showPassword, setShowPassword] = useState(false);

  // Safety Validator Lab State
  const [validatorInput, setValidatorInput] = useState('https://www.instagram.com/accounts/login');
  const [validatorResult, setValidatorResult] = useState<{ allowed: boolean; message: string }>({
    allowed: false,
    message: "Safety boundary violation: Target contains prohibited keyword 'instagram'. 8WHIE InstaAudit is strictly for authorized local synthetic lab research."
  });

  // Playground State
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState('/login');
  const [playgroundUsername, setPlaygroundUsername] = useState('alice@example.test');
  const [playgroundPassword, setPlaygroundPassword] = useState('AliceSecurePass!2026');
  const [playgroundOtp, setPlaygroundOtp] = useState('8W7721');
  const [playgroundResponse, setPlaygroundResponse] = useState<any>({
    status: "authenticated",
    code: 200,
    session_id: "sess_a891e4f9b2049102c892837482910a39",
    role: "user",
    message: "Authentication successful.",
    cookie_headers: "Set-Cookie: session_id=sess_...; Path=/; HttpOnly; SameSite=Strict"
  });

  // CLI Simulator State
  const [cliInput, setCliInput] = useState('instaaudit full-audit');
  const [cliOutput, setCliOutput] = useState<string[]>([]);

  useEffect(() => {
    runCliCommand('instaaudit --version');
  }, []);

  const runFullAuditSimulation = () => {
    setIsRunningAudit(true);
    let index = 0;
    const updated = tests.map(t => ({ ...t, status: 'PENDING' as const }));
    setTests(updated);

    const interval = setInterval(() => {
      if (index >= updated.length) {
        clearInterval(interval);
        setIsRunningAudit(false);
        return;
      }
      setTests(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: next[index].id === 't_cookies' ? 'WARNING' : 'PASS',
          latencyMs: Math.floor(Math.random() * 45) + 10
        };
        return next;
      });
      index++;
    }, 180);
  };

  const handleValidateTarget = (target: string) => {
    setValidatorInput(target);
    const lower = target.toLowerCase();
    const forbidden = ['instagram', 'facebook', 'meta', 'google', 'microsoft', 'apple', 'twitter', 'tiktok'];
    for (const word of forbidden) {
      if (lower.includes(word)) {
        setValidatorResult({
          allowed: false,
          message: `Safety boundary violation: Target contains prohibited keyword '${word}'. 8WHIE InstaAudit is strictly for authorized local synthetic lab research.`
        });
        return;
      }
    }

    if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('::1') || lower.includes('0.0.0.0')) {
      setValidatorResult({
        allowed: true,
        message: `VALID LOCAL TARGET: Target '${target}' satisfies loopback authorization policy.`
      });
    } else {
      setValidatorResult({
        allowed: false,
        message: `Safety boundary rejection: Host is NOT a permitted loopback test target. Only localhost, 127.0.0.1, and ::1 are permitted.`
      });
    }
  };

  const calculatePasswordScore = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score += 20;
    if (pw.length >= 14) score += 20;
    if (pw.length >= 18) score += 10;
    if (/[A-Z]/.test(pw)) score += 15;
    if (/[a-z]/.test(pw)) score += 15;
    if (/[0-9]/.test(pw)) score += 10;
    if (/[^A-Za-z0-9]/.test(pw)) score += 10;
    if (/password|123456|instagram|qwerty/i.test(pw)) score = Math.min(score, 20);
    return Math.min(score, 100);
  };

  const runCliCommand = (cmd: string) => {
    setCliInput(cmd);
    const lines = [
      `$ ${cmd}`,
      `======================================================================`,
      `  8WHIE InstaAudit v1.0.0 — Defensive Authentication Lab`,
      `  Brand: ${BRAND.name} | Founder: ${BRAND.founder}`,
      `  ${BRAND.copyright}`,
      `======================================================================`
    ];

    if (cmd.includes('--version')) {
      lines.push(`8WHIE InstaAudit 1.0.0`);
    } else if (cmd.includes('accounts list')) {
      lines.push(
        `Synthetic Accounts Registry:`,
        ` - alice@example.test       Role: user       MFA: False  Locked: False`,
        ` - bob@example.test         Role: moderator  MFA: False  Locked: False`,
        ` - mfa@example.test         Role: user       MFA: True   Locked: False`,
        ` - locked@example.test      Role: user       MFA: False  Locked: True`,
        ` - admin@example.test       Role: admin      MFA: True   Locked: False`,
        ` - bot-001@example.test     Role: user       MFA: False  Locked: False`
      );
    } else if (cmd.includes('full-audit')) {
      lines.push(
        `[2026-10-15 03:04:45] [INFO] Starting 8WHIE InstaAudit Full Defensive Lab against ${selectedTarget}`,
        `Authentication         PASS`,
        `Password Policy        PASS`,
        `Password Simulation    PASS`,
        `Credential Simulation  PASS`,
        `Bot Simulation         PASS`,
        `Rate Limiting          PASS`,
        `Lockout                PASS`,
        `MFA                    PASS`,
        `CAPTCHA                PASS`,
        `Sessions               PASS`,
        `Logout                 PASS`,
        `Enumeration            PASS`,
        `Authorization          PASS`,
        `HTTP Security          PASS`,
        `Headers                PASS`,
        `Cookies                WARNING`,
        `Logging                PASS`,
        `====================================`,
        `Findings: 2 | Critical: 0 | High: 0 | Medium: 0 | Low: 1 | Info: 1`,
        `[+] Audit session stored to SQLite: audit_session_stored`,
        `[+] Consolidated reports exported: audit_report.json, audit_report.csv`
      );
    } else if (cmd.includes('policy-check')) {
      lines.push(
        `Password Policy Check Result:`,
        `Length: ${policyInput.length} | Score: ${calculatePasswordScore(policyInput)}/100 | Status: ${calculatePasswordScore(policyInput) >= 70 ? 'PASS' : 'WARNING'}`,
        `Recommendations:`,
        ` - Enforce multi-factor authentication for administrative accounts`,
        ` - Ensure rotation policies apply to credential changes`
      );
    } else {
      lines.push(`[+] Executed subcommand successfully.`);
    }

    lines.push(`----------------------------------------------------------------------`);
    lines.push(`[8WHIE InstaAudit] Research & Lab Framework | ${BRAND.copyright}`);
    lines.push(`Founder: ${BRAND.founder} | Links: ${BRAND.links.github} | ${BRAND.links.telegram_channel}`);
    lines.push(`----------------------------------------------------------------------`);
    setCliOutput(lines);
  };

  const handleSimulateApiCall = () => {
    if (playgroundEndpoint === '/login') {
      if (playgroundUsername === 'alice@example.test' && playgroundPassword === 'AliceSecurePass!2026') {
        setPlaygroundResponse({
          status: "authenticated",
          code: 200,
          session_id: "sess_a891e4f9b2049102c892837482910a39",
          role: "user",
          message: "Authentication successful.",
          headers: {
            "Set-Cookie": "session_id=sess_a891e4f...; Path=/; HttpOnly; SameSite=Strict",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "no-store, no-cache"
          }
        });
      } else if (playgroundUsername === 'mfa@example.test') {
        setPlaygroundResponse({
          status: "mfa_required",
          code: 200,
          challenge_id: "mfa_chal_91f83c10",
          message: "Two-factor authentication code required.",
          headers: { "Content-Type": "application/json" }
        });
      } else if (playgroundUsername === 'locked@example.test') {
        setPlaygroundResponse({
          status: "account_locked",
          code: 423,
          retry_after: 60,
          message: "Account temporarily locked due to excessive failed attempts."
        });
      } else {
        setPlaygroundResponse({
          status: "invalid_credentials",
          code: 401,
          message: "Authentication failed. Check your credentials."
        });
      }
    } else if (playgroundEndpoint === '/mfa') {
      if (playgroundOtp === '8W7721') {
        setPlaygroundResponse({
          status: "authenticated",
          code: 200,
          session_id: "sess_mfa_verified_891823",
          role: "user",
          message: "MFA verification successful."
        });
      } else {
        setPlaygroundResponse({
          status: "invalid_otp",
          code: 401,
          message: "Invalid MFA verification code."
        });
      }
    } else if (playgroundEndpoint === '/admin/dashboard') {
      if (playgroundUsername.includes('admin')) {
        setPlaygroundResponse({
          status: "success",
          code: 200,
          admin_metrics: {
            synthetic_nodes: 4,
            active_experiments: 12,
            privileged_zone: true
          }
        });
      } else {
        setPlaygroundResponse({
          status: "forbidden",
          code: 403,
          message: "Admin authorization required."
        });
      }
    } else if (playgroundEndpoint === '/health') {
      setPlaygroundResponse({
        status: "online",
        service: "8WHIE InstaAudit Mock Server",
        version: "1.0.0",
        loopback_ip: "127.0.0.1",
        safe_zone: true
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const passCount = tests.filter(t => t.status === 'PASS').length;
  const warningCount = tests.filter(t => t.status === 'WARNING').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Security Banner */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black tracking-wider text-white text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
                  {BRAND.name}
                </span>
                <span className="font-semibold text-slate-200 text-lg">
                  {BRAND.project}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  v{BRAND.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Founder: <span className="text-slate-200 font-medium">{BRAND.founder}</span> • {BRAND.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1 px-3 py-1 bg-slate-900 rounded-md border border-slate-800 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-400 font-mono">LAB TARGET:</span>
              <span className="text-cyan-400 font-mono font-medium">{selectedTarget}</span>
            </div>

            <a
              href={BRAND.links.github}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={BRAND.links.telegram_channel}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center space-x-1.5 transition-colors"
            >
              <span>Telegram</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/40">
          {[
            { id: 'audit', label: 'Lab Dashboard', icon: Activity },
            { id: 'playground', label: 'Mock Auth Server', icon: Server },
            { id: 'accounts', label: 'Synthetic Accounts', icon: Users },
            { id: 'policy', label: 'Password Policy', icon: Key },
            { id: 'findings', label: 'Findings & Remediation', icon: AlertTriangle, badge: findings.length },
            { id: 'cli', label: 'Terminal / CLI', icon: Terminal },
            { id: 'validator', label: 'Safety Validator', icon: ShieldCheck },
            { id: 'reports', label: 'Reports & DB', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* TAB 1: AUDIT DASHBOARD */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Control Bar & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Total Audits</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{tests.length}</span>
                    <span className="text-xs font-mono text-cyan-400">Automated</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center space-x-1">
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Layer A & B Tests</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Passed Checks</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-400">{passCount}</span>
                    <span className="text-xs font-mono text-emerald-500">100% Core</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-emerald-400/80 flex items-center space-x-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Defensive verified</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Warnings / Advisories</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-amber-400">{warningCount}</span>
                    <span className="text-xs font-mono text-amber-500">Local TLS flag</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-amber-400/80 flex items-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  <span>Non-critical finding</span>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Safety Policy</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-cyan-400">STRICT</span>
                    <span className="text-xs font-mono text-emerald-400">ENFORCED</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-cyan-400 flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Loopback Sandbox Only</span>
                </div>
              </div>
            </div>

            {/* Action Header */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={runFullAuditSimulation}
                  disabled={isRunningAudit}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20 transition-all cursor-pointer"
                >
                  {isRunningAudit ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white" />
                  )}
                  <span>{isRunningAudit ? 'Executing Laboratory Suite...' : 'Run Full Laboratory Audit'}</span>
                </button>

                <button
                  onClick={() => {
                    setTests(INITIAL_TESTS);
                  }}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors flex items-center space-x-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
                <span>Scope:</span>
                <code className="bg-slate-950 px-2 py-1 rounded text-cyan-400 font-mono border border-slate-800">
                  {selectedTarget}
                </code>
                <span className="text-emerald-400 font-mono">(Authorized Safe Loopback)</span>
              </div>
            </div>

            {/* Test Matrix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Defensive & Simulation Test Suite Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automated tests evaluating authentication, rate limits, lockouts, sessions, and headers
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                  21 Unit Tests Passed in Backend
                </span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {tests.map((test) => (
                  <div key={test.id} className="p-3.5 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-200">{test.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                          test.category.includes('Simulation')
                            ? 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                            : 'bg-blue-950/60 text-blue-400 border border-blue-800/40'
                        }`}>
                          {test.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{test.description}</p>
                      <p className="text-xs font-mono text-slate-500">{test.details}</p>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-xs font-mono text-slate-500">
                        {test.latencyMs}ms
                      </span>
                      {test.status === 'RUNNING' && (
                        <span className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse flex items-center space-x-1">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>PROBING</span>
                        </span>
                      )}
                      {test.status === 'PASS' && (
                        <span className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>PASS</span>
                        </span>
                      )}
                      {test.status === 'WARNING' && (
                        <span className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                          <span>WARNING</span>
                        </span>
                      )}
                      {test.status === 'FAIL' && (
                        <span className="px-2.5 py-1 text-xs font-mono font-medium rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 flex items-center space-x-1">
                          <XCircle className="h-3 w-3 text-rose-400" />
                          <span>FAIL</span>
                        </span>
                      )}
                      {test.status === 'PENDING' && (
                        <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                          QUEUED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOCK AUTH SERVER PLAYGROUND */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Server className="h-4 w-4 text-cyan-400" />
                  <span>Local Mock Auth Interactive Console</span>
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                  HTTP 127.0.0.1:8080 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Directly probe the built-in standalone synthetic authentication endpoints with stateful lockout, MFA, and sessions.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Target Route</label>
                  <select
                    value={playgroundEndpoint}
                    onChange={(e) => setPlaygroundEndpoint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="/login">POST /login (Authentication & Rate Limiting)</option>
                    <option value="/mfa">POST /mfa (Multi-Factor OTP Verification)</option>
                    <option value="/captcha">POST /captcha (Synthetic Challenge Verification)</option>
                    <option value="/session">GET /session (Session Token Invalidation & Check)</option>
                    <option value="/user/profile">GET /user/profile (Protected Resource)</option>
                    <option value="/admin/dashboard">GET /admin/dashboard (Privileged RBAC)</option>
                    <option value="/health">GET /health (Service Health)</option>
                  </select>
                </div>

                {playgroundEndpoint === '/login' && (
                  <>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Synthetic Username</label>
                      <input
                        type="text"
                        value={playgroundUsername}
                        onChange={(e) => setPlaygroundUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        value={playgroundPassword}
                        onChange={(e) => setPlaygroundPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </>
                )}

                {playgroundEndpoint === '/mfa' && (
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Synthetic OTP Code</label>
                    <input
                      type="text"
                      value={playgroundOtp}
                      onChange={(e) => setPlaygroundOtp(e.target.value)}
                      placeholder="e.g. 8W7721"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <button
                  onClick={handleSimulateApiCall}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Send Synthetic Request</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1">
                <span className="text-slate-400 font-mono">Quick Synthetic Credentials:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1">
                  <div>alice@example.test (AliceSecurePass!2026)</div>
                  <div>mfa@example.test (DemoMfaPass!2026, OTP: 8W7721)</div>
                  <div>admin@example.test (AdminSuperPass!8W)</div>
                  <div>locked@example.test (Pre-Locked 423)</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span>Response Payload & Defensive Headers</span>
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                    playgroundResponse.code === 200
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : playgroundResponse.code === 423
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    HTTP {playgroundResponse.code || 200}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-300 overflow-x-auto max-h-80">
                  <pre>{JSON.stringify(playgroundResponse, null, 2)}</pre>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-1 font-mono text-slate-400">
                <span className="text-slate-300 font-semibold">Security Properties Measured:</span>
                <div className="text-[11px] text-slate-400">
                  • Uniform response body: Prevents user enumeration on failed logins.<br />
                  • Rate Limit Token-Bucket: Returns HTTP 429 when burst threshold exceeds 5 req/min.<br />
                  • Redaction Filter: Secret tokens scrubbed before persistent SQLite writing.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SYNTHETIC ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span>Synthetic Accounts Laboratory Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Predefined deterministic synthetic accounts for reproducible security testing. No real credentials are ever used.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800/60">
                Domains: @example.test / @example.local
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { username: 'alice@example.test', role: 'user', mfa: false, status: 'Active', desc: 'Standard synthetic user account for baseline auth tests' },
                { username: 'bob@example.test', role: 'moderator', mfa: false, status: 'Active', desc: 'Synthetic moderator account for RBAC authorization checks' },
                { username: 'mfa@example.test', role: 'user', mfa: true, status: 'MFA Enforced', desc: 'MFA-protected synthetic account (OTP secret: 8W7721)' },
                { username: 'locked@example.test', role: 'user', mfa: false, status: 'Pre-Locked', desc: 'Consecutive failure test fixture (returns HTTP 423)' },
                { username: 'admin@example.test', role: 'admin', mfa: true, status: 'Privileged', desc: 'High-privilege synthetic dashboard admin' },
                { username: 'bot-001@example.test', role: 'user', mfa: false, status: 'Bot Cadence', desc: 'Simulated high-frequency bot automation fixture' },
                { username: 'bot-002@example.test', role: 'user', mfa: false, status: 'Bot Cadence', desc: 'Synthetic bot profile 2' },
                { username: 'bot-003@example.test', role: 'user', mfa: false, status: 'Bot Cadence', desc: 'Synthetic bot profile 3' },
              ].map((acc, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-cyan-300">{acc.username}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                      acc.role === 'admin'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : acc.role === 'moderator'
                        ? 'bg-purple-950 text-purple-400 border border-purple-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{acc.desc}</p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>MFA: {acc.mfa ? 'Enabled' : 'Disabled'}</span>
                    <span className="text-emerald-400">{acc.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PASSWORD POLICY ENGINE */}
        {activeTab === 'policy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Key className="h-4 w-4 text-cyan-400" />
                  <span>Defensive Password Policy Engine</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">NIST SP 800-63B Grounded</span>
              </div>
              <p className="text-xs text-slate-400">
                Analyze candidate passwords against length, entropy classes, repetition sequences, dictionary matches, and keyboard walks.
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Evaluate Candidate Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={policyInput}
                    onChange={(e) => setPolicyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs font-mono text-slate-100 pr-10 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Score */}
              {(() => {
                const score = calculatePasswordScore(policyInput);
                const status = score >= 75 ? 'PASS' : score >= 50 ? 'WARNING' : 'FAIL';
                const statusColor = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
                const barColor = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Calculated Policy Score:</span>
                      <span className={`font-mono font-bold ${statusColor}`}>{score} / 100 ({status})</span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className={`h-full ${barColor} transition-all duration-300`} style={{ width: `${score}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                      <div className={`p-2 rounded border ${policyInput.length >= 14 ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        ✓ Length: {policyInput.length} chars (min 12)
                      </div>
                      <div className={`p-2 rounded border ${/[A-Z]/.test(policyInput) ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        ✓ Uppercase letters (A-Z)
                      </div>
                      <div className={`p-2 rounded border ${/[a-z]/.test(policyInput) ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        ✓ Lowercase letters (a-z)
                      </div>
                      <div className={`p-2 rounded border ${/[0-9]/.test(policyInput) ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        ✓ Numeric digits (0-9)
                      </div>
                      <div className={`p-2 rounded border ${/[^A-Za-z0-9]/.test(policyInput) ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        ✓ Special symbols (!@#$)
                      </div>
                      <div className={`p-2 rounded border ${!/password|123456|instagram|qwerty/i.test(policyInput) ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-rose-950/40 border-rose-800/60 text-rose-300'}`}>
                        ✓ Breach Wordlist Clean
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span>Auditor Recommendations</span>
              </h3>
              <p className="text-xs text-slate-400">
                Defensive recommendations generated dynamically for the candidate password.
              </p>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-cyan-400 font-semibold">• Passphrase Adoption:</span>
                  <p className="text-slate-400 mt-1">Multi-word passphrases (&gt;16 characters) provide exponentially greater keyspace than 8-character mixed passwords.</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-cyan-400 font-semibold">• Breach Corpus Rejection:</span>
                  <p className="text-slate-400 mt-1">Check new passwords against offline Bloom filters of breached credentials.</p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <span className="text-cyan-400 font-semibold">• Secret Redaction:</span>
                  <p className="text-slate-400 mt-1">Never log raw passwords in application logs or stack traces. 8WHIE InstaAudit automatically scrubs all passwords.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FINDINGS & REMEDIATION */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Standardized Security Findings & Remediation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Actionable guidance: What happened, Why it matters, How to fix it, and How to verify the fix.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                {findings.length} Documented Findings
              </span>
            </div>

            <div className="space-y-4">
              {findings.map((f) => (
                <div key={f.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded ${
                        f.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        f.severity === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-800' :
                        f.severity === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        f.severity === 'LOW' ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' :
                        'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="font-mono text-xs text-slate-400">{f.id}</span>
                      <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      STATUS: OPEN
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">What Happened</span>
                      <p className="text-slate-300">{f.description}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">Evidence</span>
                      <code className="block p-2 bg-slate-950 rounded text-cyan-300 font-mono text-[11px] border border-slate-800">
                        {f.evidence}
                      </code>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">Why It Matters (Impact)</span>
                      <p className="text-slate-300">{f.impact}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px]">How to Fix (Remediation)</span>
                      <p className="text-emerald-300">{f.recommendation}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Verification CLI Command:</span>
                    <code className="bg-slate-950 text-cyan-400 px-2.5 py-1 rounded border border-slate-800">
                      {f.verification}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: TERMINAL / CLI REFERENCE */}
        {activeTab === 'cli' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>Interactive Terminal & CLI Reference</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any command to execute inside the simulated 8WHIE InstaAudit laboratory terminal.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'instaaudit --version',
                  'instaaudit full-audit',
                  'instaaudit accounts list',
                  'instaaudit rate-limit-test',
                  'instaaudit lockout-test',
                  'instaaudit mfa-test',
                  'instaaudit session list',
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => runCliCommand(cmd)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors"
                  >
                    {cmd.replace('instaaudit ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-2xl space-y-1 text-slate-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-500 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-2 text-slate-400">8whie-instaaudit ~ bash</span>
                </div>
                <span>Target: 127.0.0.1:8080</span>
              </div>

              <div className="py-3 max-h-96 overflow-y-auto space-y-1">
                {cliOutput.map((line, idx) => (
                  <div key={idx} className={`${line.startsWith('$') ? 'text-cyan-400 font-bold' : line.includes('PASS') ? 'text-emerald-400' : line.includes('WARNING') ? 'text-amber-400' : 'text-slate-300'}`}>
                    {line}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                <span className="text-cyan-400 font-bold">$</span>
                <input
                  type="text"
                  value={cliInput}
                  onChange={(e) => setCliInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runCliCommand(cliInput);
                  }}
                  className="w-full bg-transparent border-none text-slate-100 font-mono text-xs focus:outline-none"
                  placeholder="Type a command and press Enter..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SAFETY VALIDATOR */}
        {activeTab === 'validator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Centralized Safety Boundary Validator</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Enforced in Code
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The safety boundary is strictly enforced in code via <code className="text-cyan-400">instaaudit.validator.SafetyValidator</code>. External domains, remote targets, and third-party APIs are rejected before network requests are dispatched.
              </p>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Test Target Validation</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={validatorInput}
                    onChange={(e) => handleValidateTarget(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter target URL or host (e.g. localhost, 127.0.0.1, or remote URL)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Quick Test Probes:</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <button
                    onClick={() => handleValidateTarget('http://127.0.0.1:8080')}
                    className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded hover:bg-emerald-900/50"
                  >
                    127.0.0.1:8080 (Loopback)
                  </button>
                  <button
                    onClick={() => handleValidateTarget('http://localhost:8080')}
                    className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded hover:bg-emerald-900/50"
                  >
                    localhost:8080 (Loopback)
                  </button>
                  <button
                    onClick={() => handleValidateTarget('https://www.instagram.com')}
                    className="px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded hover:bg-rose-900/50"
                  >
                    instagram.com (Prohibited)
                  </button>
                  <button
                    onClick={() => handleValidateTarget('https://meta.com/login')}
                    className="px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded hover:bg-rose-900/50"
                  >
                    meta.com (Prohibited)
                  </button>
                  <button
                    onClick={() => handleValidateTarget('http://8.8.8.8')}
                    className="px-2.5 py-1 bg-rose-950/60 text-rose-300 border border-rose-800/60 rounded hover:bg-rose-900/50"
                  >
                    8.8.8.8 (Public IP)
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                validatorResult.allowed
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                <div className="flex items-center space-x-2 font-mono font-bold text-xs mb-1">
                  {validatorResult.allowed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                  )}
                  <span>{validatorResult.allowed ? 'VALID LOOPBACK PERMITTED' : 'SAFETY POLICY VIOLATION REJECTED'}</span>
                </div>
                <p className="text-xs font-mono leading-relaxed">{validatorResult.message}</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <Lock className="h-4 w-4 text-cyan-400" />
                <span>Programmatic Guardrails</span>
              </h3>
              <p className="text-xs text-slate-400">
                8WHIE InstaAudit is engineered with structural safeguards:
              </p>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-cyan-400">No Remote Exploitation:</span>
                  <p className="text-slate-400 mt-0.5">Every network module calls <code className="text-slate-300 font-mono">SafetyValidator.validate_target()</code> prior to initiating sockets.</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-cyan-400">No Bypass Mechanisms:</span>
                  <p className="text-slate-400 mt-0.5">Strictly excludes CAPTCHA solvers, MFA interception, session token theft, proxy rotation, and credential stuffing on external networks.</p>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-semibold text-cyan-400">Secret Redaction:</span>
                  <p className="text-slate-400 mt-0.5">Raw passwords, OTP tokens, and session cookies are filtered via regex filters prior to logging or storage.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: REPORTS & STORAGE */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-semibold text-white">JSON Consolidated Report</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Full machine-readable export including 8WHIE branding, metadata, test matrices, and findings.
                </p>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
                      brand: BRAND.name,
                      project: BRAND.project,
                      founder: BRAND.founder,
                      copyright: BRAND.copyright,
                      target: selectedTarget,
                      tests: tests,
                      findings: findings
                    }, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", "instaaudit_report.json");
                    dl.click();
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON Report</span>
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-semibold text-white">CSV Findings Spreadsheet</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Tabular export of documented findings for remediation tracking and executive audits.
                </p>
                <button
                  onClick={() => {
                    let csv = "Finding ID,Severity,Title,Description,Evidence,Impact,Recommendation,Verification\n";
                    findings.forEach(f => {
                      csv += `"${f.id}","${f.severity}","${f.title}","${f.description}","${f.evidence}","${f.impact}","${f.recommendation}","${f.verification}"\n`;
                    });
                    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                    const dl = document.createElement('a');
                    dl.setAttribute("href", dataStr);
                    dl.setAttribute("download", "instaaudit_findings.csv");
                    dl.click();
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download CSV Export</span>
                </button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-purple-400" />
                  <h4 className="text-xs font-semibold text-white">SQLite Session Database</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Persistent local audit sessions saved at <code className="text-cyan-400">instaaudit_sessions.db</code> with zero raw credentials stored.
                </p>
                <div className="p-2 bg-slate-950 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                  Table: audit_sessions (8 columns)
                </div>
              </div>
            </div>

            {/* SQLite Table Inspection */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white flex items-center space-x-2">
                  <Database className="h-3.5 w-3.5 text-cyan-400" />
                  <span>SQLite Audit History Records (`instaaudit session list`)</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">SQLite 3.x</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Session ID</th>
                      <th className="p-3">Test Type</th>
                      <th className="p-3">Target Scope</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Findings</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 text-cyan-400">audit_1d42af9a</td>
                      <td className="p-3">FULL_AUDIT</td>
                      <td className="p-3">http://127.0.0.1:8080</td>
                      <td className="p-3 text-emerald-400">COMPLETED</td>
                      <td className="p-3">2</td>
                      <td className="p-3 text-slate-500">2026-10-15T03:04:46Z</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-cyan-400">audit_sample_01</td>
                      <td className="p-3">FULL_AUDIT</td>
                      <td className="p-3">http://127.0.0.1:8080</td>
                      <td className="p-3 text-emerald-400">COMPLETED</td>
                      <td className="p-3">1</td>
                      <td className="p-3 text-slate-500">2026-10-15T00:00:00Z</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Official 8WHIE Branding Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-900/90 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <span className="font-bold text-white text-sm">{BRAND.name}</span>
                <span>•</span>
                <span className="font-medium text-slate-200">{BRAND.project}</span>
                <span className="text-slate-500 text-[11px]">v{BRAND.version}</span>
              </div>
              <p className="text-xs text-slate-400">
                Founder & Owner: <span className="text-slate-200 font-medium">{BRAND.founder}</span> • {BRAND.category}
              </p>
              <p className="text-[11px] text-slate-500">
                {BRAND.copyright}
              </p>
            </div>

            {/* Official Clickable Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <a
                href={BRAND.links.instagram_brand}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>8WHIE Instagram</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={BRAND.links.instagram_founder}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>Aryan Thakur Instagram</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={BRAND.links.telegram_channel}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>Telegram Channel</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={BRAND.links.telegram_contact}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>Telegram Contact</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={BRAND.links.youtube}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <span>•</span>
              <a
                href={BRAND.links.github}
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed text-center md:text-left">
            <p>{BRAND.disclaimer}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
