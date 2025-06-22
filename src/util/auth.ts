import { getUserByEmail, getUserByUsername } from "@/lib/queries/users";
import { compare } from "bcrypt";
import type {
	GetServerSidePropsContext,
	NextApiRequest,
	NextApiResponse,
} from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// You'll need to import and pass this
// to `NextAuth` in `app/api/auth/[...nextauth]/route.ts`
export const config = {
	session: {
		strategy: "jwt",
	},
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials, req) {
				console.log("Credentials received: heress", credentials);
				try {
					const user = await getUserByUsername(credentials?.username || "");

					console.log("User fetched from database:", user);

					if (!user) {
						console.error("User not found for username:", credentials?.username);
						return null;
					}

					const isPasswordValid = await compare(
						credentials?.password || "",
						user.password
					);

					if (!isPasswordValid) {
						console.error("Invalid password for user:", credentials?.username);
						return null;
					}
					// If no error and we have user data, return it
					return {
						email: user.email,
						name: user.username,
						id: user.id,
					};
				} catch (error) {
					console.error("Error during authorization:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async session({ session }) {
			const user = await getUserByEmail(session.user?.email || "");
			// Add user ID to session object
			if (session.user && user) {
				session.user.id = user.id;
				session.user.tenantId = user.tenantId; // Add tenantId if needed
			}
			return session;
		},
		async jwt({ token }) {
			const user = await getUserByEmail(token.email || "");
			// If user is defined, add user ID to token
			if (user) {
				token.access = user.id;
			}
			return token;
		},
	},
} satisfies NextAuthOptions;

// Use it in server contexts
export function auth(
	...args:
		| [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
		| [NextApiRequest, NextApiResponse]
		| []
) {
	return getServerSession(...args, config);
}
