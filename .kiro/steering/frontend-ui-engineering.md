---
inclusion: always
---

# Skill: Frontend UI Engineering

Build production-quality UIs that are accessible, responsive, and visually polished.

## Component Architecture

- Colocate component files (component, test, stories, hook, types)
- Prefer composition over configuration
- Keep components focused — one responsibility
- Separate data fetching from presentation

## Avoid the AI Aesthetic

| AI Default                   | Production Quality                              |
| ---------------------------- | ----------------------------------------------- |
| Purple/indigo everything     | Use the project's actual color palette          |
| Excessive gradients          | Flat or subtle gradients matching design system |
| Rounded everything           | Consistent border-radius from design system     |
| Oversized padding everywhere | Consistent spacing scale                        |
| Shadow-heavy design          | Subtle or no shadows                            |
| Generic card grids           | Purpose-driven layouts                          |

## Accessibility (WCAG 2.1 AA)

- Every interactive element must be keyboard accessible — use `<button>` not `<div onClick>`
- Label interactive elements without visible text: `aria-label`
- Move focus when content changes (e.g. modal opens)
- Never leave blank screens — add empty states, error states, loading states

## State Management — Choose simplest approach

- `useState` → component-specific UI state
- Lifted state → shared between 2-3 siblings
- Context → theme, auth, locale
- URL state → filters, pagination
- Server state (React Query) → remote data

## Loading & Transitions

- Use skeleton loading, not spinners for content
- Use optimistic updates for perceived speed

## Red Flags

- Components with more than 200 lines (split them)
- Inline styles or arbitrary pixel values
- Missing error states, loading states, or empty states
- No keyboard navigation testing
- Color as the sole indicator of state

## Verification Checklist

- [ ] Component renders without console errors
- [ ] All interactive elements are keyboard accessible
- [ ] Responsive: works at 320px, 768px, 1024px, 1440px
- [ ] Loading, empty, error, success states handled
- [ ] Follows the project's design system
- [ ] No accessibility warnings in dev tools
