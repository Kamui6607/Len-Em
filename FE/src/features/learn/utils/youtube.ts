/** Extract YouTube video ID from various YouTube URL formats. */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}
