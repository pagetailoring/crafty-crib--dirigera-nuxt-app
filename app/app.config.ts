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
    card: {
      slots: {
        // root: 'rounded-lg overflow-hidden',
        header: 'p-3 pb-2 sm:px-3',
        // title: 'text-highlighted font-semibold',
        title: 'text-toned',
        description: 'mt-1 text-muted text-sm',
        body: 'p-3 sm:p-3',
        footer: 'p-3 sm:px-3',
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
      base: 'grid gap-4 my-2 w-full max-w-(--ui-container) mx-auto px-4 py-1 sm:px-6 lg:px-8 ',
    },
    pageColumns: {
      base: 'relative columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 *:break-inside-avoid-column *:will-change-transform',
    },
  },
})
