// const express = require("express");
// const router = express.Router();

// const mongoose = require("mongoose");

// const Offer = require("../models/offerSchema");
// const Restaurant = require("../models/Restaurant");
// const Recipe = require("../models/recipeSchema");

// const upload = require("../uplods/multer");

// const {
//   authMiddleware,
// } = require("../middleWares/authMiddleware");

// const {
//   roleMiddleware,
// } = require("../middleWares/roleMiddleware");

// // =====================================================
// // HELPER
// // =====================================================

// const populateOffer = (query) => {
//   return query
//     .populate(
//       "restaurantId",
//       "name image address phone"
//     )
//     .populate(
//       "productId",
//       "title price image category restaurantId"
//     );
// };

// // =====================================================
// // VALIDATE OBJECT ID
// // =====================================================

// const isValidObjectId = (id) => {
//   return mongoose.Types.ObjectId.isValid(id);
// };

// // =====================================================
// // GET ALL OFFERS
// // PUBLIC
// //
// // GET /api/v1/offers
// //
// // Examples:
// // /api/v1/offers
// // /api/v1/offers?restaurantId=xxxxx
// // /api/v1/offers?active=true
// // =====================================================

// router.get("/", async (req, res) => {
//   try {
//     const {
//       restaurantId,
//       active,
//     } = req.query;

//     const filter = {};

//     // -------------------------------------------------
//     // Restaurant filter
//     // -------------------------------------------------

//     if (restaurantId) {
//       if (!isValidObjectId(restaurantId)) {
//         return res.status(400).json({
//           message:
//             "Invalid restaurantId",
//         });
//       }

//       filter.restaurantId = restaurantId;
//     }

//     // -------------------------------------------------
//     // Active filter
//     // -------------------------------------------------

//     if (active === "true") {
//       filter.isActive = true;
//     }

//     if (active === "false") {
//       filter.isActive = false;
//     }

//     // -------------------------------------------------
//     // Don't show expired offers
//     // -------------------------------------------------

//     filter.$or = [
//       {
//         expiresAt: null,
//       },
//       {
//         expiresAt: {
//           $gt: new Date(),
//         },
//       },
//     ];

//     // -------------------------------------------------
//     // Get offers
//     // -------------------------------------------------

//     const offers = await populateOffer(
//       Offer.find(filter).sort({
//         createdAt: -1,
//       })
//     );

//     return res.status(200).json(
//       offers
//     );
//   } catch (error) {
//     console.error(
//       "GET ALL OFFERS ERROR:",
//       error
//     );

//     return res.status(500).json({
//       message:
//         error.message ||
//         "Failed to get offers",
//     });
//   }
// });

// // =====================================================
// // GET MY RESTAURANT OFFERS
// // RESTAURANT OWNER
// //
// // IMPORTANT:
// // MUST BE BEFORE /:id
// //
// // GET /api/v1/offers/my/offers
// // =====================================================

// router.get(
//   "/my/offers",
//   authMiddleware,
//   roleMiddleware("restaurantOwner"),
//   async (req, res) => {
//     try {
//       // -------------------------------------------------
//       // Check restaurant
//       // -------------------------------------------------

//       if (!req.user.restaurantId) {
//         return res.status(400).json({
//           message:
//             "You are not assigned to a restaurant",
//         });
//       }

//       // -------------------------------------------------
//       // Get restaurant offers
//       // -------------------------------------------------

//       const offers = await populateOffer(
//         Offer.find({
//           restaurantId:
//             req.user.restaurantId,
//         }).sort({
//           createdAt: -1,
//         })
//       );

//       return res.status(200).json(
//         offers
//       );
//     } catch (error) {
//       console.error(
//         "GET MY OFFERS ERROR:",
//         error
//       );

//       return res.status(500).json({
//         message:
//           error.message ||
//           "Failed to get your offers",
//       });
//     }
//   }
// );

// // =====================================================
// // CREATE OFFER
// // ADMIN / RESTAURANT OWNER
// //
// // POST /api/v1/offers
// //
// // FormData:
// // title
// // description
// // price
// // discount
// // expiresAt
// // productId
// // restaurantId -> ADMIN ONLY
// // image
// // =====================================================

// router.post(
//   "/",
//   authMiddleware,
//   roleMiddleware(
//     "admin",
//     "restaurantOwner"
//   ),
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       console.log(
//         "========== CREATE OFFER =========="
//       );

//       console.log(
//         "BODY:",
//         req.body
//       );

//       console.log(
//         "FILE:",
//         req.file
//       );

//       // -------------------------------------------------
//       // Data
//       // -------------------------------------------------

//       const {
//         title,
//         description,
//         price,
//         discount,
//         expiresAt,
//         restaurantId,
//         productId,
//       } = req.body;

//       // -------------------------------------------------
//       // Validate title
//       // -------------------------------------------------

//       if (
//         !title ||
//         !title.trim()
//       ) {
//         return res.status(400).json({
//           message:
//             "Offer title is required",
//         });
//       }

//       // -------------------------------------------------
//       // Validate price
//       // -------------------------------------------------

//       if (
//         price === undefined ||
//         price === null ||
//         price === "" ||
//         Number.isNaN(
//           Number(price)
//         ) ||
//         Number(price) < 0
//       ) {
//         return res.status(400).json({
//           message:
//             "Please enter a valid price",
//         });
//       }

//       // -------------------------------------------------
//       // Validate discount
//       // -------------------------------------------------

//       const discountValue =
//         discount === undefined ||
//         discount === null ||
//         discount === ""
//           ? 0
//           : Number(discount);

//       if (
//         Number.isNaN(
//           discountValue
//         ) ||
//         discountValue < 0 ||
//         discountValue > 100
//       ) {
//         return res.status(400).json({
//           message:
//             "Discount must be between 0 and 100",
//         });
//       }

//       // -------------------------------------------------
//       // Validate productId
//       // -------------------------------------------------

//       if (!productId) {
//         return res.status(400).json({
//           message:
//             "productId is required",
//         });
//       }

//       if (
//         !isValidObjectId(
//           productId
//         )
//       ) {
//         return res.status(400).json({
//           message:
//             "Invalid productId",
//         });
//       }

//       // -------------------------------------------------
//       // Validate expiry date
//       // -------------------------------------------------

//       let finalExpiresAt = null;

//       if (expiresAt) {
//         const expiryDate =
//           new Date(expiresAt);

//         if (
//           Number.isNaN(
//             expiryDate.getTime()
//           )
//         ) {
//           return res.status(400).json({
//             message:
//               "Invalid expiry date",
//           });
//         }

//         finalExpiresAt =
//           expiryDate;
//       }

//       // -------------------------------------------------
//       // Determine restaurant
//       // -------------------------------------------------

//       let finalRestaurantId;

//       // =================================================
//       // RESTAURANT OWNER
//       // =================================================

//       if (
//         req.user.role ===
//         "restaurantOwner"
//       ) {
//         if (
//           !req.user.restaurantId
//         ) {
//           return res.status(400).json({
//             message:
//               "You are not assigned to a restaurant",
//           });
//         }

//         finalRestaurantId =
//           req.user.restaurantId;
//       }

//       // =================================================
//       // ADMIN
//       // =================================================

//       if (
//         req.user.role ===
//         "admin"
//       ) {
//         if (!restaurantId) {
//           return res.status(400).json({
//             message:
//               "restaurantId is required",
//           });
//         }

//         if (
//           !isValidObjectId(
//             restaurantId
//           )
//         ) {
//           return res.status(400).json({
//             message:
//               "Invalid restaurantId",
//           });
//         }

//         finalRestaurantId =
//           restaurantId;
//       }

//       // -------------------------------------------------
//       // Check restaurant
//       // -------------------------------------------------

//       const restaurant =
//         await Restaurant.findById(
//           finalRestaurantId
//         );

//       if (!restaurant) {
//         return res.status(404).json({
//           message:
//             "Restaurant not found",
//         });
//       }

//       // -------------------------------------------------
//       // Check product / recipe
//       // -------------------------------------------------

//       const recipe =
//         await Recipe.findById(
//           productId
//         );

//       if (!recipe) {
//         return res.status(404).json({
//           message:
//             "Product / Recipe not found",
//         });
//       }

//       // -------------------------------------------------
//       // Make sure product belongs to restaurant
//       // -------------------------------------------------

//       if (
//         recipe.restaurantId &&
//         recipe.restaurantId.toString() !==
//           finalRestaurantId.toString()
//       ) {
//         return res.status(400).json({
//           message:
//             "This product does not belong to the selected restaurant",
//         });
//       }

//       // -------------------------------------------------
//       // IMAGE
//       // -------------------------------------------------

//       let imagePath = "";

//       if (req.file) {
//         imagePath =
//           `/images/${req.file.filename}`;
//       }

//       console.log(
//         "SAVED IMAGE PATH:",
//         imagePath
//       );

//       // -------------------------------------------------
//       // Create offer
//       // -------------------------------------------------

//       const offer =
//         await Offer.create({
//           title: title.trim(),

//           description:
//             description
//               ? description.trim()
//               : "",

//           price: Number(price),

//           discount:
//             discountValue,

//           expiresAt:
//             finalExpiresAt,

//           isActive: true,

//           restaurantId:
//             finalRestaurantId,

//           productId:
//             productId,

//           image: imagePath,
//         });

//       // -------------------------------------------------
//       // Populate
//       // -------------------------------------------------

//       const fullOffer =
//         await populateOffer(
//           Offer.findById(
//             offer._id
//           )
//         );

//       // -------------------------------------------------
//       // Socket
//       // -------------------------------------------------

//       const io =
//         req.app.get("io");

//       if (io) {
//         io.emit(
//           "offerCreated",
//           fullOffer
//         );
//       }

//       // -------------------------------------------------
//       // Response
//       // -------------------------------------------------

//       return res.status(201).json({
//         message:
//           "Offer created successfully",

//         offer: fullOffer,
//       });
//     } catch (error) {
//       console.error(
//         "CREATE OFFER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         message:
//           error.message ||
//           "Failed to create offer",
//       });
//     }
//   }
// );

// // =====================================================
// // UPDATE OFFER
// // ADMIN / RESTAURANT OWNER
// //
// // PUT /api/v1/offers/:id
// // =====================================================

// router.put(
//   "/:id",
//   authMiddleware,
//   roleMiddleware(
//     "admin",
//     "restaurantOwner"
//   ),
//   upload.single("image"),
//   async (req, res) => {
//     try {
//       // -------------------------------------------------
//       // Validate ID
//       // -------------------------------------------------

//       if (
//         !isValidObjectId(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           message:
//             "Invalid offer ID",
//         });
//       }

//       // -------------------------------------------------
//       // Find offer
//       // -------------------------------------------------

//       const offer =
//         await Offer.findById(
//           req.params.id
//         );

//       if (!offer) {
//         return res.status(404).json({
//           message:
//             "Offer not found",
//         });
//       }

//       // -------------------------------------------------
//       // Owner authorization
//       // -------------------------------------------------

//       if (
//         req.user.role ===
//         "restaurantOwner"
//       ) {
//         if (
//           !req.user.restaurantId
//         ) {
//           return res.status(403).json({
//             message:
//               "You are not assigned to a restaurant",
//           });
//         }

//         if (
//           !offer.restaurantId ||
//           offer.restaurantId.toString() !==
//             req.user.restaurantId.toString()
//         ) {
//           return res.status(403).json({
//             message:
//               "You can only edit offers of your restaurant",
//           });
//         }
//       }

//       // -------------------------------------------------
//       // Data
//       // -------------------------------------------------

//       const {
//         title,
//         description,
//         price,
//         discount,
//         expiresAt,
//         productId,
//       } = req.body;

//       // -------------------------------------------------
//       // Title
//       // -------------------------------------------------

//       if (
//         title !== undefined
//       ) {
//         if (
//           !title ||
//           !title.trim()
//         ) {
//           return res.status(400).json({
//             message:
//               "Offer title is required",
//           });
//         }

//         offer.title =
//           title.trim();
//       }

//       // -------------------------------------------------
//       // Description
//       // -------------------------------------------------

//       if (
//         description !==
//         undefined
//       ) {
//         offer.description =
//           description
//             ? description.trim()
//             : "";
//       }

//       // -------------------------------------------------
//       // Price
//       // -------------------------------------------------

//       if (
//         price !== undefined
//       ) {
//         if (
//           price === "" ||
//           Number.isNaN(
//             Number(price)
//           ) ||
//           Number(price) < 0
//         ) {
//           return res.status(400).json({
//             message:
//               "Please enter a valid price",
//           });
//         }

//         offer.price =
//           Number(price);
//       }

//       // -------------------------------------------------
//       // Discount
//       // -------------------------------------------------

//       if (
//         discount !== undefined
//       ) {
//         const discountValue =
//           discount === ""
//             ? 0
//             : Number(discount);

//         if (
//           Number.isNaN(
//             discountValue
//           ) ||
//           discountValue < 0 ||
//           discountValue > 100
//         ) {
//           return res.status(400).json({
//             message:
//               "Discount must be between 0 and 100",
//           });
//         }

//         offer.discount =
//           discountValue;
//       }

//       // -------------------------------------------------
//       // Expiry
//       // -------------------------------------------------

//       if (
//         expiresAt !==
//         undefined
//       ) {
//         if (expiresAt === "") {
//           offer.expiresAt =
//             null;
//         } else {
//           const expiryDate =
//             new Date(
//               expiresAt
//             );

//           if (
//             Number.isNaN(
//               expiryDate.getTime()
//             )
//           ) {
//             return res.status(400).json({
//               message:
//                 "Invalid expiry date",
//             });
//           }

//           offer.expiresAt =
//             expiryDate;
//         }
//       }

//       // -------------------------------------------------
//       // Product / Recipe
//       // -------------------------------------------------

//       if (
//         productId !== undefined
//       ) {
//         if (!productId) {
//           return res.status(400).json({
//             message:
//               "productId cannot be empty",
//           });
//         }

//         if (
//           !isValidObjectId(
//             productId
//           )
//         ) {
//           return res.status(400).json({
//             message:
//               "Invalid productId",
//           });
//         }

//         const recipe =
//           await Recipe.findById(
//             productId
//           );

//         if (!recipe) {
//           return res.status(404).json({
//             message:
//               "Product / Recipe not found",
//           });
//         }

//         if (
//           recipe.restaurantId &&
//           recipe.restaurantId.toString() !==
//             offer.restaurantId.toString()
//         ) {
//           return res.status(400).json({
//             message:
//               "This product does not belong to this restaurant",
//           });
//         }

//         offer.productId =
//           productId;
//       }

//       // -------------------------------------------------
//       // New image
//       // -------------------------------------------------

//       if (req.file) {
//         offer.image =
//           `/images/${req.file.filename}`;

//         console.log(
//           "NEW IMAGE:",
//           offer.image
//         );
//       }

//       // =================================================
//       // IMPORTANT:
//       //
//       // Old offers may not have productId.
//       //
//       // If this is an old offer and productId was not
//       // sent from frontend, don't call save().
//       //
//       // Use findByIdAndUpdate for legacy offers.
//       // =================================================

//       if (
//         !offer.productId &&
//         productId === undefined
//       ) {
//         const updateData = {};

//         if (
//           title !== undefined
//         ) {
//           updateData.title =
//             offer.title;
//         }

//         if (
//           description !== undefined
//         ) {
//           updateData.description =
//             offer.description;
//         }

//         if (
//           price !== undefined
//         ) {
//           updateData.price =
//             offer.price;
//         }

//         if (
//           discount !== undefined
//         ) {
//           updateData.discount =
//             offer.discount;
//         }

//         if (
//           expiresAt !== undefined
//         ) {
//           updateData.expiresAt =
//             offer.expiresAt;
//         }

//         if (req.file) {
//           updateData.image =
//             offer.image;
//         }

//         const updatedLegacyOffer =
//           await Offer.findByIdAndUpdate(
//             offer._id,
//             {
//               $set: updateData,
//             },
//             {
//               new: true,
//               runValidators: false,
//             }
//           );

//         const populatedLegacyOffer =
//           await populateOffer(
//             Offer.findById(
//               updatedLegacyOffer._id
//             )
//           );

//         const io =
//           req.app.get("io");

//         if (io) {
//           io.emit(
//             "offerUpdated",
//             populatedLegacyOffer
//           );
//         }

//         return res.status(200).json({
//           message:
//             "Offer updated successfully",

//           offer:
//             populatedLegacyOffer,
//         });
//       }

//       // -------------------------------------------------
//       // Save normal offer
//       // -------------------------------------------------

//       await offer.save();

//       // -------------------------------------------------
//       // Get updated offer
//       // -------------------------------------------------

//       const updatedOffer =
//         await populateOffer(
//           Offer.findById(
//             offer._id
//           )
//         );

//       // -------------------------------------------------
//       // Socket
//       // -------------------------------------------------

//       const io =
//         req.app.get("io");

//       if (io) {
//         io.emit(
//           "offerUpdated",
//           updatedOffer
//         );
//       }

//       // -------------------------------------------------
//       // Response
//       // -------------------------------------------------

//       return res.status(200).json({
//         message:
//           "Offer updated successfully",

//         offer: updatedOffer,
//       });
//     } catch (error) {
//       console.error(
//         "UPDATE OFFER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         message:
//           error.message ||
//           "Failed to update offer",
//       });
//     }
//   }
// );

// // =====================================================
// // DELETE OFFER
// // ADMIN / RESTAURANT OWNER
// //
// // DELETE /api/v1/offers/:id
// // =====================================================

// router.delete(
//   "/:id",
//   authMiddleware,
//   roleMiddleware(
//     "admin",
//     "restaurantOwner"
//   ),
//   async (req, res) => {
//     try {
//       // -------------------------------------------------
//       // Validate ID
//       // -------------------------------------------------

//       if (
//         !isValidObjectId(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           message:
//             "Invalid offer ID",
//         });
//       }

//       // -------------------------------------------------
//       // Find offer
//       // -------------------------------------------------

//       const offer =
//         await Offer.findById(
//           req.params.id
//         );

//       if (!offer) {
//         return res.status(404).json({
//           message:
//             "Offer not found",
//         });
//       }

//       // -------------------------------------------------
//       // Owner authorization
//       // -------------------------------------------------

//       if (
//         req.user.role ===
//         "restaurantOwner"
//       ) {
//         if (
//           !req.user.restaurantId
//         ) {
//           return res.status(403).json({
//             message:
//               "You are not assigned to a restaurant",
//           });
//         }

//         if (
//           !offer.restaurantId ||
//           offer.restaurantId.toString() !==
//             req.user.restaurantId.toString()
//         ) {
//           return res.status(403).json({
//             message:
//               "You can only delete offers of your restaurant",
//           });
//         }
//       }

//       // -------------------------------------------------
//       // Delete
//       // -------------------------------------------------

//       await Offer.findByIdAndDelete(
//         req.params.id
//       );

//       // -------------------------------------------------
//       // Socket
//       // -------------------------------------------------

//       const io =
//         req.app.get("io");

//       if (io) {
//         io.emit(
//           "offerDeleted",
//           req.params.id
//         );
//       }

//       // -------------------------------------------------
//       // Response
//       // -------------------------------------------------

//       return res.status(200).json({
//         message:
//           "Offer deleted successfully",
//       });
//     } catch (error) {
//       console.error(
//         "DELETE OFFER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         message:
//           error.message ||
//           "Failed to delete offer",
//       });
//     }
//   }
// );

// // =====================================================
// // TOGGLE OFFER
// // ADMIN / RESTAURANT OWNER
// //
// // PATCH /api/v1/offers/:id/toggle
// // =====================================================

// router.patch(
//   "/:id/toggle",
//   authMiddleware,
//   roleMiddleware(
//     "admin",
//     "restaurantOwner"
//   ),
//   async (req, res) => {
//     try {
//       // -------------------------------------------------
//       // Validate ID
//       // -------------------------------------------------

//       if (
//         !isValidObjectId(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid offer ID",
//         });
//       }

//       // -------------------------------------------------
//       // Find offer
//       // -------------------------------------------------

//       const offer =
//         await Offer.findById(
//           req.params.id
//         );

//       if (!offer) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Offer not found",
//         });
//       }

//       // -------------------------------------------------
//       // Restaurant Owner Authorization
//       // -------------------------------------------------

//       if (
//         req.user.role ===
//         "restaurantOwner"
//       ) {
//         if (
//           !req.user.restaurantId
//         ) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "Restaurant owner is not assigned to a restaurant",
//           });
//         }

//         if (
//           !offer.restaurantId
//         ) {
//           return res.status(400).json({
//             success: false,
//             message:
//               "Offer does not have a restaurant",
//           });
//         }

//         if (
//           offer.restaurantId.toString() !==
//           req.user.restaurantId.toString()
//         ) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "You can only change offers of your restaurant",
//           });
//         }
//       }

//       // -------------------------------------------------
//       // Toggle
//       //
//       // IMPORTANT:
//       // Do NOT use offer.save() here.
//       //
//       // Some old offers don't have productId,
//       // while productId is required in the schema.
//       //
//       // findByIdAndUpdate allows us to update only
//       // isActive without validating the old missing field.
//       // -------------------------------------------------

//       const updatedOffer =
//         await Offer.findByIdAndUpdate(
//           offer._id,
//           {
//             $set: {
//               isActive:
//                 !offer.isActive,
//             },
//           },
//           {
//             new: true,
//             runValidators: false,
//           }
//         );

//       // -------------------------------------------------
//       // Populate
//       // -------------------------------------------------

//       const populatedOffer =
//         await populateOffer(
//           Offer.findById(
//             updatedOffer._id
//           )
//         );

//       // -------------------------------------------------
//       // Socket
//       // -------------------------------------------------

//       const io =
//         req.app.get("io");

//       if (io) {
//         io.emit(
//           "offerUpdated",
//           populatedOffer
//         );
//       }

//       // -------------------------------------------------
//       // Response
//       // -------------------------------------------------

//       return res.status(200).json({
//         success: true,

//         message:
//           populatedOffer.isActive
//             ? "Offer activated successfully"
//             : "Offer deactivated successfully",

//         offer:
//           populatedOffer,
//       });
//     } catch (error) {
//       console.error(
//         "TOGGLE OFFER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           error.message ||
//           "Failed to update offer status",
//       });
//     }
//   }
// );

// // =====================================================
// // GET ONE OFFER
// // PUBLIC
// //
// // IMPORTANT:
// // Keep AFTER /my/offers
// //
// // GET /api/v1/offers/:id
// // =====================================================

// router.get(
//   "/:id",
//   async (req, res) => {
//     try {
//       // -------------------------------------------------
//       // Validate ID
//       // -------------------------------------------------

//       if (
//         !isValidObjectId(
//           req.params.id
//         )
//       ) {
//         return res.status(400).json({
//           message:
//             "Invalid offer ID",
//         });
//       }

//       // -------------------------------------------------
//       // Get offer
//       // -------------------------------------------------

//       const offer =
//         await populateOffer(
//           Offer.findById(
//             req.params.id
//           )
//         );

//       if (!offer) {
//         return res.status(404).json({
//           message:
//             "Offer not found",
//         });
//       }

//       return res.status(200).json(
//         offer
//       );
//     } catch (error) {
//       console.error(
//         "GET ONE OFFER ERROR:",
//         error
//       );

//       return res.status(500).json({
//         message:
//           error.message ||
//           "Failed to get offer",
//       });
//     }
//   }
// );

// // =====================================================
// // EXPORT
// // =====================================================

// module.exports = router;


const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const stream = require("stream");

const Offer = require("../models/offerSchema");
const Restaurant = require("../models/Restaurant");
const Recipe = require("../models/recipeSchema");

const upload = require("../uplods/multer");
const cloudinary = require("../config/cloudinary");

const {
  authMiddleware,
} = require("../middleWares/authMiddleware");

const {
  roleMiddleware,
} = require("../middleWares/roleMiddleware");

// =====================================================
// CLOUDINARY HELPER
// =====================================================

const uploadToCloudinary = (
  buffer,
  folder = "famy/offers"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    const readableStream =
      new stream.Readable();

    readableStream.push(buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);
  });
};

// =====================================================
// HELPER
// =====================================================

const populateOffer = (query) => {
  return query
    .populate(
      "restaurantId",
      "name image address phone"
    )
    .populate(
      "productId",
      "title price image category restaurantId"
    );
};

// =====================================================
// VALIDATE OBJECT ID
// =====================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================================================
// GET ALL OFFERS
// PUBLIC
//
// GET /api/v1/offers
//
// Examples:
// /api/v1/offers
// /api/v1/offers?restaurantId=xxxxx
// /api/v1/offers?active=true
// =====================================================

router.get("/", async (req, res) => {
  try {
    const {
      restaurantId,
      active,
    } = req.query;

    const filter = {};

    // -------------------------------------------------
    // Restaurant filter
    // -------------------------------------------------

    if (restaurantId) {
      if (!isValidObjectId(restaurantId)) {
        return res.status(400).json({
          message:
            "Invalid restaurantId",
        });
      }

      filter.restaurantId = restaurantId;
    }

    // -------------------------------------------------
    // Active filter
    // -------------------------------------------------

    if (active === "true") {
      filter.isActive = true;
    }

    if (active === "false") {
      filter.isActive = false;
    }

    // -------------------------------------------------
    // Don't show expired offers
    // -------------------------------------------------

    filter.$or = [
      {
        expiresAt: null,
      },
      {
        expiresAt: {
          $gt: new Date(),
        },
      },
    ];

    // -------------------------------------------------
    // Get offers
    // -------------------------------------------------

    const offers = await populateOffer(
      Offer.find(filter).sort({
        createdAt: -1,
      })
    );

    return res.status(200).json(
      offers
    );
  } catch (error) {
    console.error(
      "GET ALL OFFERS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Failed to get offers",
    });
  }
});

// =====================================================
// GET MY RESTAURANT OFFERS
// RESTAURANT OWNER
//
// IMPORTANT:
// MUST BE BEFORE /:id
//
// GET /api/v1/offers/my/offers
// =====================================================

router.get(
  "/my/offers",
  authMiddleware,
  roleMiddleware("restaurantOwner"),
  async (req, res) => {
    try {
      // -------------------------------------------------
      // Check restaurant
      // -------------------------------------------------

      if (!req.user.restaurantId) {
        return res.status(400).json({
          message:
            "You are not assigned to a restaurant",
        });
      }

      // -------------------------------------------------
      // Get restaurant offers
      // -------------------------------------------------

      const offers = await populateOffer(
        Offer.find({
          restaurantId:
            req.user.restaurantId,
        }).sort({
          createdAt: -1,
        })
      );

      return res.status(200).json(
        offers
      );
    } catch (error) {
      console.error(
        "GET MY OFFERS ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to get your offers",
      });
    }
  }
);

// =====================================================
// CREATE OFFER
// ADMIN / RESTAURANT OWNER
//
// POST /api/v1/offers
//
// FormData:
// title
// description
// price
// discount
// expiresAt
// productId
// restaurantId -> ADMIN ONLY
// image
// =====================================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  upload.single("image"),
  async (req, res) => {
    try {
      console.log(
        "========== CREATE OFFER =========="
      );

      console.log(
        "BODY:",
        req.body
      );

      console.log(
        "FILE:",
        req.file
      );

      // -------------------------------------------------
      // Data
      // -------------------------------------------------

      const {
        title,
        description,
        price,
        discount,
        expiresAt,
        restaurantId,
        productId,
      } = req.body;

      // -------------------------------------------------
      // Validate title
      // -------------------------------------------------

      if (
        !title ||
        !title.trim()
      ) {
        return res.status(400).json({
          message:
            "Offer title is required",
        });
      }

      // -------------------------------------------------
      // Validate price
      // -------------------------------------------------

      if (
        price === undefined ||
        price === null ||
        price === "" ||
        Number.isNaN(
          Number(price)
        ) ||
        Number(price) < 0
      ) {
        return res.status(400).json({
          message:
            "Please enter a valid price",
        });
      }

      // -------------------------------------------------
      // Validate discount
      // -------------------------------------------------

      const discountValue =
        discount === undefined ||
        discount === null ||
        discount === ""
          ? 0
          : Number(discount);

      if (
        Number.isNaN(
          discountValue
        ) ||
        discountValue < 0 ||
        discountValue > 100
      ) {
        return res.status(400).json({
          message:
            "Discount must be between 0 and 100",
        });
      }

      // -------------------------------------------------
      // Validate productId
      // -------------------------------------------------

      if (!productId) {
        return res.status(400).json({
          message:
            "productId is required",
        });
      }

      if (
        !isValidObjectId(
          productId
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid productId",
        });
      }

      // -------------------------------------------------
      // Validate expiry date
      // -------------------------------------------------

      let finalExpiresAt = null;

      if (expiresAt) {
        const expiryDate =
          new Date(expiresAt);

        if (
          Number.isNaN(
            expiryDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid expiry date",
          });
        }

        finalExpiresAt =
          expiryDate;
      }

      // -------------------------------------------------
      // Determine restaurant
      // -------------------------------------------------

      let finalRestaurantId;

      // =================================================
      // RESTAURANT OWNER
      // =================================================

      if (
        req.user.role ===
        "restaurantOwner"
      ) {
        if (
          !req.user.restaurantId
        ) {
          return res.status(400).json({
            message:
              "You are not assigned to a restaurant",
          });
        }

        finalRestaurantId =
          req.user.restaurantId;
      }

      // =================================================
      // ADMIN
      // =================================================

      if (
        req.user.role ===
        "admin"
      ) {
        if (!restaurantId) {
          return res.status(400).json({
            message:
              "restaurantId is required",
          });
        }

        if (
          !isValidObjectId(
            restaurantId
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid restaurantId",
          });
        }

        finalRestaurantId =
          restaurantId;
      }

      // -------------------------------------------------
      // Check restaurant
      // -------------------------------------------------

      const restaurant =
        await Restaurant.findById(
          finalRestaurantId
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant not found",
        });
      }

      // -------------------------------------------------
      // Check product / recipe
      // -------------------------------------------------

      const recipe =
        await Recipe.findById(
          productId
        );

      if (!recipe) {
        return res.status(404).json({
          message:
            "Product / Recipe not found",
        });
      }

      // -------------------------------------------------
      // Make sure product belongs to restaurant
      // -------------------------------------------------

      if (
        recipe.restaurantId &&
        recipe.restaurantId.toString() !==
          finalRestaurantId.toString()
      ) {
        return res.status(400).json({
          message:
            "This product does not belong to the selected restaurant",
        });
      }

      // -------------------------------------------------
      // IMAGE - CLOUDINARY
      // -------------------------------------------------

      let imagePath = "";

      if (req.file) {
        const result =
          await uploadToCloudinary(
            req.file.buffer,
            "famy/offers"
          );

        imagePath =
          result.secure_url;
      }

      console.log(
        "SAVED CLOUDINARY IMAGE:",
        imagePath
      );

      // -------------------------------------------------
      // Create offer
      // -------------------------------------------------

      const offer =
        await Offer.create({
          title: title.trim(),

          description:
            description
              ? description.trim()
              : "",

          price: Number(price),

          discount:
            discountValue,

          expiresAt:
            finalExpiresAt,

          isActive: true,

          restaurantId:
            finalRestaurantId,

          productId:
            productId,

          image: imagePath,
        });

      // -------------------------------------------------
      // Populate
      // -------------------------------------------------

      const fullOffer =
        await populateOffer(
          Offer.findById(
            offer._id
          )
        );

      // -------------------------------------------------
      // Socket
      // -------------------------------------------------

      const io =
        req.app.get("io");

      if (io) {
        io.emit(
          "offerCreated",
          fullOffer
        );
      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return res.status(201).json({
        message:
          "Offer created successfully",

        offer: fullOffer,
      });
    } catch (error) {
      console.error(
        "CREATE OFFER ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to create offer",
      });
    }
  }
);

// =====================================================
// UPDATE OFFER
// ADMIN / RESTAURANT OWNER
//
// PUT /api/v1/offers/:id
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  upload.single("image"),
  async (req, res) => {
    try {
      // -------------------------------------------------
      // Validate ID
      // -------------------------------------------------

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid offer ID",
        });
      }

      // -------------------------------------------------
      // Find offer
      // -------------------------------------------------

      const offer =
        await Offer.findById(
          req.params.id
        );

      if (!offer) {
        return res.status(404).json({
          message:
            "Offer not found",
        });
      }

      // -------------------------------------------------
      // Owner authorization
      // -------------------------------------------------

      if (
        req.user.role ===
        "restaurantOwner"
      ) {
        if (
          !req.user.restaurantId
        ) {
          return res.status(403).json({
            message:
              "You are not assigned to a restaurant",
          });
        }

        if (
          !offer.restaurantId ||
          offer.restaurantId.toString() !==
            req.user.restaurantId.toString()
        ) {
          return res.status(403).json({
            message:
              "You can only edit offers of your restaurant",
          });
        }
      }

      // -------------------------------------------------
      // Data
      // -------------------------------------------------

      const {
        title,
        description,
        price,
        discount,
        expiresAt,
        productId,
      } = req.body;

      // -------------------------------------------------
      // Title
      // -------------------------------------------------

      if (
        title !== undefined
      ) {
        if (
          !title ||
          !title.trim()
        ) {
          return res.status(400).json({
            message:
              "Offer title is required",
          });
        }

        offer.title =
          title.trim();
      }

      // -------------------------------------------------
      // Description
      // -------------------------------------------------

      if (
        description !==
        undefined
      ) {
        offer.description =
          description
            ? description.trim()
            : "";
      }

      // -------------------------------------------------
      // Price
      // -------------------------------------------------

      if (
        price !== undefined
      ) {
        if (
          price === "" ||
          Number.isNaN(
            Number(price)
          ) ||
          Number(price) < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid price",
          });
        }

        offer.price =
          Number(price);
      }

      // -------------------------------------------------
      // Discount
      // -------------------------------------------------

      if (
        discount !== undefined
      ) {
        const discountValue =
          discount === ""
            ? 0
            : Number(discount);

        if (
          Number.isNaN(
            discountValue
          ) ||
          discountValue < 0 ||
          discountValue > 100
        ) {
          return res.status(400).json({
            message:
              "Discount must be between 0 and 100",
          });
        }

        offer.discount =
          discountValue;
      }

      // -------------------------------------------------
      // Expiry
      // -------------------------------------------------

      if (
        expiresAt !==
        undefined
      ) {
        if (expiresAt === "") {
          offer.expiresAt =
            null;
        } else {
          const expiryDate =
            new Date(
              expiresAt
            );

          if (
            Number.isNaN(
              expiryDate.getTime()
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid expiry date",
            });
          }

          offer.expiresAt =
            expiryDate;
        }
      }

      // -------------------------------------------------
      // Product / Recipe
      // -------------------------------------------------

      if (
        productId !== undefined
      ) {
        if (!productId) {
          return res.status(400).json({
            message:
              "productId cannot be empty",
          });
        }

        if (
          !isValidObjectId(
            productId
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid productId",
          });
        }

        const recipe =
          await Recipe.findById(
            productId
          );

        if (!recipe) {
          return res.status(404).json({
            message:
              "Product / Recipe not found",
          });
        }

        if (
          recipe.restaurantId &&
          recipe.restaurantId.toString() !==
            offer.restaurantId.toString()
        ) {
          return res.status(400).json({
            message:
              "This product does not belong to this restaurant",
          });
        }

        offer.productId =
          productId;
      }

      // -------------------------------------------------
      // New image - CLOUDINARY
      // -------------------------------------------------

      if (req.file) {
        const result =
          await uploadToCloudinary(
            req.file.buffer,
            "famy/offers"
          );

        offer.image =
          result.secure_url;

        console.log(
          "NEW CLOUDINARY IMAGE:",
          offer.image
        );
      }

      // =================================================
      // IMPORTANT:
      //
      // Old offers may not have productId.
      //
      // If this is an old offer and productId was not
      // sent from frontend, don't call save().
      //
      // Use findByIdAndUpdate for legacy offers.
      // =================================================

      if (
        !offer.productId &&
        productId === undefined
      ) {
        const updateData = {};

        if (
          title !== undefined
        ) {
          updateData.title =
            offer.title;
        }

        if (
          description !== undefined
        ) {
          updateData.description =
            offer.description;
        }

        if (
          price !== undefined
        ) {
          updateData.price =
            offer.price;
        }

        if (
          discount !== undefined
        ) {
          updateData.discount =
            offer.discount;
        }

        if (
          expiresAt !== undefined
        ) {
          updateData.expiresAt =
            offer.expiresAt;
        }

        if (req.file) {
          updateData.image =
            offer.image;
        }

        const updatedLegacyOffer =
          await Offer.findByIdAndUpdate(
            offer._id,
            {
              $set: updateData,
            },
            {
              new: true,
              runValidators: false,
            }
          );

        const populatedLegacyOffer =
          await populateOffer(
            Offer.findById(
              updatedLegacyOffer._id
            )
          );

        const io =
          req.app.get("io");

        if (io) {
          io.emit(
            "offerUpdated",
            populatedLegacyOffer
          );
        }

        return res.status(200).json({
          message:
            "Offer updated successfully",

          offer:
            populatedLegacyOffer,
        });
      }

      // -------------------------------------------------
      // Save normal offer
      // -------------------------------------------------

      await offer.save();

      // -------------------------------------------------
      // Get updated offer
      // -------------------------------------------------

      const updatedOffer =
        await populateOffer(
          Offer.findById(
            offer._id
          )
        );

      // -------------------------------------------------
      // Socket
      // -------------------------------------------------

      const io =
        req.app.get("io");

      if (io) {
        io.emit(
          "offerUpdated",
          updatedOffer
        );
      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return res.status(200).json({
        message:
          "Offer updated successfully",

        offer: updatedOffer,
      });
    } catch (error) {
      console.error(
        "UPDATE OFFER ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to update offer",
      });
    }
  }
);

// =====================================================
// DELETE OFFER
// ADMIN / RESTAURANT OWNER
//
// DELETE /api/v1/offers/:id
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  async (req, res) => {
    try {
      // -------------------------------------------------
      // Validate ID
      // -------------------------------------------------

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid offer ID",
        });
      }

      // -------------------------------------------------
      // Find offer
      // -------------------------------------------------

      const offer =
        await Offer.findById(
          req.params.id
        );

      if (!offer) {
        return res.status(404).json({
          message:
            "Offer not found",
        });
      }

      // -------------------------------------------------
      // Owner authorization
      // -------------------------------------------------

      if (
        req.user.role ===
        "restaurantOwner"
      ) {
        if (
          !req.user.restaurantId
        ) {
          return res.status(403).json({
            message:
              "You are not assigned to a restaurant",
          });
        }

        if (
          !offer.restaurantId ||
          offer.restaurantId.toString() !==
            req.user.restaurantId.toString()
        ) {
          return res.status(403).json({
            message:
              "You can only delete offers of your restaurant",
          });
        }
      }

      // -------------------------------------------------
      // Delete
      // -------------------------------------------------

      await Offer.findByIdAndDelete(
        req.params.id
      );

      // -------------------------------------------------
      // Socket
      // -------------------------------------------------

      const io =
        req.app.get("io");

      if (io) {
        io.emit(
          "offerDeleted",
          req.params.id
        );
      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return res.status(200).json({
        message:
          "Offer deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE OFFER ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to delete offer",
      });
    }
  }
);

// =====================================================
// TOGGLE OFFER
// ADMIN / RESTAURANT OWNER
//
// PATCH /api/v1/offers/:id/toggle
// =====================================================

router.patch(
  "/:id/toggle",
  authMiddleware,
  roleMiddleware(
    "admin",
    "restaurantOwner"
  ),
  async (req, res) => {
    try {
      // -------------------------------------------------
      // Validate ID
      // -------------------------------------------------

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid offer ID",
        });
      }

      // -------------------------------------------------
      // Find offer
      // -------------------------------------------------

      const offer =
        await Offer.findById(
          req.params.id
        );

      if (!offer) {
        return res.status(404).json({
          success: false,
          message:
            "Offer not found",
        });
      }

      // -------------------------------------------------
      // Restaurant Owner Authorization
      // -------------------------------------------------

      if (
        req.user.role ===
        "restaurantOwner"
      ) {
        if (
          !req.user.restaurantId
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Restaurant owner is not assigned to a restaurant",
          });
        }

        if (
          !offer.restaurantId
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Offer does not have a restaurant",
          });
        }

        if (
          offer.restaurantId.toString() !==
          req.user.restaurantId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You can only change offers of your restaurant",
          });
        }
      }

      // -------------------------------------------------
      // Toggle
      //
      // IMPORTANT:
      // Do NOT use offer.save() here.
      //
      // Some old offers don't have productId,
      // while productId is required in the schema.
      //
      // findByIdAndUpdate allows us to update only
      // isActive without validating the old missing field.
      // -------------------------------------------------

      const updatedOffer =
        await Offer.findByIdAndUpdate(
          offer._id,
          {
            $set: {
              isActive:
                !offer.isActive,
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );

      // -------------------------------------------------
      // Populate
      // -------------------------------------------------

      const populatedOffer =
        await populateOffer(
          Offer.findById(
            updatedOffer._id
          )
        );

      // -------------------------------------------------
      // Socket
      // -------------------------------------------------

      const io =
        req.app.get("io");

      if (io) {
        io.emit(
          "offerUpdated",
          populatedOffer
        );
      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          populatedOffer.isActive
            ? "Offer activated successfully"
            : "Offer deactivated successfully",

        offer:
          populatedOffer,
      });
    } catch (error) {
      console.error(
        "TOGGLE OFFER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update offer status",
      });
    }
  }
);

// =====================================================
// GET ONE OFFER
// PUBLIC
//
// IMPORTANT:
// Keep AFTER /my/offers
//
// GET /api/v1/offers/:id
// =====================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      // -------------------------------------------------
      // Validate ID
      // -------------------------------------------------

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid offer ID",
        });
      }

      // -------------------------------------------------
      // Get offer
      // -------------------------------------------------

      const offer =
        await populateOffer(
          Offer.findById(
            req.params.id
          )
        );

      if (!offer) {
        return res.status(404).json({
          message:
            "Offer not found",
        });
      }

      return res.status(200).json(
        offer
      );
    } catch (error) {
      console.error(
        "GET ONE OFFER ERROR:",
        error
      );

      return res.status(500).json({
        message:
          error.message ||
          "Failed to get offer",
      });
    }
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;