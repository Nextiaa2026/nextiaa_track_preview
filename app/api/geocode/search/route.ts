import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import axios from "axios";

const USER_AGENT = "2NP/1.0 (internal geocoder; https://github.com/)";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 3) {
      return NextResponse.json([]);
    }

    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        q,
        addressdetails: 1,
        limit: 8,
      },
      headers: {
        "Accept-Language": request.headers.get("Accept-Language") ?? "en",
        "User-Agent": USER_AGENT,
      },
      timeout: 5000,
    });

    return NextResponse.json(Array.isArray(response.data) ? response.data : []);
  } catch (error: any) {
    console.log("Geocode search ERROR:", error.response?.data || error.message);
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        console.error("Geocode search TIMEOUT (axios):", error.message);
        return NextResponse.json(
          { error: "Geocoding request timed out. Please try again." },
          { status: 504 },
        );
      }
      
      console.error("Geocode search AXIOS ERROR:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });

      return NextResponse.json(
        { error: `Geocoder error: ${error.message}` },
        { status: error.response?.status || 502 },
      );
    }

    console.error("Geocode search UNEXPECTED ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error during geocoding" },
      { status: 500 },
    );
  }
}
