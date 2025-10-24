import {type NextRequest, NextResponse} from "next/server";
import { LangfuseClient } from "@langfuse/client";
import type {Traces, TraceWithFullDetails} from '@langfuse/core'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const langfuse = new LangfuseClient();

    let trace : Traces | TraceWithFullDetails
    if (!id) {
         trace = await langfuse.api.trace.list();
    } else {
         trace = await langfuse.api.trace.get(id);
    }


// Fetch list of observations, supports filters and pagination
//     const observations = await langtfuse.api.observations.getMany();
//     console.log('observations', observations);

// Fetch a single observation by ID
//     const observation = await langfuse.api.observations.get("observationId");


// Fetch list of scores
//     const scores = await langfuse.api.scoreV2.get();
//     console.log('scores', scores);

// Fetch a single score by ID
//     const score = await langfuse.api.scoreV2.getById("scoreId");

    return NextResponse.json({ data: trace });
}
