import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRecentActivityFeed } from "@/lib/activity/feed";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feed = await getRecentActivityFeed(session);
    return NextResponse.json({ success: true, data: feed.items, meta: feed.meta });
  } catch (e) {
    console.error("[activity GET]", e);
    return NextResponse.json({
      success: true,
      data: [],
      meta: { canPostAnnouncements: false, canManageAnnouncementAccess: false, isApprover: false },
    });
  }
}
