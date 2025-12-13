import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [Google],
  callbacks: {
    // Include user ID in session for leaderboard
    session({ session, token }) {
      console.log('[Auth] Session callback:', {
        userId: token.sub,
        email: session.user?.email,
        hasUser: !!session.user
      });
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('[Auth] Sign-in attempt:', {
        provider: account?.provider,
        userId: user.id,
        email: user.email,
      });
      return true;
    },
  },
  trustHost: true,
})
