# Combo POS - Modern Restaurant Point-of-Sale System

A complete, production-ready restaurant Point-of-Sale system built with Next.js, React, TypeScript, PostgreSQL, and Prisma.

## 🚀 Features

### Core POS Features
- **Intuitive Touch Interface** - Optimized for tablets and desktops
- **Real-time Order Management** - Add/remove items, modify quantities, order notes
- **Dynamic Cart System** - Live total calculation with tax and service charges
- **Multiple Payment Methods** - Cash, Card, Mobile payments
- **Receipt Generation** - Print-ready receipts with order details
- **Order Confirmation** - Professional confirmation screen with order summary

### Admin Dashboard
- **Sales Analytics** - Daily, weekly, and monthly sales tracking
- **Order Management** - View and track all orders
- **Popular Items** - Visual analytics of best-selling menu items
- **Dashboard Overview** - Key metrics and performance indicators

### Technical Features
- **Role-based Authentication** - Admin, Manager, and Staff roles
- **Responsive Design** - Works on tablets, desktops, and mobile devices
- **Real-time Updates** - Live order tracking and updates
- **Database Integration** - PostgreSQL with Prisma ORM
- **Type Safety** - Full TypeScript implementation
- **Modern UI** - TailwindCSS with professional restaurant styling

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - Full-stack React framework
- **React 18** - Modern React with hooks and context
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first CSS framework
- **NextAuth.js** - Authentication and session management

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Type-safe database operations
- **PostgreSQL** - Production-ready relational database
- **bcryptjs** - Password hashing and security

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** database (local or hosted)
- **yarn** package manager (preferred) or npm

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd combo_pos
\`\`\`

### 2. Install Dependencies

\`\`\`bash
yarn install
# or use the setup script for full setup
yarn setup
\`\`\`

### 3. Environment Setup

Copy the environment example file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your configuration:

\`\`\`env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/combo_pos"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# App Configuration
NEXT_PUBLIC_APP_NAME="Combo POS"
NEXT_PUBLIC_CURRENCY="USD"
NEXT_PUBLIC_TAX_RATE="0.08"
NEXT_PUBLIC_SERVICE_CHARGE="0.05"
\`\`\`

### 4. Database Setup

Generate Prisma client:

\`\`\`bash
yarn db:generate
\`\`\`

Push database schema:

\`\`\`bash
yarn db:push
\`\`\`

Seed the database with sample data:

\`\`\`bash
yarn db:seed
\`\`\`

### 5. Run Development Server

\`\`\`bash
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Default Login Credentials

The system comes with pre-configured demo accounts:

### Admin Account
- **Email:** admin@combo.com
- **Password:** admin123
- **Access:** Full dashboard and POS access

### Staff Account
- **Email:** staff@combo.com
- **Password:** staff123
- **Access:** POS system only

## 📱 Using the System

### POS Interface (/pos)

1. **Login** with staff or admin credentials
2. **Browse Menu** - Items are organized by category
3. **Add Items** - Click items to add them to cart
4. **Modify Orders** - Adjust quantities, add notes
5. **Checkout** - Select payment method and complete order
6. **Print Receipt** - Generate and print order receipt

### Admin Dashboard (/dashboard)

1. **Login** with admin or manager credentials
2. **View Analytics** - Daily, weekly, monthly sales data
3. **Monitor Orders** - Track recent orders and status
4. **Popular Items** - See best-selling menu items

## 🏗️ Project Structure

\`\`\`
combo_pos/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Admin dashboard
│   ├── pos/              # POS interface
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   ├── pos/             # POS components
│   └── providers.tsx    # App providers
├── lib/                   # Utility libraries
│   ├── auth.ts          # Authentication config
│   ├── prisma.ts        # Database client
│   └── utils.ts         # Helper functions
├── prisma/               # Database schema and migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── types/                # TypeScript type definitions
└── public/              # Static assets
\`\`\`

## 🗃️ Database Schema

The system uses a comprehensive database schema:

### Core Tables
- **Users** - Authentication and role management
- **Categories** - Menu organization
- **MenuItems** - Restaurant menu items
- **Orders** - Customer orders
- **OrderItems** - Individual order line items
- **Payments** - Payment tracking
- **DailySales** - Sales analytics

### Key Features
- **Role-based access** (Admin, Manager, Staff)
- **Order status tracking** (Pending, Preparing, Ready, Served)
- **Payment method support** (Cash, Card, Mobile)
- **Inventory tracking** (optional stock management)
- **Sales analytics** (daily aggregation)

## 📊 Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint

# Database Operations
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio GUI
\`\`\`

## 🚀 Production Deployment

### Environment Variables

Set these environment variables in your production environment:

\`\`\`env
DATABASE_URL=your_production_database_url
NEXTAUTH_URL=your_production_domain
NEXTAUTH_SECRET=secure_random_secret
\`\`\`

### Deployment Steps

1. **Build the application:**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Deploy to your platform:**
   - **Vercel:** Connect your repository for automatic deployment
   - **Netlify:** Deploy with build command \`npm run build\`
   - **Docker:** Use the included Dockerfile
   - **VPS:** Upload build files and run with PM2

3. **Set up production database:**
   \`\`\`bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   \`\`\`

### Recommended Hosting

- **Vercel** - Optimized for Next.js applications
- **Railway** - PostgreSQL + Next.js hosting
- **Heroku** - Full-stack application deployment
- **DigitalOcean** - VPS with database hosting

## 🔧 Customization

### Menu Configuration

Edit the database seed file to customize your menu:

\`\`\`typescript
// prisma/seed.ts
const menuItem = await prisma.menuItem.create({
  data: {
    name: 'Your Item Name',
    description: 'Item description',
    price: 12.99,
    cost: 5.50,
    categoryId: category.id,
  },
})
\`\`\`

### Styling and Branding

Update the styling in:

- \`tailwind.config.js\` - Color scheme and theme
- \`app/globals.css\` - Global styles and components
- Components - Individual component styling

### Business Rules

Configure business settings in \`.env.local\`:

\`\`\`env
NEXT_PUBLIC_TAX_RATE="0.08"        # 8% tax rate
NEXT_PUBLIC_SERVICE_CHARGE="0.05"  # 5% service charge
\`\`\`

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Build Errors:**
- Run \`npm run db:generate\` before building
- Ensure all environment variables are set
- Check for TypeScript errors with \`npm run lint\`

### Development Tips

- Use \`npm run db:studio\` to inspect database visually
- Check browser console for frontend errors
- Use \`console.log\` in API routes for debugging
- Enable verbose logging in development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the code comments for implementation details

---

**Built with ❤️ for the restaurant industry**