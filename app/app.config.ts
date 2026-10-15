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
    switch: {
      defaultVariants: {
        color: 'primary',
        size: 'xl',
      },
    },

    //
    container: {
      base: 'grid gap-4 my-2 w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 ',
    },
    pageColumns: {
      base: 'relative columns-1 md:columns-2 lg:columns-3 gap-4 space-y-8 *:break-inside-avoid-column *:will-change-transform',
    },
  },
})
