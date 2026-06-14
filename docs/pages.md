# Application Pages

OPERA consists of 12 main routes, categorized by authentication requirements.

| Route | Description | Auth Required |
| --- | --- | --- |
| `/` | Landing page | No |
| `/login` | Email/Google sign in | No |
| `/register` | Email/Google registration | No |
| `/home` | Dashboard (sessions, tags) | Yes |
| `/dump` | Mind Dump input interface | Yes |
| `/session/[id]/profiling` | Loading status page | Yes |
| `/session/[id]/council` | Debate interface | Yes |
| `/session/[id]/verdict` | Final verdict + commit | Yes |
| `/chat` | Solo persona chat | Yes |
| `/history` | Past sessions list | Yes |
| `/profile` | User settings + account mgmt | Yes |
| `/error` | Error boundary page | No |
