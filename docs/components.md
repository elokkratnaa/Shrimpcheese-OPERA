# Shared Components

Shared components live in `app/components/shared/` and should be reused across the application.

| Component | Description | Props |
| --- | --- | --- |
| `<OperaNav />` | Top navigation | `variant: "guest" \| "authed"` |
| `<OperaFooter />` | Dark footer | None |
| `<OperaLoader />` | Loading animation | None |
| `<PersonaBubble />` | Debate message bubble | `persona_name`, `message_content`, `variant: "a"\|"b"\|"c"`, `isStreaming?` |
| `<SessionCard />` | History list item | `session` |
| `<OperaInput />` | Styled textarea | `value`, `onChange`, `placeholder`, `maxLength` |
| `<ConflictFlag />` | Warning card | `message` |
| `<CommitButton />` | Coral action button | `onCommit`, `isCommitted` |
| `<LanguageSwitcher />` | Locale toggle | None |

## Usage Guidelines

- Extend shadcn primitives using `className` + design tokens.
- Never hardcode styles; use CSS variables from `DESIGN.md`.
- Ensure mobile responsiveness for all shared components.
