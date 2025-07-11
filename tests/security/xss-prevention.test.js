/**
 * XSS Prevention Tests
 * Tests to ensure HTML escaping prevents script injection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { escapeHTML, escapeHTMLAttribute } from '../../src/utils/htmlEscape.js';

describe('XSS Prevention', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('HTML Escape Utility', () => {
    it('should escape basic HTML characters', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const escaped = escapeHTML(maliciousInput);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape single quotes', () => {
      const input = "'; alert('XSS'); //";
      const escaped = escapeHTML(input);
      expect(escaped).toBe('&#x27;; alert(&#x27;XSS&#x27;); &#x2F;&#x2F;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const escaped = escapeHTML(input);
      expect(escaped).toBe('Tom &amp; Jerry');
    });

    it('should handle empty strings and null values', () => {
      expect(escapeHTML('')).toBe('');
      expect(escapeHTML(null)).toBe(null);
      expect(escapeHTML(undefined)).toBe(undefined);
      expect(escapeHTML(123)).toBe(123);
    });

    it('should escape HTML attributes more aggressively', () => {
      const maliciousInput = 'value" onload="alert(1)" x="';
      const escaped = escapeHTMLAttribute(maliciousInput);
      expect(escaped).toContain('&quot;');
      expect(escaped).not.toContain('"');
    });
  });

  describe('Modal XSS Prevention', () => {
    it('should prevent XSS in modal title', async () => {
      // Import Modal component
      const { default: Modal } = await import('../../src/components/ui/Modal.js');
      
      const maliciousTitle = '<script>alert("XSS in title")</script>';
      const modal = new Modal({
        id: 'test-modal',
        title: maliciousTitle,
        content: 'Safe content'
      });

      const html = modal.generateHTML();
      
      // Should not contain executable script
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert("XSS in title")');
      
      // Should contain escaped version
      expect(html).toContain('&lt;script&gt;');
    });

    it('should prevent XSS in button text', async () => {
      const { default: Modal } = await import('../../src/components/ui/Modal.js');
      
      const maliciousButtonText = '<img src=x onerror="alert(1)">';
      const modal = new Modal({
        id: 'test-modal',
        title: 'Safe Title',
        content: 'Safe content',
        confirmButtonText: maliciousButtonText,
        showConfirmButton: true
      });

      const html = modal.generateHTML();
      
      // Should not contain executable onerror
      expect(html).not.toContain('onerror="alert(1)"');
      expect(html).toContain('&lt;img');
    });
  });

  describe('SubjectTemplateLoader XSS Prevention', () => {
    it('should prevent XSS in character names', async () => {
      // Create mock fetch for template
      global.fetch = async (url) => ({
        ok: true,
        text: async () => '<h2>{{subjectName}} with {{characterName}} the {{characterType}}!</h2>'
      });

      const { default: SubjectTemplateLoader } = await import('../../src/utils/subjectTemplateLoader.js');
      
      const maliciousOptions = {
        subjectName: 'Math<script>alert("subject")</script>',
        characterName: 'Mango<img src=x onerror="alert(1)">',
        characterType: 'Shark</h2><script>alert("type")</script><h2>',
        subjectLower: 'math',
        subjectDescription: 'Safe description',
        heroSubtitle: 'Safe subtitle',
        featureCards: 'Safe cards'
      };

      const result = await SubjectTemplateLoader.loadTemplate(maliciousOptions);
      
      // Should not contain executable scripts
      expect(result).not.toContain('<script>alert("subject")</script>');
      expect(result).not.toContain('onerror="alert(1)"');
      expect(result).not.toContain('<script>alert("type")</script>');
      
      // Should contain escaped versions
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;img');
    });

    it('should escape all template placeholders', async () => {
      global.fetch = async (url) => ({
        ok: true,
        text: async () => `
          <title>{{subjectName}}</title>
          <meta name="description" content="{{subjectDescription}}">
          <h2>{{characterName}} the {{characterType}}</h2>
          <p>{{heroSubtitle}}</p>
        `
      });

      const { default: SubjectTemplateLoader } = await import('../../src/utils/subjectTemplateLoader.js');
      
      const maliciousOptions = {
        subjectName: '"><script>alert(1)</script>',
        subjectDescription: '"><script>alert(2)</script>',
        characterName: '"><script>alert(3)</script>',
        characterType: '"><script>alert(4)</script>',
        heroSubtitle: '"><script>alert(5)</script>',
        subjectLower: 'test',
        featureCards: 'Safe cards'
      };

      const result = await SubjectTemplateLoader.loadTemplate(maliciousOptions);
      
      // Count how many script tags were escaped vs executed
      const scriptMatches = result.match(/&lt;script&gt;/g) || [];
      const executableScripts = result.match(/<script>/g) || [];
      
      expect(scriptMatches.length).toBe(5); // All 5 should be escaped
      expect(executableScripts.length).toBe(0); // None should be executable
    });
  });

  describe('Character Icon Security', () => {
    it('should handle emoji characters safely', async () => {
      global.fetch = async (url) => ({
        ok: true,
        text: async () => '<div class="character-icon">{{characterName}}</div>'
      });

      const { default: SubjectTemplateLoader } = await import('../../src/utils/subjectTemplateLoader.js');
      
      const options = {
        subjectName: 'Math',
        characterName: '🦈 <script>alert("emoji")</script>',
        characterType: 'Shark',
        subjectLower: 'math',
        subjectDescription: 'Math with sharks',
        heroSubtitle: 'Learn with sharks',
        featureCards: 'Cards'
      };

      const result = await SubjectTemplateLoader.loadTemplate(options);
      
      // Should preserve emoji but escape script
      expect(result).toContain('🦈');
      expect(result).not.toContain('<script>alert("emoji")</script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });
});