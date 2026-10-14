export default defineAppConfig({
  ui: {
    button: {
      defaultVariants: {
        color: 'neutral',
        variant: 'outline',
        size: 'lg',
      },
    },
    container: {
      base: 'grid gap-4 my-2 w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8 ',
    },
  },
})
