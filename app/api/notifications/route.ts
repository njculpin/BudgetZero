import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, is_read, mark_all_read } = body;

    if (mark_all_read) {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all as read:", error);
        return NextResponse.json(
          { error: "Failed to mark all as read" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!notification_id) {
      return NextResponse.json(
        { error: "notification_id required" },
        { status: 400 },
      );
    }

    // Update single notification
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read,
        read_at: is_read ? new Date().toISOString() : null,
      })
      .eq("id", notification_id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting notification:", error);
      return NextResponse.json(
        { error: "Failed to delete notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
