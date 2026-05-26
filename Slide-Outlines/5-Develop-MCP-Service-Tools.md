# 📘 Lesson Slide Outline: MCP Tools — Building a Shopping List Service

---

## **Slide 1 — Title**

**Building MCP Tools with TypeScript**

### Shopping List Manager (End-to-End MCP Service)

* MCP tools in real-world use
* Stateful server design
* Client ↔ server interaction
* Hands-on TypeScript implementation

---

## **Slide 2 — What We Learned Previously**

* MCP exposes 3 primitives:

  * tools
  * resources
  * prompts
* Clients can call server capabilities
* We already tested basic interactions

👉 Now we go deeper into **tools (the most important primitive today)**

---

## **Slide 3 — Why Tools Matter Most**

* Most AI agents today only support **tools**
* Tools = “actions the server can perform”
* Examples:

  * add item
  * fetch data
  * update state
* Tools define the **real power of MCP servers**

---

## **Slide 4 — What We Are Building**

### Shopping List MCP Service

We will build:

* Add items 🛒
* Remove items ❌
* Update purchase status ✅
* Fetch list 📦

👉 Goal: expose this as MCP tools for agents

---

## **Slide 5 — Step 1: Define Data Model (Start Small)**

```ts
interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
}
```

### Key idea:

* Every item must be uniquely identifiable
* We use `id` for updates/removal

---

## **Slide 6 — Step 2: Start Service Skeleton**

```ts
export class ShoppingListService {
  private items: ShoppingItem[] = [];

  constructor() {}
}
```

### Key idea:

* Business logic is isolated from MCP layer
* MCP only *calls* this service

---

## **Slide 7 — Step 3: Add Initial Sample Data**

```ts
constructor() {
  this.items = [
    { id: randomUUID(), name: "Milk", quantity: 2, purchased: true },
    { id: randomUUID(), name: "Bread", quantity: 1, purchased: false }
  ];
}
```

### Key idea:

* Preload sample state for testing
* Simulates real-world dataset

---

## **Slide 8 — Step 4: Add Core Method (Read)**

```ts
getItems(purchased?: boolean): ShoppingItem[] {
  if (purchased === undefined) return [...this.items];
  return this.items.filter(i => i.purchased === purchased);
}
```

### Key idea:

* Optional filtering
* Read-only access pattern

---

## **Slide 9 — Step 5: Add Write Method (Create)**

```ts
addItem(name: string, quantity: number): ShoppingItem {
  const item = {
    id: randomUUID(),
    name,
    quantity,
    purchased: false
  };

  this.items.push(item);
  return item;
}
```

### Key idea:

* Server owns state mutation
* Always return created object

---

## **Slide 10 — Step 6: Update + Delete Methods**

```ts
removeItem(id: string): boolean {
  const index = this.items.findIndex(i => i.id === id);
  if (index === -1) return false;

  this.items.splice(index, 1);
  return true;
}

setPurchased(id: string, purchased = true): boolean {
  const item = this.items.find(i => i.id === id);
  if (!item) return false;

  item.purchased = purchased;
  return true;
}
```

### Key idea:

* Update by ID (critical MCP pattern)
* Boolean result = success/failure signal

---

## **Slide 11 — Step 7: MCP Server Skeleton**

```ts
const server = new McpServer({
  name: "shopping-list-server",
  version: "1.0.0"
});

const service = new ShoppingListService();
```

### Key idea:

* Server = MCP layer
* Service = business logic layer

---

## **Slide 12 — Step 8: Tool Registration Pattern**

Every tool follows:

```ts
server.registerTool(
  "tool_name",
  {
    description: "...",
    inputSchema: { }
  },
  (args) => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify(...)
      }]
    };
  }
);
```

### Key idea:

* Schema = contract for AI agents
* Handler = business logic bridge

---

## **Slide 13 — Step 9: Build FIRST Tool (get_items)**

```ts
purchased: z.boolean().optional()
```

```ts
const items = service.getItems(purchased);
```

### Response pattern:

```ts
{
  success: true,
  message: "...",
  data: items
}
```

### Key idea:

* Read tools are simplest MCP entry point

---

## **Slide 14 — Step 10: Add Item Tool**

```ts
name: z.string()
quantity: z.number().positive()
```

```ts
const newItem = service.addItem(name, quantity);
```

### Key idea:

* Strong validation using Zod
* Prevent invalid agent inputs

---

## **Slide 15 — Step 11: Remove Tool**

```ts
itemId: z.string()
```

```ts
const success = service.removeItem(itemId);
```

### Key idea:

* ID-based mutation pattern
* Always return success flag

---

## **Slide 16 — Step 12: Update Tool**

```ts
itemId: z.string()
purchased: z.boolean().default(true)
```

```ts
service.setPurchased(itemId, purchased);
```

### Key idea:

* Default parameters matter for agents
* Reduces tool-call complexity

---

## **Slide 17 — Step 13: Stateful MCP Server (Critical Concept)**

```ts
const transports: Record<string, Transport> = {};
```

* Each client gets its own server instance
* Each session = isolated shopping list

### Key idea:

👉 MCP servers are **stateless unless YOU design state**

---

## **Slide 18 — Step 14: Session Creation Flow**

```ts
if (!transport && isInitializeRequest(req.body)) {
  const server = createMcpServer();
  await server.connect(transport);
}
```

### Key idea:

* New client → new server instance
* Enables multi-user isolation

---

## **Slide 19 — Step 15: Client Testing Flow**

Steps:

1. Connect client
2. Call `get_items`
3. Call `add_item`
4. Capture ID
5. Call update tool
6. Call remove tool

### Key idea:

👉 MCP tools behave like an API for agents

---

## **Slide 20 — End-to-End Flow**

```text
Client → MCP Tool Call → Server Tool Handler → Service → Response → Client
```

### Mental model:

* MCP = transport + contract layer
* Service = business logic
* Tools = bridge between them

---

## **Slide 21 — Summary**

You built:

* A real MCP tool system
* A stateful server architecture
* A reusable service layer
* Fully testable client interactions

### Core takeaway:

👉 MCP tools = the “functions” agents actually call
