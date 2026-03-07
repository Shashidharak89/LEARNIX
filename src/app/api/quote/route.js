export async function GET() {
  try {
    const res = await fetch("https://zenquotes.io/api/random", {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return Response.json(
        { error: `Upstream error: ${res.status}` },
        { status: res.status }
      );
    }

    const [data] = await res.json(); // zenquotes returns an array
    return Response.json({
      content: data.q,
      author:  data.a,
    });
  } catch (err) {
    return Response.json(
      { error: "Failed to reach quote API" },
      { status: 502 }
    );
  }
}
