export async function GET({ params }:{ params: any}) {
  return new Response(JSON.stringify(params), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}