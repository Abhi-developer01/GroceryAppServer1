import Product from "../../models/products.js";

export const getProductsByCategoryId = async (req, reply) => {
  const { categoryId } = req.params;

  try {
    const products = await Product.find({ category: categoryId })
      .select("-category")
      .exec();

    return reply.send(products);
  } catch (error) {
    return reply.status(500).send({ message: "An error occurred", error });
  }
};

export const getProductsBySubcategoryId = async (req, reply) => {
  try {
    const { subcategoryId } = req.params;

    const products = await Product.find({ subcategory: subcategoryId });

    return reply.send(products);
  } catch (error) {
    return reply.status(500).send({ message: "Error fetching products" });
  }
};

// import Product from "../models/Product.js";

// export default async function searchRoutes(fastify, options) {
//   fastify.get("/search", async (req, reply) => {
//     const { q } = req.query;

//     if (!q || q.trim() === "") {
//       return [];
//     }

//     try {
//       const results = await Product.aggregate([
//         {
//           $search: {
//             index: "default", // your Atlas Search index name
//             text: {
//               query: q,
//               path: ["name", "description", "category"],
//               fuzzy: { maxEdits: 2 },
//             },
//           },
//         },
//         { $limit: 25 },
//       ]);

//       return results;
//     } catch (err) {
//       console.error("Search error:", err);
//       reply.status(500).send({ message: "Search failed" });
//     }
//   });
// }
