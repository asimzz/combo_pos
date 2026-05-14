import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        const role = token?.role

        // ADMIN-only sections
        if (
          path.startsWith('/expenses') ||
          path.startsWith('/staff') ||
          path.startsWith('/books') ||
          path.startsWith('/settings')
        ) {
          return role === 'ADMIN'
        }

        // ADMIN + MANAGER sections
        if (
          path.startsWith('/dashboard') ||
          path.startsWith('/catalog') ||
          path.startsWith('/stock')
        ) {
          return role === 'ADMIN' || role === 'MANAGER'
        }

        // Any authenticated user
        if (
          path.startsWith('/sell') ||
          path.startsWith('/orders') ||
          path.startsWith('/inbox')
        ) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sell/:path*',
    '/orders/:path*',
    '/inbox/:path*',
    '/catalog/:path*',
    '/stock/:path*',
    '/expenses/:path*',
    '/staff/:path*',
    '/books/:path*',
    '/settings/:path*',
  ],
}
