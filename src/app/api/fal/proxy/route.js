import { NextResponse } from "next/server";

async function handleRequest(request) {
    const { headers, method } = request;
    const targetUrl = headers.get("x-fal-target-url");

    console.log(`🔍 [Fal Proxy] ${method} request received`);
    console.log(`🔍 [Fal Proxy] Target URL: ${targetUrl || 'MISSING'}`);

    if (!process.env.FAL_KEY) {
        console.error("❌ [Fal Proxy] FAL_KEY is missing from env variables");
        return NextResponse.json(
            { error: "Server configuration error: FAL_KEY missing" },
            { status: 500 }
        );
    }

    if (!targetUrl) {
        console.error("❌ [Fal Proxy] x-fal-target-url header is missing");
        return NextResponse.json(
            { error: "x-fal-target-url header is missing" },
            { status: 400 }
        );
    }

    try {
        const fetchOptions = {
            method: method,
            headers: {
                Authorization: `Key ${process.env.FAL_KEY}`,
                Accept: "application/json",
            },
        };

        // Forward Content-Type if present
        if (headers.get("content-type")) {
            fetchOptions.headers["Content-Type"] = headers.get("content-type");
        }

        // Forward Content-Length if present (important for uploads)
        if (headers.get("content-length")) {
            fetchOptions.headers["Content-Length"] = headers.get("content-length");
        }

        // Attach body for non-GET/HEAD requests
        if (method !== "GET" && method !== "HEAD") {
            fetchOptions.body = request.body;
            // @ts-ignore
            fetchOptions.duplex = "half";
        }

        const response = await fetch(targetUrl, fetchOptions);

        console.log(`🔍 [Fal Proxy] Upstream response status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Fal Proxy] Upstream error (${response.status}):`, errorText);
            return new NextResponse(errorText, {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
        });
    } catch (error) {
        console.error("❌ [Fal Proxy] Internal Fetch Error:", error);
        return NextResponse.json(
            { error: `Internal/Network error: ${error.message}` },
            { status: 500 }
        );
    }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
