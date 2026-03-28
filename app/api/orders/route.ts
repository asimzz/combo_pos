import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateDailyOrderNumber,
} from "@/lib/utils";
import { z } from "zod";

export const dynamic = 'force-dynamic'

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0).optional(),
      notes: z.string().optional(),
    }),
  ),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(["CASH", "MOMO"]),
  discount: z.number().min(0).default(0),
  serviceCharge: z.number().min(0).default(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUserId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderUserId = user.id;

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Fetch menu items (with stock group) and generate order number in parallel
    const [menuItems, dailyOrderNumber] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          id: { in: data.items.map((item) => item.menuItemId) },
        },
        include: { stockGroup: true },
      }),
      generateDailyOrderNumber(prisma),
    ]);

    // Validate stock availability and calculate totals
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
      if (!menuItem.active)
        throw new Error(`Menu item ${menuItem.name} is not available`);

      const currentStock = menuItem.stockGroup
        ? menuItem.stockGroup.stock
        : (menuItem.stock || 0);
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${menuItem.name}. Available: ${currentStock}, Requested: ${item.quantity}`,
        );
      }

      const unitPrice = item.unitPrice ?? Number(menuItem.price);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
        total: itemTotal,
        notes: item.notes,
      };
    });

    const total = subtotal + data.serviceCharge - data.discount;

    // Build stock deductions — use stock_groups table for grouped items, menu_items for others
    const stockGroupDeductions = new Map<string, number>();
    const individualDeductions: { menuItemId: string; quantity: number }[] = [];

    data.items.forEach((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (menuItem?.stockGroupId) {
        const current = stockGroupDeductions.get(menuItem.stockGroupId) || 0;
        stockGroupDeductions.set(menuItem.stockGroupId, current + item.quantity);
      } else {
        individualDeductions.push({ menuItemId: item.menuItemId, quantity: item.quantity });
      }
    });

    const stockUpdates = [
      ...individualDeductions.map((item) =>
        prisma.$executeRaw`UPDATE "menu_items" SET "stock" = "stock" - ${item.quantity} WHERE "id" = ${item.menuItemId}`
      ),
      ...Array.from(stockGroupDeductions.entries()).map(([groupId, qty]) =>
        prisma.$executeRaw`UPDATE "stock_groups" SET "stock" = "stock" - ${qty} WHERE "id" = ${groupId}`
      ),
    ];

    const orderCreate = prisma.order.create({
      data: {
        orderNumber: dailyOrderNumber,
        userId: orderUserId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        subtotal,
        taxAmount: 0,
        serviceCharge: data.serviceCharge,
        discount: data.discount,
        total,
        paymentMethod: data.paymentMethod,
        paymentStatus: "PENDING",
        status: "PENDING",
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
        user: true,
      },
    });

    const results = await Promise.all([...stockUpdates, orderCreate]);
    const order = results[results.length - 1];

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
