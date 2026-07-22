// import Product from "../../models/products.js";

// export async function searchRoutes(fastify, options) {
//   fastify.get("/search", async (req, reply) => {
//     console.log("📩 Query received:", req.query.q);
//     const { q } = req.query;

//     if (!q || q.trim() === "") {
//       return reply.send([]);
//     }

//     try {
//       const results = await Product.aggregate([
//         {
//           $search: {
//             index: "Grocery", // name you created in Atlas
//             text: {
//               query: q,
//               path: ["name"], // only existing searchable fields
//               fuzzy: { maxEdits: 1 },
//             },
//           },
//         },
//         { $limit: 30 },

//         {
//           $project: {
//             name: 1,
//             image: 1,
//             price: 1,
//             discountPrice: 1,
//             quantity: 1,
//             // stock: 1, // ✅ REQUIRED FOR YOUR BUTTON LOGIC
//             stock: { $ifNull: ["$stock", 0] }, // 👈 force stock
//             score: { $meta: "searchScore" }, // optional but useful
//           },
//         },
//       ]);

//       return reply.send(results);
//     } catch (err) {
//       console.error("Search error:", err);
//       return reply.status(500).send({ message: "Search failed" });
//     }
//   });
// }

// import Product from "../../models/products.js";

// export async function searchRoutes(fastify, options) {
//   fastify.get("/search", async (req, reply) => {
//     console.log("📩 Query received:", req.query.q);
//     const { q } = req.query;

//     if (!q || q.trim() === "") {
//       return reply.send([]);
//     }

//     try {
//       const results = await Product.aggregate([
//         {
//           $search: {
//             index: "Grocery", // name you created in Atlas
//             // Changed from 'text' to 'autocomplete' to handle edgeGrams (partial matches)
//             autocomplete: {
//               query: q,
//               path: "name", // Target field
//               tokenOrder: "any", // Matches tokens in any order (e.g. "mayo low fat")
//               fuzzy: {
//                 maxEdits: 1, // Allows 1 character error typo adjustments
//                 prefixLength: 1, // Typo tolerance kicks in after the first character
//               },
//             },
//           },
//         },
//         { $limit: 30 },
//         {
//           $project: {
//             name: 1,
//             image: 1,
//             price: 1,
//             discountPrice: 1,
//             quantity: 1,
//             stock: { $ifNull: ["$stock", 0] },
//             score: { $meta: "searchScore" },
//           },
//         },
//       ]);

//       return reply.send(results);
//     } catch (err) {
//       console.error("Search error:", err);
//       return reply.status(500).send({ message: "Search failed" });
//     }
//   });
// }

// import Product from "../../models/products.js";

// export async function searchRoutes(fastify, options) {
//   fastify.get("/search", async (req, reply) => {
//     console.log("📩 Query received:", req.query.q);
//     const { q } = req.query;

//     if (!q || q.trim() === "") {
//       return reply.send([]);
//     }

//     try {
//       const results = await Product.aggregate([
//         {
//           $search: {
//             index: "Grocery",
//             compound: {
//               should: [
//                 // Pass 1: Handle fast character-by-character autocomplete typing (e.g., 'mayo')
//                 {
//                   autocomplete: {
//                     query: q,
//                     path: "name",
//                     tokenOrder: "any",
//                     score: { boost: { value: 2 } }, // Give native name matches a higher score
//                     fuzzy: {
//                       maxEdits: 2, // Silently handles up to 2 misspelled letters
//                       prefixLength: 1,
//                     },
//                   },
//                 },
//                 // Pass 2: Handle Synonyms / Alternate words / Translations (e.g., 'chole' -> 'chana')
//                 {
//                   text: {
//                     query: q,
//                     path: "name",
//                     synonyms: "my_grocery_synonyms", // Tells MongoDB to substitute words from our list
//                     fuzzy: {
//                       maxEdits: 1, // Handles small typos made directly on regional names
//                     },
//                   },
//                 },
//               ],
//             },
//           },
//         },
//         { $limit: 30 },
//         {
//           $project: {
//             name: 1,
//             image: 1,
//             price: 1,
//             discountPrice: 1,
//             quantity: 1,
//             stock: { $ifNull: ["$stock", 0] },
//             score: { $meta: "searchScore" },
//           },
//         },
//       ]);

//       return reply.send(results);
//     } catch (err) {
//       console.error("Search error:", err);
//       return reply.status(500).send({ message: "Search failed" });
//     }
//   });
// }

import Product from "../../models/products.js";

export async function searchRoutes(fastify, options) {
  fastify.get("/search", async (req, reply) => {
    console.log("📩 Query received:", req.query.q);
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return reply.send([]);
    }

    try {
      const results = await Product.aggregate([
        {
          $search: {
            index: "Grocery",
            compound: {
              should: [
                // Pass 1: Autocomplete + Silent Typo Correction (e.g., 'mayoniz' -> Mayonnaise)
                {
                  autocomplete: {
                    query: q,
                    path: "name",
                    tokenOrder: "any",
                    score: { boost: { value: 2 } },
                    fuzzy: {
                      maxEdits: 1, // Silently handles up to 2 misspelled letters
                      prefixLength: 1,
                    },
                  },
                },
                // Pass 2: Synonyms + Silent Typo Correction (e.g., 'cholae' -> Chana)
                {
                  text: {
                    query: q,
                    path: "name",
                    synonyms: "my_grocery_synonyms",
                    // fuzzy: {
                    //   maxEdits: 1, // Handles small typos made directly on regional names
                    // },
                  },
                },
              ],
            },
          },
        },
        { $limit: 30 },

        // 🏪 1. LOOKUP THE RESTAURANT RELATIONSHIP
        {
          $lookup: {
            from: "restaurants", // ⚠️ MUST match your exact MongoDB collection name for restaurants (usually lowercase plural)
            localField: "restaurant", // The field name inside your Product schema
            foreignField: "_id", // The target field in the restaurant collection
            as: "restaurantDetails", // Temporary array payload name
          },
        },

        // 🧼 2. FLATTEN THE RESTAURANT ARRAY INTO A SINGLE OBJECT
        {
          $unwind: {
            path: "$restaurantDetails",
            preserveNullAndEmptyArrays: true, // Prevents removing the product if it doesn't have a restaurant
          },
        },

        // 🎯 3. PROJECT FIELDS (Including Restaurant details)
        {
          $project: {
            name: 1,
            image: 1,
            price: 1,
            discountPrice: 1,
            quantity: 1,
            stock: { $ifNull: ["$stock", 0] },
            score: { $meta: "searchScore" },

            restaurant: { $ifNull: ["$restaurantDetails.name", null] },
          },
        },
      ]);

      // Returns the raw corrected array directly to the app
      return reply.send(results);
    } catch (err) {
      console.error("Search error:", err);
      return reply.status(500).send({ message: "Search failed" });
    }
  });
}
