import { NextRequest, NextResponse } from 'next/server';
import { monitorAllMembersPerformance } from '@/lib/db/actions';

/**
 * POST /api/performance/monitor
 * 
 * Triggers AI-powered performance monitoring for all members in the organization.
 * Only accessible by Admin, Owner, or Manager roles.
 */
export async function POST(req: NextRequest) {
  try {
    const result = await monitorAllMembersPerformance();
    
    return NextResponse.json({
      success: result.success,
      message: `Performance monitoring completed. Evaluated ${result.evaluated} member(s).`,
      evaluated: result.evaluated,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Error monitoring performance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to monitor performance',
      },
      { status: 500 }
    );
  }
}

