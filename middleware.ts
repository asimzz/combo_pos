import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes for admin/manager only
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return token?.role === 'ADMIN' || token?.role === 'MANAGER'
        }

        // Protect POS routes for authenticated users only
        if (req.nextUrl.pathname.startsWith('/pos')) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/pos/:path*']
}