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
    pageCard: {
      slots: {
        root: 'relative  flex rounded-lg',
        spotlight:
          'absolute inset-0 rounded-[inherit] pointer-events-none bg-default/90',
        container:
          'relative flex flex-col flex-1 lg:grid gap-x-8 gap-y-4 p-2 sm:p-3',
        wrapper: 'flex flex-col flex-1 items-start',
        // header: 'mb-4',
        header: 'grid grid-cols-[1.5rem_minmax(0,1fr)_max-content] w-full',
        body: 'flex flex-wrap gap-3 items-center justify-between w-full',
        // body: 'flex-1',
        footer: 'pt-4 mt-auto',
        leading: 'inline-flex items-center mb-2.5',
        leadingIcon: 'size-5 shrink-0 text-primary',
        title: 'text-base text-pretty font-semibold text-highlighted',
        description: 'text-[15px] text-pretty',
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
