<!--
SPDX-License-Identifier: MPL-2.0
Copyright (c) Jonathan D.A. Jewell <j.d.a.jewell@open.ac.uk>
-->
# Commit Signing Guide

**Platinum RSR Requirement**: All commits to `main` and all release tags must be cryptographically signed.

---

## Why Sign Commits?

**Security Benefits**:
- ✅ Verify commits came from authentic maintainers
- ✅ Prevent impersonation
- ✅ Supply chain integrity (SLSA compliance)
- ✅ Audit trail for compliance

---

## Signing Methods

### Option 1: Sigstore/gitsign (Recommended)

**Keyless signing** using OpenID Connect (GitHub, Google, etc.)

#### Setup
```bash
# Install gitsign
brew install sigstore/tap/gitsign
# OR
go install github.com/sigstore/gitsign@latest

# Configure git
git config --global commit.gpgsign true
git config --global tag.gpgsign true
git config --global gpg.x509.program gitsign
git config --global gpg.format x509
```

#### Usage
```bash
# Commits are automatically signed
git commit -m "feat: add feature"

# Verify signature
git verify-commit HEAD

# Tags are automatically signed
git tag -s v1.0.0 -m "Release v1.0.0"
git verify-tag v1.0.0
```

**Advantages**:
- ✅ No key management (keyless)
- ✅ OIDC-based (GitHub/Google login)
- ✅ Public transparency log (Rekor)
- ✅ SLSA compliance built-in

### Option 2: GPG (Traditional)

**Public key cryptography** using GPG keys

#### Setup
```bash
# Generate GPG key
gpg --full-generate-key
# Select: RSA and RSA, 4096 bits, expires in 2 years

# List keys
gpg --list-secret-keys --keyid-format LONG

# Configure git
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

#### Export Public Key (for GitHub)
```bash
gpg --armor --export YOUR_KEY_ID
# Copy output to GitHub Settings → SSH and GPG keys
```

#### Usage
```bash
# Same as gitsign
git commit -m "feat: add feature"
git tag -s v1.0.0 -m "Release v1.0.0"
```

**Advantages**:
- ✅ Offline signing (no network needed)
- ✅ Widely supported
- ✅ Full control over keys

**Disadvantages**:
- ❌ Key management burden
- ❌ Key rotation complexity
- ❌ Key loss = unable to sign

---

## Enforcement

### Branch Protection Rules (GitHub)

```yaml
# .github/workflows/branch-protection.yml
main:
  required_signatures: true
  enforce_admins: true
```

### Git Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash
if ! git config --get commit.gpgsign; then
  echo "❌ Commit signing not enabled. Run:"
  echo "   git config commit.gpgsign true"
  exit 1
fi
```

### CI/CD Verification

```yaml
# .gitlab-ci.yml
verify-signatures:
  script:
    - git verify-commit HEAD || exit 1
```

---

## Signing Release Artifacts

### Binaries
```bash
# Sign with GPG
gpg --detach-sign --armor bin/ubicity
# Creates bin/ubicity.asc

# Verify
gpg --verify bin/ubicity.asc bin/ubicity
```

### Checksums
```bash
# Create checksums
sha256sum bin/* > SHA256SUMS

# Sign checksums
gpg --clearsign SHA256SUMS
# Creates SHA256SUMS.asc
```

### Container Images
```bash
# Sign with cosign (Sigstore)
cosign sign ghcr.io/hyperpolymath/ubicity:v1.0.0

# Verify
cosign verify ghcr.io/hyperpolymath/ubicity:v1.0.0
```

---

## Troubleshooting

### "gpg: signing failed: No secret key"
**Solution**: Set your GPG key ID
```bash
git config --global user.signingkey YOUR_KEY_ID
```

### "gitsign: command not found"
**Solution**: Install gitsign
```bash
brew install sigstore/tap/gitsign
```

### "error: cannot run gitsign: No such file"
**Solution**: Add gitsign to PATH
```bash
export PATH="$PATH:$(go env GOPATH)/bin"
```

---

## Key Rotation (GPG)

**Recommended**: Rotate GPG keys every 2 years

### Process
1. Generate new key
2. Add new key to GitHub
3. Update git config
4. Sign a commit with new key
5. Revoke old key (after transition period)

```bash
# Generate new key (same steps as setup)
gpg --full-generate-key

# Update git config
git config --global user.signingkey NEW_KEY_ID

# Revoke old key (after 90 days)
gpg --gen-revoke OLD_KEY_ID > revoke.asc
gpg --import revoke.asc
gpg --send-keys OLD_KEY_ID  # Publish revocation
```

---

## Policy

**UbiCity Signing Policy**:
- ✅ All commits to `main` must be signed
- ✅ All release tags must be signed
- ✅ All release binaries must be signed
- ✅ Feature branches: signing encouraged but not required

**Maintainers**: Must configure signing before merge access

---

## References

- [Sigstore/gitsign](https://github.com/sigstore/gitsign)
- [GitHub Commit Signing](https://docs.github.com/en/authentication/managing-commit-signature-verification)
- [GPG Quick Start](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
- [SLSA Framework](https://slsa.dev/)

---

**Document Owner**: Maintainers
**Last Review**: 2025-11-22
