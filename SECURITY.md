# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Open Sunsama seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do

- **Email us directly** at [security@circo.so](mailto:security@circo.so)
- **Provide details** about the vulnerability, including:
  - Type of issue (e.g., SQL injection, XSS, authentication bypass)
  - Full paths of source file(s) related to the issue
  - Location of the affected source code (tag/branch/commit or direct URL)
  - Step-by-step instructions to reproduce the issue
  - Proof-of-concept or exploit code (if possible)
  - Impact of the issue, including how an attacker might exploit it
- **Give us reasonable time** to respond before public disclosure

### Please Don't

- **Don't open a public GitHub issue** for security vulnerabilities
- **Don't access or modify other users' data** without explicit permission
- **Don't perform actions** that could negatively impact other users
- **Don't use automated scanners** against production systems without permission

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Resolution target**: Within 90 days (depending on severity)

## Disclosure Policy

We follow a coordinated disclosure process:

1. Security issues are reported privately
2. We confirm the vulnerability and determine its scope
3. We develop and test a fix
4. We release the fix and publish a security advisory
5. We credit the reporter (unless they prefer to remain anonymous)

## Security Best Practices for Self-Hosters

If you're self-hosting Open Sunsama, please ensure:

### Environment

- [ ] Use strong, unique values for `JWT_SECRET`
- [ ] Keep `DATABASE_URL` credentials secure
- [ ] Use HTTPS in production
- [ ] Set appropriate `CORS_ORIGIN` values

### Database

- [ ] Use a strong PostgreSQL password
- [ ] Limit database network access
- [ ] Enable SSL for database connections
- [ ] Regular backups

### API Keys

- [ ] API keys are hashed before storage (SHA-256)
- [ ] Use minimal required scopes for API keys
- [ ] Rotate API keys periodically
- [ ] Set expiration dates when possible

### Infrastructure

- [ ] Keep dependencies updated
- [ ] Use a reverse proxy (nginx, Caddy) with rate limiting
- [ ] Enable firewall rules
- [ ] Monitor logs for suspicious activity

## Known Security Features

Open Sunsama implements the following security measures:

- **Password Hashing**: bcrypt with appropriate work factor
- **API Key Hashing**: SHA-256 (keys cannot be recovered)
- **JWT Tokens**: Short expiration, secure signing
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: React's built-in escaping + CSP headers
- **CORS**: Configurable origin restrictions
- **Rate Limiting**: Available via reverse proxy configuration

## Bug Bounty

We do not currently have a formal bug bounty program. However, we deeply appreciate security researchers who report vulnerabilities responsibly. We will:

- Acknowledge your contribution in our security advisories (with permission)
- Provide a letter of recognition upon request
- Consider significant findings for monetary rewards on a case-by-case basis

## Contact

- **Security issues**: [security@circo.so](mailto:security@circo.so)
- **General inquiries**: [ceo@circo.so](mailto:ceo@circo.so)
- **PGP Key**: Available upon request

Thank you for helping keep Open Sunsama and our users safe!
