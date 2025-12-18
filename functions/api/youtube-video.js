// Cloudflare Pages Function for YouTube video details
// This keeps the API key secure on the server side

export async function onRequest(context) {
  const apiKey = context.env.VITE_YOUTUBE_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'YouTube API key not configured'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Get query parameters from the request
  const url = new URL(context.request.url);
  const videoId = url.searchParams.get('id');

  if (!videoId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing video ID parameter'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: apiKey
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: data.items?.[0] || null
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
