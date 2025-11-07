import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { Schema as MongooseSchema } from "mongoose";
import { AppModule } from "../src/app.module";
import { CategoryRepository } from "../src/database/repositories/category.repository";
import { DiscountRepository } from "../src/database/repositories/discount.repository";
import { ProductRepository } from "../src/database/repositories/product.repository";
import { ProductDiscountRepository } from "../src/database/repositories/product-discount.repository";
import { UserRepository } from "../src/database/repositories/user.repository";
import { DiscountType } from "../src/database/schemas/discount.schema";
import { UserRole } from "../src/database/schemas/user.schema";

async function seed() {
  console.log("🌱 Starting seed process...");

  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get(UserRepository);
  const categoryRepository = app.get(CategoryRepository);
  const productRepository = app.get(ProductRepository);
  const discountRepository = app.get(DiscountRepository);
  const productDiscountRepository = app.get(ProductDiscountRepository);

  try {
    // Clear existing data (optional - comment out if you want to preserve data)
    console.log("Clearing existing data...");
    await userRepository.deleteMany({});
    await categoryRepository.deleteMany({});
    await productRepository.deleteMany({});
    await discountRepository.deleteMany({});
    await productDiscountRepository.deleteMany({});
    // Note: In production, you'd want to be more careful about clearing data

    // Create admin user
    console.log("Creating admin user...");
    const hashedPassword = await bcrypt.hash("Admin123!", 10);
    const admin = await userRepository.create({
      email: "admin@ecommerce.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: UserRole.ADMIN,
      isActive: true,
    });
    console.log(`✅ Created admin: ${admin.email}`);

    // Create regular user
    console.log("Creating regular user...");
    const userHashedPassword = await bcrypt.hash("User123!", 10);
    const user = await userRepository.create({
      email: "user@ecommerce.com",
      password: userHashedPassword,
      firstName: "John",
      lastName: "Doe",
      role: UserRole.USER,
      isActive: true,
    });
    console.log(`✅ Created user: ${user.email}`);

    // Create categories
    console.log("Creating car categories...");
    const suvCategory = await categoryRepository.create({
      name: "SUV",
      slug: "suv",
      description: "SUV cars",
      isActive: true,
    });

    const coupeCategory = await categoryRepository.create({
      name: "Coupe",
      slug: "coupe",
      description: "Coupe cars",
      isActive: true,
    });

    const sedanCategory = await categoryRepository.create({
      name: "Sedan",
      slug: "sedan",
      description: "Sedan cars",
      isActive: true,
    });

    const hatchbackCategory = await categoryRepository.create({
      name: "Hatchback",
      slug: "hatchback",
      description: "Hatchback cars",
      isActive: true,
    });

    const convertibleCategory = await categoryRepository.create({
      name: "Convertible",
      slug: "convertible",
      description: "Convertible cars",
      isActive: true,
    });

    console.log(`✅ Created ${2} categories`);

    // Create products
    console.log("Creating products...");
    const product1 = await productRepository.create({
      name: "SUV Car",
      slug: "suv-car",
      description: "SUV car with a large cargo space",
      basePrice: 100000,
      categoryId: suvCategory._id as MongooseSchema.Types.ObjectId,
      sku: "SUV-001",
      images: ["https://example.com/suv.jpg"],
      isActive: true,
      metadata: { brand: "SUVBrand", warranty: "2 years", model: "SUV Model" },
    });

    const product2 = await productRepository.create({
      name: "Coupe Car",
      slug: "coupe-car",
      description: "Coupe car with a sleek design",
      basePrice: 50000,
      categoryId: coupeCategory._id as MongooseSchema.Types.ObjectId,
      sku: "COUPE-001",
      images: ["https://example.com/coupe.jpg"],
      isActive: true,
      metadata: {
        brand: "CoupeBrand",
        warranty: "1 year",
        model: "Coupe Model",
      },
    });

    const product3 = await productRepository.create({
      name: "Sedan Car",
      slug: "sedan-car",
      description: "Sedan car with a comfortable interior",
      basePrice: 30000,
      categoryId: sedanCategory._id as MongooseSchema.Types.ObjectId,
      sku: "SEDAN-001",
      images: ["https://example.com/sedan.jpg"],
      isActive: true,
      metadata: {
        brand: "SedanBrand",
        warranty: "1 year",
        model: "Sedan Model",
      },
    });
    const product4 = await productRepository.create({
      name: "Convertible Car",
      slug: "convertible-car",
      description: "Convertible car with a retractable roof",
      basePrice: 100000,
      categoryId: convertibleCategory._id as MongooseSchema.Types.ObjectId,
      sku: "CV-CONVERTIBLE-001",
      images: ["https://example.com/convertible.jpg"],
      isActive: true,
      metadata: {
        brand: "ConvertibleBrand",
        warranty: "2 years",
        model: "Convertible Model",
      },
    });

    const product5 = await productRepository.create({
      name: "Hatchback Car",
      slug: "hatchback-car",
      description: "Hatchback car with a sloping roofline",
      basePrice: 50000,
      categoryId: hatchbackCategory._id as MongooseSchema.Types.ObjectId,
      sku: "HB-HATCHBACK-001",
      images: ["https://example.com/hatchback.jpg"],
      isActive: true,
      metadata: {
        brand: "HatchbackBrand",
        warranty: "1 year",
        model: "Hatchback Model",
      },
    });

    console.log(`✅ Created ${5} products`);

    // Create discounts
    console.log("Creating discounts...");
    const summerDiscount = await discountRepository.create({
      code: "SUMMER2024",
      name: "Summer Sale 2024",
      description: "20% off on all electronics",
      discountType: DiscountType.PERCENTAGE,
      value: 20,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-08-31"),
      isActive: true,
      minimumOrderValue: 100,
      maxUsageCount: 1000,
      usageCount: 0,
    });

    const welcomeDiscount = await discountRepository.create({
      code: "WELCOME10",
      name: "Welcome Discount",
      description: "$10 off on your first order",
      discountType: DiscountType.FIXED_AMOUNT,
      value: 10,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      minimumOrderValue: 50,
      maxUsageCount: 10000,
      usageCount: 0,
    });

    console.log(`✅ Created ${2} discounts`);

    // Link discounts to products
    console.log("Linking discounts to products...");
    await productDiscountRepository.linkProductToDiscount(
      (product1._id as MongooseSchema.Types.ObjectId).toString(),
      (summerDiscount._id as MongooseSchema.Types.ObjectId).toString()
    );

    await productDiscountRepository.linkProductToDiscount(
      (product2._id as MongooseSchema.Types.ObjectId).toString(),
      (summerDiscount._id as MongooseSchema.Types.ObjectId).toString()
    );

    await productDiscountRepository.linkProductToDiscount(
      (product3._id as MongooseSchema.Types.ObjectId).toString(),
      (welcomeDiscount._id as MongooseSchema.Types.ObjectId).toString()
    );

    console.log(`✅ Linked discounts to products`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📝 Test credentials:");
    console.log("Admin: admin@ecommerce.com / Admin123!");
    console.log("User: user@ecommerce.com / User123!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
