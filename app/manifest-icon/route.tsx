import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get("size")) || 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d97706",
          fontSize: Math.round(size * 0.6),
        }}
      >
        🍺
      </div>
    ),
    { width: size, height: size },
  );
}
