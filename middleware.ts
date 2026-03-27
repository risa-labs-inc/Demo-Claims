export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/', '/my-cases', '/completed', '/inaccuracy', '/denied'],
}
