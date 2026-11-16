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
        header: 'p-3 pb-2 sm:px-3',

        title: 'text-toned',
        description: 'mt-1 text-muted text-sm',
        body: 'p-3 sm:p-3',
        footer: 'p-3 sm:px-3',
      },
    },
    collapsible: {
      slots: {
        root: 'w-full',
        content:
          'flex gap-2 pt-3 data-[state=open]:animate-[collapsible-down_200ms_var(--ease-out)] data-[state=closed]:animate-[collapsible-up_200ms_var(--ease-out)] data-[state=closed]:overflow-hidden',
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
    slider: {
      defaultVariants: {
        color: 'primary',
        size: 'sm',
      },
    },
    //
    pageCard: {
      slots: {
        root: 'relative flex rounded-lg',
        spotlight:
          'absolute inset-0 rounded-[inherit] pointer-events-none bg-default/90',
        container:
          'relative flex flex-col flex-1 lg:grid gap-x-8 gap-y-4 p-2 sm:p-3',
        wrapper: 'flex flex-col flex-1 items-start',
        // header: 'mb-4',
        header: 'grid grid-cols-[1.5rem_minmax(0,1fr)_max-content] w-full',
        body: 'flex flex-wrap gap-3 items-center justify-between w-full pl-6',
        // body: 'flex-1',
        footer: 'pt-3 w-full',
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

    // nav
    navigationMenu: {
      slots: {
        // root: 'relative flex gap-1.5 [&>div]:min-w-0',
        // list: 'isolate min-w-0',
        // label:
        //   'w-full flex items-center gap-1.5 font-semibold text-xs/5 text-highlighted px-2.5 py-1.5',
        // item: 'min-w-0',
        link: 'group relative w-full max-w-80 mx-auto flex items-center gap-1.5 font-medium text-sm before:absolute before:z-[-1] before:rounded-md focus:outline-none focus-visible:outline-none focus-visible:before:outline-3',
        linkLeadingIcon: 'shrink-0 size-5 mr-1',
        // linkLeadingAvatar: 'shrink-0',
        // linkLeadingAvatarSize: '2xs',
        // linkLeadingChipSize: 'sm',
        // linkTrailing: 'group ms-auto inline-flex gap-1.5 items-center',
        // linkTrailingBadge: 'shrink-0',
        // linkTrailingBadgeSize: 'sm',
        // linkTrailingIcon:
        //   'size-5 transform shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-200 ease-out motion-reduce:transition-none',
        linkLabel: 'truncate font-light uppercase tracking-widest',
        // linkLabelExternalIcon: 'inline-block size-3 align-top text-dimmed',
        // childList: 'isolate',
        // childLabel: 'text-xs text-highlighted',
        // childItem: '',
        // childLink:
        //   'group relative size-full flex items-start text-start text-sm before:absolute before:z-[-1] before:rounded-md focus:outline-none focus-visible:outline-none focus-visible:before:outline-3',
        // childLinkWrapper: 'min-w-0',
        // childLinkIcon: 'size-5 shrink-0',
        // childLinkLabel: 'truncate',
        // childLinkLabelExternalIcon: 'inline-block size-3 align-top text-dimmed',
        // childLinkDescription: 'text-muted',
        separator: 'px-2 h-px bg-border my-2',
        // viewportWrapper: 'absolute top-full start-0 flex w-full',
        // viewport:
        //   'relative overflow-hidden bg-default shadow-lg rounded-md ring ring-default h-(--reka-navigation-menu-viewport-height) w-full transition-[width,height,left,right] duration-200 ease-out motion-reduce:transition-none origin-[top_center] data-[state=open]:animate-[scale-in_100ms_var(--ease-out)] data-[state=closed]:animate-[scale-out_100ms_var(--ease-out)] z-1',
        // content: '',
        // indicator:
        //   'absolute left-0 data-[state=visible]:animate-[fade-in_100ms_var(--ease-out)] data-[state=hidden]:animate-[fade-out_100ms_var(--ease-out)] data-[state=hidden]:opacity-0 bottom-0 z-2 w-(--reka-navigation-menu-indicator-size) translate-x-(--reka-navigation-menu-indicator-position) flex h-2.5 items-end justify-center overflow-hidden transition-[translate,width] duration-200 ease-out motion-reduce:transition-none',
        // arrow:
        //   'relative top-[50%] size-2.5 rotate-45 border border-default bg-default z-1 rounded-xs',
      },
    },
  },
})
