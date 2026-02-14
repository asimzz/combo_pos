import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data in correct order (respecting foreign key constraints)
  console.log('Clearing existing data...')
  await prisma.payment.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})
  await prisma.dailySales.deleteMany({})
  await prisma.rawMaterialUsage.deleteMany({})
  await prisma.rawMaterialStockLog.deleteMany({})
  await prisma.rawMaterial.deleteMany({})
  await prisma.menuItem.deleteMany({})
  await prisma.category.deleteMany({})

  console.log('Creating fresh menu...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@combo.com' },
    update: {},
    create: {
      email: 'admin@combo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 12)

  await prisma.user.upsert({
    where: { email: 'staff@combo.com' },
    update: {},
    create: {
      email: 'staff@combo.com',
      name: 'Staff User',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  // Create categories - Combo Menu (4-Step System)
  const grilledChicken = await prisma.category.create({
    data: {
      name: 'Grilled Chicken',
      description: 'Lemon & Herbs / Honey Garlic / Peri-Peri',
      sortOrder: 1,
    },
  })

  const shaya = await prisma.category.create({
    data: {
      name: 'Shaya (Nyama Choma)',
      description: 'Best served with bread and peanut butter chili',
      sortOrder: 2,
    },
  })

  const ossoBuco = await prisma.category.create({
    data: {
      name: 'Osso Buco',
      description: 'Tender braised beef shank',
      sortOrder: 3,
    },
  })

  const skewers = await prisma.category.create({
    data: {
      name: 'Skewers',
      description: 'Tawook / Lamb Kofta / Beef Kebab',
      sortOrder: 4,
    },
  })

  const friedTilapia = await prisma.category.create({
    data: {
      name: 'Fried Tilapia Fillet',
      description: 'Crispy fried tilapia fillet',
      sortOrder: 5,
    },
  })

  const lambMandi = await prisma.category.create({
    data: {
      name: 'Lamb Mandi',
      description: 'Traditional spiced lamb with rice',
      sortOrder: 6,
    },
  })

  const wholeTilapia = await prisma.category.create({
    data: {
      name: 'Whole Tilapia Fish',
      description: 'Whole grilled tilapia fish',
      sortOrder: 7,
    },
  })

  const smokedBeef = await prisma.category.create({
    data: {
      name: 'Smoked BBQ Beef Shank',
      description: 'Tender smoked BBQ beef shank',
      sortOrder: 8,
    },
  })


  const specials = await prisma.category.create({
    data: {
      name: 'Daily & Family Combos',
      description: 'Special combo deals and family meals',
      sortOrder: 12,
    },
  })

  // Create categories - Combo Sandwiches (Separate Menu)
  const wraps = await prisma.category.create({
    data: {
      name: 'Combo Sandwiches - Wraps',
      description: 'Fresh wraps and sandwiches',
      sortOrder: 13,
    },
  })

  const burgers = await prisma.category.create({
    data: {
      name: 'Combo Sandwiches - Burgers',
      description: 'Juicy burgers with fries',
      sortOrder: 14,
    },
  })

  // Create new categories for sides and add-ons
  const carbs = await prisma.category.create({
    data: {
      name: 'Choose Your Carbs',
      description: 'Perfect sides to complete your meal',
      sortOrder: 15,
    },
  })

  const salads = await prisma.category.create({
    data: {
      name: 'Choose Your Salads',
      description: 'Fresh salads and vegetables',
      sortOrder: 16,
    },
  })

  const sauces = await prisma.category.create({
    data: {
      name: 'Choose Your Sauces',
      description: 'Delicious sauces to enhance your meal',
      sortOrder: 17,
    },
  })

  // Create menu items - Grilled Chicken
  await prisma.menuItem.createMany({
    data: [
      {
        menuNumber: 'GC001',
        name: 'Grilled Chicken - Quarter (Small)',
        description: 'Quarter grilled chicken - Lemon & Herbs / Honey Garlic / Peri-Peri',
        price: 5000,
        cost: 2000,
        stock: 25,
        lowStockAlert: 5,
        categoryId: grilledChicken.id,
        featured: true,
        sortOrder: 1,
      },
      {
        menuNumber: 'GC002',
        name: 'Grilled Chicken - Half (Medium)',
        description: 'Half grilled chicken - Lemon & Herbs / Honey Garlic / Peri-Peri',
        price: 9000,
        cost: 3500,
        stock: 20,
        lowStockAlert: 5,
        categoryId: grilledChicken.id,
        featured: true,
        sortOrder: 2,
      },
      {
        menuNumber: 'GC003',
        name: 'Grilled Chicken - Full (Large)',
        description: 'Full grilled chicken - Lemon & Herbs / Honey Garlic / Peri-Peri',
        price: 16000,
        cost: 6000,
        stock: 15,
        lowStockAlert: 3,
        categoryId: grilledChicken.id,
        featured: true,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Shaya (Nyama Choma)
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Shaya - 200g (Small)',
        description: 'Best served with bread and peanut butter chili',
        price: 5000,
        cost: 2000,
        categoryId: shaya.id,
        sortOrder: 1,
      },
      {
        name: 'Shaya - 500g (Medium)',
        description: 'Best served with bread and peanut butter chili',
        price: 9000,
        cost: 3500,
        categoryId: shaya.id,
        sortOrder: 2,
      },
      {
        name: 'Shaya - Full (Large)',
        description: 'Best served with bread and peanut butter chili',
        price: 18000,
        cost: 7000,
        categoryId: shaya.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Osso Buco
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Osso Buco - 1 Piece (Small)',
        description: 'Tender braised beef shank',
        price: 5000,
        cost: 2000,
        categoryId: ossoBuco.id,
        sortOrder: 1,
      },
      {
        name: 'Osso Buco - 2 Pieces (Medium)',
        description: 'Tender braised beef shank',
        price: 9000,
        cost: 3500,
        categoryId: ossoBuco.id,
        sortOrder: 2,
      },
      {
        name: 'Osso Buco - 4 Pieces (Large)',
        description: 'Tender braised beef shank',
        price: 16000,
        cost: 6000,
        categoryId: ossoBuco.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Skewers
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Skewers - 1 Skewer (Small)',
        description: 'Tawook / Lamb Kofta / Beef Kebab',
        price: 3500,
        cost: 1500,
        categoryId: skewers.id,
        sortOrder: 1,
      },
      {
        name: 'Skewers - 2 Skewers (Medium)',
        description: 'Tawook / Lamb Kofta / Beef Kebab',
        price: 5000,
        cost: 2000,
        categoryId: skewers.id,
        sortOrder: 2,
      },
      {
        name: 'Skewers - 4 Skewers (Large)',
        description: 'Tawook / Lamb Kofta / Beef Kebab',
        price: 9000,
        cost: 3500,
        categoryId: skewers.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Fried Tilapia Fillet
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Fried Tilapia - 1 Piece (Small)',
        description: 'Crispy fried tilapia fillet',
        price: 5000,
        cost: 2000,
        categoryId: friedTilapia.id,
        sortOrder: 1,
      },
      {
        name: 'Fried Tilapia - 2 Pieces (Medium)',
        description: 'Crispy fried tilapia fillet',
        price: 9000,
        cost: 3500,
        categoryId: friedTilapia.id,
        sortOrder: 2,
      },
      {
        name: 'Fried Tilapia - 4 Pieces (Large)',
        description: 'Crispy fried tilapia fillet',
        price: 16000,
        cost: 6000,
        categoryId: friedTilapia.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Lamb Mandi
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Lamb Mandi - Regular (Medium)',
        description: 'Traditional spiced lamb with rice',
        price: 7000,
        cost: 3000,
        categoryId: lambMandi.id,
        sortOrder: 1,
      },
      {
        name: 'Lamb Mandi - Full Power (Large)',
        description: 'Large portion traditional spiced lamb with rice',
        price: 15000,
        cost: 6000,
        categoryId: lambMandi.id,
        featured: true,
        sortOrder: 2,
      },
    ],
  })

  // Create menu items - Whole Tilapia Fish
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Whole Tilapia - Regular (Medium)',
        description: 'Whole grilled tilapia fish',
        price: 10000,
        cost: 4000,
        categoryId: wholeTilapia.id,
        sortOrder: 1,
      },
      {
        name: 'Whole Tilapia - The Big Boss (Large)',
        description: 'Large whole grilled tilapia fish',
        price: 16000,
        cost: 6000,
        categoryId: wholeTilapia.id,
        featured: true,
        sortOrder: 2,
      },
    ],
  })

  // Create menu items - Smoked BBQ Beef Shank
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Beef Shank - Normal Cut (Medium)',
        description: 'Tender smoked BBQ beef shank',
        price: 17000,
        cost: 7000,
        categoryId: smokedBeef.id,
        sortOrder: 1,
      },
      {
        name: 'Beef Shank - The Prime Cut (Large)',
        description: 'Premium cut tender smoked BBQ beef shank',
        price: 25000,
        cost: 10000,
        categoryId: smokedBeef.id,
        featured: true,
        sortOrder: 2,
      },
    ],
  })


  // Create menu items - Daily & Family Combos
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Daily Combo',
        description: 'Meatballs in gravy or chicken curry - comes with rice & salad',
        price: 3000,
        cost: 1200,
        categoryId: specials.id,
        featured: true,
        sortOrder: 1,
      },
      {
        name: 'Family Style Combo - Whole Lamb',
        description: 'Whole lamb for family sharing (Pre-order 48 hours before)',
        price: 0, // Price on request
        cost: 0,
        categoryId: specials.id,
        featured: true,
        sortOrder: 2,
      },
      {
        name: 'Family Style Combo - Whole Goat',
        description: 'Whole goat for family sharing (Pre-order 48 hours before)',
        price: 0, // Price on request
        cost: 0,
        categoryId: specials.id,
        featured: true,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Combo Sandwiches - Wraps
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Sheesh Tawook',
        description: 'Grilled chicken wrap',
        price: 4000,
        cost: 1500,
        categoryId: wraps.id,
        featured: true,
        sortOrder: 1,
      },
      {
        name: 'Kofta Kebab',
        description: 'Spiced ground meat wrap',
        price: 4000,
        cost: 1500,
        categoryId: wraps.id,
        sortOrder: 2,
      },
      {
        name: 'Crispy Chicken',
        description: 'Crispy fried chicken wrap',
        price: 4500,
        cost: 1800,
        categoryId: wraps.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Combo Sandwiches - Burgers
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Cheese Burger',
        description: 'Classic cheeseburger',
        price: 4000,
        cost: 1500,
        categoryId: burgers.id,
        featured: true,
        sortOrder: 1,
      },
      {
        name: 'Double Cheese Burger',
        description: 'Double patty cheeseburger',
        price: 6000,
        cost: 2500,
        categoryId: burgers.id,
        sortOrder: 2,
      },
      {
        name: 'Crispy Chicken Burger',
        description: 'Crispy chicken burger',
        price: 4500,
        cost: 1800,
        categoryId: burgers.id,
        sortOrder: 3,
      },
    ],
  })

  // Create menu items - Choose Your Carbs
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Rice',
        description: 'Steamed white rice',
        price: 2000,
        cost: 800,
        categoryId: carbs.id,
        sortOrder: 1,
      },
      {
        name: 'Mashed Potatoes',
        description: 'Creamy mashed potatoes',
        price: 2500,
        cost: 1000,
        categoryId: carbs.id,
        sortOrder: 2,
      },
      {
        name: 'Fries',
        description: 'Golden crispy French fries',
        price: 2500,
        cost: 1000,
        categoryId: carbs.id,
        sortOrder: 3,
      },
      {
        name: 'Roasted Veggies',
        description: 'Mixed roasted vegetables',
        price: 3000,
        cost: 1200,
        categoryId: carbs.id,
        sortOrder: 4,
      },
      {
        name: 'Bread',
        description: 'Fresh baked bread',
        price: 1500,
        cost: 600,
        categoryId: carbs.id,
        sortOrder: 5,
      },
    ],
  })

  // Create menu items - Choose Your Salads
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Mediterranean',
        description: 'Mediterranean style salad',
        price: 3500,
        cost: 1400,
        categoryId: salads.id,
        sortOrder: 1,
      },
      {
        name: 'Sautéed Veggies',
        description: 'Sautéed mixed vegetables',
        price: 3000,
        cost: 1200,
        categoryId: salads.id,
        sortOrder: 2,
      },
      {
        name: 'Sumac Onion',
        description: 'Sumac seasoned onion salad',
        price: 2000,
        cost: 800,
        categoryId: salads.id,
        sortOrder: 3,
      },
      {
        name: 'Dakwa',
        description: 'Traditional Dakwa salad',
        price: 2500,
        cost: 1000,
        categoryId: salads.id,
        sortOrder: 4,
      },
    ],
  })

  // Create menu items - Choose Your Sauces
  await prisma.menuItem.createMany({
    data: [
      {
        name: 'Garlic Sauce',
        description: 'Creamy garlic sauce',
        price: 1000,
        cost: 400,
        categoryId: sauces.id,
        sortOrder: 1,
      },
      {
        name: 'Combo Sauce',
        description: 'House special combo sauce',
        price: 1000,
        cost: 400,
        categoryId: sauces.id,
        sortOrder: 2,
      },
      {
        name: 'Peanut-Butter Chili',
        description: 'Spicy peanut butter chili sauce',
        price: 1500,
        cost: 600,
        categoryId: sauces.id,
        featured: true,
        sortOrder: 3,
      },
    ],
  })

  // Create sample orders with different statuses
  console.log('Creating sample orders with different statuses...')

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@combo.com' }
  })

  if (adminUser) {
    // Get some menu items
    const menuItems = await prisma.menuItem.findMany({
      take: 5
    })

    if (menuItems.length > 0) {
      // Create orders with different statuses
      const sampleOrders = [
        {
          status: 'PENDING',
          customerName: 'John Doe',
          customerPhone: '+250788123456',
          items: [{ menuItem: menuItems[0], quantity: 2 }]
        },
        {
          status: 'PREPARING',
          customerName: 'Jane Smith',
          items: [{ menuItem: menuItems[1], quantity: 1 }, { menuItem: menuItems[2], quantity: 3 }]
        },
        {
          status: 'READY',
          customerName: 'Bob Johnson',
          customerPhone: '+250788987654',
          items: [{ menuItem: menuItems[3], quantity: 1 }]
        },
        {
          status: 'SERVED',
          customerName: 'Alice Brown',
          items: [{ menuItem: menuItems[4], quantity: 2 }, { menuItem: menuItems[0], quantity: 1 }]
        },
        {
          status: 'CANCELLED',
          customerName: 'Mike Wilson',
          notes: 'Customer cancelled due to wait time',
          items: [{ menuItem: menuItems[1], quantity: 1 }]
        }
      ]

      for (let i = 0; i < sampleOrders.length; i++) {
        const orderData = sampleOrders[i]
        const orderItems = orderData.items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          unitPrice: item.menuItem.price,
          total: Number(item.menuItem.price) * item.quantity
        }))

        const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0)

        await prisma.order.create({
          data: {
            orderNumber: `ORD${String(Date.now() + i).slice(-6)}`,
            userId: adminUser.id,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            notes: orderData.notes,
            status: orderData.status as any,
            subtotal,
            taxAmount: 0,
            serviceCharge: 0,
            discount: 0,
            total: subtotal,
            paymentMethod: 'CASH',
            paymentStatus: 'COMPLETED',
            orderItems: {
              create: orderItems
            },
            payments: {
              create: {
                amount: subtotal,
                method: 'CASH',
                status: 'COMPLETED'
              }
            }
          }
        })
      }

      console.log('Sample orders created with all status types!')
    }
  }

  // Create sample raw materials for demo
  console.log('Creating sample raw materials...')

  const rawMaterials = [
    {
      name: 'Chicken Breast',
      description: 'Fresh chicken breast for grilled chicken dishes',
      unit: 'kg',
      stock: 50.5,
      cost: 3500,
    },
    {
      name: 'Beef Chuck',
      description: 'Quality beef chuck for steaks and roasts',
      unit: 'kg',
      stock: 25.0,
      cost: 4500,
    },
    {
      name: 'Fresh Tilapia',
      description: 'Fresh tilapia fish from Lake Kivu',
      unit: 'kg',
      stock: 15.5,
      cost: 2800,
    },
    {
      name: 'Rice (Jasmine)',
      description: 'Premium jasmine rice',
      unit: 'kg',
      stock: 100.0,
      cost: 1200,
    },
    {
      name: 'Cooking Oil',
      description: 'Vegetable cooking oil',
      unit: 'liters',
      stock: 20.0,
      cost: 1800,
    },
    {
      name: 'Onions',
      description: 'Fresh yellow onions',
      unit: 'kg',
      stock: 30.0,
      cost: 800,
    },
    {
      name: 'Garlic',
      description: 'Fresh garlic cloves',
      unit: 'kg',
      stock: 5.5,
      cost: 2500,
    },
    {
      name: 'Tomatoes',
      description: 'Fresh ripe tomatoes',
      unit: 'kg',
      stock: 12.0,
      cost: 1200,
    }
  ]

  for (const material of rawMaterials) {
    const created = await prisma.rawMaterial.create({
      data: material
    })

    // Create initial stock log
    await prisma.rawMaterialStockLog.create({
      data: {
        type: 'IN',
        quantity: material.stock,
        reason: 'Initial inventory setup',
        rawMaterialId: created.id,
        userId: adminUser.id
      }
    })
  }

  console.log('Sample raw materials created!')
  console.log('Database seeded successfully!')
  console.log('Admin user: admin@combo.com / admin123')
  console.log('Staff user: staff@combo.com / staff123')
  console.log('Navigate to /manage to access Stock Management and Raw Materials tabs')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })