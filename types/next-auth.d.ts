import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      phone: string
      name: string
      role: string
    }
  }

  interface User {
    id: string
    phone: string
    name: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    phone: string
  }
}
