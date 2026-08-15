import { OFFLINE_LIBRARY_RELEASE_DATE, OFFLINE_LIBRARY_VERSION } from "@/lib/offline-library-version";

export function GET() {
  return Response.json({version:OFFLINE_LIBRARY_VERSION,releaseDate:OFFLINE_LIBRARY_RELEASE_DATE},{headers:{"Cache-Control":"no-store, max-age=0"}});
}

