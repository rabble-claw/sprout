// ABOUTME: Route-switch wrapper for the mobile-web main view.
// ABOUTME: Keeps routing isolated from AppShell so it can be dropped in with a one-line edit.
import { ChannelsListPage } from "../features/channels/ChannelsListPage";
import { ChannelDetailPage } from "../features/channels/detail/ChannelDetailPage";
import { HomeFeedPage } from "../features/feed/HomeFeedPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { SearchPage } from "../features/search/SearchPage";
import { matchPath, useRoute } from "../lib/router";

export function MainRoutes() {
  const route = useRoute();
  const { pathname } = route;

  if (pathname === "/" || pathname === "/channels") {
    return <ChannelsListPage />;
  }

  if (matchPath("/channels/:channelId", pathname)) {
    return <ChannelDetailPage />;
  }

  if (pathname === "/feed" || pathname.startsWith("/feed")) {
    return <HomeFeedPage />;
  }

  if (pathname === "/search" || pathname.startsWith("/search")) {
    return <SearchPage />;
  }

  if (pathname === "/profile" || pathname.startsWith("/profile")) {
    return <ProfilePage />;
  }

  return <NotFound pathname={pathname} />;
}

function NotFound({ pathname }: { pathname: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
      <p className="text-sm font-medium">Not found</p>
      <p className="mt-1 text-xs text-muted-foreground">No route matches {pathname}.</p>
    </div>
  );
}
