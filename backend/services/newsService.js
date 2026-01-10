export async function fetchLatestNews() {
  const apiUrl = `https://newsdata.io/api/1/latest?apikey=pub_f039be14b86241899df134a1b7d2a40b&q=technology&country=in,am,cn,ru,us&category=technology,science,education&language=en&timezone=Asia/Kolkata`;

  const response = await fetch(apiUrl);

  console.log("Response status:", response.status); // 👈 log HTTP status

  if (!response.ok) {
    throw new Error(`News API request failed with status ${response.status}`);
  }

  return response.json();
}
