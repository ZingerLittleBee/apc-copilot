import {NextRequest} from "next/server";
import { LangfuseClient } from "@langfuse/client";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const langfuse = new LangfuseClient();

    if (id) {
        const trace = await langfuse.api.trace.get(id);
        return Response.json(trace);
    } else {
        const traces = await langfuse.api.trace.list({
            tags: ['apc-ai']
        });
        return Response.json(traces);
    }
}
