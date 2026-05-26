// mcp-server.ts
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ShoppingListService } from "./shopping-list-service.js";

export function createMcpServer():{ server: McpServer } {
  // Create server instance
  const server = new McpServer({
    name: "shopping-list-server",
    version: "1.0.0"
  });

  // Create service instance
  const service = new ShoppingListService();

  // Register all tools
  registerShoppingListTools(server, service);

  return { server };
}

function registerShoppingListTools(server: McpServer, service: ShoppingListService){
  // 1. Get Items Tool
  server.registerTool(
    "get_items",
    {
      description: "Get shopping list items with optional filtering by purchase status",
      inputSchema: {
        purchased: z.boolean().optional().describe("Filter by purchase status. If not provided, returns all items.")
      }
    },
    ({ purchased }) => {
      try {
        const items = service.getItems(purchased);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Retrieved ${items.length} item(s)`,
              data: items
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, message: "Failed to retrieve items" }, null, 2)
          }]
        };
      }
    }
  );

  // 2. Add Item Tool
  server.registerTool(
    "add_item",
    {
      description: "Add a new item to the shopping list",
      inputSchema: {
        name: z.string().describe("Name of the item to add"),
        quantity: z.number().positive().describe("Quantity of the item")
      }
    },
    ({ name, quantity }) => {
      try {
        const newItem = service.addItem(name, quantity);
        if (newItem && newItem.id) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Item added successfully",
                data: newItem
              }, null, 2)
            }]
          };
        }
        throw new Error("Invalid item returned");
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: false, message: "Failed to add item" }, null, 2)
          }]
        };
      }
    }
  );

  // 3. Remove Item Tool
  server.registerTool(
    "remove_item",
    {
      description: "Remove an item from the shopping list",
      inputSchema: {
        itemId: z.string().describe("ID of the item to remove")
      }
    },
    ({ itemId }) => {
      const success = service.removeItem(itemId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: success,
            message: success ? "Item removed successfully" : "Item not found"
          }, null, 2)
        }]
      };
    }
  );

  // 4. Set Purchased Tool
  server.registerTool(
    "set_purchased",
    {
      description: "Mark an item as purchased or not purchased",
      inputSchema: {
        itemId: z.string().describe("ID of the item to update"),
        purchased: z.boolean().default(true).describe("Purchase status to set")
      }
    },
    ({ itemId, purchased }) => {
      const success = service.setPurchased(itemId, purchased);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: success,
            message: success
              ? `Item marked as ${purchased ? 'purchased' : 'not purchased'}`
              : "Item not found"
          }, null, 2)
        }]
      };
    }
  );
}