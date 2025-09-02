const { Prisma, PrismaClient } = require("@prisma/client");
const {
	sendErrorResponse,
	sendSuccessResponse,
} = require("../utils/responseHelper");

const prisma = new PrismaClient();

// ✅ Add to Cart
const addTocart = async (req, res) => {
	const { productId, quantity, variation, supplementaryProducts, price, total } =
		req.body;

	if (!productId || !quantity || !price) {
		return sendErrorResponse(res, 400, "All fields are required");
	}

	try {
		let supProduct = [];

		// ✅ First check if item with same productId + variation exists
		const whereClause = {
			userId: res.user.id,
			productId,
		};

		// Only include variation if provided
		if (variation !== undefined && variation !== null) {
			whereClause.variation = variation;
		}

		const existingCartItem = await prisma.cartItem.findFirst({
			where: whereClause,
			include: {
				supplementaryProducts: {
					include: { product: true },
				},
			},
		});

		let cartItem;

		if (existingCartItem) {
			// ✅ If exists, increment quantity & total
			cartItem = await prisma.cartItem.update({
				where: { id: existingCartItem.id },
				data: {
					quantity: existingCartItem.quantity + parseInt(quantity, 10),
					total:
						existingCartItem.total +
						(total ? parseFloat(total) : parseFloat(price) * parseInt(quantity, 10)),
				},
				include: {
					product: true,
					supplementaryProducts: { include: { product: true } },
				},
			});
		} else {
			// ✅ Else, create new cart item
			cartItem = await prisma.cartItem.create({
				data: {
					userId: res.user.id,
					productId,
					quantity: parseInt(quantity, 10),
					variation: variation || null,
					price: parseFloat(price),
					total: total
						? parseFloat(total)
						: parseFloat(price) * parseInt(quantity, 10),
				},
				include: {
					product: true,
					supplementaryProducts: true,
				},
			});
		}

		// ✅ Handle supplementary products only when creating new
		if (!existingCartItem && supplementaryProducts) {
			try {
				const products =
					typeof supplementaryProducts === "string"
						? JSON.parse(supplementaryProducts)
						: supplementaryProducts;

				if (Array.isArray(products) && products.length > 0) {
					supProduct = await Promise.all(
						products.map((item) =>
							prisma.cartItemSupplement.create({
								data: {
									cartItemId: cartItem.id,
									productId: item.id,
									quantity: parseInt(item.quantity, 10),
									price: parseFloat(item.price),
								},
								include: { product: true },
							})
						)
					);

					// Refresh cartItem with supplements
					cartItem = {
						...cartItem,
						supplementaryProducts: supProduct,
					};
				}
			} catch (error) {
				console.error("Invalid supplementaryProducts JSON:", error);
			}
		}

		return sendSuccessResponse(res, 201, "Item added to cart", {
			cart: cartItem,
		});
	} catch (error) {
		console.error(error);
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

// ✅ Add multiple items
const addAllToCart = async (req, res) => {
	const { carts } = req.body;
	if (!carts || !Array.isArray(carts) || carts.length === 0)
		return sendErrorResponse(res, 400, "Carts must be a non-empty array");

	try {
		const newCartItems = await Promise.all(
			carts.map((item) => {
				const { supplementaryProducts, quantity, variation, productId, price } =
					item;
				return prisma.cartItem.create({
					data: {
						productId, // UUID string
						userId: res.user.id,
						quantity: parseInt(quantity, 10),
						variation: variation || null,
						price: parseFloat(price),
						total: parseFloat(price) * parseInt(quantity, 10),
					},
				});
			})
		);

		const cartItemIds = newCartItems.map((c) => c.id);

		const supplementaryData = carts.flatMap((cartItem, index) => {
			let supplements = cartItem.supplementaryProducts;

			// If it's a JSON string, parse it
			if (typeof supplements === "string") {
				try {
					supplements = JSON.parse(supplements);
				} catch (err) {
					console.error("Invalid supplementaryProducts JSON:", err);
					supplements = [];
				}
			}

			// Ensure it's always an array
			if (!Array.isArray(supplements)) {
				supplements = [];
			}

			return supplements.map((supplementary) => ({
				cartItemId: cartItemIds[index],
				productId: supplementary.id,
				quantity: parseInt(supplementary.quantity, 10),
				price: parseFloat(supplementary.price),
			}));
		});

		if (supplementaryData.length > 0) {
			await prisma.cartItemSupplement.createMany({ data: supplementaryData });
		}

		const addedCartItemsWithSupplements = await prisma.cartItem.findMany({
			where: { userId: res.user.id },
			include: {
				product: true,
				supplementaryProducts: { include: { product: true } },
			},
		});

		return sendSuccessResponse(res, 201, "Items added to cart", {
			carts: addedCartItemsWithSupplements,
		});
	} catch (error) {
		console.error(error);
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

// ✅ Get cart
const getCart = async (req, res) => {
	try {
		const items = await prisma.cartItem.findMany({
			where: { userId: res.user.id },
			include: {
				product: true,
				supplementaryProducts: { include: { product: true } },
			},
		});

		const carts = items.map((item) => ({
			...item,
			supplementaryProducts: item.supplementaryProducts,
		}));

		if (carts.length === 0)
			return sendSuccessResponse(res, 200, "Cart is empty", { carts });

		return sendSuccessResponse(res, 200, "Cart retrieved successfully", {
			carts,
		});
	} catch (error) {
		console.error(error);
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

// ✅ Edit cart item
const editCartItem = async (req, res) => {
	const { id, quantity, supplementaryProducts, total } = req.body;
	if (!id || !quantity)
		return sendErrorResponse(res, 400, "All fields are required");

	try {
		await prisma.cartItem.update({
			where: { id, userId: res.user.id }, // UUID string
			data: {
				quantity: parseInt(quantity, 10),
				total: total ? parseFloat(total) : undefined,
			},
		});

		if (supplementaryProducts && supplementaryProducts.length > 0) {
			await prisma.cartItemSupplement.deleteMany({
				where: { cartItemId: id }, // UUID string
			});

			await prisma.cartItemSupplement.createMany({
				data: supplementaryProducts.map((item) => ({
					cartItemId: id,
					productId: item.id, // UUID string
					quantity: parseInt(item.quantity, 10),
					price: parseFloat(item.price),
				})),
			});
		}

		const cartItemWithSupplements = await prisma.cartItem.findUnique({
			where: { id }, // UUID string
			include: {
				product: true,
				supplementaryProducts: { include: { product: true } },
			},
		});

		return sendSuccessResponse(res, 200, "Item updated successfully", {
			cart: cartItemWithSupplements,
		});
	} catch (error) {
		console.error(error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025")
				return sendErrorResponse(res, 404, "Cart Item not found", null);
		}
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

// ✅ Delete single item
const deleteCartItem = async (req, res) => {
	const { id } = req.params;
	if (!id) return sendErrorResponse(res, 400, "ID is required");

	try {
		await prisma.cartItem.delete({
			where: { id }, // UUID string
		});
		return sendSuccessResponse(res, 200, "Item removed successfully");
	} catch (error) {
		console.error(error);
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2025")
				return sendErrorResponse(res, 404, "Cart Item not found", null);
		}
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

// ✅ Clear all items
const clearAll = async (req, res) => {
	try {
		await prisma.cartItem.deleteMany({ where: { userId: res.user.id } });
		return sendSuccessResponse(res, 200, "Cart cleared successfully");
	} catch (error) {
		console.error(error);
		return sendErrorResponse(res, 500, "Internal server error", {
			error: error.message,
		});
	}
};

module.exports = {
	getCart,
	addTocart,
	editCartItem,
	deleteCartItem,
	clearAll,
	addAllToCart,
};
