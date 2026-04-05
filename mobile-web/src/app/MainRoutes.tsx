// ABOUTME: Route-switch wrapper for the mobile-web main view.
// ABOUTME: Keeps routing isolated from AppShell so it can be dropped in with a one-line edit.
import { ChannelsListPage } from "../features/channels/ChannelsListPage";
import { HomeFeedPage } from "../features/feed/HomeFeedPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { useRoute } from "../lib/router";

export function MainRoutes() {
  const route = useRoute();
  const { pathname } = route;

  if (pathname === "/" || pathname === "/channels" || pathname.startsWith("/channels")) {
    return <ChannelsListPage />;
  }

  if (pathname === "/feed" || pathname.startsWith("/feed")) {
    return <HomeFeedPage />;
  }

  if (pathname === "/profile" || pathname.startsWith("/profile")) {
    return <ProfilePage />;
  }

  return <ComingSoon title="Not found" description={`No route matches ${pathname}.`} />;
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
