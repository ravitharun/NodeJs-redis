


await client.set("name", "Tharun");
const value = await client.get("name");
console.log(value); // Tharun
export default client;