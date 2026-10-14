---
createdAt: 2026-10-14
editedAt: 2026-10-14T22:07:11
lastReviewed: 2026-10-14
---

# Nuxt UI

Keep the design minimal and use as few component variants as possible.
Unless the user instructs otherwise, use the component's default appearance
and variant first.

1. Prefer an existing project adapter in `app/components/ui/` over the
   corresponding Nuxt UI component. Adapters provide reusable project presets
   while preserving the underlying component API. Otherwise, use Nuxt UI
   directly. Check the chosen component API before building interface elements. Use
   library components for both controls and layout, including containers,
   headers, main content, separators, and button groups.
2. Preserve the components' default spacing and layout. Introduce custom HTML,
   Tailwind classes, or style overrides only as a last resort, after checking
   the library's capabilities and agreeing on the necessary exception with
   the user. Ask before making an unrequested visual change.
3. Prefer supported props such as `label` and `icon` for simple content. Use
   slots when props cannot express the required content, composing Nuxt UI
   components inside them where appropriate.
4. Consult the [component list](../context/nuxt-ui-components.md) only when
   adding or removing component usage. Update only the affected entries: add
   a missing name, or remove it after confirming its last application use
   was removed. Exclude comments and test-only usage. For project adapters,
   also record their source path and the Nuxt UI component they replace.
   Other UI changes do not require checking the list.

Before finishing a UI change, check that props are used where sufficient,
custom markup or styling has an agreed justification, and existing project
adapters are used where applicable.
