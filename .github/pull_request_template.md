## 🔧 AI Healing PR

### Rules Checklist

- [ ] Only locator updated
- [ ] No XPath introduced
- [ ] Business logic unchanged
- [ ] Assertions unchanged
- [ ] No hard waits added
- [ ] CI passed
- [ ] Do not modify .feature files
- [ ] Do not change step regex

---

### How to Fix

1. Open failing file
2. Use Copilot Chat
3. Ask:

"Fix locator using DOM and failure context in this PR. Follow healing rules."