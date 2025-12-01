import { NextRequest, NextResponse } from 'next/server';
import { addTaskComment, getTaskComments } from '@/lib/db/actions';

/**
 * GET /api/tasks/[taskId]/comments
 * Get all comments for a task
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const comments = await getTaskComments(taskId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch comments',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks/[taskId]/comments
 * Add a comment to a task
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await addTaskComment(taskId, content);
    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}

