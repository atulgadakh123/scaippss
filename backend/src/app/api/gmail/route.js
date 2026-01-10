import axios from "axios";

export async function GET(req) {
  const ACCESS_TOKEN = "ya29.a0Aa7pCA9KJUTyLlbPX1d3yyDfSXmr0pwjiiph_MAPXF1ysiwjkREP1VYMmcrws1zleJQ5ApxuOBSFNsrIIu0yzUYh6A-Ni4kaFjtVmzMbwfTseibF9bRq2B7B5vZK7LgHU0q0IbGpI9MZPRG66hDFzwto_vopRutLGirRhHtbCZtshcYitRRYOQfgnhJQnwq9PEcCn0EaCgYKATQSARMSFQHGX2MioyThSGWx2o3WOX84EXTtMg0206";

  try {
    const listRes = await axios.get(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params: { maxResults: 10 },
      }
    );

    const messages = listRes.data.messages || [];
    const fullMails = await Promise.all(
      messages.map(msg =>
        axios
          .get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
          })
          .then(res => res.data)
      )
    );

    return new Response(JSON.stringify(fullMails), { status: 200 });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return new Response(JSON.stringify({ error: "Failed to fetch mails" }), { status: 500 });
  }
}
