import { NextRequest, NextResponse } from "next/server";
import { getInviteByToken } from "@/lib/db/invites";
import { getInvites } from "@/lib/db/actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // If token is provided, get specific invite
    if (token) {
      const invite = await getInviteByToken(token);

      if (!invite) {
        return NextResponse.json(
          { error: "Invalid or expired invite" },
          { status: 404 }
        );
      }

      return NextResponse.json(invite);
    }

    // Otherwise, get all invites for current organization
    try {
      const invites = await getInvites();
      return NextResponse.json(invites);
    } catch (error) {
      // User might not have permission
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

