import { NextResponse } from "next/server";

export async function POST(request) {
    const { headers } = request;
    const targetUrl = headers.get("x-fal-target-url");

    if (!targetUrl) {
        return NextResponse.json(
            { error: "x-fal-target-url header is missing" },
            { status: 400 }
        );
    }

    const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
            Accept: "application/json",
            ...(headers.get("content-type") ? { "Content-Type": headers.get("content-type") } : {}),
        },
        body: request.body,
        // @ts-ignore
        duplex: "half",
    });

    return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
    });
}

export async function GET(request) {
    const { headers } = request;
    const targetUrl = headers.get("x-fal-target-url");

    if (!targetUrl) {
        return NextResponse.json(
            { error: "x-fal-target-url header is missing" },
            { status: 400 }
        );
    }

    const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
            Authorization: `Key ${process.env.FAL_KEY}`,
            Accept: "application/json",
        },
    });

    return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
    });
}
