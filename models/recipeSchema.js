const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    ingredients: {
        type: [String],
        required: true
    },
    instructions: {
        type: String,
        required: true
    },
    CoverImage: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    },
     variants: [
        {
            name: {
                type: String, // Small / Large / XL / Roll / Cone
                required: true
            },
            price: {
                type: Number,
                required: true
            }
        }
    ],
    
    category: {
        type: String,
        required: false,
        enum: ['beef', 'chicken', 'pizza', 'dessert', 'seafood', 'pasta', 'salad', 'soup','burger','drinks']
    }
}
,{
    timestamps: true
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
    