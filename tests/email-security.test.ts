import { describe, it, expect } from 'vitest';
import {
  assessEmailSecurity,
  detectSpamKeywords,
  sanitizeEmailHtml,
  sanitizeEmailText,
  normalizeText,
  checkSenderDomain,
  checkSenderRateLimit,
} from '../functions/lib/email-security';

describe('Email Security & Anti-Spam / Anti-Judol Engine', () => {

  describe('1. Normalization & De-obfuscation', () => {
    it('should strip zero-width characters and invisible unicode spaces', () => {
      const obfuscated = 's\u200Bl\u200Cot\uFEFF g\u200Dacor';
      const normalized = normalizeText(obfuscated);
      expect(normalized).toBe('slot gacor');
    });

    it('should map Cyrillic homoglyphs and leetspeak numbers to latin characters', () => {
      // Cyrillic 'о' (U+043E) and 'а' (U+0430) + leet 0, 4
      const mixed = 'sl0t g4cоr';
      const normalized = normalizeText(mixed);
      expect(normalized).toBe('slot gacor');
    });
  });

  describe('2. Judi Online (Judol) Keyword Detection', () => {
    it('should detect explicit Indonesian judol keywords', () => {
      const subject = 'Promo Slot Gacor Hari Ini Maxwin x5000 Depo 10k';
      const result = detectSpamKeywords(subject);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(45);
      expect(result.matches.some(m => m.includes('slot gacor'))).toBe(true);
    });

    it('should catch obfuscated judol phrases with dots and dashes', () => {
      const content = 'Daftar sekarang di s.l.o.t g-a-c-o-r kakek z.e.u.s scatter hitam';
      const result = detectSpamKeywords(content);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(45);
    });

    it('should detect regex patterns like sl0t, z3us, m4xwin, t0g3l', () => {
      const text = 'Buruan join sl0t online paling gacor';
      const result = detectSpamKeywords(text);
      expect(result.matches.length).toBeGreaterThan(0);
    });
  });

  describe('3. Phishing and Scam Keyword Detection', () => {
    it('should detect crypto phishing and suspicious illegal loans', () => {
      const sample1 = 'Urgent account verification: Metamask verification required immediately';
      const result1 = detectSpamKeywords(sample1);
      expect(result1.matches.some(m => m.includes('SCAM:metamask verification required'))).toBe(true);

      const sample2 = 'Penawaran spesial pinjol tanpa jaminan langsung cair';
      const result2 = detectSpamKeywords(sample2);
      expect(result2.matches.some(m => m.includes('SCAM:pinjol tanpa jaminan'))).toBe(true);
    });

    it('should not flag legitimate business inquiry emails', () => {
      const cleanEmail = 'Halo tim Asri Digital, saya ingin bertanya tentang fitur Assalam TV dan lisensi masjid.';
      const result = detectSpamKeywords(cleanEmail);
      expect(result.matches.length).toBe(0);
      expect(result.score).toBe(0);
    });
  });

  describe('4. Disposable Domain & Suspicious TLD Detection', () => {
    it('should flag known disposable email providers', () => {
      const check1 = checkSenderDomain('bot123@tempmail.com');
      expect(check1.isDisposable).toBe(true);
      expect(check1.score).toBeGreaterThanOrEqual(40);

      const check2 = checkSenderDomain('attacker@guerrillamail.com');
      expect(check2.isDisposable).toBe(true);
    });

    it('should flag high-risk spam TLDs', () => {
      const check = checkSenderDomain('promo@casino-win.xyz');
      expect(check.isSuspiciousTld).toBe(true);
      expect(check.score).toBeGreaterThanOrEqual(25);
    });

    it('should pass legitimate email domains', () => {
      const check = checkSenderDomain('dkm.alikhlas@gmail.com');
      expect(check.isDisposable).toBe(false);
      expect(check.isSuspiciousTld).toBe(false);
      expect(check.score).toBe(0);
    });
  });

  describe('5. HTML Sanitization (Zero XSS)', () => {
    it('should completely strip script tags and their inner javascript', () => {
      const dangerousHtml = '<p>Halo</p><script>alert("XSS Attack!"); window.location="https://malicious.com"</script><b>Teman</b>';
      const sanitized = sanitizeEmailHtml(dangerousHtml);
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('<p>Halo</p>');
      expect(sanitized).toContain('<b>Teman</b>');
    });

    it('should strip dangerous iframes, objects, and forms', () => {
      const dirtyHtml = '<iframe src="https://evil.com/phish"></iframe><form action="https://evil.com/steal"><input name="pass"></form>';
      const sanitized = sanitizeEmailHtml(dirtyHtml);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<form');
      expect(sanitized).not.toContain('<input');
    });

    it('should strip event handlers like onerror and onload', () => {
      const dirtyHtml = '<img src="invalid.jpg" onerror="alert(document.cookie)" /><body onload="alert(1)">Text</body>';
      const sanitized = sanitizeEmailHtml(dirtyHtml);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
      expect(sanitized).not.toContain('document.cookie');
    });

    it('should neutralize javascript: schemes in href and src', () => {
      const dirtyLink = '<a href="javascript:alert(1)">Klik Disini</a>';
      const sanitized = sanitizeEmailHtml(dirtyLink);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).toContain('href="#"');
      expect(sanitized).toContain('rel="noopener noreferrer nofollow"');
      expect(sanitized).toContain('target="_blank"');
    });

    it('should produce clean safe plaintext with sanitizeEmailText', () => {
      const html = '<h1>Subjek Penting</h1><p>Baris 1<br>Baris 2</p>';
      const plain = sanitizeEmailText(html);
      expect(plain).toContain('Subjek Penting');
      expect(plain).toContain('Baris 1\nBaris 2');
      expect(plain).not.toContain('<h1>');
    });
  });

  describe('6. Anti-Bot Inbound Rate Limiting', () => {
    it('should allow normal rate but throttle flooders', () => {
      const uniqueSender = `test-bot-${Date.now()}@spammer.org`;
      
      // Send 5 emails (well within 15/hr)
      for (let i = 0; i < 5; i++) {
        expect(checkSenderRateLimit(uniqueSender, 15)).toBe(true);
      }

      // Fill up to limit of 15
      for (let i = 5; i < 15; i++) {
        expect(checkSenderRateLimit(uniqueSender, 15)).toBe(true);
      }

      // 16th email should be blocked!
      expect(checkSenderRateLimit(uniqueSender, 15)).toBe(false);
    });
  });

  describe('7. Comprehensive Email Security Assessment', () => {
    it('should classify a judol spam email as SPAM with high spam score', () => {
      const assessment = assessEmailSecurity({
        from: 'promo@judol-gacor.xyz',
        to: 'halo@asridigital.com',
        subject: 'DAFTAR SEKARANG SLOT GACOR ZEUS MAXWIN',
        bodyHtml: '<p>Link alternatif slot online terpercaya deposit pulsa 10k <a href="http://judol.com">Klik</a></p>',
      });

      expect(assessment.isSpam).toBe(true);
      expect(assessment.status).toBe('SPAM');
      expect(assessment.score).toBeGreaterThanOrEqual(60);
      expect(assessment.reasons.length).toBeGreaterThan(0);
    });

    it('should verify a legitimate email with SPF and DKIM pass', () => {
      const assessment = assessEmailSecurity({
        from: 'budi@perusahaan.com',
        to: 'halo@asridigital.com',
        subject: 'Kerjasama Pengadaan Software Layar Masjid',
        bodyText: 'Selamat siang tim Asri Digital, kami tertarik untuk lisensi tahunan.',
        headers: {
          'authentication-results': 'mx.cloudflare.com; spf=pass; dkim=pass; dmarc=pass',
        },
      });

      expect(assessment.isSpam).toBe(false);
      expect(assessment.status).toBe('VERIFIED');
      expect(assessment.spf).toBe('pass');
      expect(assessment.dkim).toBe('pass');
      expect(assessment.score).toBe(0);
    });
  });

});
