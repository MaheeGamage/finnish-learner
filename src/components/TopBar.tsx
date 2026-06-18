import TopBarClient from './TopBarClient';
import UserMenu from './UserMenu';

// Server wrapper: renders the session-aware UserMenu (a server component) and hands it to the
// client bar, which owns the responsive layout + mobile hamburger menu.
export default function TopBar() {
  return <TopBarClient userMenu={<UserMenu />} />;
}
