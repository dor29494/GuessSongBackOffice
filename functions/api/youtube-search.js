// Cloudflare Pages Function for YouTube API search
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
  const query = url.searchParams.get('q');
  const maxResults = url.searchParams.get('maxResults') || '10';

  if (!query) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing query parameter'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults,
      key: apiKey,
      videoCategoryId: '10' // Music category
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'YouTube API request failed');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: data.items || []
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
