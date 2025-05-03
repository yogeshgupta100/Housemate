import User from '../models/userModel.js';
import Property from '../models/propertymodel.js';

class FavoritesService {
    async getFavorites(userId) {
        const user = await User.findById(userId)
            .populate('favorites')
            .select('favorites');

        if (!user) {
            throw new Error('User not found');
        }

        return user.favorites;
    }

    async addFavorite(userId, propertyId) {
        const user = await User.findById(userId);
        const property = await Property.findById(propertyId);

        if (!user) {
            throw new Error('User not found');
        }
        if (!property) {
            throw new Error('Property not found');
        }

        if (!user.favorites.includes(property._id)) {
            user.favorites.push(property._id);
            await user.save();
        }

        return user.favorites;
    }

    async removeFavorite(userId, propertyId) {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        user.favorites = user.favorites.filter(
            (fav) => fav.toString() !== propertyId
        );
        await user.save();

        return user.favorites;
    }

    async isPropertyFavorited(userId, propertyId) {
        const user = await User.findById(userId).select('favorites');

        if (!user) {
            throw new Error('User not found');
        }

        return user.favorites.includes(propertyId);
    }
}

export default new FavoritesService();
