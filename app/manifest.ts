import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fusto",
    short_name: "Fusto",
    description: "Una foto per ogni birra, tra amici.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c0392b",
    icons: [
      {
        src: "/manifest-icon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
