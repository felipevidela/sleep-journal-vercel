import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import MicrosoftProvider from 'next-auth/providers/azure-ad';
import { sql } from '@vercel/postgres';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    MicrosoftProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        // Create users table if it doesn't exist
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE NOT NULL,
            image TEXT,
            provider VARCHAR(100),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        // Upsert user
        await sql`
          INSERT INTO users (id, name, email, image, provider, created_at, updated_at)
          VALUES (${user.id || crypto.randomUUID()}, ${user.name}, ${user.email}, ${user.image}, ${account?.provider || 'unknown'}, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            image = EXCLUDED.image,
            updated_at = NOW()
        `;
        
        return true;
      } catch (error) {
        console.error('Error creating user:', error);
        return false;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };