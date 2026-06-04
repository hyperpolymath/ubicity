<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Accessibility Guidelines

**UbiCity Accessibility Commitment**
**Version**: 1.0
**Standard**: WCAG 2.1 Level AA (where applicable)

## Overview

UbiCity is a CLI-first tool for learning capture. While traditional web accessibility (WCAG) focuses on visual interfaces, we ensure our command-line tools are accessible to all users, including those using screen readers, alternative input devices, and assistive technologies.

---

## Accessibility Principles

### 1. Perceivable
**Users can perceive the information being presented**

#### CLI Output
- ✅ **Plain text output** (screen reader compatible)
- ✅ **Unicode symbols with text fallbacks** (`✅` → "Success")
- ✅ **Structured output** (headings, lists)
- ✅ **No color-only information** (use symbols + color)

#### Visual Representations
- ✅ **Visualization HTML** includes alt text for images
- ✅ **High contrast** (4.5:1 minimum for text)
- ✅ **Resize-able text** (HTML reports)

### 2. Operable
**Users can operate the interface**

#### Keyboard Navigation
- ✅ **Keyboard-only operation** (no mouse required)
- ✅ **Tab navigation** in interactive prompts
- ✅ **Escape key exits** prompts
- ✅ **Arrow keys** for history/autocomplete

#### Timing
- ✅ **No time limits** on input
- ✅ **Pausable operations** (Ctrl+C to cancel)

### 3. Understandable
**Users can understand the information and operation**

#### Language
- ✅ **Simple, clear language** (no jargon)
- ✅ **Internationalization (i18n)** support (`src/i18n/`)
- ✅ **Error messages** are actionable
- ✅ **Help text** for all commands

#### Predictable Behavior
- ✅ **Consistent prompts** across captures
- ✅ **Confirmation before destructive actions**
- ✅ **Undo/rollback** for mistakes

### 4. Robust
**Content can be interpreted by assistive technologies**

#### Standards Compliance
- ✅ **UTF-8 encoding** throughout
- ✅ **ANSI escape codes** for terminal colors (widely supported)
- ✅ **HTML5 semantic elements** in visualizations
- ✅ **ARIA labels** for interactive HTML elements

---

## CLI Accessibility Features

### Screen Reader Compatibility

**Tested With**:
- NVDA (Windows)
- JAWS (Windows)
- Orca (Linux)
- VoiceOver (macOS)

**Best Practices**:
```bash
# Good: Screen reader announces "Success: Experience captured"
echo "✅ Success: Experience captured"

# Bad: Screen reader announces "Green check. Experience captured"
echo -e "\e[32m✅ Experience captured\e[0m"  # Color-only info
```

### Alternative Input Methods

#### Voice Control (Dragon, VoiceOver)
- ✅ Commands are short and memorable
- ✅ Autocomplete reduces typing
- ✅ Tab completion for file paths

#### Switch Access
- ✅ Sequential navigation (Tab through options)
- ✅ Single-key shortcuts where possible

### Reduced Motion

**For visualizations**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

```bash
# Detect terminal capabilities
if [ "$TERM" = "linux" ]; then
  # High contrast for Linux console
  export UBICITY_COLOR=off
fi
```

---

## Internationalization (i18n)

### Supported Languages
- English (en) - Primary
- Spanish (es) - Community
- [More coming soon]

### Language Selection
```bash
# Set language via environment variable
export UBICITY_LANG=es
ubicity capture

# Or inline
UBICITY_LANG=es ubicity capture
```

### Translation Guidelines

**For Contributors**:
1. All user-facing strings in `src/i18n/*.json`
2. Use placeholders for dynamic content: `{learner_name}`
3. Respect cultural context (dates, names, formality)
4. Test with native speakers

**Example**:
```json
{
  "capture": {
    "success": "✅ Experience captured successfully!"
  }
}
```

---

## Documentation Accessibility

### README & Guides

- ✅ **Headings hierarchy** (H1 → H2 → H3, no skipping)
- ✅ **Link text is descriptive** ("Read getting started guide" not "Click here")
- ✅ **Alt text for images/diagrams**
- ✅ **Code blocks** have syntax labels
- ✅ **Tables** have header rows

### API Documentation

- ✅ **Function signatures** clearly explained
- ✅ **Parameter types** documented
- ✅ **Examples** for every function
- ✅ **Error conditions** listed

---

## Testing for Accessibility

### Manual Testing Checklist

- [ ] Run CLI with screen reader (NVDA/Orca/VoiceOver)
- [ ] Navigate using keyboard only (no mouse)
- [ ] Test with terminal color disabled (`NO_COLOR=1`)
- [ ] Resize terminal to 80x24 (minimum)
- [ ] Test with slow network (if network features added)
- [ ] Test in high contrast mode
- [ ] Verify error messages are actionable

### Automated Testing

```bash
# HTML reports (axe-core)
npm install -g @axe-core/cli
axe ./visualizations/report.html

# Color contrast (pa11y)
npm install -g pa11y
pa11y --standard WCAG2AA ./visualizations/report.html
```

---

## Privacy & Accessibility Intersection

### Data Minimization
**Accessibility Benefit**: Less data = simpler interfaces

- ✅ WHO/WHERE/WHAT protocol keeps prompts short
- ✅ No multi-page forms
- ✅ Fast capture (< 1 minute)

### Privacy-Preserving Exports
**Accessibility Benefit**: Simple export formats

- ✅ CSV (readable in spreadsheets with screen readers)
- ✅ GeoJSON (standard for mapping tools)
- ✅ Markdown (semantic headings, screen reader friendly)

---

## Known Limitations

### Current (v0.3)
- ❌ **No GUI** - CLI only (but this is by design: "tools not platforms")
- ❌ **English-first** - Translations incomplete
- ❌ **Emoji in output** - May not render in all terminals

### Future Enhancements
- 🔮 **TUI (Text User Interface)** with full keyboard navigation
- 🔮 **Audio feedback** (optional beeps on success/error)
- 🔮 **Simplified mode** (fewer prompts, more defaults)
- 🔮 **Screen reader optimizations** (verbose mode)

---

## Reporting Accessibility Issues

**How to Report**:
1. GitHub Issues: https://github.com/Hyperpolymath/ubicity/issues
2. Label: `accessibility`
3. Describe: Assistive tech used, expected behavior, actual behavior

**Response Time**:
- Critical (blocks usage): 48 hours
- High (degrades experience): 7 days
- Medium (improvement): Next release

---

## References

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inclusive Design Principles](https://inclusivedesignprinciples.org/)
- [The A11Y Project](https://www.a11yproject.com/)
- [CLI Accessibility Best Practices](https://cli-a11y.dev/)

---

## Commitment

**UbiCity Accessibility Promise**:
> Learning happens for everyone, everywhere. Our tools must be accessible to all learners, regardless of ability. We commit to maintaining and improving accessibility with every release.

**Contact**: accessibility@ubicity.example.org

---

**Document Owner**: Maintainers
**Last Review**: 2025-11-22
**Next Review**: 2026-02-22 (quarterly)
