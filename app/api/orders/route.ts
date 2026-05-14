import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { authenticate } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  generateDailyOrderNumber,
} from "@/lib/utils";
import { z } from "zod";

export const dynamic = 'force-dynamic'

class OrderValidationError extends Error {}

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
    const auth = await authenticate(request);
    if (auth instanceof NextResponse) return auth;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderUserId = user.id;

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    const [menuItems, dailyOrderNumber] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          id: { in: data.items.map((item) => item.menuItemId) },
        },
      }),
      generateDailyOrderNumber(prisma),
    ]);

    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem)
        throw new OrderValidationError(`Menu item ${item.menuItemId} not found`);
      if (!menuItem.active)
        throw new OrderValidationError(`Menu item ${menuItem.name} is not available`);

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

    const order = await prisma.order.create({
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
        paymentStatus: "COMPLETED",
        status: "COMPLETED",
        orderItems: {
          create: orderItems,
        },
        payments: {
          create: {
            amount: total,
            method: data.paymentMethod,
            status: "COMPLETED",
          },
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

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    if (error instanceof OrderValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create order" },
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
