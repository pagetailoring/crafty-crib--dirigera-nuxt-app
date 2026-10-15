export default defineAppConfig({
  ui: {
    badge: {
      // tabular-nums
      defaultVariants: {
        color: 'secondary',
        variant: 'subtle',
        size: 'md',
      },
    },
    button: {
      defaultVariants: {
        color: 'neutral',
        variant: 'outline',
        size: 'lg',
      },
    },
    checkboxGroup: {
      defaultVariants: {
        highlight: false,
        size: 'md',
        variant: 'card',
        color: 'secondary',
      },
    },
    container: {
      base: 'grid gap-4 my-2 w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 ',
    },
    switch: {
      defaultVariants: {
        color: 'primary',
        size: 'xl',
      },
    },
  },
})
