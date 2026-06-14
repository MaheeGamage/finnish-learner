import { auth } from '@/lib/auth';
import { signInWithGoogle } from '@/lib/authActions';
import UserMenuDropdown from './UserMenuDropdown';

// Server component: reads the session and renders either a sign-in button or the
// signed-in user dropdown (identity + sign out).
export default async function UserMenu() {
  const session = await auth();

  if (!session?.user) {
    return (
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Sign in
        </button>
      </form>
    );
  }

  return (
    <UserMenuDropdown
      user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
    />
  );
}
