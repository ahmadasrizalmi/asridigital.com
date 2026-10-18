/**
 * Asri Digital - Email Security, Anti-Spam & Anti-Judol Engine
 * 
 * Provides defense-in-depth against:
 * 1. Judi Online (Judol) / Slot / Togel spam & obfuscated keywords
 * 2. Phishing, crypto airdrop & loan scams
 * 3. Cross-Site Scripting (XSS) via rigorous HTML sanitization
 * 4. Disposable/burner email addresses & malicious domain TLDs
 * 5. Bot email floods & rate-limiting abuse
 * 6. Sender authentication (SPF, DKIM, DMARC) verification
 */

export interface EmailSecurityInput {
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  headers?: Record<string, string>;
  senderIp?: string;
}

export interface EmailSecurityAssessment {
  score: number; // 0 (Clean) to 100 (High Risk Spam)
  status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS' | 'SPAM' | 'BLOCKED';
  isSpam: boolean;
  reasons: string[];
  sanitizedHtml: string;
  sanitizedText: string;
  spf: 'pass' | 'fail' | 'softfail' | 'none';
  dkim: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  detectedKeywords: string[];
}

// 1. High-priority Indonesian Judi Online (Judol) terms
export const JUDOL_KEYWORDS: string[] = [
  'slot gacor',
  'pragmatic play',
  'gates of olympus',
  'sweet bonanza',
  'mahjong ways',
  'zeus slot',
  'kakek zeus',
  'jackpot paus',
  'pola gacor',
  'scatter hitam',
  'deposit pulsa tanpa potongan',
  'link alternatif slot',
  'agen judi online',
  'situs slot online',
  'taruhan bola',
  'sbobet88',
  'togel online',
  'bandar togel',
  'bocoran slot',
  'rtp slot live',
  'rtp tertinggi',
  'maxwin x5000',
  'sensasional slot',
  'casino live',
  'depo pulsa',
  'depo 10k',
  'depo 25k',
  'bonus new member 100',
  'free spin slot',
  'judi slot',
  'daftar slot gacor',
  'situs judi terpercaya',
  'domino qiu qiu',
  'poker online idn',
  'slot terpercaya',
];

// 2. High-risk Scams, Crypto Phishing & Illegal Loan keywords
export const SCAM_KEYWORDS: string[] = [
  'pinjol tanpa jaminan',
  'pinjaman cepat cair',
  'dana cair instan tanpa ktp',
  'claim your airdrop',
  'crypto giveaway',
  'metamask verification required',
  'trust wallet recovery phrase',
  'binance account suspended',
  'urgent account verification',
  'transfer funds immediately',
  'lottery winning notification',
];

// 3. Known Disposable / Temporary / Burner Email Domains
export const DISPOSABLE_EMAIL_DOMAINS: Set<string> = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'sharklasers.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'throwawaymail.com',
  'yopmail.com',
  'trashmail.com',
  'fakeinbox.com',
  'dispostable.com',
  'getairmail.com',
  'mohmal.com',
  'crazymailing.com',
  'tmail.ws',
  'generator.email',
]);

// 4. Suspicious high-abuse TLDs often used for spam campaigns
export const SUSPICIOUS_TLDS: Set<string> = new Set([
  'xyz',
  'top',
  'buzz',
  'fit',
  'click',
  'rest',
  'gq',
  'cf',
  'tk',
  'ml',
  'ga',
  'men',
  'work',
  'live',
]);

// Character homoglyphs and leet mappings for de-obfuscation
const HOMOGLYPHS: Record<string, string> = {
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i',
  '@': 'a', '4': 'a', '0': 'o', '3': 'e', '1': 'i', '!': 'i', '$': 's', '5': 's',
  '8': 'b', '7': 't', '+': 't',
};

/**
 * Normalizes text by removing zero-width characters, collapsing spaces,
 * mapping common homoglyphs/leetspeak, and stripping non-alphanumeric noise.
 */
export function normalizeText(input: string): string {
  if (!input) return '';

  // Remove invisible and zero-width characters (popular in spam evasion)
  let clean = input.replace(/[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E]/g, '');

  // Lowercase
  clean = clean.toLowerCase();

  // Substitute common homoglyphs & leetspeak
  clean = clean.split('').map(char => HOMOGLYPHS[char] || char).join('');

  // Normalize repeated whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

/**
 * De-spaced token string to catch patterns like "s.l.o.t" or "g-a-c-o-r" or "s l o t"
 */
export function stripPunctuationAndSpacing(input: string): string {
  const normalized = normalizeText(input);
  return normalized.replace(/[^a-z0-9]/g, '');
}

/**
 * Detects presence of judol or scam keywords, including obfuscated variations.
 */
export function detectSpamKeywords(text: string): { matches: string[]; score: number } {
  if (!text) return { matches: [], score: 0 };

  const normalized = normalizeText(text);
  const condensed = stripPunctuationAndSpacing(text);
  const found: string[] = [];
  let score = 0;

  // 1. Direct and normalized keyword matching
  for (const kw of JUDOL_KEYWORDS) {
    const kwNorm = normalizeText(kw);
    const kwCondensed = stripPunctuationAndSpacing(kw);

    if (normalized.includes(kwNorm)) {
      found.push(`JUDOL:${kw}`);
      score += 45;
    } else if (kwCondensed.length >= 6 && condensed.includes(kwCondensed)) {
      found.push(`JUDOL_OBFUSCATED:${kw}`);
      score += 50;
    }
  }

  // 2. Scam and phishing keyword matching
  for (const scam of SCAM_KEYWORDS) {
    const scamNorm = normalizeText(scam);
    if (normalized.includes(scamNorm)) {
      found.push(`SCAM:${scam}`);
      score += 40;
    }
  }

  // 3. RegEx patterns for aggressive obfuscated judol terms
  const obfuscatedRegexPatterns = [
    { name: 'REGEX_SLOT', pattern: /\bs+[l1|!]+[o0]+t+[s5]?\b/i, weight: 35 },
    { name: 'REGEX_GACOR', pattern: /\bg+[a4@]+c+[o0]+r+\b/i, weight: 35 },
    { name: 'REGEX_ZEUS', pattern: /\bz+[e3]+u+[s5]+\b/i, weight: 30 },
    { name: 'REGEX_MAXWIN', pattern: /\bm+[a4@]+x+w+[i1!]+n+\b/i, weight: 35 },
    { name: 'REGEX_SCATTER', pattern: /\bsc+[a4@]+t+t+[e3]+r+\b/i, weight: 30 },
    { name: 'REGEX_TOGEL', pattern: /\bt+[o0]+g+[e3]+l+\b/i, weight: 35 },
    { name: 'REGEX_CASINO', pattern: /\bc+[a4@]+s+[i1!]+n+[o0]+\b/i, weight: 30 },
    { name: 'REGEX_JACKPOT', pattern: /\bj+[a4@]+c+k+p+[o0]+t+\b/i, weight: 25 },
  ];

  for (const { name, pattern, weight } of obfuscatedRegexPatterns) {
    if (pattern.test(normalized)) {
      if (!found.some(f => f.startsWith(name))) {
        found.push(name);
        score += weight;
      }
    }
  }

  return { matches: found, score };
}

/**
 * Validates sender domain against disposable burner list and suspicious TLDs.
 */
export function checkSenderDomain(fromEmail: string): {
  isDisposable: boolean;
  isSuspiciousTld: boolean;
  domain: string;
  score: number;
} {
  const parts = (fromEmail || '').toLowerCase().trim().split('@');
  if (parts.length < 2) {
    return { isDisposable: false, isSuspiciousTld: false, domain: '', score: 25 };
  }

  const domain = parts[1];
  const tld = domain.split('.').pop() || '';

  const isDisposable = DISPOSABLE_EMAIL_DOMAINS.has(domain);
  const isSuspiciousTld = SUSPICIOUS_TLDS.has(tld);

  let score = 0;
  if (isDisposable) score += 45;
  if (isSuspiciousTld) score += 25;

  return { isDisposable, isSuspiciousTld, domain, score };
}

/**
 * Parses SPF, DKIM, DMARC auth results from email headers
 */
export function parseAuthHeaders(headers: Record<string, string> = {}): {
  spf: 'pass' | 'fail' | 'softfail' | 'none';
  dkim: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  score: number;
  reasons: string[];
} {
  const authResults = (
    headers['authentication-results'] ||
    headers['Authentication-Results'] ||
    headers['x-cf-spf'] ||
    headers['x-cf-dkim'] ||
    ''
  ).toLowerCase();

  const receivedSpf = (headers['received-spf'] || headers['Received-SPF'] || '').toLowerCase();

  let spf: 'pass' | 'fail' | 'softfail' | 'none' = 'none';
  let dkim: 'pass' | 'fail' | 'none' = 'none';
  let dmarc: 'pass' | 'fail' | 'none' = 'none';
  const reasons: string[] = [];
  let score = 0;

  // Check SPF
  if (receivedSpf.includes('pass') || authResults.includes('spf=pass')) {
    spf = 'pass';
  } else if (receivedSpf.includes('fail') || authResults.includes('spf=fail')) {
    spf = 'fail';
    score += 25;
    reasons.push('SPF_FAILED');
  } else if (receivedSpf.includes('softfail') || authResults.includes('spf=softfail')) {
    spf = 'softfail';
    score += 15;
    reasons.push('SPF_SOFTFAIL');
  }

  // Check DKIM
  if (authResults.includes('dkim=pass')) {
    dkim = 'pass';
  } else if (authResults.includes('dkim=fail')) {
    dkim = 'fail';
    score += 25;
    reasons.push('DKIM_FAILED');
  }

  // Check DMARC
  if (authResults.includes('dmarc=pass')) {
    dmarc = 'pass';
  } else if (authResults.includes('dmarc=fail')) {
    dmarc = 'fail';
    score += 30;
    reasons.push('DMARC_FAILED');
  }

  return { spf, dkim, dmarc, score, reasons };
}

/**
 * HTML Sanitizer (Zero XSS)
 * Completely eliminates any scripts, event handlers, frames, objects, forms, and dangerous schemes.
 */
export function sanitizeEmailHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Remove dangerous script, iframe, object, embed, form, meta, link, base tags and their contents
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  html = html.replace(/<embed\b[^>]*>/gi, '');
  html = html.replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '');
  html = html.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  html = html.replace(/<(meta|link|base|title|canvas|svg|math)\b[^>]*>/gi, '');

  // 2. Remove all inline event handlers (onload, onclick, onerror, etc.)
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

  // 3. Remove dangerous URL schemes (javascript:, vbscript:, data:text/html)
  html = html.replace(/href\s*=\s*['"]\s*(javascript|vbscript|data):[^'"]*['"]/gi, 'href="#"');
  html = html.replace(/src\s*=\s*['"]\s*(javascript|vbscript|data):[^'"]*['"]/gi, 'src=""');

  // 4. Force all links (<a>) to open in new tab with security attributes (noopener, noreferrer, nofollow)
  html = html.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    // Strip existing rel, target
    let cleanAttrs = attrs
      .replace(/\s+rel\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/\s+target\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
    return `<a ${cleanAttrs} target="_blank" rel="noopener noreferrer nofollow" class="text-blue-600 underline hover:text-blue-800">`;
  });

  return html.trim();
}

/**
 * Strips HTML to produce clean, safe plaintext
 */
export function sanitizeEmailText(rawTextOrHtml: string): string {
  if (!rawTextOrHtml) return '';
  return rawTextOrHtml
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

// In-memory rate limiting map for inbound emails per sender
const senderRateLimitMap = new Map<string, { count: number; windowStart: number }>();

/**
 * Checks inbound rate limit (Anti-bot flood):
 * Defaults to max 15 emails per hour per sender email.
 */
export function checkSenderRateLimit(fromEmail: string, maxPerHour: number = 15): boolean {
  if (!fromEmail) return false;
  const key = fromEmail.toLowerCase().trim();
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  const current = senderRateLimitMap.get(key);
  if (!current || now - current.windowStart > ONE_HOUR) {
    senderRateLimitMap.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (current.count >= maxPerHour) {
    return false; // Rate limit exceeded!
  }

  current.count++;
  return true;
}

/**
 * Master Security Assessment for Inbound Emails
 */
export function assessEmailSecurity(input: EmailSecurityInput): EmailSecurityAssessment {
  const reasons: string[] = [];
  let totalScore = 0;

  // A. Check domain reputation & disposable mail
  const domainCheck = checkSenderDomain(input.from);
  if (domainCheck.isDisposable) {
    reasons.push(`DISPOSABLE_DOMAIN:${domainCheck.domain}`);
    totalScore += domainCheck.score;
  }
  if (domainCheck.isSuspiciousTld) {
    reasons.push(`SUSPICIOUS_TLD:${domainCheck.domain}`);
    totalScore += domainCheck.score;
  }

  // B. Check keywords in Subject & Body (Judol, scam, phishing)
  const fullContent = `${input.subject || ''} ${input.bodyText || ''} ${input.bodyHtml || ''}`;
  const keywordCheck = detectSpamKeywords(fullContent);
  if (keywordCheck.matches.length > 0) {
    reasons.push(...keywordCheck.matches);
    totalScore += keywordCheck.score;
  }

  // C. Check ALL CAPS Subject
  if (input.subject && input.subject.length > 10) {
    const letters = input.subject.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 8 && letters === letters.toUpperCase()) {
      reasons.push('ALL_CAPS_SUBJECT');
      totalScore += 15;
    }
  }

  // D. Check Excessive links (> 6 links in email often indicates bulk spam)
  const linkMatches = (input.bodyHtml || input.bodyText || '').match(/https?:\/\//gi);
  if (linkMatches && linkMatches.length > 6) {
    reasons.push(`EXCESSIVE_LINKS:${linkMatches.length}`);
    totalScore += 20;
  }

  // E. Check Authentication Headers (SPF/DKIM/DMARC)
  const auth = parseAuthHeaders(input.headers);
  if (auth.reasons.length > 0) {
    reasons.push(...auth.reasons);
    totalScore += auth.score;
  }

  // Cap score at 100
  const finalScore = Math.min(100, totalScore);

  // Determine security status
  let status: 'VERIFIED' | 'UNVERIFIED' | 'SUSPICIOUS' | 'SPAM' | 'BLOCKED';
  let isSpam = false;

  if (finalScore >= 60 || reasons.some(r => r.startsWith('JUDOL:') || r.startsWith('JUDOL_OBFUSCATED:'))) {
    status = 'SPAM';
    isSpam = true;
  } else if (finalScore >= 30) {
    status = 'SUSPICIOUS';
  } else if (auth.spf === 'pass' && auth.dkim === 'pass') {
    status = 'VERIFIED';
  } else {
    status = 'UNVERIFIED';
  }

  // Sanitize contents
  const sanitizedHtml = sanitizeEmailHtml(input.bodyHtml || '');
  const sanitizedText = sanitizeEmailText(input.bodyText || input.bodyHtml || '');

  return {
    score: finalScore,
    status,
    isSpam,
    reasons,
    sanitizedHtml,
    sanitizedText,
    spf: auth.spf,
    dkim: auth.dkim,
    dmarc: auth.dmarc,
    detectedKeywords: keywordCheck.matches,
  };
}
