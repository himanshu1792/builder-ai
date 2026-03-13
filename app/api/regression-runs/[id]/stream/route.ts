import { NextRequest } from "next/server";
import {
  runRegressionPipeline,
  type RegressionSSEEvent,
} from "@/lib/agents/regression/pipeline";

/**
 * GET /api/regression-runs/[id]/stream — SSE endpoint for regression pipeline events.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const emit = (event: RegressionSSEEvent) => {
        const data = JSON.stringify(event.data);
        controller.enqueue(
          encoder.encode(`event: ${event.event}\ndata: ${data}\n\n`)
        );

        if (event.event === "done" || event.event === "error_event") {
          try {
            controller.close();
          } catch {
            // Stream already closed
          }
        }
      };

      runRegressionPipeline(id, emit).catch((error) => {
        const message = error instanceof Error ? error.message : "Pipeline failed";
        try {
          controller.enqueue(
            encoder.encode(
              `event: error_event\ndata: ${JSON.stringify({ message })}\n\n`
            )
          );
          controller.close();
        } catch {
          // Stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
