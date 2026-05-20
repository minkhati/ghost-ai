import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { NODE_COLORS, SHAPE_SIZES } from "@/types/canvas";
import type { ShapeType } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function n(
  id: string,
  label: string,
  shape: ShapeType,
  colorIndex: number,
  x: number,
  y: number
): CanvasNode {
  const { bg, text } = NODE_COLORS[colorIndex];
  const { width, height } = SHAPE_SIZES[shape];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: bg, textColor: text, shape },
    width,
    height,
  };
}

function e(id: string, source: string, target: string): CanvasEdge {
  return { id, source, target, type: "canvasEdge", data: {} };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
  nodes: [
    n("gw",        "API Gateway",      "pill",      1, 260,  30),
    n("auth",      "Auth Service",     "rectangle", 2,  40, 190),
    n("users",     "User Service",     "rectangle", 1, 260, 190),
    n("orders",    "Order Service",    "rectangle", 3, 480, 190),
    n("user-db",   "User DB",          "cylinder",  0, 160, 370),
    n("order-db",  "Order DB",         "cylinder",  0, 480, 370),
    n("broker",    "Message Broker",   "hexagon",   7, 720, 190),
    n("notif",     "Notifications",    "pill",      4, 640, 370),
    n("analytics", "Analytics",        "pill",      6, 800, 370),
  ],
  edges: [
    e("e1", "gw",     "auth"),
    e("e2", "gw",     "users"),
    e("e3", "gw",     "orders"),
    e("e4", "users",  "user-db"),
    e("e5", "orders", "order-db"),
    e("e6", "orders", "broker"),
    e("e7", "broker", "notif"),
    e("e8", "broker", "analytics"),
  ],
};

const cicd: CanvasTemplate = {
  id: "cicd",
  name: "CI/CD Pipeline",
  description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
  nodes: [
    n("source",   "Source Code", "rectangle", 1,  40, 160),
    n("build",    "Build",       "rectangle", 3, 240, 160),
    n("test",     "Test",        "rectangle", 6, 440, 160),
    n("stage",    "Staging",     "rectangle", 2, 640, 160),
    n("prod",     "Production",  "pill",      7, 840, 160),
    n("artifact", "Artifacts",   "cylinder",  0, 240, 320),
    n("monitor",  "Monitoring",  "hexagon",   5, 840, 320),
  ],
  edges: [
    e("e1", "source",   "build"),
    e("e2", "build",    "test"),
    e("e3", "test",     "stage"),
    e("e4", "stage",    "prod"),
    e("e5", "build",    "artifact"),
    e("e6", "prod",     "monitor"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
  nodes: [
    n("prod1",  "User Events",    "pill",      1,  40,  60),
    n("prod2",  "Order Events",   "pill",      3,  40, 230),
    n("prod3",  "Payment Events", "pill",      6,  40, 400),
    n("bus",    "Event Bus",      "hexagon",   7, 330, 230),
    n("cons1",  "Email Service",  "rectangle", 4, 620,  60),
    n("cons2",  "Analytics",      "rectangle", 2, 620, 230),
    n("cons3",  "Audit Log",      "rectangle", 0, 620, 400),
  ],
  edges: [
    e("e1", "prod1", "bus"),
    e("e2", "prod2", "bus"),
    e("e3", "prod3", "bus"),
    e("e4", "bus",   "cons1"),
    e("e5", "bus",   "cons2"),
    e("e6", "bus",   "cons3"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [microservices, cicd, eventDriven];
