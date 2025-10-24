"use server"

import {LangfuseClient} from "@langfuse/client";

export async function getTraceList() {
    const langfuse = new LangfuseClient();
    return langfuse.api.trace.list({
        tags: ['apc-ai']
    });
}

export async function getTraceDetail(id: string) {
    const langfuse = new LangfuseClient();
    return langfuse.api.trace.get(id);
}
