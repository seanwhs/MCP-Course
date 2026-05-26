// client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function runTestClient(){
  const baseUrl = new URL("http://localhost:3000/mcp");
  const client = new Client({
    name: "shopping-list-client",
    version: "1.0.0"
  });

  const transport = new StreamableHTTPClientTransport(baseUrl);
  await client.connect(transport);
  console.log("Connected to MCP Server successfully.\n");

  // 1. Initial get_items call
  console.log("--- Fetching Initial List ---");
  const initialItems = await client.callTool({ name: "get_items", arguments: {} });
  console.log(((initialItems as any).content[0] as any).text);

  // 2. Add a new item
  console.log("\n--- Adding Bananas ---");
  const addResult = await client.callTool({
    name: "add_item",
    arguments: { name: "Bananas", quantity: 3 }
  });
  const addText = ((addResult as any).content[0] as any).text;
  console.log(addText);

  // Extract runtime data targets safely
  const addResponse = JSON.parse(addText);
  const bananasId = addResponse.success ? addResponse.data.id : null;

  // 3. Update purchase target status
  if (bananasId) {
    console.log(`\n--- Updating Purchase Status (ID: ${bananasId}) ---`);
    const purchaseResult = await client.callTool({
      name: "set_purchased",
      arguments: { itemId: bananasId, purchased: true }
    });
    console.log(((purchaseResult as any).content[0] as any).text);

    // 4. Verification Step: Show only unpurchased items to ensure filter consistency
    console.log("\n--- Fetching Remaining Unpurchased Items ---");
    const unpurchasedItems = await client.callTool({ name: "get_items", arguments: { purchased: false } });
    console.log(((unpurchasedItems as any).content[0] as any).text);

    // 5. Remove the item
    console.log(`\n--- Removing Item (ID: ${bananasId}) ---`);
    const removeResult = await client.callTool({
      name: "remove_item",
      arguments: { itemId: bananasId }
    });
    console.log(((removeResult as any).content[0] as any).text);
  } else {
    console.error("Failed to fetch custom validation ID to continue clean lifecycle testing.");
  }
}

runTestClient().catch(console.error);